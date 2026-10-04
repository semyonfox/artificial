import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnonymousTelemetry, validateEndpoint } from '../src/lib/utils/anonymousTelemetry.js';
import { readFileSync } from 'node:fs';

function harness(overrides = {}) {
  const calls = [];
  const environment = { navigator: {}, AbortController, setTimeout, clearTimeout, fetch: async (url, options) => { calls.push({ url, options }); return { ok: true }; }, ...overrides };
  return { calls, environment, client: createAnonymousTelemetry({ enabled: true, endpoint: 'https://counts.example/v1/events', optedIn: () => true, environment }) };
}

test('default, missing consent, privacy signals and throwing getters fail closed', async () => {
  const { calls, environment } = harness();
  await createAnonymousTelemetry({ endpoint: '/v1/events', environment }).send('count', 'app_open', 'game');
  await createAnonymousTelemetry({ enabled: true, endpoint: '/v1/events', environment }).send('count', 'app_open', 'game');
  for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: '1' }, { msDoNotTrack: 'yes' }]) {
    const h = harness({ navigator }); assert.equal(await h.client.send('count', 'app_open', 'game'), false); assert.equal(h.calls.length, 0);
  }
  const h = harness();
  Object.defineProperty(h.environment, 'doNotTrack', { get() { throw new Error('private fixture'); } });
  assert.equal(await h.client.send('count', 'app_open', 'game'), false);
  assert.equal(h.calls.length, 0); assert.equal(calls.length, 0);
});

test('only six literal fields leave the app; unknown routes are generalized and unknown events rejected', async () => {
  const h = harness();
  assert.equal(await h.client.send('count', 'app_open', 'game'), true);
  assert.equal(await h.client.send('error', 'storage_failed', 'game'), true);
  assert.equal(await h.client.send('error', 'PRIVATE_SAVE_FIXTURE', 'game'), false);
  assert.equal(await h.client.send('count', 'app_open', 'https://private.example/user/42?secret=fixture'), true);
  assert.equal(await h.client.send('constructor', 'app_open', 'game'), false);
  assert.equal(await h.client.send('__proto__', 'app_open', 'game'), false);
  assert.equal(JSON.parse(h.calls.at(-1).options.body).route, 'app');
  for (const { options } of h.calls) {
    const body = JSON.parse(options.body);
    assert.deepEqual(Object.keys(body), ['version', 'app', 'kind', 'name', 'surface', 'route']);
    assert.equal(body.app, 'artificial'); assert.equal(body.surface, 'web'); assert.ok(['game', 'app'].includes(body.route));
    assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
    assert.equal(options.signal instanceof AbortSignal, true);
    assert.ok(Buffer.byteLength(options.body) < 1024);
    assert.equal(options.body.includes('PRIVATE'), false);
    assert.equal(options.body.includes('private.example'), false);
    assert.equal(options.body.includes('user/42'), false);
  }
});

test('endpoint validation excludes credentials, plaintext, URL parameters and protocol-relative destinations', () => {
  for (const value of ['http://counts.example/v1/events', '//counts.example/v1/events', 'https://user:password@counts.example/v1/events', '/v1/events?save=fixture', '/v1/events#fragment', '/\\example/v1/events', 'https://counts.example/other']) assert.equal(validateEndpoint(value), null);
  assert.equal(validateEndpoint('/v1/events'), '/v1/events');
});

test('consent is checked again for every send, error repeats and bursts are bounded', async () => {
  const h = harness();
  await h.client.send('error', 'storage_failed', 'game');
  await h.client.send('error', 'storage_failed', 'game');
  assert.equal(h.calls.length, 1);
  h.environment.navigator.doNotTrack = '1';
  await h.client.send('count', 'app_open', 'game'); assert.equal(h.calls.length, 1);
  h.environment.navigator.doNotTrack = '0';
  for (let i = 0; i < 30; i++) await h.client.send('count', 'action_completed', 'game');
  assert.equal(h.calls.length, 20);
});

test('one request at a time and transport/setup failures are harmless with no retry', async () => {
  let release;
  const h = harness({ fetch: () => new Promise(resolve => { release = resolve; }) });
  const first = h.client.send('count', 'app_open', 'game');
  assert.equal(await h.client.send('count', 'screen_view', 'game'), false);
  release({ ok: true }); assert.equal(await first, true);
  let attempts = 0;
  const broken = harness({ fetch: async () => { attempts++; throw new Error('PRIVATE_SAVE_FIXTURE'); } });
  assert.equal(await broken.client.send('error', 'storage_failed', 'game'), false);
  assert.equal(attempts, 1);
  const setup = harness({ setTimeout() { throw new Error('unavailable'); } });
  assert.equal(await setup.client.send('count', 'app_open', 'game'), false); assert.equal(setup.calls.length, 0);
});

test('real startup and save recovery call sites use fixed categories without error content', () => {
  const app = readFileSync(new URL('../src/App.svelte', import.meta.url), 'utf8');
  const store = readFileSync(new URL('../src/lib/stores/gameStore.js', import.meta.url), 'utf8');
  assert.match(app, /telemetry.send\("count", "app_open", "game"\)/);
  assert.match(app, /"validation_failed".*"storage_failed".*"unexpected_error", "game"/);
  assert.match(store, /if \(!saved\) void telemetry.send\("error", "storage_failed", "game"\)/);
  assert.doesNotMatch(app + store, /telemetry.send\([^;]*(error\.(message|stack)|location\.)/);
});


test('app lifetime limit remains 200 after minute windows roll over', async () => {
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  try {
    const h = harness();
    for (let minute = 0; minute < 12; minute++) {
      for (let i = 0; i < 20; i++) await h.client.send('count', 'action_completed', 'game');
      now += 60001;
    }
    assert.equal(h.calls.length, 200);
  } finally { Date.now = originalNow; }
});

test('failed opt-out persistence still disables reporting for the current page', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'true', setItem() { throw new Error('quota'); } } });
  try {
    const { getTelemetryPreference, setTelemetryPreference } = await import('../src/lib/utils/telemetry.js');
    assert.equal(getTelemetryPreference(), true);
    assert.equal(setTelemetryPreference(false), false);
    assert.equal(getTelemetryPreference(), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});
