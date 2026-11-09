'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 10000);
const RECIPIENT = process.env.FRECLEAN_REQUEST_RECIPIENT || 'freclean7@gmail.com';
const MAX_BODY_BYTES = 32 * 1024;
const OUTBOUND_TIMEOUT_MS = 10 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 10_000;
const rateBuckets = new Map();
const recentRequests = new Map();

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || 'https://freclean.com')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function sendJson(response, status, body, origin, requestId) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  if (requestId) headers['X-Request-ID'] = requestId;
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function sendOptions(response, origin, requestId) {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '600',
    'X-Request-ID': requestId,
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  response.writeHead(204, headers);
  response.end();
}

function clientIp(request) {
  return (request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload too large'), { status: 413 }));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error('invalid JSON'), { status: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength) : '';
}

function validateSubmission(payload) {
  const name = clean(payload.name || payload.fullName, 120);
  const email = clean(payload.email, 254).toLowerCase();
  const message = clean(payload.message || payload.notes, 5000);
  if (!name || name.length < 2 || !email || !message || message.length < 10) {
    return { error: 'Please provide a valid name, email address and message of at least 10 characters.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please provide a valid email address.' };
  }
  return { name, email, message };
}

function checkRateLimit(ip, now) {
  if (rateBuckets.size >= MAX_TRACKED_CLIENTS && !rateBuckets.has(ip)) {
    for (const [key, bucket] of rateBuckets) {
      if (now - bucket.started >= RATE_LIMIT_WINDOW_MS) rateBuckets.delete(key);
    }
  }
  const bucket = rateBuckets.get(ip) || { started: now, count: 0 };
  if (now - bucket.started >= RATE_LIMIT_WINDOW_MS) {
    bucket.started = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  return bucket.count <= RATE_LIMIT_MAX;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

function resolveStaticFilePath(requestPath) {
  const rootDir = __dirname;
  const safePath = requestPath.split('?')[0].split('#')[0];
  const normalized = decodeURIComponent(safePath || '/');
  if (normalized === '/' || normalized === '/index.html') {
    return path.join(rootDir, 'index.html');
  }

  const candidate = path.join(rootDir, normalized.replace(/^\//, ''));
  const relative = path.relative(rootDir, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return candidate;
}

function serveStaticFile(response, requestPath) {
  const filePath = resolveStaticFilePath(requestPath);
  if (!filePath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  let resolvedPath = filePath;
  if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
    const candidate = `${resolvedPath}${path.sep}index.html`;
    if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
      resolvedPath = candidate;
    } else {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
  }

  const contentType = contentTypeFor(resolvedPath);
  const body = fs.readFileSync(resolvedPath);
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=3600',
  });
  response.end(body);
}

async function deliverEmail({ name, email, message, submittedAt }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw Object.assign(new Error('email provider is not configured'), { status: 503 });
  }
  const response = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [RECIPIENT],
      reply_to: email,
      subject: `FreClean enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nSubmitted: ${submittedAt}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p><hr><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
    }),
  });
  if (!response.ok) {
    const error = new Error('email provider rejected the message');
    error.status = response.status >= 500 ? 503 : 502;
    throw error;
  }
  return true;
}

async function handleRequest(request, response) {
  const requestId = crypto.randomUUID();
  const origin = request.headers.origin;
  const origins = allowedOrigins();
  if (origin && !origins.includes(origin)) {
    sendJson(response, 403, { error: 'Origin is not allowed.' }, undefined, requestId);
    return;
  }
  if (request.method === 'OPTIONS') {
    sendOptions(response, origin, requestId);
    return;
  }
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { ok: true }, origin, requestId);
    return;
  }
  if (request.method === 'GET' || request.method === 'HEAD') {
    const requestPath = request.url || '/';
    const pathname = requestPath.split('?')[0];
    if (pathname === '/' || pathname === '/index.html' || !pathname.startsWith('/api/')) {
      serveStaticFile(response, pathname);
      return;
    }
  }
  if (request.method !== 'POST' || request.url !== '/api/public/requests') {
    sendJson(response, 404, { error: 'Not found.' }, origin, requestId);
    return;
  }

  try {
    const contentType = request.headers['content-type'] || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
      sendJson(response, 415, { error: 'Content-Type must be application/json.' }, origin, requestId);
      return;
    }
    const payload = await readBody(request);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.website) {
      sendJson(response, 400, { error: 'Invalid submission.' }, origin, requestId);
      return;
    }
    const submission = validateSubmission(payload);
    if (submission.error) {
      sendJson(response, 400, { error: submission.error }, origin, requestId);
      return;
    }
    const now = Date.now();
    const ip = clientIp(request);
    if (!checkRateLimit(ip, now)) {
      sendJson(response, 429, { error: 'Too many submissions. Please try again later.' }, origin, requestId);
      return;
    }
    const fingerprint = crypto.createHash('sha256')
      .update(`${ip}\n${submission.email}\n${submission.message}`)
      .digest('hex');
    const previous = recentRequests.get(fingerprint);
    if (previous && now - previous < DUPLICATE_WINDOW_MS) {
      sendJson(response, 409, { error: 'This enquiry was already submitted recently.' }, origin, requestId);
      return;
    }
    const submittedAt = new Date(now).toISOString();
    await deliverEmail({ ...submission, submittedAt });
    if (recentRequests.size >= MAX_TRACKED_CLIENTS) {
      for (const [key, timestamp] of recentRequests) {
        if (now - timestamp >= DUPLICATE_WINDOW_MS) recentRequests.delete(key);
      }
    }
    recentRequests.set(fingerprint, now);
    sendJson(response, 201, { received: true }, origin, requestId);
  } catch (error) {
    const status = error.status || 503;
    sendJson(response, status, { error: status === 503 ? 'We could not deliver your enquiry. Please try again later.' : 'Invalid request.' }, origin, requestId);
  }
}

const server = http.createServer(handleRequest);
server.requestTimeout = 15 * 1000;
server.headersTimeout = 10 * 1000;
server.keepAliveTimeout = 5 * 1000;

if (require.main === module) {
  server.listen(PORT, () => console.log(`FreClean contact API listening on port ${PORT}`));
}

module.exports = { handleRequest, server, validateSubmission };