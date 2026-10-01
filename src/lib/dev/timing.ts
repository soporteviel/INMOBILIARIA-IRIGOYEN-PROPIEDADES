export function devTiming(scope: string, step: string, startedAt: number, detail?: string) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const elapsed = Math.round(performance.now() - startedAt);
  const suffix = detail ? ` · ${detail}` : "";
  console.info(`[nip-timing] ${scope} · ${step} · ${elapsed} ms${suffix}`);
}

export function devEvent(scope: string, step: string, detail?: string) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.info(`[nip-timing] ${scope} · ${step}${detail ? ` · ${detail}` : ""}`);
}

export async function devMeasure<T>(scope: string, step: string, run: () => Promise<T>, detail?: string) {
  const started = performance.now();
  try {
    return await run();
  } finally {
    devTiming(scope, step, started, detail);
  }
}
