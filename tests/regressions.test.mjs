import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const temporary = await mkdtemp(path.join(os.tmpdir(), 'courseit-tests-'));
for (const key of Object.keys(process.env)) {
  if (/^(APPWRITE_|VITE_APPWRITE_|NETLIFY|AWS_LAMBDA_|VITE_MAINTENANCE|RESEND_|MISTRAL_|GROQ_|OPENROUTER_|CEREBRAS_|GEMINI_)/.test(key)) delete process.env[key];
}
Object.assign(process.env, { COURSEIT_DATA_DIR: temporary, APPWRITE_ENDPOINT: 'https://auth.test/v1',
  APPWRITE_PROJECT_ID: 'test-project', ADMIN_EMAIL: 'admin@example.test', LLM_API_KEY: 'test-only', LLM_PROVIDER: 'gemini' });
let providerCalls = 0;
let providerFailure = false;
let providerRateLimited = false;
let providerAuthFailure = false;
let providerBadRequest = false;
let fallbackCalls = [];
let fallbackStatuses = {};
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  const url = typeof input === 'string' ? input : input.url || String(input);
  if (url.startsWith('https://auth.test/v1/account')) {
    const jwt = new Headers(options.headers || input.headers).get('x-appwrite-jwt');
    if (['admin', 'author', 'newbie'].includes(jwt)) return Response.json({ $id: jwt, email: jwt + '@example.test', name: jwt });
    return Response.json({ message: 'Invalid session', code: 401 }, { status: 401 });
  }
  if (url.startsWith('https://auth.test/v1/users/identities')) return Response.json({ total: 1,
    identities: [{ $id: 'identity-1', userId: 'author', provider: 'github' }] });
  if (url.startsWith('https://auth.test/v1/users')) return Response.json({ total: 4, users: [
    { $id: 'author', email: 'author@example.test', name: 'Author', emailVerification: true },
    { $id: 'newbie', email: 'newbie@example.test', name: 'Newbie', emailVerification: false }
  ] });
  if (url.includes('generativelanguage.googleapis.com')) {
    providerCalls++;
    if (providerAuthFailure) return Response.json({ error: { message: 'Invalid API key', code: 401 } }, { status: 401 });
    if (providerBadRequest) return Response.json({ error: { message: 'Bad Request: Invalid argument', code: 400 } }, { status: 400 });
    if (providerRateLimited) return Response.json({ error: { message: 'RESOURCE_EXHAUSTED: Retry in 2 seconds', code: 429 } },
      { status: 429, headers: { 'Retry-After': '2' } });
    if (providerFailure) return Response.json({ error: { message: 'Service Unavailable', code: 503 } }, { status: 503 });
    const course = { title: 'Test generated course', steps: [{ title: 'Build a test', summary: 'Run the test.' }] };
    return Response.json({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(course) }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 } });
  }
  const fallback = url.includes('api.cerebras.ai') ? 'Cerebras' :
    url.includes('api.groq.com') ? 'Groq' :
    url.includes('api.mistral.ai') ? 'Mistral' :
    url.includes('openrouter.ai/api') ? 'OpenRouter' : null;
  if (fallback) {
    const request = JSON.parse(options.body);
    fallbackCalls.push({ provider: fallback, request });
    if (fallbackStatuses[fallback]) return Response.json({ error: { message: 'Provider unavailable' } },
      { status: fallbackStatuses[fallback], headers: { 'Retry-After': '3' } });
    return Response.json({ model: request.model, choices: [{ message: { content: JSON.stringify({
      title: 'Fallback course', steps: [{ title: 'Build a fallback', summary: 'Run the command.' }] }) } }],
      usage: { prompt_tokens: 12, completion_tokens: 24, total_tokens: 36 } });
  }
  if (url === 'https://docs.test/guide') return new Response('<html><head><title>Example docs</title></head><body><article><h1>Build a test</h1><p>Install the package, create a test file and run the test command to check your application. These instructions provide enough text for extraction.</p></article></body></html>');
  throw new Error('Unexpected external request: ' + url);
};
after(async () => { globalThis.fetch = originalFetch; await rm(temporary, { recursive: true, force: true }); });
const { handler } = await import('../server/api.js');
const { writeState, readState, updateState, listState, deleteState } = await import('../server/state.js');
const { listCatalog, readCourse, cleanupGuestCourses, publishCourse, listDocumentsAll, addPublicCourseToFeed } = await import('../server/catalog.js');
const { getUserQuota, topUpUserCredits, deductCredit, getCreditHistory, getTokenMetrics, processDocumentText, processDocumentationUrl, listAllUsers, reserveGeneration, releaseGeneration, deleteCourse, getAuthIdentityOverview } = await import('../server/handler.js');
const { handleApiRequest } = await import('../server/request.js');
const { normalizeCourse, canReadCourse, publicCourse } = await import('../shared/courses.js');
const { discoverDocumentationSections } = await import('../server/discover.js');
const { readApiResponse } = await import('../src/lib/api.js');
const { apiError, providerRetrySeconds } = await import('../server/errors.js');
const { getGenerationJob, runGenerationJob } = await import('../server/generationJobs.js');
const { authenticatedFetch } = await import('../src/lib/auth.js');
const api = (route, method = 'GET', body, token) => handler({ path: '/api' + route, httpMethod: method,
  body: body ? JSON.stringify(body) : '', queryStringParameters: {}, headers: token ? { 'x-appwrite-jwt': token } : {} });
