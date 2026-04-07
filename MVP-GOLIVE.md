# MVP Go-Live Checklist

A working checklist for getting NewsChart production-ready. This is both a hobby project and portfolio piece — quality and polish matter.

Items are grouped into three tiers:
- **P1** — must be done before launch
- **P2** — soon after launch (first week or two)
- **P3** — nice-to-have, no rush

---

## P1 — Launch blockers

### Backend — Testing & Code Quality

- [ ] **Unit tests for pipeline steps** — each `PipelineStep` implementation tested in isolation (mock dependencies)
- [ ] **Unit tests for `HighlightsTransformerService`** — core business logic, no DB needed
- [ ] **Unit tests for `MostCommonCountryHighlighter`**
- [ ] **Unit tests for `NewYorkTimesRssParserService`** — RSS parsing logic
- [ ] **Unit tests for `CountryFactory` / `Country`** — geo lookup correctness
- [ ] **Integration test for `CalloutController`** — REST endpoint contract (with MockMvc or WebTestClient)
- [ ] **Integration test for `GeminiGatewayService`** — mock the Gemini HTTP call, test parsing/error handling
- [ ] **Review `BasePipelineOrchestrator`** — assess whether prototype code needs refactoring before go-live
- [ ] **Review error handling** — ensure pipeline failures don't silently swallow errors in production
- [ ] **Logging review** — appropriate log levels, no secrets or PII in logs
- [ ] **API key / secrets management** — move all secrets to environment variables or a secrets store, none in `application.properties` committed to git
- [ ] **Production scheduler** — implement scheduled pipeline runs (currently only runs on startup; needs new cron/scheduling code, e.g. `@Scheduled`) with a sensible interval for prod

### Database — MongoDB Atlas

- [x] **Provision Atlas cluster** — free/shared tier is fine for MVP
- [ ] **Configure connection string** — externalise via environment variable (`MONGODB_URI`)
- [x] **Set up Atlas IP allowlist** — restrict to Oracle Cloud egress IP(s)
- [x] **Create Atlas DB user** — least-privilege read/write role scoped to the newschart DB
- [ ] **Data indexes** — ensure indexes exist for date-based callout queries
- [ ] **Atlas backup policy** — confirm automated backups are enabled
- [ ] **Connection pool tuning** — review default Spring Data Mongo pool settings for a small OCI instance with limited RAM; size down if needed

### Hosting — Oracle Cloud (OCI)

- [x] **Register for OCI Account**
- [x] **Provision OCI compute instance** — ARM-based Ampere A1 (free tier eligible) - instance IP is 132.145.37.108
- [x] **Set up unattended-upgrades on instance**
- [x] **Harden SSH** - disable root login, disable password login, install fail2ban
- [x] **Install basic sysadmin tools** - htop, iotop, nethogs
- [x] **Install JDK 21 on instance**
- [x] **Install Node.js on instance** (or serve frontend as static build via Nginx)
- [x] **Install nginx**
- [ ] **Harden and Performance-optimise nginx**
- [x] **Nginx reverse proxy config** — proxy `/api` to Spring Boot (`:8080`), serve React build from root
- [ ] **TLS / HTTPS** — Let's Encrypt cert via Certbot
- [ ] **Domain name** — register or point existing DNS to OCI instance IP
- [ ] **Firewall rules** — OCI security list: allow 80/443 inbound, block direct :8080
- [ ] **Systemd service** — Spring Boot runs as a systemd unit, restarts on failure
- [x] **Environment variable management on host** — `.env` file loaded via systemd `EnvironmentFile`, not in repo
- [ ] **Rollback plan** — keep previous JAR on deploy; if the new one fails to start, systemd can fall back or you can swap manually
- [ ] **Log rotation** — configure `journald` max size or `logrotate` for application logs to prevent disk fill on a small instance

### CI/CD — GitHub Actions

- [ ] **Backend CI workflow** — on push/PR: `./mvnw test` (Testcontainers, needs Docker in runner)
- [ ] **Frontend CI workflow** — on push/PR: `npm install && CI=true npm test`
- [ ] **Build & artifact workflow** — produce a fat JAR and a React `build/` on tagged releases
- [ ] **Deploy workflow** — SSH to OCI instance, swap JAR + static files, restart systemd service
- [ ] **Post-deploy smoke test** — curl the health endpoint and/or `/api/news` after deploy; fail the workflow if unhealthy
- [ ] **Secrets in GitHub** — `MONGODB_URI`, `GEMINI_API_KEY`, OCI SSH key stored as Actions secrets

### Security

