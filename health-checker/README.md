# Atlas Render Web Service Health Checker

Periodic uptime / availability monitoring for Atlas's Render web services, run
from GitHub Actions. Every scheduled run sends **one lightweight HTTP request
per configured service** and records whether each service is reachable.

This is a legitimate availability-monitoring helper. It does **not** provide a
public endpoint, does not take arbitrary URLs, and must not be used to bypass
hosting-provider restrictions.

## How it works

```
GitHub Actions runner
      │  scheduled GET (per service in config/urls.json)
      ▼
Render Web Service
      ▼  HTTP response
      ▼
GitHub Actions logs (+ exit code → job pass/fail)
```

- The workflow is defined in `.github/workflows/render-health-check.yml` at the
  **repository root** (GitHub Actions only discovers workflows there), while all
  checker code and configuration stay isolated under `health-checker/`.
- `health-checker/scripts/health-check.js` reads `health-checker/config/urls.json`,
  validates every URL, and sends one GET per service with a 15 s timeout.
- `2xx` → healthy. `3xx` redirects are followed and the final response is
  evaluated. `4xx`/`5xx`, timeouts, and DNS/network errors → unhealthy.
- If one service fails, the remaining services are still checked. The job exits
  non-zero (and GitHub marks the workflow run failed) when at least one service
  is unhealthy.

## Setup

1. **Add a Render URL** — open `health-checker/config/urls.json` and replace the
   placeholder with a real service URL. Use the root (`/`) unless your service
   exposes a dedicated public health endpoint (`/api/health`, `/health`), in
   which case use that:
   ```json
   {
     "services": [
       {
         "name": "Main Website",
         "url": "https://my-app.onrender.com/health"
       }
     ]
   }
   ```
2. **Add more services** — append another object to the `services` array. Per
   service you may also set `timeoutMs` (default `15000`) and `retries`
   (default `0`) if needed. One GET is sent per service; retries stay off by
   default to avoid unnecessary traffic.
3. **Commit and push** the `health-checker/` directory and
   `.github/workflows/render-health-check.yml`.
4. **Enable GitHub Actions** — if Actions is disabled for the repository, enable
   it under **Settings → Actions** (the workflow needs to be on the default
   branch to appear).
5. **Run manually** — open **Actions → Render Health Check → Run workflow**
   (`workflow_dispatch`) and click the button.

If you prefer separate environments per service, create one `urls.json` per
environment and point the workflow at it with the `--config`
flag/`HEALTH_CHECK_CONFIG` env var in the workflow file.

## Viewing results

- **Logs:** Actions → *Render Health Check* → click a run → each step shows the
  per-service lines (`✓` / `✗`, HTTP code, response time).
- **Success:** all services healthy → final summary "Health check completed
  successfully." and the job is green.
- **Failure:** any service unhealthy → summary "Health check completed with
  failures." and the job is red.

## Schedule

The workflow uses:

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'
```

**GitHub Actions scheduled workflows are approximate.** Runners do not guarantee
second-level (or even minute-level) exactness; runs can be deferred during heavy
CI load, and the default branch is the only branch the schedule is read from.
GitHub supports cron intervals as tight as 5 minutes, but scheduled runs are
frequently delayed and a tighter cadence would only generate unnecessary
traffic for an uptime monitor — so the default here is every 15 minutes.

## Configuration reference

| File | Purpose |
| --- | --- |
| `health-checker/config/urls.json` | The only source of service URLs for the checker. |
| `health-checker/scripts/health-check.js` | Zero-dependency Node checker (built-in `fetch`). |
| `.github/workflows/render-health-check.yml` | Schedule + manual trigger; runs the checker. |

Supported per-service fields: `name` (label), `url` (required, `http(s)://`),
`timeoutMs` (optional, default `15000`), `retries` (optional, default `0`).

## Local testing

```sh
node health-checker/scripts/health-check.js                       # uses config/urls.json
node health-checker/scripts/health-check.js --config=/tmp/custom.json   # any file
```

No secrets, tokens, or API keys are stored anywhere in this setup. If a health
endpoint ever requires authentication, use GitHub Actions **Secrets** and load
them via the `env:` block — never commit credentials.

## Limitations

- GitHub Actions scheduling is not real-time; scheduled jobs can be delayed.
- Render free-tier behavior and policies can change; a free service can be
  **spun down after inactivity** and its next request will be slow while it
  wakes. This checker does **not guarantee** a Render Free service stays awake.
- A periodic check only samples availability at check time; it cannot detect an
  outage that starts and ends between runs.
- This implementation is strictly for legitimate availability monitoring and
  must not be used to circumvent hosting-provider restrictions, generate
  artificial traffic, or evade rate limits.