const fixture = (id, extra = {}) => normalizeCourse({ $id: id, title: 'Course', steps: [],
  $createdAt: new Date().toISOString(), creator_id: 'author', creator_email: 'private@example.test', ...extra });

test('authenticatedFetch strips stale bearer headers for guest/public requests', async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const requests = [];

  globalThis.localStorage = {
    getItem: () => null,
    setItem() {},
    removeItem() {}
  };

  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, headers: options.headers || {} });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    await authenticatedFetch('/api/public', {
      headers: {
        Authorization: 'Bearer undefined',
        'x-appwrite-jwt': 'undefined'
      }
    });

    assert.equal(requests.length, 1);
    assert.equal(requests[0].headers.authorization, undefined);
    assert.equal(requests[0].headers['x-appwrite-jwt'], undefined);
    assert.equal(requests[0].headers.Authorization, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
  }
});

test('legacy account courses stay private even with course_ IDs', () => {
  const course = normalizeCourse({ $id: 'course_legacy', steps: JSON.stringify({ creator_id: 'author', items: [] }) });
  assert.equal(course.visibility, 'private');
  assert.equal(canReadCourse(course), false);
});
test('feedback keeps verified identity and message, while forged or anonymous submissions fail', async () => {
  const body = { name: 'forged', email: 'forged@example.test', userId: 'admin',
    rating: 4, category: 'Bug Report', message: 'Useful <script>alert(1)</script>', pageUrl: 'https://courseitai.kenncode.me/app' };
  assert.equal((await api('/feedback', 'POST', body)).statusCode, 401);
  const result = await api('/feedback', 'POST', body, 'author');
  assert.equal(result.statusCode, 200);
  const feedback = JSON.parse(result.body).feedback;
  assert.equal(feedback.userId, 'author');
  assert.equal(feedback.email, 'author@example.test');
  assert.equal(feedback.name, 'author');
  assert.equal(feedback.message, body.message);
  assert.equal((await readState('feedback/' + feedback.id)).message, body.message);
  const list = await api('/feedback', 'GET', undefined, 'admin');
  assert.ok(JSON.parse(list.body).feedbacks.some(item => item.id === feedback.id && item.message === body.message));
});
test('legacy display-only password reset endpoint no longer sends a code', async () => {
  assert.equal((await api('/user/reset-password', 'POST', { email: 'author@example.test' })).statusCode, 410);
});
test('signup registration requires verified account identity', async () => {
  const forged = { userId: 'admin', name: 'admin', email: 'admin@example.test' };
  assert.equal((await api('/user/signup', 'POST', forged)).statusCode, 401);
  assert.equal((await api('/user/signup', 'POST', forged, 'newbie')).statusCode, 200);
  const record = await readState('users/newbie');
  assert.equal(record.email, 'newbie@example.test');
  assert.equal(record.name, 'newbie');
  assert.equal(record.status, 'pending');
});
test('public guest course is readable in an independent request without author email', async () => {
  await writeState('courses/guest', fixture('guest', { is_guest: true, creator_id: 'public_guest' }));
  const result = await api('/courses/guest');
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).course.creator_email, undefined);
  assert.ok((await listCatalog()).some(c => c.$id === 'guest'));
});
test('private course requires author or admin and is absent from public catalog', async () => {
  await writeState('courses/private', fixture('private'));
  assert.equal((await api('/courses/private')).statusCode, 401);
  assert.equal((await api('/courses/private', 'GET', undefined, 'author')).statusCode, 200);
  assert.ok(!(await listCatalog()).some(c => c.$id === 'private'));
  await assert.rejects(readCourse('private', { userId: 'other' }), { status: 403 });
});
test('explicit author publishing grants guest access', async () => {
  await assert.rejects(publishCourse('private', { userId: 'other' }), { status: 403 });
  await publishCourse('private', { userId: 'author' });
  assert.equal((await api('/courses/private')).statusCode, 200);
});
test('30-minute expiry blocks reads; cleanup preserves active and account courses', async () => {
  await writeState('courses/expired', fixture('expired', { is_guest: true, creator_id: 'public_guest', $createdAt: new Date(Date.now() - 1800001).toISOString() }));
  assert.equal((await api('/courses/expired')).statusCode, 410);
  assert.ok(!(await listCatalog()).some(c => c.$id === 'expired'));
  assert.equal(await cleanupGuestCourses(), 1);
  assert.equal(await readState('courses/expired'), null);
  assert.ok(await readState('courses/guest'));
  assert.ok(await readState('courses/private'));
});
test('persistent maintenance is admin-only and blocks generation before AI calls', async () => {
  assert.equal((await api('/maintenance')).statusCode, 200);
  assert.equal((await api('/maintenance', 'POST', { enabled: true })).statusCode, 403);
  assert.equal((await api('/maintenance', 'POST', { enabled: true }, 'admin')).statusCode, 200);
  assert.equal(JSON.parse((await api('/maintenance')).body).enabled, true);
  const before = providerCalls;
  assert.equal((await api('/summarize-text', 'POST', { text: 'Example text' })).statusCode, 503);
  assert.equal(providerCalls, before);
  await api('/maintenance', 'POST', { enabled: false }, 'admin');
});
test('forged identity cannot read history, delete or grant admin rights', async () => {
  assert.equal((await api('/admin/users', 'GET', { isAdmin: true })).statusCode, 403);
  assert.equal((await api('/user/history')).statusCode, 401);
  assert.equal((await api('/courses/delete', 'POST', { courseId: 'private', userId: 'author', userEmail: 'admin@example.test' })).statusCode, 401);
  assert.equal((await api('/summarize-text', 'POST', { text: 'Example', userId: 'author' })).statusCode, 401);
});
test('account/top-up survive independent reads with fractional balance and history', async () => {
  assert.equal((await getUserQuota('author', 'author@example.test', 'Author')).status, 'pending');
  await topUpUserCredits('author', 1.5);
  assert.equal((await getUserQuota('author')).quota_remaining, 1.5);
  assert.equal((await getCreditHistory('author'))[0].credits, 1.5);
  assert.ok((await listAllUsers()).some(u => u.user_id === 'author'));
  assert.ok(!(await listAllUsers()).some(u => u.user_id === 'user_yopmail_kenn_2026'));
});
test('concurrent deductions cannot overspend fractional credits', async () => {
  await updateState('users/author', u => ({ ...u, status: 'approved', quota_remaining: 0.5 }));
  const results = await Promise.allSettled([deductCredit('author'), deductCredit('author')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await readState('users/author')).quota_remaining, 0);
});
test('exhausted account fails before provider call', async () => {
  const before = providerCalls;
  await assert.rejects(processDocumentText({ text: 'Example source', userId: 'author' }), { status: 402 });
  assert.equal(providerCalls, before);
});
test('same URL produces distinct persisted guest courses; quota is shared', async () => {
  await writeState('settings/guest-quota', { lastReset: Date.now(), totalGenerations: 0 });
  const options = { fetchHtml: async url => ({ html: await (await fetch(url)).text(), url }) };
  const first = await processDocumentationUrl('https://docs.test/guide', undefined, false, false, null, '', 'public', options);
  const second = await processDocumentationUrl('https://docs.test/guide', undefined, false, false, null, '', 'public', options);
  assert.notEqual(first.course.$id, second.course.$id);
  assert.equal(second.quota.remaining, 1);
  assert.equal((await readCourse(first.course.$id)).visibility, 'public');
  assert.ok((await listCatalog()).some(c => c.$id === second.course.$id));
});
test('guest and account reservations stop concurrent provider work before quota is spent', async () => {
  const guest = await Promise.allSettled([
    reserveGeneration('public_guest', false, 'gemini-flash-lite-latest'),
    reserveGeneration('public_guest', false, 'gemini-flash-lite-latest')
  ]);
  assert.equal(guest.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(guest.find(item => item.status === 'rejected').reason.status, 429);
  await releaseGeneration('public_guest', guest.find(item => item.status === 'fulfilled').value);

  await getUserQuota('limited', 'limited@example.test');
  await updateState('users/limited', current => ({ ...current, status: 'approved', quota_remaining: 0.5 }));
  const account = await Promise.allSettled([
    reserveGeneration('limited', false, 'gemini-flash-lite-latest'),
    reserveGeneration('limited', false, 'gemini-flash-lite-latest')
  ]);
  assert.equal(account.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(account.find(item => item.status === 'rejected').reason.status, 402);
  await releaseGeneration('limited', account.find(item => item.status === 'fulfilled').value);
});
test('oversized requests stop before generation', async () => {
  const before = providerCalls;
  const result = await api('/summarize-text', 'POST', { text: 'x'.repeat(130000) });
  assert.equal(result.statusCode, 413);
  assert.equal(providerCalls, before);
});
test('account OCR defaults private and records token and credit history', async () => {
  await topUpUserCredits('author', 2);
  const result = await processDocumentText({ title: 'Notes', text: 'Example source', userId: 'author', userEmail: 'author@example.test' });
  assert.equal(result.course.visibility, 'private');
  assert.equal(result.quota.remaining, 1.5);
  assert.ok((await getCreditHistory('author')).some(h => h.courseId === result.course.$id && h.credits === -0.5 && h.totalTokens === 30));
});
test('non-owner course views omit author email and URL query secrets', () => {
  const course = fixture('redacted', { visibility: 'community',
    source_url: 'https://docs.test/guide?token=secret#part',
    input_url: 'https://docs.test/index?key=secret', creator_name: 'Author' });
  const publicView = publicCourse(course, 'newbie', false);
  assert.equal(publicView.creator_email, undefined);
  assert.equal(publicView.creator_id, undefined);
  assert.equal(publicView.source_url, 'https://docs.test/guide');
  assert.equal(publicView.input_url, 'https://docs.test/index');
  assert.equal(publicCourse(course, 'author', false).source_url, course.source_url);
});
test('bounded topic discovery ranks same-host documentation and ignores unsafe links', async () => {
  const page = `<nav><a href="/en/stable/tutorials/audio/index.html">Audio</a>
    <a href="/en/stable/tutorials/audio/audio_buses.html">Audio buses</a>
    <a href="https://evil.test/audio">Audio elsewhere</a>
    <a href="http://127.0.0.1/audio">Audio local</a></nav>`;
  const result = await discoverDocumentationSections('https://docs.godotengine.org/en/stable/index.html',
    'I want to learn audio', async url => ({ html: page, url }));
  assert.equal(result.candidates[0].url, 'https://docs.godotengine.org/en/stable/tutorials/audio/index.html');
  assert.equal(result.candidates.length, 2);
  assert.ok(result.candidates.every(candidate => new URL(candidate.url).hostname === 'docs.godotengine.org'));
  await assert.rejects(discoverDocumentationSections('http://127.0.0.1/', 'audio', async () => ({ html: page })), { status: 422 });
});
test('admin identity counts distinguish Auth availability from application records', async () => {
  const response = await api('/admin/users', 'GET', undefined, 'admin');
  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.count, data.users.length);
  assert.equal(data.auth.available, false);
  assert.equal(data.auth.total, null);
  assert.equal((await api('/admin/users', 'GET', undefined, 'author')).statusCode, 403);
});
test('server-only Users key returns Auth total, verification and provider identities', async () => {
  process.env.APPWRITE_USERS_API_KEY = 'test-users-read-key';
  try {
    const auth = await getAuthIdentityOverview();
    assert.equal(auth.available, true);
    assert.equal(auth.total, 4);
    assert.equal(auth.partial, true);
    assert.equal(auth.users.find(user => user.id === 'author').emailVerification, true);
    assert.deepEqual(auth.users.find(user => user.id === 'author').providers, ['github']);
    assert.equal(auth.users.find(user => user.id === 'newbie').emailVerification, false);
  } finally { delete process.env.APPWRITE_USERS_API_KEY; }
});
test('rate-limit errors have safe codes and bounded provider retry timing', async () => {
  assert.equal(providerRetrySeconds({ headers: new Headers({ 'Retry-After': '7' }) }), 7);
  assert.equal(providerRetrySeconds({ errorDetails: [{ retryDelay: '12s' }] }), 12);
  assert.equal(providerRetrySeconds({ headers: new Headers({ 'Retry-After': '99999' }) }), 3600);
  const failure = apiError({ provider: true, status: 429, message: 'RESOURCE_EXHAUSTED',
    headers: new Headers({ 'Retry-After': '7' }) });
  assert.equal(failure.body.code, 'RATE_LIMITED');
  assert.equal(failure.body.retryAfterSeconds, 7);
  assert.ok(!failure.body.error.includes('RESOURCE_EXHAUSTED'));
  await assert.rejects(readApiResponse(Response.json(failure.body, { status: 429 })),
    error => error.code === 'RATE_LIMITED' && error.retryAfterSeconds === 7);
});
test('durable generation jobs expose real stages and reject concurrent duplicate work', async () => {
  const id = randomUUID();
  const course = fixture('job-course-' + Date.now());
  let release;
  let signalStarted;
  const gate = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { signalStarted = resolve; });
  const options = { id, actor: 'author', payload: { text: 'test' }, session: { userId: 'author' } };
  const first = runGenerationJob({ ...options, work: async onStage => {
    await onStage('Generating with Gemini');
    signalStarted();
    await gate;
    await writeState('courses/' + course.$id, course);
    return { course, quota: { remaining: 1 } };
  } });
  await started;
  const concurrent = await runGenerationJob({ ...options, work: () => { throw new Error('Duplicate ran'); } });
  assert.equal(concurrent.status, 202, JSON.stringify(concurrent.body));
  assert.equal((await getGenerationJob(id, 'newbie')).status, 403);
  assert.ok((await getGenerationJob(id, 'author', options.session)).body.events.some(e => e.stage === 'Generating with Gemini'));
  release();
  assert.equal((await first).status, 200);
  const replay = await runGenerationJob({ ...options, work: () => { throw new Error('Replay ran'); } });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.course.$id, course.$id);
});
test('Gemini 429 does not call a fallback model or deduct credits twice on retry', async () => {
  await topUpUserCredits('author', 2);
  const beforeBalance = (await getUserQuota('author')).quota_remaining;
  const beforeCalls = providerCalls;
  const requestId = randomUUID();
  const body = { title: 'Rate limited notes', text: 'Example source', requestId };
  providerRateLimited = true;
  try {
    const limited = await api('/summarize-text', 'POST', body, 'author');
    assert.equal(limited.statusCode, 429);
    assert.equal(JSON.parse(limited.body).code, 'RATE_LIMITED');
    assert.equal(JSON.parse(limited.body).retryAfterSeconds, 2);
    assert.equal(providerCalls, beforeCalls + 1);
    assert.equal((await getUserQuota('author')).quota_remaining, beforeBalance);
    assert.equal((await api('/summarize-text', 'POST', body, 'author')).statusCode, 429);
    assert.equal(providerCalls, beforeCalls + 1);
    await updateState('generation-jobs/' + requestId, job => ({ ...job, retryAt: Date.now() - 1 }));
    providerRateLimited = false;
    const generated = JSON.parse((await api('/summarize-text', 'POST', body, 'author')).body);
    assert.ok(generated.course?.$id);
    const replay = JSON.parse((await api('/summarize-text', 'POST', body, 'author')).body);
    assert.equal(replay.course.$id, generated.course.$id);
    assert.equal((await getUserQuota('author')).quota_remaining, beforeBalance - 0.5);
    assert.equal((await getCreditHistory('author')).filter(event => event.courseId === generated.course.$id).length, 1);
  } finally { providerRateLimited = false; }
});
test('1. Gemini success -> stop', async () => {
  const beforeCalls = fallbackCalls.length;
  providerRateLimited = false;
  const { summarizeWithLLM } = await import('../server/llm/manager.js');
  const result = await summarizeWithLLM('Example source', 'Primary test');
  assert.equal(result.actualModel, 'gemini-flash-lite-latest');
  assert.equal(Boolean(result.isFallback), false);
  assert.equal(fallbackCalls.length, beforeCalls);
});
test('2. Gemini 429 -> Cerebras', async () => {
  process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
  providerRateLimited = true;
  const beforeCalls = fallbackCalls.length;
  try {
    const { summarizeWithLLM } = await import('../server/llm/manager.js');
    const result = await summarizeWithLLM('Example source', 'Cerebras test');
    assert.equal(result.actualModel, 'cerebras:llama3.1-8b');
    assert.equal(result.isFallback, true);
    assert.match(result.fallbackNotice, /Cerebras/);
    assert.equal(fallbackCalls.length, beforeCalls + 1);
    assert.equal(fallbackCalls.at(-1).provider, 'Cerebras');
  } finally {
    providerRateLimited = false;
    delete process.env.CEREBRAS_API_KEY;
  }
});
test('3. Cerebras temporary failure -> Groq', async () => {
  process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  providerRateLimited = true;
  fallbackStatuses = { Cerebras: 503 };
  try {
    const { summarizeWithLLM } = await import('../server/llm/manager.js');
    const result = await summarizeWithLLM('a'.repeat(35000), 'Long documentation');
    assert.equal(result.actualModel, 'groq:openai/gpt-oss-20b');
    assert.match(result.fallbackNotice, /shorter source excerpt/);
    assert.deepEqual(fallbackCalls.slice(-2).map(call => call.provider), ['Cerebras', 'Groq']);
    assert.ok(fallbackCalls.at(-1).request.messages[1].content.length < 13000);
  } finally {
    providerRateLimited = false;
    fallbackStatuses = {};
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.GROQ_API_KEY;
  }
});
test('4. Groq temporary failure -> Mistral', async () => {
  process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
  providerRateLimited = true;
  fallbackStatuses = { Cerebras: 503, Groq: 504 };
  try {
    const { summarizeWithLLM } = await import('../server/llm/manager.js');
    const result = await summarizeWithLLM('Example source', 'Mistral fallback test');
    assert.equal(result.actualModel, 'mistral:mistral-small-latest');
    assert.match(result.fallbackNotice, /Mistral/);
    assert.deepEqual(fallbackCalls.slice(-3).map(call => call.provider), ['Cerebras', 'Groq', 'Mistral']);
  } finally {
    providerRateLimited = false;
    fallbackStatuses = {};
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
  }
});
test('5. Mistral temporary failure -> OpenRouter', async () => {
  process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  providerRateLimited = true;
  fallbackStatuses = { Cerebras: 503, Groq: 504, Mistral: 429 };
  try {
    const { summarizeWithLLM } = await import('../server/llm/manager.js');
    const result = await summarizeWithLLM('Example source', 'OpenRouter fallback test');
    assert.equal(result.actualModel, 'openrouter:openrouter/free');
    assert.deepEqual(fallbackCalls.slice(-4).map(call => call.provider), ['Cerebras', 'Groq', 'Mistral', 'OpenRouter']);
    assert.equal(fallbackCalls.at(-1).request.model, 'openrouter/free');
  } finally {
    providerRateLimited = false;
    fallbackStatuses = {};
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  }
});
test('6. missing key -> skip provider', async () => {
  delete process.env.CEREBRAS_API_KEY;
  process.env.GROQ_API_KEY = 'test-groq-key';
  providerRateLimited = true;
  const beforeCalls = fallbackCalls.length;
  try {
    const { summarizeWithLLM } = await import('../server/llm/manager.js');
    const result = await summarizeWithLLM('Example source', 'Skip missing key test');
    assert.equal(result.actualModel, 'groq:openai/gpt-oss-20b');
    assert.equal(fallbackCalls.length, beforeCalls + 1);
    assert.equal(fallbackCalls.at(-1).provider, 'Groq');
    assert.ok(!fallbackCalls.slice(beforeCalls).some(call => call.provider === 'Cerebras'));
  } finally {
    providerRateLimited = false;
    delete process.env.GROQ_API_KEY;
  }
});
test('7. bad request -> no fallback', async () => {
  process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  providerBadRequest = true;
  const beforeCalls = fallbackCalls.length;
  try {
    const { summarizeWithLLM } = await import('../server/llm/manager.js');
    await assert.rejects(summarizeWithLLM('Example source'), error => Number(error.status) === 400);
    assert.equal(fallbackCalls.length, beforeCalls);
  } finally {
    providerBadRequest = false;
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  }
});
test('8. fallback success -> exactly one course, one credit deduction, one usage record', async () => {
  process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
  await topUpUserCredits('author', 10);
  const beforeBalance = (await getUserQuota('author')).quota_remaining;
  const beforeCalls = fallbackCalls.length;
  providerRateLimited = true;
  const requestId = randomUUID();
  try {
    const result = await processDocumentText({
      title: 'Cerebras fallback notes',
      text: 'Example source documentation for testing learning steps.',
      customModel: 'gemini-3.7-flash',
      userId: 'author',
      userEmail: 'author@example.test',
      requestId
    });
    assert.equal(result.course.actual_model, 'cerebras:llama3.1-8b');
    assert.equal(result.course.credits_charged, 0.5);
    assert.equal(result.quota.remaining, beforeBalance - 0.5);
    assert.match(result.fallbackNotice, /Cerebras/);
    assert.equal(result.course.generation_request_id, requestId);
    assert.equal(fallbackCalls.length, beforeCalls + 1);
    assert.equal(fallbackCalls.at(-1).provider, 'Cerebras');

    // Exactly one course created
    const courses = (await listState('courses/')).filter(c => c.$id === result.course.$id);
    assert.equal(courses.length, 1);

    // Exactly one credit deduction event
    const historyEvents = (await getCreditHistory('author')).filter(event => event.courseId === result.course.$id);
    assert.equal(historyEvents.length, 1);
    assert.equal(historyEvents[0].actualModel, 'cerebras:llama3.1-8b');

    // Exactly one usage entry
    const usageEntries = (await listState('usage/')).filter(entry => entry.courseId === result.course.$id);
    assert.equal(usageEntries.length, 1);
  } finally {
    providerRateLimited = false;
    delete process.env.CEREBRAS_API_KEY;
  }
});
test('Gemini 429 uses configured Mistral and charges the Flash Lite tier once', async () => {
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
  await topUpUserCredits('author', 10);
  const beforeBalance = (await getUserQuota('author')).quota_remaining;
  const beforeCalls = fallbackCalls.length;
  providerRateLimited = true;
  try {
    const result = await processDocumentText({ title: 'Fallback notes', text: 'Example source',
      customModel: 'gemini-3.7-flash', userId: 'author', userEmail: 'author@example.test' });
    assert.equal(result.course.actual_model, 'mistral:mistral-small-latest');
    assert.equal(result.course.credits_charged, 0.5);
    assert.equal(result.quota.remaining, beforeBalance - 0.5);
    assert.match(result.fallbackNotice, /Mistral/);
    assert.equal(fallbackCalls.length, beforeCalls + 1);
    assert.equal(fallbackCalls.at(-1).provider, 'Mistral');
    assert.equal((await getCreditHistory('author')).find(event => event.courseId === result.course.$id).actualModel,
      'mistral:mistral-small-latest');
  } finally { providerRateLimited = false; delete process.env.MISTRAL_API_KEY; }
});
test('Gemini credential errors do not send documentation to fallback providers', async () => {
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
  providerAuthFailure = true;
  const beforeCalls = fallbackCalls.length;
  try {
    const { summarizeWithLLM } = await import('../server/llm.js');
    await assert.rejects(summarizeWithLLM('Example source'), error => Number(error.status) === 401);
    assert.equal(fallbackCalls.length, beforeCalls);
  } finally { providerAuthFailure = false; delete process.env.MISTRAL_API_KEY; }
});
test('signed-in generations default private and direct URLs enforce ownership', async () => {
  const generated = await api('/summarize-text', 'POST', { title: 'Private notes', text: 'Example source' }, 'author');
  assert.equal(generated.statusCode, 200);
  const course = JSON.parse(generated.body).course;
  assert.equal(course.visibility, 'private');
  assert.ok(!(await listCatalog()).some(item => item.$id === course.$id));
  assert.ok(!((await readState('indexes/public-feed'))?.entries || []).some(item => item.id === course.$id));
  assert.equal((await api('/courses/' + course.$id)).statusCode, 401);
  assert.equal((await api('/courses/' + course.$id, 'GET', undefined, 'newbie')).statusCode, 403);
  assert.equal((await api('/courses/' + course.$id, 'GET', undefined, 'author')).statusCode, 200);
  assert.equal((await api('/summarize-text', 'POST', { text: 'Example source', visibility: 'unlisted' }, 'author')).statusCode, 400);
});
test('community course requires a signed-in reader and is not in anonymous discovery', async () => {
  const generated = await api('/summarize-text', 'POST', { title: 'Community notes', text: 'Example source', visibility: 'community' }, 'author');
  assert.equal(generated.statusCode, 200);
  const course = JSON.parse(generated.body).course;
  assert.equal(course.visibility, 'community');
  assert.equal((await api('/courses/' + course.$id)).statusCode, 401);
  assert.equal((await api('/courses/' + course.$id, 'GET', undefined, 'newbie')).statusCode, 200);
  assert.ok(!(await listCatalog()).some(item => item.$id === course.$id));
  assert.ok((await listCatalog({ userId: 'newbie' })).some(item => item.$id === course.$id));
  assert.equal((await readState('courses/' + course.$id)).visibility, 'community');
});
test('canonical server course deletion requires its owner and removes the course', async () => {
  const course = fixture('semaphore-delete-fixture', { visibility: 'public' });
  await writeState('courses/' + course.$id, course);
  assert.equal((await api('/courses/' + course.$id, 'GET', undefined, 'author')).statusCode, 200);
  assert.equal((await api('/courses/delete', 'POST', { courseId: course.$id }, 'newbie')).statusCode, 403);
  assert.ok(await readState('courses/' + course.$id));
  assert.equal((await api('/courses/delete', 'POST', { courseId: course.$id }, 'author')).statusCode, 200);
  assert.equal(await readState('courses/' + course.$id), null);
  assert.equal((await api('/courses/' + course.$id, 'GET', undefined, 'author')).statusCode, 404);
});
test('OCR source image persists privately for its owner and is removed with the course', async () => {
  const course = fixture('source-fixture', { source_type: 'document', source_url: 'upload://scan', visibility: 'public' });
  await writeState('courses/' + course.$id, course);
  const image = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
  const endpoint = `https://courseit.test/api/courses/${course.$id}/source`;
  const upload = (jwt, body = image) => handleApiRequest(new Request(endpoint, { method: 'PUT',
    headers: { 'x-appwrite-jwt': jwt, 'x-source-filename': 'scan.png' }, body }));
  assert.equal((await upload('newbie')).status, 403);
  assert.equal((await upload('author', Buffer.from('not an image'))).status, 415);
  assert.equal((await upload('author')).status, 201);
  const saved = await readState('courses/' + course.$id);
  assert.equal(saved.source_mime_type, 'image/png');
  assert.equal(saved.source_filename, 'scan.png');
  assert.equal(publicCourse(saved, 'newbie', false).source_file_id, undefined);
  const ownerRead = await handleApiRequest(new Request(endpoint, { headers: { 'x-appwrite-jwt': 'author' } }));
  assert.equal(ownerRead.status, 200);
  assert.deepEqual(Buffer.from(await ownerRead.arrayBuffer()), image);
  assert.equal((await handleApiRequest(new Request(endpoint, { headers: { 'x-appwrite-jwt': 'newbie' } }))).status, 403);
  assert.equal((await handleApiRequest(new Request(endpoint))).status, 401);
  await deleteCourse(course.$id, 'author', 'author@example.test');
  assert.equal(await readState('courses/' + course.$id), null);
  assert.equal((await handleApiRequest(new Request(endpoint, { headers: { 'x-appwrite-jwt': 'author' } }))).status, 404);
});
test('admin analytics survive a missing secondary usage blob for a charged account generation', async () => {
  const courseId = (await getCreditHistory('author')).find(event => event.type === 'generation')?.courseId;
  const usage = (await listState('usage/')).find(event => event.courseId === courseId);
  assert.ok(usage);
  await deleteState('usage/' + usage.id);
  const metrics = await getTokenMetrics();
  assert.ok(metrics.history.some(event => event.courseId === courseId && event.ledgerSource === 'credit-transaction'));
  assert.ok(metrics.totalTokens >= 30);
  assert.ok(metrics.creditsUsed >= 0.5);
  assert.ok(metrics.totalGenerations >= 1);
  assert.ok(metrics.promptTokens >= 10);
  assert.ok(metrics.candidateTokens >= 20);
});
test('guest quota and analytics retain the same generation transaction without its usage blob', async () => {
  const generated = await api('/summarize-text', 'POST', { title: 'Guest notes', text: 'Example source' });
  assert.equal(generated.statusCode, 200);
  const courseId = JSON.parse(generated.body).course.$id;
  const quota = await readState('settings/guest-quota');
  assert.ok(quota.generationHistory.some(event => event.courseId === courseId && event.totalTokens === 30));
  const usage = (await listState('usage/')).find(event => event.courseId === courseId);
  if (usage) await deleteState('usage/' + usage.id);
  const metrics = await getTokenMetrics();
  assert.ok(metrics.history.some(event => event.courseId === courseId && event.ledgerSource === 'credit-transaction'));
  assert.ok(metrics.perUser.public_guest.generations >= 1);
});
test('indexed anonymous discovery returns three public courses without reading legacy Appwrite', async () => {
  for (let i = 0; i < 3; i++) {
    const course = fixture('feed-' + i, { visibility: 'public', $createdAt: new Date(Date.now() + i * 1000).toISOString() });
    await writeState('courses/' + course.$id, course);
    await addPublicCourseToFeed(course);
  }
  process.env.APPWRITE_API_KEY = 'invalid-test-key';
  process.env.APPWRITE_DATABASE_ID = 'legacy-test-db';
  process.env.APPWRITE_COLLECTION_ID = 'legacy-test-courses';
  try {
    const publicCourses = await listCatalog();
    assert.equal(publicCourses.length, 3);
    assert.ok(publicCourses.every(course => course.$id.startsWith('feed-')));
  } finally {
    delete process.env.APPWRITE_API_KEY;
    delete process.env.APPWRITE_DATABASE_ID;
    delete process.env.APPWRITE_COLLECTION_ID;
  }
});
test('provider failure has a useful error and does not charge credits', async () => {
  providerFailure = true;
  try {
    const before = (await readState('users/author')).quota_remaining;
    const result = await api('/summarize-text', 'POST', { text: 'Example', userId: 'author' }, 'author');
    assert.equal(result.statusCode, 503);
    assert.match(JSON.parse(result.body).error, /temporarily unavailable/);
    assert.equal((await readState('users/author')).quota_remaining, before);
  } finally { providerFailure = false; }
});
test('HTML gateway failures show actionable errors instead of JSON errors', async () => {
  await assert.rejects(readApiResponse(new Response('<html>Bad gateway</html>', { status: 502 })), /Flash Lite/);
});
test('Appwrite catalog pagination returns every page', async () => {
  let calls = 0;
  const db = { listDocuments: async () => ({ documents: calls++ === 0 ? Array.from({ length: 100 }, (_, i) => ({ $id: String(i) })) : [{ $id: 'last' }] }) };
  assert.equal((await listDocumentsAll(db, 'db', 'courses')).length, 101);
  assert.equal(calls, 2);
});
test('maintenance env override cannot report a successful disable', async () => {
  process.env.VITE_MAINTENANCE_MODE = 'true';
  try { assert.equal((await api('/maintenance', 'POST', { enabled: false }, 'admin')).statusCode, 409); }
  finally { delete process.env.VITE_MAINTENANCE_MODE; }
});

