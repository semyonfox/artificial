const names = {
  count: new Set(['app_open', 'screen_view', 'action_completed', 'action_failed']),
  error: new Set(['unexpected_error', 'request_failed', 'render_failed', 'storage_failed', 'permission_failed', 'media_failed', 'validation_failed']),
};
const routes = new Set(['app', 'game', 'settings']);

export function validateEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || /[\\\s?#]/.test(endpoint)) return null;
  if (endpoint.startsWith('/') && !endpoint.startsWith('//')) return endpoint.endsWith('/v1/events') ? endpoint : null;
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.username && !url.password && url.pathname.endsWith('/v1/events') ? url.href : null;
  } catch { return null; }
}

export function createAnonymousTelemetry({ enabled = false, endpoint, environment = globalThis, optedIn = () => false } = {}) {
  const target = validateEndpoint(endpoint);
  let inFlight = false;
  let total = 0;
  let recent = [];
  const errors = new Map();

  function permitted() {
    try {
      if (enabled !== true || !target || optedIn() !== true) return false;
      const navigator = environment.navigator;
      if (!navigator || navigator.globalPrivacyControl === true) return false;
      const signals = [navigator.doNotTrack, navigator.msDoNotTrack, environment.doNotTrack];
      return !signals.some(signal => signal === '1' || signal === 1 || signal === 'yes');
    } catch { return false; }
  }

  async function send(kind, name, route = 'app') {
    if (kind !== 'count' && kind !== 'error') return false;
    if (!names[kind].has(name) || !permitted()) return false;
    route = routes.has(route) ? route : 'app';
    const now = Date.now();
    recent = recent.filter(time => now - time < 60000);
    if (inFlight || total >= 200 || recent.length >= 20 || (kind === 'error' && now - (errors.get(name) ?? -Infinity) < 60000)) return false;
    let timer;
    let controller;
    try {
      controller = new environment.AbortController();
      timer = environment.setTimeout(() => controller.abort(), 2000);
      inFlight = true;
      total++;
      recent.push(now);
      if (kind === 'error') errors.set(name, now);
      const response = await environment.fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 1, app: 'artificial', kind, name, surface: 'web', route }),
        credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store',
        signal: controller.signal,
      });
      return response?.ok === true;
    } catch { return false; }
    finally {
      try { if (timer !== undefined) environment.clearTimeout(timer); } catch { /* telemetry remains optional */ }
      inFlight = false;
    }
  }
  return { send, permitted };
}
