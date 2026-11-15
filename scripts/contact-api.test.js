'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const originalEnv = { ...process.env };
const { server } = require('../server');
let ipSequence = 1;

function request(port, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      port,
      path: '/api/public/requests',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://freclean.com',
        'X-Forwarded-For': `198.51.100.${ipSequence++}`,
        ...headers,
      },
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(data) }));
    });
    request.on('error', reject);
    request.end(JSON.stringify(body));
  });
}

test.before(async () => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'FreClean <noreply@example.test>';
  process.env.RESEND_API_URL = `http://127.0.0.1:${await new Promise((resolve) => {
    const provider = http.createServer((request, response) => {
      let body = '';
      request.on('data', (chunk) => { body += chunk; });
      request.on('end', () => {
        provider.deliveryCount += 1;
        provider.lastBody = JSON.parse(body);
        response.writeHead(provider.responseStatus, { 'Content-Type': 'application/json' });
        response.end(provider.responseBody);
      });
    });
    provider.deliveryCount = 0;
    provider.responseStatus = 200;
    provider.responseBody = JSON.stringify({ id: 'test-email-id' });
    provider.listen(0, '127.0.0.1', () => {
      global.provider = provider;
      resolve(provider.address().port);
    });
  })}/emails`;
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
});

test.after(async () => {
  process.env = originalEnv;
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve) => global.provider.close(resolve));
});

test('valid contact is delivered and includes the required details', async () => {
  const response = await request(server.address().port, {
    type: 'CONTACT_FORM',
    name: 'Ada Customer',
    email: 'ada@example.com',
    message: 'Please contact me about home cleaning.',
    website: ''
  });
  assert.equal(response.status, 201);
  assert.deepEqual(response.body, { received: true });
  assert.deepEqual(global.provider.lastBody.to, ['contact@freclean.com']);
  assert.equal(global.provider.lastBody.from, 'FreClean <noreply@example.test>');
  assert.equal(global.provider.lastBody.reply_to, 'ada@example.com');
  assert.equal(global.provider.lastBody.subject, 'New FreClean Contact Enquiry');
  assert.match(global.provider.lastBody.text, /Name:\nAda Customer/);
  assert.match(global.provider.lastBody.text, /Email:\nada@example\.com/);
  assert.match(global.provider.lastBody.text, /Message:\nPlease contact me about home cleaning\./);
  assert.match(global.provider.lastBody.text, /Submitted:\n\d{4}-\d\d-\d\dT/);
});

test('service and general contact enquiries keep the configured non-contact recipient', async () => {
  for (const type of ['CONTACT', 'SERVICE']) {
    const response = await request(server.address().port, {
      type,
      name: 'Ada Customer',
      email: `ada-${type.toLowerCase()}@example.com`,
      message: `Please contact me about a ${type.toLowerCase()} enquiry.`,
    });
    assert.equal(response.status, 201);
    assert.deepEqual(global.provider.lastBody.to, [process.env.FRECLEAN_REQUEST_RECIPIENT || 'freclean7@gmail.com']);
  }
});

test('invalid, automated, duplicate and disallowed-origin submissions are rejected', async () => {
  assert.equal((await request(server.address().port, { name: 'A', email: 'bad', message: 'short' })).status, 400);
  assert.equal((await request(server.address().port, { name: 'Ada', email: 'ada2@example.com', message: 'A valid message here', website: 'bot' })).status, 400);
  const duplicateIp = '198.51.100.220';
  assert.equal((await request(server.address().port, { name: 'Ada', email: 'ada@example.com', message: 'Please contact me about home cleaning.' }, { 'X-Forwarded-For': duplicateIp })).status, 201);
  assert.equal((await request(server.address().port, { name: 'Ada', email: 'ada@example.com', message: 'Please contact me about home cleaning.' }, { 'X-Forwarded-For': duplicateIp })).status, 409);
  assert.equal((await request(server.address().port, { name: 'Ada', email: 'ada3@example.com', message: 'Please contact me about home cleaning.' }, { Origin: 'https://evil.example' })).status, 403);
});

test('rejects empty fields, malformed or injected email and overlong messages', async () => {
  const beforeDeliveries = global.provider.deliveryCount;
  assert.equal((await request(server.address().port, { type: 'CONTACT_FORM', name: '', email: 'ada@example.com', message: 'A valid message here' })).status, 400);
  assert.equal((await request(server.address().port, { type: 'CONTACT_FORM', name: 'Ada', email: 'not-an-email', message: 'A valid message here' })).status, 400);
  assert.equal((await request(server.address().port, { type: 'CONTACT_FORM', name: 'Ada', email: 'ada@example.com\r\nBcc: other@example.com', message: 'A valid message here' })).status, 400);
  assert.equal((await request(server.address().port, { type: 'CONTACT_FORM', name: 'Ada', email: 'ada@example.com', message: 'x'.repeat(5001) })).status, 400);
  assert.equal(global.provider.deliveryCount, beforeDeliveries);
});

