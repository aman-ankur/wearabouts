interface ClientTelemetryPayload {
  [key: string]: unknown;
}

export function logWearaboutsClientEvent(event: string, payload: ClientTelemetryPayload = {}) {
  console.info(
    JSON.stringify({
      event: `wearabouts.client.${event}`,
      at: new Date().toISOString(),
      ...payload,
    }),
  );
}
