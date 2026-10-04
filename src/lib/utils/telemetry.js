import { createAnonymousTelemetry, validateEndpoint } from './anonymousTelemetry.js';

const preferenceKey = 'artificial:anonymous-counts-enabled';
const buildEnabled = import.meta.env?.VITE_ANONYMOUS_TELEMETRY_ENABLED === 'true';
const endpoint = import.meta.env?.VITE_ANONYMOUS_TELEMETRY_ENDPOINT;
export const telemetryConfigured = buildEnabled && Boolean(validateEndpoint(endpoint));

let sessionPermission = null;

export function getTelemetryPreference() {
  try { return globalThis.localStorage?.getItem(preferenceKey) === 'true' && sessionPermission !== false; }
  catch { return false; }
}
export function setTelemetryPreference(enabled) {
  sessionPermission = enabled === true;
  try {
    globalThis.localStorage.setItem(preferenceKey, enabled === true ? 'true' : 'false');
    return true;
  } catch { sessionPermission = false; return false; }
}
export const telemetry = createAnonymousTelemetry({ enabled: buildEnabled, endpoint, optedIn: getTelemetryPreference });