- [ ] **Scheduled OWASP dependency-check workflow** — run `./mvnw org.owasp:dependency-check-maven:check` weekly
- [ ] **NVD API key secret** — `NVD_API_KEY` stored in GitHub secrets for the workflow
- [ ] **npm audit workflow** — run `npm audit --audit-level=high` in frontend CI
- [ ] **Review `SUPPRESS.md` / `owasp-suppressions.xml`** — ensure all suppressions are still justified before go-live
- [ ] **Dependabot** — enable for Maven, npm, and GitHub Actions in `.github/dependabot.yml`
- [ ] **CORS configuration** — lock down `@CrossOrigin` to the production domain only

### Frontend — Production Readiness

- [ ] **Production build tested** — `npm run build` output served correctly via Nginx
- [ ] **Environment config** — API base URL driven by env var, not hardcoded `localhost`
- [ ] **Error states** — loading/error UI when API is unreachable
- [ ] **Favicon and `<title>`** — set appropriate page title and icon

### Frontend — Supporting Pages

- [x] **`credits.html`** — acknowledge all open-source libraries, services, and data sources (cover React libs, react-simple-maps, Spring Boot, MongoDB, Gemini API, map data sources, etc.)
- [ ] **`credits.html`** — second pass, final check to add credit for any additional components added during the golive push
- [ ] **`credits.html`** - final check to confirm we are compliant with all licenses

### Observability

- [x] **Prometheus** Install, including node exporter
- [x] **Grafana** Install, add basic node exporter dashboard
- [ ] **Health check endpoint** — Spring Boot Actuator `/actuator/health` enabled and used by uptime monitor
- [ ] **Uptime monitoring** — set up a free monitor (e.g. UptimeRobot) pointing at the health endpoint

### Documentation & Portfolio

- [ ] **README updated** — architecture overview, screenshots, live URL
- [ ] **Live URL working** — smoke test all key user flows after deploy
- [ ] **GitHub repo tidy** — description, topics, social preview image set

---

## P2 — Soon after launch

### Code Quality & Accessibility

- [ ] **ESLint** — confirm JavaScript linting is wired up and passing in CI
- [ ] **`html-validate`** — add for static HTML pages (credits, accessibility); catches WCAG violations at build time
- [ ] **Manual Lighthouse audit** — run Lighthouse in Chrome DevTools against the live site; fix any critical accessibility or performance issues
- [ ] **Pre-commit hooks** — wire ESLint and html-validate into `.pre-commit-config.yaml`

### Observability

- [ ] **Backend** Enable metrics on spring actuator endpoint for key components.  Consider custom metrics too.
- [ ] **Prometheus** Scrape and store metrics
- [ ] **Grafana** Dashboards with relevant metrics
- [ ] **Screenshots** provide screenshots of dashboards for portfolio

### Migrate from Create React App to Vite

- [ ] **Replace `react-scripts` with Vite** — CRA is unmaintained since 2022; TS5 peer dep conflict is an early symptom
- [ ] **Add `vite.config.ts`** — configure `@vitejs/plugin-react` and proxy `/api` to `:8080`
- [ ] **Update `index.html`** — move to project root, add `<script type="module" src="/src/index.tsx">`
- [ ] **Swap test runner to Vitest** — near-identical API to Jest, replaces `react-scripts test`
- [ ] **Remove `react-app-env.d.ts`** — replace with `vite/client` types in tsconfig
- [ ] **Update CI workflow** — no changes expected; `npm test` still works via Vitest
- [ ] **Remove `frontend/.npmrc` legacy-peer-deps workaround** — no longer needed after migration

### Frontend — Polish

- [ ] **Basic SEO meta tags** — description, og:title for portfolio discoverability
- [ ] **`accessibility.html`** — accessibility statement: WCAG commitment, what's been done, known limitations, contact for issues
- [ ] **"How it works" / `method.html`** — explain the pipeline (news ingestion → Gemini summarisation → geo-tagging → map display); good portfolio signal
- [ ] **Footer navigation** — link to credits, accessibility, and how-it-works from every page
- [ ] **Supporting pages live** — all linked and reachable

---

## P3 — Nice to have

- [ ] **Playwright screenshot tests in CI** — run against a spun-up local stack, or keep as manual-only
- [ ] **Umami analytics** — embed cookieless tracking snippet, verify data flowing, acknowledge in credits
- [ ] **Separate GCP API keys per environment** — create a dedicated `GOOGLE_API_KEY` for prod (separate key or separate GCP project) for cost isolation, quota separation, and independent key rotation
- [ ] **Dedicated MongoDB Atlas app user** — replace `rossarn_db_user` with an app-specific Atlas user scoped to newschart DB only; retire the personal user

---

## Server Hardening (from security review)

- [ ] **Systemd service hardening** — add `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`, `ProtectKernelTunables`, `ProtectKernelModules`, `ProtectControlGroups`, `RestrictAddressFamilies`, `LockPersonality` to `newschart.service`
- [ ] **SSH: disable X11Forwarding** — set `X11Forwarding no` in `/etc/ssh/sshd_config`

---

_Last updated: 2026-04-06_
