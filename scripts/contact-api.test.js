'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const originalEnv = { ...process.env };
const { server } = require('../server');

function request(port, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      port,
      path: '/api/public/requests',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://freclean.com', ...headers },
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
        provider.lastBody = JSON.parse(body);
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ id: 'test-email-id' }));
      });
    });
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
    name: 'Ada Customer', email: 'ada@example.com', message: 'Please contact me about home cleaning.', website: ''
  });
  assert.equal(response.status, 201);
  assert.deepEqual(response.body, { received: true });
  assert.match(global.provider.lastBody.text, /Ada Customer/);
  assert.match(global.provider.lastBody.text, /ada@example.com/);
  assert.match(global.provider.lastBody.text, /Submitted:/);
});

test('invalid, automated, duplicate and disallowed-origin submissions are rejected', async () => {
  assert.equal((await request(server.address().port, { name: 'A', email: 'bad', message: 'short' })).status, 400);
  assert.equal((await request(server.address().port, { name: 'Ada', email: 'ada2@example.com', message: 'A valid message here', website: 'bot' })).status, 400);
  assert.equal((await request(server.address().port, { name: 'Ada', email: 'ada@example.com', message: 'Please contact me about home cleaning.' })).status, 409);
  assert.equal((await request(server.address().port, { name: 'Ada', email: 'ada3@example.com', message: 'Please contact me about home cleaning.' }, { Origin: 'https://evil.example' })).status, 403);
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

test('null and array JSON payloads are rejected as invalid submissions', async () => {
  assert.equal((await request(server.address().port, null)).status, 400);
  assert.equal((await request(server.address().port, [])).status, 400);
});