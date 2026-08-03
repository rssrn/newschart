# Story Image Acquisition — Options Brainstorm

**Status:** exploratory on sourcing; **one display decision now settled** (see below).
**Constraint:** real photographs only — no AI-generated imagery.
**Date:** 2026-08-02

---

## TL;DR

**Display is decided: overlay-only.** Photos live in the existing modals
(`EventInspectorModal` / `StoryDetailModal`), not in the map callout boxes — the map has no room
(see "Display decision"). An optional ~12px thumbnail in the callout header may act as an
affordance hinting that a photo is one click away. This removes the single largest engineering
risk from the feature and narrows the sourcing question considerably.

**Sourcing recommendation: Getty Images' free embed**, used inside the modal. It is the only
option offering genuine professional news photography under an **explicit written licence** at
zero cost. Its one disqualifying flaw — fixed-dimension, non-responsive iframes — only mattered
for map callouts, and the overlay-only decision makes it irrelevant.

Getty's API was verified against its live OpenAPI spec: it supports **date limiting**
(day granularity), **free-text `phrase` search**, **quality/relevance ranking**, a **`news`
editorial segment filter**, and — critically — **programmatic embed retrieval**
(`embed_content_only` + `uri_oembed`). Two caveats: there is **no structured geographic
filter**, so "country X" is a free-text heuristic; and **search needs an approved key**
(~1–3 business days). Getty publishes **no pricing tiers at all** — API access is account-rep
gated — but an **Embed Key** ("search for and embed from over 40 million embeddable images") is
the free, licence-agreement-free path that fits us.

**Usefully, oEmbed itself needs no key** — verified working unauthenticated today — so the modal
display layer can be built and finished while the search key application is in flight. Full
detail under Option 4.

**NYT RSS (Option 1) is blocked pending permission**, despite being technically trivial: the
feed we already download carries `media:content` + `media:credit` + `media:description` on
essentially every item, and we discard it at `NytRssParserService.java:70-73`. But NYT's ToS
§2.2 prohibits "framing and inline linking" and §2.3/§4.1(5) restrict copying and caching to
personal use. Best unlocked by *asking*, not by engineering.

**Fallback if Getty doesn't pan out:** curated openly-licensed contextual imagery (Wikimedia
Commons / Openverse, Option 5) — weaker editorially, but unambiguous licensing and no
permission dependency.

---

## Display decision — overlay-only

**Decided 2026-08-02.** Images will not be rendered inside map callout boxes.

**Why.** The callout box is already at its limit. From `mapCalloutUtils.ts`:

- `BOX_WIDTH = 135` in an 800-unit SVG — each callout is ~17% of the map's width, and with
  `EDGE_PADDING = 40` the usable X range is only 40–625 for up to 4 boxes plus connectors.
- More decisively, `mapCalloutUtils.ts:107-110`:

  ```
  // The foreignObject is BOX_WIDTH x BOX_HEIGHT (135x100) but has overflow:visible,
  // so the rendered box is taller than declared. Use RENDERED_HEIGHT for collision
  const RENDERED_HEIGHT = 140; // measured: 133-144 SVG units (varies with text length)
  ```

  The box **already** overflows its declared height, and that height **already** varies with
  text length. The algorithm copes by hardcoding an empirically measured constant and absorbing
  ±5 units of slop. A useful thumbnail is +40–60 units — that doesn't stretch the tolerance, it
  breaks the premise. Collision detection, bounds clamping and origin-obscuring all key off
  `RENDERED_HEIGHT`, so every fixture in the layout suite would need re-baselining.

**No spare real estate elsewhere on the map.** The top-right region is already the
VIEW/HIGHLIGHT/MAP controls panel and is explicitly excluded from layout
(`mapCalloutUtils.ts:179-187`).

**What this buys us.** Variable-height callout boxes were the largest engineering unknown in
this feature. Overlay-only deletes it outright: no layout-algorithm changes, no fixture
regressions, no re-derivation of `RENDERED_HEIGHT`.

**The trade-off, stated plainly.** Images become invisible until a user clicks. "Every story has
a photo" degrades to "every story has a photo if you go looking for it." That is a real
reduction in what the feature delivers. Mitigations: the header affordance below, and
instrumenting actual usage before investing further in sourcing.

### Optional — micro-thumbnail affordance in the callout header

