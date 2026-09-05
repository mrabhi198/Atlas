#!/usr/bin/env node
// Render / web-service availability health checker.
//
// Reads a service list from health-checker/config/urls.json (or the file given
// by --config / HEALTH_CHECK_CONFIG), sends ONE lightweight GET request per
// service, and reports healthy/unhealthy. Exits non-zero if any service is
// unhealthy or misconfigured. Never exposes an endpoint and sends no more
// traffic than one request per configured service.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_TIMEOUT_MS = 15000;
const RETRY_BACKOFF_MS = 1000;

const flagConfig = process.argv.find((a) => a.startsWith('--config='));
const CONFIG_PATH =
  flagConfig?.slice('--config='.length) ||
  process.env.HEALTH_CHECK_CONFIG ||
  path.join(__dirname, '..', 'config', 'urls.json');

const HHMMSS = () => new Date().toTimeString().slice(0, 8);

function isValidUrl(raw) {
  if (typeof raw !== 'string') return false;
  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return false;
  }
  return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
}

// One lightweight GET per attempt. 3xx is followed automatically (redirect:
// 'follow'); the final response code is what counts. Aborts on timeout.
async function probe(url, timeoutMs) {
  const started = Date.now();
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent': 'atlas-render-health-checker/1.0 (legitimate availability monitoring)',
      Accept: 'text/html,application/json'
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
  return { status: res.status, responseTimeMs: Date.now() - started };
}

async function checkService(service) {
  const { name = 'unnamed', url = '', retries = 0 } = service;
  const timeoutMs = Number.isInteger(service.timeoutMs) ? service.timeoutMs : DEFAULT_TIMEOUT_MS;
  const attempts = Math.max(0, Number.isInteger(retries) ? retries : 0) + 1;

  if (!isValidUrl(url)) {
    console.log(`[${HHMMSS()}] ✗ ${name} — invalid URL "${url}" (skipped)`);
    return { name, url, status: 'INVALID_URL', responseTimeMs: 0, healthy: false, timestamp: new Date().toISOString() };
  }

  let lastResult = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      lastResult = await probe(url, timeoutMs);
      if (lastResult.status >= 200 && lastResult.status < 300) break;
    } catch (err) {
      const isTimeout = err && typeof err.name === 'string' && err.name === 'TimeoutError';
      lastResult = { status: isTimeout ? 'TIMEOUT' : 'ERR', responseTimeMs: 0 };
    }
    if (attempt < attempts) {
      console.log(`[${HHMMSS()}] ~ ${name} — ${lastResult.status} — retrying (${attempt}/${attempts - 1})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
    }
  }

  const healthy = lastResult.status !== 'TIMEOUT' && lastResult.status !== 'ERR' && lastResult.status >= 200 && lastResult.status < 300;
  const mark = healthy ? '✓' : '✗';
  const responseLabel = typeof lastResult.status === 'number' ? `${lastResult.status} — ${lastResult.responseTimeMs}ms` : `${lastResult.status} — ${lastResult.responseTimeMs || 0}ms`;
  console.log(`[${HHMMSS()}] ${mark} ${name} — ${responseLabel}`);

  return {
    name,
    url,
    status: lastResult.status,
    responseTimeMs: lastResult.responseTimeMs,
    healthy,
    timestamp: new Date().toISOString()
  };
}

async function main() {
  let config;
  try {
    config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  } catch (err) {
    console.error(`Unable to read ${CONFIG_PATH}: ${err.message}`);
    process.exitCode = 2;
    return;
  }

  const services = Array.isArray(config.services) ? config.services : [];
  if (services.length === 0) {
    console.error(`No services configured in ${CONFIG_PATH}.`);
    process.exitCode = 2;
    return;
  }

  console.log('Render Health Check');
  console.log('===================');

  const results = [];
  for (const service of services) {
    console.log(`[${HHMMSS()}] Checking ${service?.name ?? 'unnamed'}...`);
    results.push(await checkService(service));
  }

  const healthy = results.filter((r) => r.healthy).length;
  const unhealthy = results.length - healthy;

  console.log('--------------------------------');
  console.log(`Services checked: ${results.length}`);
  console.log(`Healthy: ${healthy}`);
  console.log(`Unhealthy: ${unhealthy}`);
  console.log('--------------------------------');

  if (unhealthy === 0) {
    console.log('Health check completed successfully.');
  } else {
    console.log('Health check completed with failures.');
    process.exitCode = 1;
  }
}

main();