test('modern Netlify entrypoints preserve routing, responses and auth', async () => {
  const { default: entrypoint } = await import('../netlify/functions/api.js');
  for (const route of ['/api/maintenance', '/.netlify/functions/api/maintenance']) {
    const response = await entrypoint(new Request('https://courseit.test' + route));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).enabled, false);
  }
  const { default: summarize } = await import('../netlify/functions/summarize.js');
  const response = await summarize(new Request('https://courseit.test/.netlify/functions/summarize', {
    method: 'POST', body: JSON.stringify({ url: 'https://docs.test/guide', userId: 'author' })
  }));
  assert.equal(response.status, 401);
});

test('tutor endpoint requires valid courseId and question or error message', async () => {
  assert.equal((await api('/tutor', 'POST', {})).statusCode, 400);
  assert.equal((await api('/tutor', 'POST', { courseId: 'missing-course' })).statusCode, 400);
});

test('tutor endpoint answers contextual question using step context and does not charge course cost', async () => {
  const courseId = 'course-tutor-fixture-' + randomUUID();
  await writeState('courses/' + courseId, normalizeCourse({
    $id: courseId,
    title: 'Firebase Setup',
    creator_id: 'author',
    visibility: 'public',
    steps: [
      {
        step_number: 1,
        title: 'Install Firebase CLI',
        summary: 'Install npm package.',
        actions: ['npm install -g firebase-tools']
      }
    ]
  }));

  const res = await api('/tutor', 'POST', {
    courseId,
    stepIndex: 0,
    question: 'How do I check installation?'
  }, 'author');

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.success, true);
  assert.ok(data.answer);
  assert.equal(data.usage.cost, 0.1); // Quick mode costs 0.1, not full 0.5-5.0 generation cost
});

test('guest tutor usage is bounded by separate guest tutor allowance without consuming course generations', async () => {
  const courseId = 'course-guest-tutor-' + randomUUID();
  await writeState('courses/' + courseId, normalizeCourse({
    $id: courseId,
    $createdAt: new Date().toISOString(),
    title: 'Guest Demo',
    creator_id: 'public_guest',
    is_guest: true,
    visibility: 'public',
    steps: [{ step_number: 1, title: 'Step 1', summary: 'Intro' }]
  }));

  const beforeGenerations = (await readState('settings/guest-quota'))?.totalGenerations || 0;

  const res = await api('/tutor', 'POST', {
    courseId,
    stepIndex: 0,
    question: 'What is this step?'
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.usage.isGuest, true);
  assert.equal(data.usage.cost, 0);

  // Check that guest course generations quota was NOT consumed
  const guestCourseQuota = await readState('settings/guest-quota');
  assert.equal(guestCourseQuota?.totalGenerations || 0, beforeGenerations);

  // Check that guest tutor quota WAS tracked separately
  const guestTutorQuota = await readState('settings/guest-tutor-quota');
  assert.ok(guestTutorQuota.totalMessages >= 1);
});