test('sanitizes message markup before including it in provider HTML', async () => {
  const response = await request(server.address().port, {
    type: 'CONTACT_FORM',
    name: 'Ada',
    email: 'ada@example.com',
    message: '<script>alert(1)</script>\nPlease contact me.',
  });
  assert.equal(response.status, 201);
  assert.match(global.provider.lastBody.text, /<script>alert\(1\)<\/script>\nPlease contact me\./);
  assert.match(global.provider.lastBody.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;<br>Please contact me\./);
});

test('rate limits repeated submissions from one client', async () => {
  const ip = '198.51.100.221';
  const statuses = [];
  for (let index = 0; index < 6; index += 1) {
    const response = await request(server.address().port, {
      type: 'CONTACT_FORM',
      name: 'Ada',
      email: `rate-limit-${index}@example.com`,
      message: `Please contact me about request number ${index}.`,
    }, { 'X-Forwarded-For': ip });
    statuses.push(response.status);
  }
  assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
});

test('provider failures return a generic error and log a correlated technical event', async () => {
  const originalError = console.error;
  const logs = [];
  global.provider.responseStatus = 500;
  global.provider.responseBody = JSON.stringify({ error: 'private-provider-detail' });
  console.error = (message) => logs.push(message);
  try {
    const response = await request(server.address().port, {
      type: 'CONTACT_FORM',
      name: 'Ada',
      email: 'ada-failure@example.com',
      message: 'Please contact me about an unavailable service.',
    });
    assert.equal(response.status, 503);
    assert.match(response.body.error, /could not deliver/i);
    assert.doesNotMatch(JSON.stringify(response.body), /private-provider-detail|test-key/);
    assert.match(logs[0], /"code":"email_provider_rejected"/);
    assert.match(logs[0], /"providerStatus":500/);
    assert.doesNotMatch(logs[0], /private-provider-detail|test-key/);
  } finally {
    console.error = originalError;
    global.provider.responseStatus = 200;
    global.provider.responseBody = JSON.stringify({ id: 'test-email-id' });
  }
});

test('rejects non-JSON bodies and does not echo a blocked origin', async () => {
  const sendRaw = (headers, body) => new Promise((resolve, reject) => {
    const request = http.request({
      port: server.address().port,
      path: '/api/public/requests',
      method: 'POST',
      headers,
    }, (apiResponse) => {
      apiResponse.resume();
      apiResponse.on('end', () => resolve(apiResponse));
    });
    request.on('error', reject);
    request.end(body);
  });
  const contentTypeResponse = await sendRaw({
    'Content-Type': 'text/plain', Origin: 'https://freclean.com'
  }, 'not json');
  assert.equal(contentTypeResponse.statusCode, 415);
  const originResponse = await sendRaw({
    'Content-Type': 'application/json', Origin: 'https://evil.example'
  }, '{}');
  assert.equal(originResponse.statusCode, 403);
  assert.equal(originResponse.headers['access-control-allow-origin'], undefined);
});

test('returns a successful receipt when the provider uses an empty 2xx response', async () => {
  const originalRequest = process.env.RESEND_API_URL;
  const provider = http.createServer((_request, response) => {
    response.writeHead(202);
    response.end();
  });
  await new Promise((resolve) => provider.listen(0, '127.0.0.1', resolve));
  process.env.RESEND_API_URL = `http://127.0.0.1:${provider.address().port}/emails`;
  try {
    const response = await request(server.address().port, {
      name: 'Empty Receipt', email: 'empty@example.com', message: 'Please contact me about a service.'
    });
    assert.equal(response.status, 201);
  } finally {
    process.env.RESEND_API_URL = originalRequest;
    await new Promise((resolve) => provider.close(resolve));
  }
});

test('responses include security headers and correlate the request', async () => {
  const response = await new Promise((resolve, reject) => {
    const request = http.request({
      port: server.address().port,
      path: '/health',
      method: 'GET',
      headers: { Origin: 'https://freclean.com' },
    }, (healthResponse) => {
      healthResponse.resume();
      healthResponse.on('end', () => resolve(healthResponse));
    });
    request.on('error', reject);
    request.end();
  });
  assert.equal(response.statusCode, 200);
  assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/);
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('homepage is served for both the site root and index.html', async () => {
  const rootResponse = await new Promise((resolve, reject) => {
    const request = http.request({
      port: server.address().port,
      path: '/',
      method: 'GET',
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => resolve({ statusCode: response.statusCode, body: data, contentType: response.headers['content-type'] }));
    });
    request.on('error', reject);
    request.end();
  });

  const indexResponse = await new Promise((resolve, reject) => {
    const request = http.request({
      port: server.address().port,
      path: '/index.html',
      method: 'GET',
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => resolve({ statusCode: response.statusCode, body: data, contentType: response.headers['content-type'] }));
    });
    request.on('error', reject);
    request.end();
  });

  assert.equal(rootResponse.statusCode, 200);
  assert.equal(indexResponse.statusCode, 200);
  assert.match(rootResponse.contentType, /text\/html/);
  assert.match(indexResponse.contentType, /text\/html/);
  assert.match(rootResponse.body, /FreClean/);
  assert.match(indexResponse.body, /FreClean/);
});

test('null and array JSON payloads are rejected as invalid submissions', async () => {
  assert.equal((await request(server.address().port, null)).status, 400);
  assert.equal((await request(server.address().port, [])).status, 400);
});