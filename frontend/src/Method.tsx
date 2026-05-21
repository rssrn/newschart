import React from 'react';

/** @author Claude Opus 4.7 Anthropic */
const Method = (): React.ReactElement => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background-color: #f5f5f5; }
      .mt-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 24px 40px;
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 1rem;
        color: #374151;
        line-height: 1.6;
      }
      .mt-container a { color: #2563eb; text-decoration: underline; }
      .mt-container a:hover, .mt-container a:focus { color: #1d4ed8; }
      .mt-back { text-decoration: none; }
      .mt-back:hover, .mt-back:focus { text-decoration: none; }
      .mt-header {
        padding: 32px 0 24px;
        border-bottom: 2px solid #dbeafe;
        margin-bottom: 28px;
      }
      .mt-header h1 {
        margin: 0 0 4px;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e3a5f;
        font-family: 'IBM Plex Mono', monospace;
      }
      .mt-subtitle { color: #4b5563; font-size: 0.95rem; }
      .mt-back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 24px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #2563eb;
        text-decoration: none;
        transition: gap 0.15s ease;
      }
      .mt-back:hover, .mt-back:focus {
        color: #1d4ed8;
        gap: 9px;
        text-decoration: none;
      }
      .mt-back-arrow { font-size: 1rem; line-height: 1; transition: transform 0.15s ease; }
      .mt-back:hover .mt-back-arrow { transform: translateX(-2px); }

      .mt-section {
        background: #ffffff;
        border-radius: 6px;
        padding: 22px 26px;
        margin-bottom: 22px;
        box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);
      }
      .mt-section h2 {
        margin: 0 0 14px;
        font-size: 1.15rem;
        font-weight: 700;
        color: #1e3a5f;
        font-family: 'IBM Plex Mono', monospace;
        padding-bottom: 8px;
        border-bottom: 2px solid #dbeafe;
      }
      .mt-section h3 {
        margin: 22px 0 10px;
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e3a5f;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .mt-section h3:first-of-type { margin-top: 12px; }
      .mt-section p { margin: 0 0 12px; }
      .mt-section ul { margin: 0 0 12px; padding-left: 20px; }
      .mt-section li { margin-bottom: 6px; }
      .mt-section code {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.85em;
        background: #f3f4f6;
        padding: 1px 6px;
        border-radius: 3px;
        color: #1e3a5f;
      }

      .mt-callout {
        border-left: 3px solid #2563eb;
        background: #eff6ff;
        padding: 12px 16px;
        margin: 16px 0;
        font-size: 0.92rem;
        border-radius: 0 4px 4px 0;
      }
      .mt-callout strong { color: #1e3a5f; }
      .mt-callout.warn {
        border-left-color: #f59e0b;
        background: #fffbeb;
      }
      .mt-callout.warn strong { color: #92400e; }

      .mt-tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 14px; }
      .mt-tag {
        display: inline-block;
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 0.775rem;
        font-weight: 500;
        background: #eff6ff;
        color: #1e3a5f;
        border: 1px solid #dbeafe;
      }

      .mt-toc {
        background: #ffffff;
        border-radius: 6px;
        padding: 16px 22px;
        margin-bottom: 22px;
        box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);
      }
      .mt-toc-title {
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
        margin-bottom: 8px;
      }
      .mt-toc ol { margin: 0; padding-left: 20px; }
      .mt-toc li { margin-bottom: 4px; }

      .mt-footer {
        margin-top: 36px;
        padding-top: 20px;
        border-top: 1px solid #dbeafe;
        text-align: center;
        font-size: 0.875rem;
        color: #4b5563;
      }
      .mt-footer a { color: #2563eb; text-decoration: none; }
      .mt-footer a:hover, .mt-footer a:focus { text-decoration: underline; }

      @media (max-width: 640px) {
        .mt-container { padding: 0 16px 32px; }
        .mt-section { padding: 18px 18px; }
        .mt-header h1 { font-size: 1.4rem; }
      }
    `}</style>

    <div className="mt-container">
      <header className="mt-header">
        <h1>How NewsChart Works</h1>
        <div className="mt-subtitle">
          A user guide, plus a look under the hood at the AI and engineering behind it
        </div>
      </header>

      <a href="/" className="mt-back">
        <span className="mt-back-arrow">←</span>
        Back to NewsChart
      </a>

      <nav className="mt-toc" aria-label="Page contents">
        <div className="mt-toc-title">On this page</div>
        <ol>
          <li><a href="#user-experience">The user experience</a></li>
          <li><a href="#ai">AI: models, prompts, and caveats</a></li>
          <li><a href="#engineering">Engineering practices &amp; hosting</a></li>
        </ol>
      </nav>

      {/* ------------------------------------------------------------------ */}
      <section className="mt-section" id="user-experience" aria-labelledby="ux-h">
        <h2 id="ux-h">1. What NewsChart is for</h2>

        <p>
          NewsChart is a way to <strong>compare how different AI models cover the
          news</strong>. Each day, we ask several leading AI models the same simple
          question — "what are today's top three international news stories?" — and
          plot their answers on a world map. You can flip between models to see which
          stories each one chose, where in the world they think the action is, and
          how they summarised it.
        </p>

        <p>
          It's part news reader, part comparison tool. If you've ever wondered
          whether ChatGPT, Gemini and Perplexity actually agree on what's important
          today — or how an AI's picks compare to the front page of a major
          newspaper — this is a way to see for yourself, side by side.
        </p>

        <h3>What you can do with it</h3>
        <ul>
          <li>
            <strong>Get a quick global news briefing.</strong> Pick a source, glance
            at the map, read three short summaries. Done in under a minute.
          </li>
          <li>
            <strong>Compare AI models.</strong> Switch between Google Gemini,
            Perplexity, ChatGPT and a New York Times baseline for the same day.
            Where do they agree? Where do they completely miss each other?
          </li>
          <li>
            <strong>See whose worldview is which.</strong> Different models lean on
            different search engines and training data. Looking at the same date
            across all four sources tends to make those biases visible.
          </li>
          <li>
            <strong>Look back at previous days.</strong> A date timeline lets you
            scrub through earlier dates to revisit how a story broke, or to see what
            each model thought was important on a particular day.
          </li>
        </ul>

        <h3>How to use it</h3>
        <p>
          The map is the main thing. Each story shows up as a small box (a
          "callout") connected by a line to the country it's about. Click or tap a
          callout to open the full summary.
        </p>
        <ul>
          <li>
            <strong>Change the news source</strong> using the source selector — this
            switches between the AI models and the NYT baseline.
          </li>
          <li>
            <strong>Change the date</strong> using the date timeline to jump to a
            different day's stories. On desktop you can also use the left/right
            arrow keys.
          </li>
          <li>
            <strong>Change the map style</strong> if you prefer a different
            projection of the world (Mercator versus Natural Earth).
          </li>
        </ul>

        <h3>On a phone vs. on a desktop</h3>
        <p>
          On a desktop the controls sit alongside the map and everything is visible
          at once. On a phone the map takes nearly the whole screen — tap the menu
          button at the bottom to slide up the controls when you need them, and use
          the chip strip along the bottom to switch between dates with your thumb.
          The story callouts are sized and arranged differently on each so they
          stay readable without crowding the map.
        </p>

        <div className="mt-callout">
          <strong>A note on what NewsChart is <em>not</em>.</strong> It's not a
          replacement for a real news source. The summaries are written by AI
          models from web search results, and they make mistakes — wrong countries,
          missed nuance, occasional confident-sounding errors. Treat it as a way to
          <em> survey</em> what the day looks like through several AI lenses, not as
          the final word on any single story. The next section explains why.
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section className="mt-section" id="ai" aria-labelledby="ai-h">
        <h2 id="ai-h">2. AI: models, prompts, and caveats</h2>

        <p>
          Three of the four news sources are large language models — each chosen
          specifically because they offer native web search as a built-in capability.
          Without search grounding a model draws on training data for "today's news",
          producing plausible-sounding but stale or invented stories. Each source is
          asked the same question once a day and writes its own headline list
          independently. Comparing them is part of the point — different models
          indexing different corners of the web often surface noticeably different
          "top stories".
        </p>

        <h3>The models</h3>
        <div className="mt-tag-row">
          <span className="mt-tag">Gemini 2.5 Flash (news search)</span>
          <span className="mt-tag">Gemini 2.5 Flash Lite (NYT geo-tagging)</span>
          <span className="mt-tag">Perplexity Sonar Pro Search</span>
          <span className="mt-tag">OpenAI gpt-4o-search-preview</span>
          <span className="mt-tag">NYT RSS (non-AI baseline)</span>
        </div>
        <ul>
          <li>
            <strong>Gemini 2.5 Flash</strong> — used for the Gemini news source
            with Google Search grounding enabled, giving it a different index
            than either of the other two LLM sources.
          </li>
          <li>
            <strong>Perplexity Sonar Pro Search</strong> — a search-native model
            built around live web retrieval and source citations. Provides an
            independent perspective via Perplexity's own index.
          </li>
          <li>
            <strong>OpenAI gpt-4o-search-preview</strong> — an independent voice
            from a third vendor so no single provider's worldview dominates.
            Routed via OpenRouter alongside Perplexity so the same gateway code
            handles both.
          </li>
          <li>
            <strong>New York Times RSS</strong> — a non-AI baseline: the NYT world
            feed is well-structured, updated reliably, and individual stories
            already carry clear location metadata, which makes geo-tagging
            tractable. Gemini 2.5 Flash Lite is still used here, but only to{' '}
            <em>geo-tag and summarise</em> NYT items (with search grounding
            disabled) rather than to choose them, so we can compare AI-curated
            headlines to a human-edited feed.
          </li>
        </ul>

        <h3>Why these models?</h3>
        <p>
          The primary selection criterion was native search grounding — a model
          that can't search the live web can't reliably report today's news.
          Beyond that, practical integration played a role: Perplexity and OpenAI
          are both accessible via OpenRouter, which lets a single backend gateway
          handle both without bespoke client code. Other vendors with search-native
          models — notably Claude (Anthropic) and Grok (xAI) — are natural
          candidates for future expansion; three independent sources is sufficient
          to make cross-model differences visible.
        </p>

        <h3>The prompt</h3>
        <p>
          The prompt is deliberately short. Long prompts tend to over-constrain
          summarisation models without making them better. The core ask is:
        </p>
        <div className="mt-callout">
          <em>
            Find today's top 3 international news stories. No sport. Prioritise by
            global significance; counter regional or media bias. Use search results as
            the source, not training data. Apply editorial judgement on
            prioritisation and phrasing. Title ≤ 8 words; summary 12–20 words;
            extended detail up to 100 words. The country field should be the primary
            location of the story. Return exactly 3 items.
          </em>
        </div>
        <p>
          The country field is what lets us pin the story to the map. Returns are
          structured (the gateway uses Spring AI's typed-output binding) so the
          backend never has to parse free-form text — the model returns a typed list
          of objects matching the <code>NewsHighlight</code> schema directly.
        </p>

        <h3>Caveats &amp; non-determinism</h3>
        <div className="mt-callout warn">
          <strong>Model output is non-deterministic.</strong> The same prompt run
          twice will produce different headlines, different ordering, sometimes
          different countries. NewsChart leans into this rather than fighting it: each
          source produces one snapshot per day, stored in MongoDB, and the UI lets you
          compare them side by side.
        </div>
        <ul>
          <li>
            <strong>Hallucinated countries.</strong> Models occasionally name a
            country that isn't in our ISO-code lookup, or attach a story to the wrong
            location. The pipeline drops items it can't geo-resolve rather than
            guessing.
          </li>
          <li>
            <strong>Bias.</strong> "Top international stories" is itself an editorial
            judgement, baked into model training data and search rankings. The
            multi-source view is partly a transparency mechanism — you can see when
            three models agree, and when they don't.
          </li>
          <li>
            <strong>Recency vs. training data.</strong> Native search grounding was a
            selection criterion for all three LLM sources precisely because without
            it, models produce plausible-sounding but stale or invented "today's news"
            from training data.
          </li>
          <li>
            <strong>No fact-checking.</strong> NewsChart summarises what the model
            says the news is. It does not verify the underlying claims.
          </li>
        </ul>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section className="mt-section" id="engineering" aria-labelledby="eng-h">
        <h2 id="eng-h">3. Engineering practices &amp; hosting</h2>

        <p>
          NewsChart is a portfolio project, so the engineering scaffolding gets the
          same care as the product. The aim is to demonstrate the practices a small
          team would actually want around a service like this — not to over-engineer,
          but to leave nothing important out.
        </p>

        <h3>Continuous integration</h3>
        <p>
          Every push and pull request runs through GitHub Actions. The pipelines are
          split by concern so feedback stays fast:
        </p>
        <ul>
          <li>
            <strong>Backend CI</strong> — runs the Maven test suite. Integration tests
            spin up a real MongoDB via{' '}
            <a href="https://testcontainers.com/" target="_blank" rel="noopener noreferrer">Testcontainers</a>{' '}
            rather than mocking the database, so migrations and query behaviour are
            actually exercised.
          </li>
          <li>
            <strong>Frontend CI</strong> — runs unit tests and a production build on
            every PR. The build step catches type errors and bundler regressions
            before they reach <code>main</code>.
          </li>
          <li>
            <strong>Health check</strong> — a scheduled workflow hits a real API
            endpoint on the live site every four hours. If the service is down,
            the workflow fails and notifies.
          </li>
        </ul>

        <h3>Security</h3>
        <p>
          Security gets its own layered set of automated checks rather than being
          left to ad-hoc review. The same scaffolding a real production service
          would want is in place:
        </p>
        <ul>
          <li>
            <strong>OWASP Dependency-Check</strong> — runs weekly against the
            National Vulnerability Database (NVD), plus on demand. Scans every
            transitive Java dependency for known CVEs and fails the build if a
            new one shows up. The weekly cadence means a vulnerability disclosed
            on Tuesday is flagged by the following Monday at the latest, even if
            nobody has touched the code.
          </li>
          <li>
            <strong>Sonatype OSS Index</strong> — a second, independent
            vulnerability database queried during the Maven build. Two databases
            with different coverage catch more than either alone, and the
            redundancy helps when one source is slow to publish.
          </li>
          <li>
            <strong>Dependabot</strong> — opens weekly pull requests for
            out-of-date dependencies across all three ecosystems the project uses:
            Maven (backend), npm (frontend), and GitHub Actions itself. Keeping
            CI action versions current is easy to forget; automating it means the
            pipeline doesn't quietly rot.
          </li>
          <li>
            <strong>npm audit</strong> — the standard frontend vulnerability check,
            run as part of the frontend CI. Combined with Dependabot it keeps the
            React side of the project clean.
          </li>
          <li>
            <strong>Secrets management.</strong> Secrets are split by where they're
            needed. CI/deploy-scoped credentials (Tailscale auth key, SSH deploy
            key, NVD API key, Grafana API token) live in GitHub Actions repository
            secrets and are injected only at workflow run time. The runtime AI
            provider tokens (OpenRouter and Gemini) are kept in a config file on
            the production server itself — never in source control, never passed
            through CI. Nothing sensitive is committed; GitHub's secret-scanning
            service runs against the repo as a backstop.
          </li>
          <li>
            <strong>No public SSH.</strong> The server accepts HTTP on port 80;
            TLS is terminated by Cloudflare, which proxies traffic to the origin.
            All shell access and deployments go exclusively over{' '}
            <a href="https://tailscale.com/" target="_blank" rel="noopener noreferrer">Tailscale</a>,
            a WireGuard-based overlay network that enforces identity-based access
            control at the network level — SSH is not reachable from the public
            internet at all.
          </li>
          <li>
            <strong>CORS policy.</strong> The API only accepts cross-origin requests
            from the NewsChart origin. Even if a browser-side vulnerability existed,
            a third-party page couldn't silently call the API on a user's behalf.
          </li>
        </ul>

        <h3>Deployment</h3>
        <p>
          Deployments are tag-triggered: pushing a <code>v*</code> tag kicks off the
          deploy workflow, which builds the frontend, runs <code>versions:set</code>{' '}
          on the Maven project to align the artifact version with the tag, builds the
          Spring Boot jar, and ships it to the production host via Tailscale.
        </p>

        <h3>Code quality &amp; testing</h3>
        <ul>
          <li>
            <strong>Type safety end-to-end.</strong> Java 21 records on the backend,
            TypeScript on the frontend, structured AI output binding so even model
            responses are typed.
          </li>
          <li>
            <strong>Layout algorithm with a real foundation.</strong> The callout
            placement uses exhaustive candidate enumeration with penalty scoring —
            based on the Point-Feature Label Placement literature (<a href="https://doi.org/10.1145/212332.212334" target="_blank" rel="noopener noreferrer">Christensen, Marks &amp; Shieber, 1995</a>). Feasible because N ≤ 3 stories per day; correct
            because the search space is bounded and every candidate is evaluated.
          </li>
          <li>
            <strong>Layout algorithm test harness.</strong> The placement algorithm
            is tested by a dedicated headless harness (separate from the main test
            suite) that checks hard geometric constraints independently of the
            algorithm itself. An <em>independent geometry evaluator</em> — written
            from scratch, importing nothing from the layout code — re-derives every
            box rectangle and connector segment and checks five hard rules: no
            box-overlap (touching counts as a fail), no out-of-bounds, no
            connector crossing, no connector passing behind another callout's box,
            and no origin marker obscured by a box. Soft metrics (connector length,
            box–box gap, angular spread) are recorded for later baseline comparison.
          </li>
          <li>
            <strong>Viewport &amp; projection matrix.</strong> Every test fixture
            runs across 9 real-browser viewport sizes (from a maximised 1920×1080
            desktop with chrome subtracted down to a 360×510 budget Android phone)
            and 2 map projections (Mercator, Natural Earth) — 18 configurations per
            case. The fixture corpus covers geographic edge cases that are hard to
            spot visually: origins near the right map edge (New Zealand / Fiji), nearly
            coincident points (Belgium / Netherlands), high-latitude distortion
            (Iceland / Norway), vertical stacks along a single meridian (Canada /
            USA / Mexico), and real production days captured directly from the live
            API. Known failures are tagged <code>needs-fix</code> and skipped in CI
            so the build stays green while serving as concrete regression targets for
            algorithm improvements.{' '}
            <a href="https://playwright.dev/" target="_blank" rel="noopener noreferrer">Playwright</a>{' '}
            can be invoked on demand to render each case at the correct viewport size
            and capture a screenshot for visual review.
          </li>
        </ul>

        <h3>Hosting</h3>
        <ul>
          <li>
            <strong>Application server.</strong> The Spring Boot jar runs on a
            self-managed Linux host on Oracle Cloud, fronted by a reverse proxy
            that terminates TLS and serves the built React bundle as static assets.
          </li>
          <li>
            <strong>Database.</strong>{' '}
            <a href="https://www.mongodb.com/atlas" target="_blank" rel="noopener noreferrer">MongoDB Atlas</a>{' '}
            (managed, free tier). MongoDB suits the document-shaped story data and
            removes one operational burden from a single-developer project.
          </li>
          <li>
            <strong>Observability.</strong> A Grafana dashboard tracks service
            health (HTTP request rate, error rate, latency), per-provider AI
            metrics (call count, token usage, latency), MongoDB connection pool
            and query latency, and JVM heap and GC overhead — giving a live
            operational view across the full stack.
          </li>
        </ul>

        <p style={{ marginTop: 18 }}>
          Full credits and the licences of every dependency are listed on the{' '}
          <a href="/credits">credits page</a>.
        </p>
      </section>

      <footer className="mt-footer">
        <a href="/">Home</a>
        {' · '}
        <a href="/credits">Credits</a>
        {' · '}
        <a href="/accessibility">Accessibility</a>
        {' · '}
        <a href="https://github.com/rssrn/newschart" target="_blank" rel="noopener noreferrer">GitHub</a>
      </footer>
    </div>
  </>
);

export default Method;