A very small thumbnail in the callout header, signalling "there's a photo one click away."
**This is viable within the existing layout constraints, but only under a hard size rule.**

The header (`StoryCalloutList.tsx:334-341`) is a flex row, `justify-content: space-between`:
`.map-annotation-location` (flag + shortened country name) on the left, `.map-annotation-expand`
(a `+`) on the right. Its height is driven by `.location-flag` at `font-size: 12px;
line-height: 1` plus `4px` vertical padding (`App.css:184-192, 251-254`).

**The rule: the thumbnail must be no taller than the flag** — ~12px desktop, ~15px at the mobile
breakpoint where `.location-flag` grows (`App.css:473-475`). At that size it sits inside the
existing line box and contributes **zero** additional height, leaving `RENDERED_HEIGHT`
untouched. Anything larger reintroduces the whole problem the overlay-only decision just solved.

**Placement:** right side, adjacent to the `+`. The left cluster is identity (flag, country);
the right cluster is interaction affordance. An image indicator belongs with the affordance.

**Costs to weigh:**
- **Horizontal, not vertical.** ~12px + 4px gap eats ~16px of a 135px-wide header. Country names
  already pass through `shortenCountryName` — check the longest names for truncation.
- At 12px a photo is unreadable as an image; it reads as a coloured dot. A generic icon may
  communicate "photo available" *better* than a real thumbnail. Worth prototyping both — the
  honest answer may be that the thumbnail idea resolves into an icon.
- **If the source is Getty, it must be an icon, not a real thumbnail.** Getty's oEmbed exposes a
  plain `thumbnail_url` JPEG, but using it outside the embed widget strips the branding and
  credit the free licence depends on — see "Caveat 2" under Option 4. An icon avoids the
  question entirely.
- Only render it when an image actually exists, or it stops being informative.

**Also needs:** an `aria-label` update (currently "…Press Enter to expand.") to mention the
photo; a component-level a11y test in `StoryCalloutList`'s axe coverage; and a `track()` event
per `CLAUDE.md`'s analytics convention.

---

## Option 1 — NYT RSS `media:content` (the feed we already have)

**What it is.** Media RSS extension fields already present in each `<item>`.

Live sample from the World feed:

```xml
<media:content height="1801" medium="image"
  url="https://static01.nyt.com/images/2026/08/02/multimedia/02dc-trump-attack-hqgl/02dc-trump-attack-hqgl-mediumSquareAt3X-v2.jpg"
  width="1800"/>
<media:credit>Pete Marovich for The New York Times</media:credit>
<media:description>President Trump disembarks from Air Force One at the airport in Morristown, N.J. …</media:description>
```

**Why it fits us.** The image is *already tied to the exact article* the callout was derived
from. No matching problem, no relevance heuristics, no separate search API. The credit and
caption come along for free, which is most of what a defensible attribution block needs.

**Coverage.** ~100% for NYT-sourced callouts. **Zero** for callouts produced by the Gemini /
OpenRouter pipeline orchestrators, which don't originate from an RSS item at all — that's the
main gap to plan around.

**Cost.** £0.

**Licensing — this is the problem, and it got worse on inspection.**

These images are NYT/wire-agency copyright served from `static01.nyt.com`. The initial
assumption was that displaying a credited, captioned, click-through thumbnail is the
conventional intended use of an MRSS feed, and that **hotlinking** rather than re-hosting would
keep us in "embedding a publicly served asset" territory.

**The NYT Terms of Service appear to prohibit exactly that.** Relevant clauses, retrieved from
a mirror of the ToS (see caveat below):

- **§2.2** prohibits "**framing and inline linking**" of Content without permission.
  *Inline linking is hotlinking* — this names the specific mitigation we were relying on.
- **§2.3** "You may download or copy certain Content and other downloadable items displayed on
  the Services **for your personal use only**, provided that you maintain all copyright and
  other notices contained in the Content." Copying beyond personal use is "expressly prohibited
  without prior written permission from The New York Times Rights and Permissions Department."
- **§4.1(5)** restricts users from "cache or archive the Content" (carve-out is for public
  search engine spiders creating link-and-snippet indices only).

So both doors look closed: hotlinking is named in §2.2, and re-hosting runs into §2.3 and
§4.1(5). A public-facing map is not "personal use" under any natural reading, and NewsChart
being non-commercial is not itself a defence.

