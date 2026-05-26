import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";

const chromeJsonUrl = "http://127.0.0.1:9222";
const appUrl = process.env.WEARABOUTS_APP_URL ?? "http://localhost:3001";
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

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    const callback = callbacks.get(payload.id);
    if (!callback) {
      return;
    }

    callbacks.delete(payload.id);
    if (payload.error) {
      callback.reject(new Error(payload.error.message));
      return;
    }

    callback.resolve(payload.result);
  });

  return {
    opened: new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    close() {
      socket.close();
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

async function waitFor(client, predicate, timeoutMs = 8000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await client.send("Runtime.evaluate", {
      expression: `Boolean((${predicate})())`,
      returnByValue: true,
    });

    if (result.result.value) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error("Timed out waiting for page state");
}

async function screenshot(client, filename) {
  await mkdir(screenshotsDir, { recursive: true });
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: 390, height: 760, scale: 1 },
  });

  await writeFile(new URL(filename, screenshotsDir), Buffer.from(result.data, "base64"));
}

const target = await createTarget(`${appUrl}/upload`);
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

  await waitFor(client, `() => document.body.innerText.includes('Real Auto-Prettify')`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await screenshot(client, "wearabouts-ux-phase5-real-upload-item.png");

  await client.send("Runtime.evaluate", {
    expression: `Array.from(document.querySelectorAll('[role="tab"]')).find((tab) => tab.textContent.includes('Outfit photo')).click()`,
  });
  await waitFor(client, `() => document.body.innerText.includes('Upload and Detect Outfit')`);
  await screenshot(client, "wearabouts-ux-phase5-real-upload-outfit.png");

  await client.send("Runtime.evaluate", {
    expression: `Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('Dev')).click()`,
  });
  await waitFor(client, `() => document.body.innerText.includes('Upload and Use Multi-Card Cache')`);
  await screenshot(client, "wearabouts-ux-phase5-dev-upload-outfit.png");

  console.log("Captured Phase 5 real-mode upload screenshots.");
} finally {
  client.close();
}
