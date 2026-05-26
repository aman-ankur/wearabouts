import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";

const chromeJsonUrl = "http://127.0.0.1:9222";
const appUrl = "http://localhost:3000";
const screenshotsDir = new URL("../screenshots/", import.meta.url);

async function createTarget(url) {
  const response = await fetch(`${chromeJsonUrl}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  if (!response.ok) {
    throw new Error(`Could not create Chrome target: ${response.status}`);
  }

  return response.json();
}

function createCdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 1;
  const callbacks = new Map();
  const listeners = new Map();

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);

    if (payload.id && callbacks.has(payload.id)) {
      const { resolve, reject } = callbacks.get(payload.id);
      callbacks.delete(payload.id);

      if (payload.error) {
        reject(new Error(payload.error.message));
      } else {
        resolve(payload.result);
      }

      return;
    }

    const eventListeners = listeners.get(payload.method) ?? [];
    eventListeners.forEach((listener) => listener(payload.params ?? {}));
  });

  return {
    opened: new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    close() {
      socket.close();
    },
    on(method, listener) {
      listeners.set(method, [...(listeners.get(method) ?? []), listener]);
    },
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;

      const promise = new Promise((resolve, reject) => {
        callbacks.set(id, { resolve, reject });
      });

      socket.send(JSON.stringify({ id, method, params }));
      return promise;
    },
  };
}

async function waitFor(client, predicate, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await client.send("Runtime.evaluate", {
      expression: `Boolean((${predicate})())`,
      returnByValue: true,
    });

    if (result.result.value) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Timed out waiting for page state");
}

async function clickText(client, text) {
  const result = await client.send("Runtime.evaluate", {
    expression: `
      (() => {
        const wanted = ${JSON.stringify(text)};
        const element = [...document.querySelectorAll('button, a')]
          .find((candidate) => candidate.textContent.replace(/\\s+/g, ' ').trim().includes(wanted));
        if (!element) return false;
        element.click();
        return true;
      })()
    `,
    returnByValue: true,
  });

  if (!result.result.value) {
    throw new Error(`Could not find clickable text: ${text}`);
  }
}

async function navigate(client, url) {
  await client.send("Page.navigate", { url });
  await waitFor(client, `() => document.readyState === 'complete'`);
}

async function screenshot(client, filename) {
  await mkdir(screenshotsDir, { recursive: true });
  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 380, y: 10 });
  const viewport = await client.send("Runtime.evaluate", {
    expression: "({ x: window.scrollX, y: window.scrollY })",
    returnByValue: true,
  });
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    clip: { x: viewport.result.value.x, y: viewport.result.value.y, width: 390, height: 760, scale: 1 },
  });

  await writeFile(new URL(filename, screenshotsDir), Buffer.from(result.data, "base64"));
}

const target = await createTarget(appUrl);
const client = createCdpClient(target.webSocketDebuggerUrl);
await client.opened;

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: false });

  await navigate(client, `${appUrl}/trips`);
  await waitFor(client, `() => document.body.innerText.includes('Closet items needed')`);
  await screenshot(client, "wearabouts-ux-trips-empty.png");

  await navigate(client, `${appUrl}/upload`);
  await waitFor(client, `() => document.body.innerText.includes('Batch upload')`);
  await clickText(client, "Batch upload");
  await waitFor(client, `() => location.pathname.startsWith('/review/') && document.body.innerText.includes('Add All')`);
  await clickText(client, "Add All");
  await waitFor(client, `() => location.pathname === '/closet' && document.body.innerText.includes('6 approved items')`);

  await clickText(client, "Trips");
  await waitFor(client, `() => document.body.innerText.includes('Build trip looks')`);
  await screenshot(client, "wearabouts-ux-trips-start.png");

  await clickText(client, "Build trip looks");
  await waitFor(client, `() => document.body.innerText.includes('Packing list')`);
  await screenshot(client, "wearabouts-ux-trip-looks.png");

  await clickText(client, "Swap");
  await waitFor(client, `() => document.body.innerText.includes('Swapped one unlocked item')`);
  await clickText(client, "Approve");
  await waitFor(client, `() => document.body.innerText.includes('1/3 approved')`);
  await client.send("Runtime.evaluate", {
    expression: `
      [...document.querySelectorAll('section.card')]
        .find((section) => section.textContent.includes('Packing list'))
        ?.scrollIntoView({ block: 'start' })
    `,
  });
  await screenshot(client, "wearabouts-ux-packing-list.png");

  console.log("Captured trip flow screenshots.");
} finally {
  client.close();
}