**Caveat on confidence.** `nytimes.com` blocks automated fetching, so this text came from a
third-party mirror of the ToS reflecting a ~2022 version. It is strongly indicative, not
authoritative. **Read the current §2.2 directly before making a decision** —
<https://help.nytimes.com/hc/en-us/articles/115014893428-Terms-of-service>. Also check
<https://www.nytimes.com/rss> for feed-specific terms that might grant more than the general
ToS does.

**If confirmed, this demotes Option 1 from "start here" to "requires permission first."** The
route to using it legitimately is to ask — NYT Licensing Group (<https://nytlicensing.com/>) is
the commercial syndication arm and the Rights and Permissions department is named in §2.3 as
the contact. A small non-commercial project asking politely for feed-image display rights is
not an absurd request, but it is a request, with an unknown answer and lead time.

**Risks.** NYT could change URL structure or add hotlink protection (Referer checks) — build a
graceful missing-image path from day one. The `mediumSquareAt3X` crop is a square 1800×1801,
which is actually convenient for a small callout thumbnail; other crop variants exist in the
URL slug if we want different aspect ratios, but relying on unstated URL-templating is fragile.

---

## Option 2 — The Guardian Open Platform

**What it is.** A genuine, documented, self-serve content API. Free developer key issued by
email in minutes, 500 calls/day, article content plus tags plus asset/thumbnail fields.

**Why consider it.** It's the only *major* newsroom with a real open API you can sign up for
without a sales call, and it's a natural second source alongside NYT for a world-news map —
different editorial geography, UK/Europe-weighted, so it fills NYT's blind spots.

**Licensing.** This is the catch. The free developer tier is explicitly **non-commercial
only**, and image rights are handled separately from text rights — many Guardian article
images are agency (Getty/Reuters/AFP) and are *not* covered by the content licence even when
the text is. Commercial use requires their paid commercial tier. NewsChart being a
non-commercial personal project fits the free tier today, but this caps the project's future
options.

**Effort.** Moderate — new API client, new pipeline source, key management. Worth it mainly if
we want Guardian as a *content* source, not purely as an image source.

---

## Option 3 — Wire services direct: Reuters Connect / AP Newsroom / AFP

**What it is.** The real thing — the professional syndication platforms newsrooms use.
Reuters Connect is a REST API with OAuth 2.0 bearer tokens, plus ATOM/RSS and SFTP delivery
options in the same contract.

**Why it's out of reach.** Not self-serve. No credit-card signup, no free tier, no public
pricing. Publicly-reported editorial syndication licences for small digital publishers start
somewhere in the **$10k–$50k/year** range. AP is comparable and similarly gated behind sales.

**Verdict.** Correct answer for a funded newsroom product; wildly disproportionate here. Worth
documenting so the option is explicitly closed rather than left as an unknown. Revisit only if
NewsChart ever becomes a commercial product with revenue to justify it.

---

## Option 4 — Getty Images free embed

**What it is.** Getty's iframe embed programme — 70M+ photos, including their news, sports and
editorial catalogue, usable **free on non-commercial sites**, unwatermarked, via iframe code.
The embed carries Getty branding, photographer credit and share links beneath the image.

**Why it's interesting.** This is the one route to *genuine professional news photography*
(the Getty editorial wire is where a lot of the world's news photos actually live) at zero cost
and with an explicit, written licence rather than an inferred one. That last part is a real
advantage over Option 1.

**The objection that no longer applies.** The iframe can't be resized freely and isn't fully
responsive, which made it hopeless against a layout algorithm reasoning about exact box
dimensions. **The overlay-only decision removes this entirely** — a modal is already a
fixed-size surface with its own layout, so a fixed-dimension embed is completely at home there.
The property that disqualified Getty for map callouts is a non-issue for the surface we're
actually building on.

**The remaining real weakness — matching.** Unlike Option 1, where NYT has already editorially
paired a photo to the article, here we must *search* Getty for a photo per story (presumably
keyed off headline text and `nyt_geo` country tags). That reintroduces relevance risk: wrong,
stale, or generic photos attached to specific stories. On a news product, a confidently-wrong
image is worse than no image. Expect to need a relevance threshold and a "show nothing" path.

The non-commercial restriction ("not for selling a product, raising money, or promoting or
endorsing something") is fine for NewsChart today, but does cap future commercial options.

**Verdict.** **Recommended primary source.** Legally the cleanest option available, and the
overlay-only decision neutralises its one disqualifying flaw. Matching quality is the open risk,
not licensing.

### API capabilities — verified against the live spec

All of the below is from Getty's own OpenAPI spec, fetched 2026-08-02 from
<https://api.gettyimages.com/swagger/v3/swagger.json> (549KB, `openapi: 3.0.4`). This is
authoritative, not blog-inferred. *(Context7 was checked and has no Getty Images library — only
unrelated packages named "…Images". Don't bother.)*

The relevant endpoint is **`GET /v3/search/images/editorial`** — a dedicated editorial (news)
search, separate from the creative/stock catalogue.

**✅ Date limiting — yes, at day granularity.**
`date_from` / `date_to`: *"Return only images that are created on or after this date. Use
ISO 8601 format (e.g., 1999-12-31)."* Day-level, so "today's photos" works
(`date_from=2026-08-02`); a rolling 24-hour window probably doesn't. The sibling
`/v3/search/events` endpoint adds *"Defaults to UTC unless otherwise specified"*, hinting
timestamps may be accepted — test once we have a key. Note it filters on **creation** date, not
publication — which is the semantics we want.

**✅ Arbitrary text search — yes.** `phrase` (string): *"Search images using a search phrase."*

**⚠️ "Best image for country X today" — ranking yes, geography no.**

Ranking is well served:
- `sort_order`: `best_match` (default), `most_popular`, `newest`, `oldest`, `random`
- `minimum_quality_rank`: *"Possible values 1, 2, 3 with 1 being best"* — a real editorial
  quality filter
- `editorial_segments`: `archival`, `entertainment`, `news`, `publicity`, `royalty`, `sport` —
  restricting to **`news`** strips out sport/celebrity noise, which matters a lot for us

**But there is no structured geographic filter on search.** All parameters were checked.
`GI-Country-Code` is *not* it — that header is *"Receive regionally relevant search results
based on the value specified"*, i.e. tuning for the **viewer's** region, not the photo's subject
location. Country targeting therefore has to go through `phrase` as a free-text country name —
a text-match heuristic.

It gets slightly worse: the search response schema (`EditorialImage`) has **no location fields
at all**. `country`, `city` and `state_province` exist only on `ImageDetail`, the per-asset
detail response. So you cannot cheaply post-filter search hits by country without an extra
fetch per candidate.

**✅ Embed is programmatically retrievable — the gating question is resolved.**
- `embed_content_only` (boolean): *"Restrict search results to embeddable images."* A
  first-class search filter.
- `uri_oembed` (string) is present on every image schema — `EditorialImage`, `ImageDetail`,
  `CreativeImage`, `Image` — i.e. a standard oEmbed URI per asset.

The feared "embed is a browser-only flow" scenario is **off the table**. This was the blocker
that would have collapsed the recommendation to manual curation; it doesn't apply.

**Indicative query shape:**

```
GET /v3/search/images/editorial
  ?phrase=<country + headline keywords>
  &date_from=2026-08-02
  &editorial_segments=news
  &sort_order=best_match
  &embed_content_only=true
  &minimum_quality_rank=1
```

**Worth investigating: `/v3/search/events`.** It searches curated news *events* by `phrase`,
`date_from`/`date_to` and `editorial_segment`. Image search accepts an `event_ids` filter — so
"find the event, then pull its images" may be a far better matching primitive than raw free-text
image search, and could sidestep the relevance problem that is now the main risk.

### Pricing and access tiers

**Getty publishes no API pricing.** There is no self-serve plan page, no free/pro/enterprise
ladder, no per-call rate card. The developer docs simply say: *"Please contact your Getty Images
account rep to discuss API access and licensing options"* and *"Please have your client contact
their Getty Images account rep to obtain an API key that is connected to their license
agreement."* Rate limits are *"configured when a customer is initially setup to use the API"* —
i.e. negotiated per account, not published.

**Two key types are documented, and the second is the one we want:**

| Key type | Purpose |
|---|---|
| **Test Key** | *"Use to test Getty Images API functionality including: image search and metadata, download, and account management."* |
| **Embed Key** | *"Use to search for and embed from over 40 million embeddable images."* |

The **Embed Key** maps exactly onto our use case — search + embed, no download, no licensing
agreement implied. Neither key has published limits; both go through the same application.

**Image licensing costs are a separate matter and don't apply to us.** Getty's paid licence
models are RF (priced by file size), RR and RM (priced by usage). Those govern *downloading and
using* an asset. **The embed route sidesteps this entirely** — embedding is free for
non-commercial use, which is why it's the recommendation. If we ever needed to host the actual
image file, we'd be into negotiated licensing.

### ⭐ oEmbed works right now, with no key at all

**Verified live on 2026-08-02.** The oEmbed endpoint is unauthenticated:

```
curl --get --data-urlencode "url=https://www.gettyimages.com/detail/463371235" \
     https://embed.gettyimages.com/oembed
```

returns `HTTP 200` with a complete payload — no `Api-Key`, no OAuth token. (A malformed `url`
gives a *validation* error, not `401`, confirming auth isn't being checked.)

Response fields include everything an attribution block needs:

| Field | Example |
|---|---|
| `html` | the embed snippet (see caveat below) |
| `width` / `height` | `594` × `354` |
| `title`, `caption` | full editorial caption |
| `photographer` | `Gabe Ginsberg` |
| `collection` | `FilmMagic` |
| `thumbnail_url` | `media.gettyimages.com/id/…?s=170x170&k=20&c=…` (170×101) |
| `terms_of_use_url` | Getty's terms |

**This splits the access problem in two, and materially de-risks the plan:**

- **Rendering an embed — available today, no key, no approval.** If we can obtain an asset ID by
  any means, we can display it immediately.
- **Searching for the right asset ID — still needs the approved key.** This remains the blocker
  for automation, but it is now the *only* blocker.

A useful consequence: we can prototype the modal display end-to-end with hardcoded asset IDs
**before** the key arrives, and have the display layer finished by the time search unblocks.

**Caveat 1 — the embed is a JS widget, not a plain iframe.** The returned `html` is an `<a>`
tag plus inline `<script>`, which loads `//embed-cdn.gettyimages.com/widgets.js` and calls
`gie.widgets.load({...})` with a signed `sig` token. Implications:

- **React can't just `dangerouslySetInnerHTML` it** — injected `<script>` tags don't execute.
  Needs deliberate script-loading, or building our own `<iframe>` against the documented embed
  URL.
- **CSP**: requires allowing `embed-cdn.gettyimages.com` as a script source.
- Third-party JS in the modal has privacy/tracking implications worth a conscious decision,
  given the site is otherwise light on external scripts.

**Caveat 2 — do NOT use `thumbnail_url` directly.** It's tempting for the ≤12px header
affordance, since it's a plain JPEG URL. But the free embed licence covers *the embed widget*,
with its Getty branding, photographer credit and click-through intact. Extracting the bare JPEG
and rendering it ourselves strips exactly what the licence is exchanging for free use, and puts
us back in the same inferred-permission territory that blocked Option 1 — this time against a
party with a notably active legal history around image rights. **For the header affordance, use
a generic icon, not a real Getty thumbnail.**

### Access status — key required for search, not instant

**We cannot call the *search* API today** (but see oEmbed above — display needs no key).
Verified live on 2026-08-02:

```
GET /v3/search/images/editorial?phrase=Iran&… → HTTP 401 {"message":"Unauthorized"}
```

- **Auth schemes** (from the spec): `Api-Key` (header) and/or `OAuth2` against
  `https://authentication.gettyimages.com/oauth2/token`, supporting client-credentials,
  password and authorization-code flows. Client-credentials suits a backend scheduler.
- **Registration: there is no self-serve signup.** Corrected 2026-08-03 — the earlier claim that
  <https://developers.gettyimages.com/> carries a "Get API Key" / "Apply for API Access" button is
  **wrong**; that site is documentation only and has no registration CTA anywhere on it. The
  self-serve developer portal it described was Getty's old Mashery instance at
  `developer.gettyimages.com` (note: singular `developer`), which is **retired — `/member/register`
  returns HTTP 404**. The two-key-type table above survives only in third-party GitHub mirrors of
  those retired Mashery docs, so treat "Embed Key" as historical terminology that Getty no longer
  surfaces publicly.
- **The only live path is sales contact**, from <https://www.gettyimages.co.uk/solutions/api>:
  - <https://engage.gettyimages.com/api-contact> — "Get started with our API" form. Asks country
    plus an integration-method checkbox (Platform Partnerships / Access Content With an Existing
    Subscription / Content Integration and Promotion / Other). No developer, free or embed-only
    option. **Was returning "Unable to submit form at this time" on 2026-08-03.**
  - <https://www.gettyimages.com/enterprise/contact-sales> — "I'm ready to discuss plans and pricing".
  - The page also says: *"If your company has an existing Getty Images agreement, contact your
    Account Manager and ask for API access."*
- **Unresolved:** the spec lists `Api-Key` and `OAuth2` as alternative schemes, but Getty's
  Getting Started example sends both together (`Authorization: Bearer … -H Api-Key: …`).
  Whether search needs only the key or also a token resolves itself once we have credentials.
- **Rate limits:** not documented publicly. Unknown until we have an account.

**Action (revised 2026-08-03): there is nothing to apply *to*.** The Embed Key application route
described above no longer exists. Getting search access means entering a B2B sales conversation
with no published pricing, an unknown timeline and no evidence a free embed-only tier is still
offered — and the one contact form is currently erroring. That makes Getty search a much weaker
bet than originally assessed.

What is unaffected: **oEmbed still needs no key**, so the display layer remains buildable now
against hardcoded asset IDs. The open question is no longer "when does the key land?" but "how do
we pick an asset ID per story without Getty search?" — which should be weighed against the other
options in the comparison table before spending more on this path.

---

## Option 5 — Openly-licensed corpora: Wikimedia Commons / Openverse

**What it is.**
- **Wikimedia Commons** via the MediaWiki Action API — `imageinfo` gives the file, and
  `extmetadata` gives licence and attribution metadata per file, which is exactly what you need
  to render a compliant credit line programmatically.
- **Openverse** (maintained by WordPress, successor to CC Search) — one REST API aggregating
  800M+ CC-licensed/public-domain works across Flickr, Wikimedia and museum collections, with
  licence filtering and cut-and-paste attribution built in.

**Why consider it.** Licensing is *unambiguous and machine-readable* — the single biggest
advantage over every other option here. No inference, no terms-page archaeology.

**Why it's a weak primary source.** These are not news photo archives. There is no Reuters
photographer at today's events uploading to Commons. What you can reliably get is
**contextual** imagery: a portrait of the head of state named in the story, a photo of the
capital city, a parliament building, a flag, a map. For a breaking story about a specific
incident, Commons will have nothing.

**Where it genuinely earns its place.** As the **fallback tier** for callouts with no wire
image — which is exactly the gap Option 1 leaves for Gemini/OpenRouter-sourced callouts. A
country- or subject-level Commons image is a much better empty state than a grey placeholder,
and we already have a `Country` entity to key it off. A per-country curated image set (chosen
once, cached, ~200 entries) would be more reliable and better-looking than live search, and is
a genuinely small piece of work.

**Watch out for.** Share-Alike licences (CC BY-SA) impose conditions on derivative works —
filter to CC BY / CC0 / public domain to keep it simple. Commons file quality is highly
variable; live search without curation will occasionally return something absurd.

---

## Option 6 — Aggregator APIs with `urlToImage` (NewsAPI, GDELT, Mediastack, Currents)

**What it is.** Metadata aggregators that return an article's social/OG image URL alongside
the headline. **GDELT** is the standout: it monitors 0.5–1M news images/day, and its DOC 2.0
API covers a rolling 3-month window including images processed by its Visual Global Knowledge
Graph, with the GEO 2.0 API exposing them geographically — which maps suspiciously well onto
what NewsChart does.

**The licensing trap.** These services return a *URL pointing at somebody else's copyrighted
image*. The aggregator licenses you the **metadata**, not the photograph. Passing that URL to
an `<img>` tag puts you in the same inferred-permission position as Option 1 but **without**
Option 1's mitigating context (no publisher-published syndication feed, no editorial
relationship, and often no reliable credit string to attribute with). GDELT's open data
firehose is the annotations — not a photo licence.

Also note NewsAPI's free tier is development/testing only; production or commercial use
requires a paid plan.

**Verdict.** GDELT is genuinely worth a look as a *geographic story discovery* source, which is
a different feature request. As an image-rights strategy it's strictly worse than Option 1.

---

## Option 7 — Public-domain government and institutional photography

**What it is.** Works by US federal employees are public domain by statute — White House,
State Department, DoD, NASA. Similar open-licence regimes exist for the UK (Open Government
Licence), the EU institutions, UN agencies and the IMF/World Bank photo libraries.

**Why it's worth a line.** Free, unambiguous, and genuinely relevant for the diplomacy,
conflict and summit stories that dominate a world-news map. Distribution is fragmented (Flickr
accounts, per-agency media pages) — but much of it is already mirrored into Wikimedia Commons,
so in practice this folds into Option 5 rather than being a separate integration.

**Caveat.** Systematic government-photo-only sourcing has an editorial slant problem: these are
official handout images by definition. Fine as one input, not as the whole diet.

---

## Comparison

| # | Option | Coverage of our callouts | Cost | Licence clarity | Integration effort | Verdict |
|---|--------|--------------------------|------|-----------------|--------------------|---------|
| 1 | **NYT RSS `media:content`** | ~100% of NYT-sourced; 0% AI-pipeline | £0 | ❌ **ToS §2.2 bars inline linking; §2.3 personal use only** | **Very low** — parse 3 extra fields | **Blocked pending permission** |
| 2 | Guardian Open Platform | New source; broadens geography | £0 free tier (non-commercial) | ⚠️ Text ≠ image rights; agency photos excluded | Medium — new API client | Good second source |
| 3 | Reuters Connect / AP / AFP | Total, professional | **$10k–50k/yr** | ✅ Explicit contract | High + sales cycle | Closed — disproportionate |
| 4 | **Getty free embed** | Broad; per-story match via free-text `phrase`, no geo filter | £0 non-commercial | ✅ **Explicit written licence** | Medium — oEmbed is programmatic; key needs ~1–3 days approval | **Recommended primary** |
| 5 | Wikimedia Commons / Openverse | Contextual only, not breaking news | £0 | ✅ **Machine-readable per file** | Low–medium | **Fallback if Getty fails** |
| 6 | Aggregators (GDELT/NewsAPI) | Broad | £0–paid | ❌ Metadata licence ≠ photo licence; same inline-linking problem, less standing | Medium | Avoid for images |
| 7 | Gov / institutional PD | Narrow (diplomacy, conflict) | £0 | ✅ Statutory PD / OGL | Low (via Commons) | Folds into #5 |

---

## Suggested shape

With display settled, the plan is:

1. **Photos render in `EventInspectorModal` / `StoryDetailModal` only.** No map callout images.
2. **Primary source: Getty free embed**, searched per story from headline + `nyt_geo` country
   tags, with a relevance threshold and a clean "no image" path when nothing good matches.
3. **Optional: ~12px header affordance** indicating a photo is available — subject to the
   flag-height rule above, and possibly better served by an icon than a real thumbnail.
4. **Fallback source: curated per-country openly-licensed image** (Option 5) if Getty's API
   turns out not to support programmatic embed retrieval, or if match quality is poor. Keyed off
   the existing `Country` entity, CC BY / CC0 / PD only, attribution stored alongside, ~200
   entries.
5. **In parallel, ask NYT.** Option 1 remains the best *editorial* answer — the photo is already
   paired to the story by an editor, no matching risk at all. It costs an email to NYT Licensing
   Group / Rights and Permissions to find out. If a permission comes back, revisit and likely
   promote it to primary.
6. **Always** handle the no-image case gracefully — assume any source can vanish.

## Open questions for the next round

**Getty (the recommended path):**
- **Apply for an API key — do this first.** ~1–3 business days for review, and it gates
  everything below. See "Access status".
- **How good is `phrase` relevance against real headlines?** This is now **the** risk. Needs a
  hands-on trial over a week of actual callouts once the key lands. On a news product a
  confidently-wrong photo is worse than no photo, so we need a relevance threshold and a
  willingness to show nothing.
- **Is `/v3/search/events` a better matching primitive than free-text image search?** Search
  events by phrase + date, then pull images via `event_ids`. Could sidestep the relevance
  problem entirely. Evaluate alongside the phrase trial.
- How do we compensate for the absence of a geographic filter, given search results carry no
  location fields? Options: country name in `phrase`, or an extra `ImageDetail` fetch per
  candidate to check `country` (costly — watch rate limits).
- Does the oEmbed output's fixed sizing fit the modal's responsive breakpoints cleanly?
- What are the rate limits? Undocumented and set per-account at setup; affects whether per-story
  lookups are viable at all. Ask during the application.
- Does the Embed Key permit the `/v3/search/images/editorial` endpoint specifically, or only a
  narrower embed-oriented search? Its description says "search for and embed", but confirm.
- Build the modal display layer now against unauthenticated oEmbed + hardcoded asset IDs — this
  is unblocked today and de-risks the integration ahead of key approval.
- Decide how to render the JS widget in React (script injection vs. hand-built iframe) and
  whether to accept `embed-cdn.gettyimages.com` in CSP.

- ~~Does Getty expose embed codes programmatically, or is the embed flow browser-only?~~
  **Resolved — programmatic.** `embed_content_only` search filter plus a `uri_oembed` field on
  every image schema.

**NYT (parallel track):**
- Does current ToS §2.2 still bar inline linking? Needs a manual browser visit to
  <https://help.nytimes.com/hc/en-us/articles/115014893428-Terms-of-service> — automated
  fetching is refused and the quoted text is from a ~2022 mirror.
- Does <https://www.nytimes.com/rss> grant anything the general ToS doesn't?
- Worth simply asking Rights and Permissions. Low effort, unknown lead time, high payoff.

**Product:**
- Do the Gemini/OpenRouter orchestrators retain a source article URL? Affects fallback coverage.
- Instrument image impressions in the modal with `track()`. If engagement is negligible, that is
  the signal that further sourcing effort isn't worth it.

**Resolved:** *"Can `mapCalloutUtils.ts` absorb variable-height boxes?"* — moot. The
overlay-only decision means the layout algorithm is untouched, provided the optional header
affordance obeys the flag-height rule.

---

## Sources

- [Getty Images — Embed](https://www.gettyimages.com/resources/embed) ·
  [Getty Images API](https://www.gettyimages.com/api) ·
  [Getty developer docs](https://developers.gettyimages.com/docs/) ·
  [Getting started](https://developers.gettyimages.com/docs/gettingstarted/) ·
  **[Live OpenAPI spec](https://api.gettyimages.com/swagger/v3/swagger.json)** — the
  authoritative source for all API claims in Option 4; re-fetch rather than trusting this doc if
  precision matters
- [The Guardian Open Platform — status & free tier](https://freeapi.watch/the-guardian/) ·
  [Guardian API overview](https://publicapis.io/the-guardian-api)
- [Reuters Connect API 2026: pricing, coverage, access](https://dataresearchtools.com/reuters-connect-api-2026-pricing-coverage-how-to-get-access/) ·
  [List of news media APIs](https://en.wikipedia.org/wiki/List_of_news_media_APIs)
- [Wikimedia APIs — reusing free images](https://api.wikimedia.org/wiki/Reusing_free_images_and_media_files_with_Python) ·
  [Wikimedia Commons](https://en.wikipedia.org/wiki/Wikimedia_Commons) ·
  [Getting licence/credit details from Commons](https://www.haykranen.nl/2025/06/27/this-is-how-you-easily-get-licensing-and-credit-details-for-free-images-on-wikimedia-commons/)
- [Openverse](https://openverse.org/) · [Openverse API docs](https://apis.io/apis/openverse/openverse-api/)
- [GDELT Visual Global Knowledge Graph](https://blog.gdeltproject.org/announcing-the-new-gdelt-visual-global-knowledge-graph-vgkg/) ·
  [GDELT GEO 2.0 API](https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/) ·
  [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- [NewsAPI pricing](https://newsapi.org/pricing)
- [Media RSS](https://en.wikipedia.org/wiki/Media_RSS)
- NYT policy pages (all verified reachable 2026-08-02, but not machine-readable — read in a browser):
  [Terms of Service](https://help.nytimes.com/hc/en-us/articles/115014893428-Terms-of-service) ·
  [RSS feeds](https://www.nytimes.com/rss) ·
  [Copyright notice](https://www.nytimes.com/content/help/rights/copyright/copyright-notice.html) ·
  [NYT Licensing Group](https://nytlicensing.com/) ·
  [Developer API terms](https://developer.nytimes.com/terms)

*Not legal advice — the licensing notes are a practical risk assessment, not a lawyer's opinion.*
