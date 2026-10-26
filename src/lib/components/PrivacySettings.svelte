<script>
  import { getTelemetryPreference, setTelemetryPreference, telemetryConfigured } from '../utils/telemetry.js';
  let enabled = $state(getTelemetryPreference());
  let message = $state('');
  function change(event) {
    const saved = setTelemetryPreference(event.currentTarget.checked);
    enabled = saved && event.currentTarget.checked;
    message = saved ? (enabled ? 'Anonymous reporting enabled.' : 'Anonymous reporting disabled.') : 'Preference could not be saved. Reporting stays off.';
  }
</script>
<section class="mt-6">
  <h3 class="section-label mb-2">Privacy</h3>
  <p class="text-sm text-ink-muted leading-relaxed">Anonymous screen counts and fixed error categories can be sent to an owner-configured self-hosted service. No visitor tracking or save contents. Reporting is off by default and respects Do Not Track and Global Privacy Control.</p>
  <label class="flex items-center gap-3 min-h-11 mt-2 text-sm">
    <input type="checkbox" checked={enabled} disabled={!telemetryConfigured} onchange={change} />
    Allow anonymous counts and error categories
  </label>
  {#if !telemetryConfigured}<p class="text-sm text-ink-muted">Reporting is unavailable because no service is configured. Nothing is sent.</p>{/if}
  <p role="status" class="text-sm text-ink-soft">{message}</p>
</section>
