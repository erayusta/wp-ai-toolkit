<p align="center">
  <img src="https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white" alt="WordPress" />
  <img src="https://img.shields.io/badge/WooCommerce-96588A?style=for-the-badge&logo=woocommerce&logoColor=white" alt="WooCommerce" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MCP-Model_Context_Protocol-8B5CF6?style=for-the-badge" alt="MCP" />
  <img src="https://img.shields.io/badge/SEO-Yoast_%7C_RankMath_%7C_AIOSEO-FF6C37?style=for-the-badge" alt="SEO" />
</p>

<h1 align="center">WordPress AI Toolkit</h1>

<p align="center">
  <strong>The ultimate MCP Server for WordPress development & content operations.</strong><br/>
  Connect Claude Code, Cursor, VS Code, Gemini CLI, or Codex to the entire WordPress ecosystem.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@erayusta/wp-ai-toolkit"><img src="https://img.shields.io/npm/v/@erayusta/wp-ai-toolkit?style=flat-square&color=CB3837&label=npm" alt="npm" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/tools-20-0969DA?style=flat-square" alt="Tools" />
  <img src="https://img.shields.io/badge/skills-20-0969DA?style=flat-square" alt="Skills" />
  <img src="https://img.shields.io/badge/tests-140%20passing-2EA043?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/CI-passing-2EA043?style=flat-square&logo=githubactions&logoColor=white" alt="CI" />
</p>

<br/>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-architecture">Architecture</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#%EF%B8%8F-dev-server--15-tools">Dev Tools</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-storefront-server--5-tools">Storefront</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-agent-skills--20">Skills</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-seo-plugins">SEO Plugins</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-mcp-configuration">Config</a>
</p>

<br/>

---

<br/>

## Why?

WordPress powers **43% of the web** — but AI dev tools don't speak WordPress natively.

This toolkit bridges that gap with **20 tools**, **20 skills**, and **universal SEO plugin support**:

<table>
<tr>
<td width="33%" valign="top">

**For Developers**
- Validate PHP, templates, block.json
- Scaffold plugins, blocks, Elementor widgets
- Analyze themes & plugins like Theme Check
- Introspect REST API endpoints live

</td>
<td width="33%" valign="top">

**For Content Teams**
- Score content SEO quality (0-100)
- Detect AI writing patterns
- Publish to WordPress with SEO metadata
- Analyze competitor sites & tech stacks

</td>
<td width="34%" valign="top">

**For Store Owners**
- Search WooCommerce products
- Track orders & store stats
- Manage sites via WP-CLI
- Works with Yoast, RankMath, AIOSEO

</td>
</tr>
</table>

<br/>

---

<br/>

## Quick Start

**One command. That's it.**

```bash
claude mcp add wp-ai-toolkit npx -y @erayusta/wp-ai-toolkit
```

Then open Claude Code and try:

```
> Analyze the theme in my wp-content/themes/flavor directory

> Scaffold an Elementor widget called Pricing Card

> Score this article's SEO quality and check for AI patterns

> Publish this draft to my WordPress site as a draft with SEO metadata
```

The AI calls the right tools automatically.

<br/>

---

<br/>

## Architecture

```
   Claude Code  ·  Cursor  ·  VS Code  ·  Gemini CLI  ·  Codex
                            │
                            │  stdio (JSON-RPC)
                            ▼
   ┌─────────────────────────────────────┐    ┌─────────────────────────────┐
   │       wp-ai-toolkit (Dev Server)    │    │  wp-storefront (Commerce)   │
   │              15 tools               │    │          5 tools            │
   ╞═════════════════════════════════════╡    ╞═════════════════════════════╡
   │                                     │    │                             │
   │  DOCS & DISCOVERY                   │    │  search_products            │
   │  ├── learn_wordpress_api            │    │  get_product_details        │
   │  ├── search_docs                    │    │  get_orders                 │
   │  ├── fetch_full_docs                │    │  get_store_info             │
   │  └── introspect_rest_api            │    │  get_store_stats            │
   │                                     │    │                             │
   │  VALIDATION                         │    └─────────────────────────────┘
   │  ├── validate_php                   │
   │  ├── validate_block_json            │    ┌─────────────────────────────┐
   │  └── validate_theme_template        │    │    WordPress MU-Plugins     │
   │                                     │    ╞═════════════════════════════╡
   │  ANALYSIS & SEO                     │    │  Universal SEO REST API     │
   │  ├── analyze_theme                  │    │  (auto-detects plugin)      │
   │  ├── analyze_plugin                 │    │                             │
   │  ├── analyze_content_seo            │    │  ✅ Yoast SEO              │
   │  ├── analyze_competitors            │    │  ✅ Rank Math              │
   │  └── score_content_quality          │    │  ✅ All in One SEO         │
   │                                     │    └─────────────────────────────┘
   │  ACTIONS                            │
   │  ├── manage_wp_site                 │    ┌─────────────────────────────┐
   │  ├── scaffold_component             │    │      20 Agent Skills        │
   │  └── publish_to_wordpress           │    ╞═════════════════════════════╡
   │                                     │    │  REST API · Hooks · Blocks  │
   └─────────────────────────────────────┘    │  Themes · Plugins · WooC    │
                                              │  Gutenberg · Custom Fields  │
                                              │  Security · Multisite       │
                                              │  Page Builders · Perf       │
                                              │  Admin UI · Cron · SEO      │
                                              │  Migrations · Copywriting   │
                                              │  Content Strategy · CRO     │
                                              │  Analytics & Tracking       │
                                              └─────────────────────────────┘
```

<br/>

---

<br/>

## Highlights

<table>
<tr>
<td align="center" width="20%">
<h3>20</h3>
<sub><strong>MCP Tools</strong></sub><br/>
<sub>15 dev + 5 storefront</sub>
</td>
<td align="center" width="20%">
<h3>20</h3>
<sub><strong>Agent Skills</strong></sub><br/>
<sub>Deep WordPress expertise</sub>
</td>
<td align="center" width="20%">
<h3>140</h3>
<sub><strong>Tests Passing</strong></sub><br/>
<sub>CI on Node 20 & 22</sub>
</td>
<td align="center" width="20%">
<h3>13</h3>
<sub><strong>Scaffold Types</strong></sub><br/>
<sub>Plugin to Elementor</sub>
</td>
<td align="center" width="20%">
<h3>3</h3>
<sub><strong>SEO Plugins</strong></sub><br/>
<sub>Yoast · RankMath · AIOSEO</sub>
</td>
</tr>
</table>

<br/>

---

<br/>

## Installation

```bash
# Option 1: npx (zero install — recommended)
npx -y @erayusta/wp-ai-toolkit

# Option 2: Global install
npm install -g @erayusta/wp-ai-toolkit

# Option 3: Build from source
git clone https://github.com/erayusta/wp-ai-toolkit.git
cd wp-ai-toolkit && npm install && npm run build
```

<br/>

---

<br/>

## Dev Server — 15 Tools

<table>
<tr><td width="50%" valign="top">

### Docs & Discovery

| Tool | Description |
|:-----|:------------|
| `learn_wordpress_api` | **Start here** — creates session, loads context |
| `search_docs` | Search developer.wordpress.org |
| `fetch_full_docs` | Full doc page as markdown |
| `introspect_rest_api` | Explore REST endpoints + live discovery |

### Validation

| Tool | Description |
|:-----|:------------|
| `validate_php` | Hooks, security, deprecated, anti-patterns |
| `validate_block_json` | block.json / theme.json schema checks |
| `validate_theme_template` | Template hierarchy, escaping, The Loop |

</td><td valign="top">

### Analysis & SEO

| Tool | Description |
|:-----|:------------|
| `analyze_theme` | Full theme directory audit |
| `analyze_plugin` | Full plugin directory audit |
| `analyze_content_seo` | Readability, keyword density, SEO score |
| `analyze_competitors` | Detect theme/plugins/tech of any WP site |
| `score_content_quality` | 5-dimension score + AI pattern detection |

### Actions

| Tool | Description |
|:-----|:------------|
| `manage_wp_site` | WP-CLI commands with safety checks |
| `scaffold_component` | Generate 13 component types |
| `publish_to_wordpress` | Publish with Yoast/RankMath/AIOSEO metadata |

</td></tr>
</table>

<br/>

### `scaffold_component` — 13 Types

<p>
  <img src="https://img.shields.io/badge/plugin-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/theme-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/block-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/custom--post--type-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/taxonomy-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/rest--endpoint-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/widget-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/shortcode-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/elementor--widget-92003B?style=flat-square" />
  <img src="https://img.shields.io/badge/meta--box-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/settings--page-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/cron--job-21759B?style=flat-square" />
  <img src="https://img.shields.io/badge/ajax--handler-21759B?style=flat-square" />
</p>

<br/>

### `analyze_content_seo` — What It Scores

```
┌──────────────────────────────────────────────────────────────┐
│                    SEO Score: 82/100 (A)                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Word Count          2,847 words          ✅ Excellent       │
│  Readability         Flesch 64 (Standard) ✅ Optimal         │
│  Keyword Density     1.8%                 ✅ Optimal         │
│  Keyword in H1       Yes                  ✅                 │
│  Keyword in H2       Yes                  ✅                 │
│  First Paragraph     Yes                  ✅                 │
│  Heading Structure   1×H1, 5×H2, 3×H3    ✅                 │
│  Internal Links      4                    ✅                 │
│  External Links      2                    ✅                 │
│  Images              3 (all with alt)     ✅                 │
│  Meta Title          54 chars             ✅ (50-60)         │
│  Meta Description    148 chars            ✅ (140-160)       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

<br/>

### `score_content_quality` — 5 Dimensions

```
┌──────────────────────────────────────────────────────────────┐
│                Content Quality: 76/100 (B)                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Humanity      ████████░░  16/20   Natural writing           │
│  Specificity   ██████░░░░  12/20   Needs more data/examples  │
│  Structure     █████████░  18/20   Well organized            │
│  Engagement    ███████░░░  14/20   Good use of questions     │
│  Completeness  ████████░░  16/20   Solid depth               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  AI Patterns Detected:                                       │
│  ⚠ "leverage" (2x) → use "use"                              │
│  ⚠ "In conclusion" (1x) → state the takeaway directly       │
└──────────────────────────────────────────────────────────────┘
```

<br/>

### `analyze_competitors` — What It Detects

```
┌──────────────────────────────────────────────────────────────┐
│           Competitor Analysis: competitor.com                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Platform       WordPress 6.7                                │
│  Theme          flavor (custom)                              │
│  Page Builder   Elementor                                    │
│  SEO Plugin     Rank Math                                    │
│  E-Commerce     WooCommerce                                  │
│  Analytics      Google Analytics + GTM                       │
│  CDN/Cache      Cloudflare + WP Rocket                       │
│  REST API       wp/v2, wc/v3, rankmath/v1                    │
│                                                              │
│  Detected Plugins (8):                                       │
│  elementor, woocommerce, wordpress-seo, wp-rocket,           │
│  contact-form-7, wp-mail-smtp, updraftplus, wordfence        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## Storefront Server — 5 Tools

WooCommerce store operations via REST API.

| Tool | Description |
|:-----|:------------|
| `search_products` | Search with filters (category, price range, stock) |
| `get_product_details` | Full product data by ID or slug |
| `get_orders` | Order listing with status filters |
| `get_store_info` | Settings, payment gateways, shipping zones |
| `get_store_stats` | Sales totals, top sellers, order counts |

```bash
claude mcp add wp-storefront node dist/storefront.js
```

<br/>

---

<br/>

## Agent Skills — 20

Deep expertise files that give AI agents WordPress superpowers.

<table>
<tr>
<td width="33%" valign="top">

### Core Development

| | Skill |
|:--|:------|
| **API** | `wp-rest-api` — endpoints, auth, custom routes |
| **Hooks** | `wp-hooks` — actions, filters, priority |
| **Blocks** | `wp-blocks` — block.json, attributes, supports |
| **React** | `wp-gutenberg-components` — RichText, InnerBlocks |
| **Fields** | `wp-custom-fields` — ACF, CMB2, meta API |
| **Plugins** | `wp-plugins` — headers, settings, CPTs, AJAX |
| **Themes** | `wp-themes` — block vs classic, FSE, theme.json |

</td>
<td width="33%" valign="top">

### Infrastructure

| | Skill |
|:--|:------|
| **Security** | `wp-security` — escaping, nonces, roles |
| **Speed** | `wp-performance` — caching, query optimization |
| **Network** | `wp-multisite` — network admin, shared tables |
| **Jobs** | `wp-cron-background` — WP-Cron, Action Scheduler |
| **Admin** | `wp-admin-ui` — meta boxes, list tables |
| **Builders** | `wp-page-builders` — Elementor, Divi, Beaver |
| **Deploy** | `wp-migrations-deploy` — DB migrations, Bedrock |

</td>
<td width="34%" valign="top">

### Content & Marketing

| | Skill |
|:--|:------|
| **Commerce** | `wp-woocommerce` — products, gateways, HPOS |
| **SEO** | `wp-seo-schema` — JSON-LD, Yoast, RankMath |
| **Strategy** | `wp-content-strategy` — topic clusters, calendars |
| **Writing** | `wp-copywriting` — headlines, meta, snippets |
| **CRO** | `wp-cro-optimization` — landing pages, A/B, forms |
| **Analytics** | `wp-analytics-tracking` — GA4, GTM, GSC, UTM |

</td>
</tr>
</table>

<br/>

---

<br/>

## SEO Plugins

WordPress MU-plugins that expose SEO data via REST API.

### Universal Plugin (Recommended)

> **One file. Three SEO plugins. Zero config.**

```bash
cp wordpress/wp-ai-toolkit-seo-rest.php /path/to/wp-content/mu-plugins/
```

Auto-detects **Yoast SEO**, **Rank Math**, or **All in One SEO** and exposes a unified `seo` field:

<table>
<tr>
<td width="50%">

**Read SEO data:**
```http
GET /wp-json/wp/v2/posts/123
```

```json
{
  "title": "My Post",
  "seo": {
    "plugin": "rankmath",
    "seo_title": "My Post | My Site",
    "meta_description": "A great post about...",
    "focus_keyword": "wordpress seo",
    "seo_score": "87",
    "canonical_url": "",
    "og_title": "My Post",
    "og_description": "...",
    "og_image": "https://...",
    "twitter_title": "...",
    "twitter_description": "..."
  }
}
```

</td>
<td>

**Write SEO data:**
```http
POST /wp-json/wp/v2/posts/123
```

```json
{
  "seo": {
    "seo_title": "New Title | My Site",
    "meta_description": "Updated desc",
    "focus_keyword": "new keyword"
  }
}
```

**Check active plugin:**
```http
GET /wp-json/wp-ai-toolkit/v1/seo-status
```

```json
{
  "active_plugin": "rankmath",
  "supported": ["yoast", "rankmath", "aioseo"]
}
```

</td>
</tr>
</table>

### Individual Plugins

| File | SEO Plugin | Use Case |
|:-----|:-----------|:---------|
| `wp-ai-toolkit-seo-rest.php` | **Universal** (auto-detect) | Recommended for most sites |
| `seo-machine-yoast-rest.php` | Yoast SEO only | Yoast-only environments |
| `wp-ai-toolkit-rankmath-rest.php` | Rank Math only | RankMath-only environments |
| `wp-ai-toolkit-aioseo-rest.php` | All in One SEO only | AIOSEO-only environments |

<br/>

---

<br/>

## MCP Configuration

<details>
<summary><strong>Claude Code</strong> (recommended)</summary>

<br/>

```bash
claude mcp add wp-ai-toolkit npx -y @erayusta/wp-ai-toolkit
```

Or `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "wp-ai-toolkit": {
      "command": "npx",
      "args": ["-y", "@erayusta/wp-ai-toolkit"]
    }
  }
}
```
</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

<br/>

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "wp-ai-toolkit": {
      "command": "npx",
      "args": ["-y", "@erayusta/wp-ai-toolkit"]
    },
    "wp-storefront": {
      "command": "npx",
      "args": ["-y", "@erayusta/wp-ai-toolkit/dist/storefront.js"]
    }
  }
}
```
</details>

<details>
<summary><strong>Cursor</strong></summary>

<br/>

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wp-ai-toolkit": {
      "command": "npx",
      "args": ["-y", "@erayusta/wp-ai-toolkit"]
    }
  }
}
```
</details>

<details>
<summary><strong>VS Code</strong></summary>

<br/>

`settings.json`:

```json
{
  "mcp.servers": {
    "wp-ai-toolkit": {
      "command": "npx",
      "args": ["-y", "@erayusta/wp-ai-toolkit"]
    }
  }
}
```
</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

<br/>

Uses the `gemini-extension.json` file in the package root.
</details>

<br/>

---

<br/>

## Tool Reference

<details>
<summary><strong>learn_wordpress_api</strong> — Session bootstrap (required first)</summary>

<br/>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `api` | string | Yes | `rest-api` `hooks` `blocks` `themes` `plugins` `woocommerce` `wp-cli` `gutenberg` `multisite` `custom-fields` |
| `conversationId` | string | No | Existing session to add another API context |
</details>

<details>
<summary><strong>validate_php</strong> — PHP code validation</summary>

<br/>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `code` | string | Yes | PHP code to validate |
| `conversationId` | string | Yes | Session ID |
| `context` | string | No | `plugin` `theme` `mu-plugin` `functions-php` `general` |

**Checks:** Hook mismatches · Security (nonces, escaping, SQL injection) · Deprecated functions (30+) · Anti-patterns (`query_posts`, `extract`, direct cURL) · Function prefixing · Absolute includes · Plugin headers
</details>

<details>
<summary><strong>scaffold_component</strong> — Code generation (13 types)</summary>

<br/>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `type` | string | Yes | See 13 types above |
| `name` | string | Yes | Component name |
| `conversationId` | string | Yes | Session ID |
| `slug` | string | No | Custom slug override |
| `namespace` | string | No | PHP namespace/prefix |
| `description` | string | No | Component description |
</details>

<details>
<summary><strong>analyze_content_seo</strong> — Content SEO analysis (0-100 score)</summary>

<br/>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `content` | string | Yes | Article content (HTML or text) |
| `conversationId` | string | Yes | Session ID |
| `targetKeyword` | string | No | Primary keyword to check |
| `secondaryKeywords` | string[] | No | Additional keywords to track |
| `metaTitle` | string | No | Meta title to validate (50-60 chars) |
| `metaDescription` | string | No | Meta description to validate (140-160 chars) |

**Returns:** Word count · Readability (Flesch) · Keyword density · Heading structure · Link counts · Image analysis · Overall SEO score with A+ to F grade
</details>

<details>
<summary><strong>publish_to_wordpress</strong> — REST API publishing with SEO</summary>

<br/>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `siteUrl` | string | Yes | WordPress site URL |
| `title` | string | Yes | Post title |
| `content` | string | Yes | Post content (HTML) |
| `conversationId` | string | Yes | Session ID |
| `status` | string | No | `draft` `publish` `pending` `private` (default: `draft`) |
| `postType` | string | No | `posts` `pages` or custom type (default: `posts`) |
| `seoTitle` | string | No | SEO title — works with Yoast/RankMath/AIOSEO |
| `seoDescription` | string | No | Meta description |
| `seoFocusKeyword` | string | No | Focus keyword |
| `ogTitle` | string | No | Open Graph title |
| `ogDescription` | string | No | Open Graph description |
| `ogImage` | string | No | Open Graph image URL |
| `username` | string | No | WP username for auth |
| `applicationPassword` | string | No | WP Application Password |

**Requires:** `wp-ai-toolkit-seo-rest.php` MU-plugin for SEO fields
</details>

<details>
<summary><strong>analyze_competitors</strong> — Competitor WordPress site analysis</summary>

<br/>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `url` | string | Yes | Competitor website URL |
| `conversationId` | string | Yes | Session ID |

**Detects:** WordPress version · Theme · Plugins (from HTML) · Page builders (Elementor, Divi, Beaver) · SEO plugins (Yoast, RankMath) · WooCommerce · Analytics (GA4, GTM) · CDN (Cloudflare) · Caching (WP Rocket, LiteSpeed) · REST API namespaces · Security indicators
</details>

<details>
<summary><strong>score_content_quality</strong> — 5-dimension content scoring</summary>

<br/>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `content` | string | Yes | Content to score (HTML or text) |
| `conversationId` | string | Yes | Session ID |
| `contentType` | string | No | `blog-post` `landing-page` `product-page` `documentation` `general` |

**Dimensions:**
- **Humanity** — AI pattern detection (delve, leverage, seamlessly, holistic...)
- **Specificity** — Numbers, data points, quotes, URLs, examples
- **Structure** — Headings, lists, images, code blocks, paragraphs
- **Engagement** — Questions, personal pronouns, transitions, examples
- **Completeness** — Depth, conclusion, CTA, topic coverage
</details>

<details>
<summary><strong>All other tools</strong> — Quick reference</summary>

<br/>

| Tool | Key Parameters |
|:-----|:--------------|
| `search_docs` | `query`, `category`, `limit` |
| `fetch_full_docs` | `url` |
| `introspect_rest_api` | `query`, `namespace`, `siteUrl`, `method` |
| `validate_block_json` | `json`, `type` (block/theme) |
| `validate_theme_template` | `code`, `templateType`, `themeType` |
| `analyze_theme` | `themePath` |
| `analyze_plugin` | `pluginPath` |
| `manage_wp_site` | `command`, `wpPath`, `format` |

**Storefront Server:**

| Tool | Key Parameters |
|:-----|:--------------|
| `search_products` | `siteUrl`, `query`, `category`, `minPrice`, `maxPrice` |
| `get_product_details` | `siteUrl`, `productId` or `slug` |
| `get_orders` | `siteUrl`, `status`, `consumerKey`, `consumerSecret` |
| `get_store_info` | `siteUrl`, `consumerKey`, `consumerSecret` |
| `get_store_stats` | `siteUrl`, `period`, `consumerKey`, `consumerSecret` |
</details>

<br/>

---

<br/>

## Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `WP_TOOLKIT_LOG_LEVEL` | `INFO` | `DEBUG` `INFO` `WARN` `ERROR` — logs to stderr |

<br/>

---

<br/>

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode (tsx)
npm run build        # Compile TypeScript
npm test             # Run 140 tests
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

### Project Structure

```
wp-ai-toolkit/
│
├── src/
│   ├── index.ts                       # Dev MCP server (15 tools)
│   ├── storefront.ts                  # Storefront MCP server (5 tools)
│   ├── types.ts                       # Shared type definitions
│   │
│   ├── tools/                         # 15 tool implementations
│   │   ├── learn-wordpress-api.ts     #   Session bootstrap
│   │   ├── search-docs.ts            #   Documentation search
│   │   ├── fetch-full-docs.ts        #   Full page retrieval
│   │   ├── introspect-rest-api.ts    #   REST API explorer
│   │   ├── validate-php.ts           #   PHP validation
│   │   ├── validate-block-json.ts    #   Block/theme JSON validation
│   │   ├── validate-theme-template.ts #   Template validation
│   │   ├── manage-wp-site.ts         #   WP-CLI bridge
│   │   ├── scaffold-component.ts     #   Code generation (13 types)
│   │   ├── analyze-theme.ts          #   Theme audit
│   │   ├── analyze-plugin.ts         #   Plugin audit
│   │   ├── analyze-content-seo.ts    #   SEO content analysis
│   │   ├── analyze-competitors.ts    #   Competitor detection
│   │   ├── publish-to-wordpress.ts   #   REST publishing + SEO
│   │   └── score-content-quality.ts  #   Quality scoring
│   │
│   ├── data/                          # Built-in reference data
│   │   ├── wp-api-descriptions.ts    #   API domain descriptions
│   │   ├── wp-hooks-registry.ts      #   50+ hooks reference
│   │   └── wp-rest-schema.ts         #   60+ REST endpoints
│   │
│   └── utils/
│       ├── conversation.ts            # Session management
│       ├── http.ts                    # HTTP client
│       └── logger.ts                  # Structured logging
│
├── skills/                            # 20 agent skill files (markdown)
│
├── wordpress/                         # SEO REST API MU-plugins
│   ├── wp-ai-toolkit-seo-rest.php    #   Universal (auto-detect)
│   ├── wp-ai-toolkit-rankmath-rest.php
│   ├── wp-ai-toolkit-aioseo-rest.php
│   └── seo-machine-yoast-rest.php
│
├── tests/                             # 140 tests (Vitest)
│   ├── tools/                        #   14 tool test files
│   └── utils/                        #   2 util test files
│
├── examples/                          # MCP config examples
├── scripts/                           # Setup & install scripts
│
├── .claude-plugin/                    # Claude Code plugin
├── .cursor-plugin/                    # Cursor plugin
├── .codex-plugin/                     # Codex plugin
├── plugin.json                        # Plugin manifest
├── gemini-extension.json              # Gemini CLI extension
│
└── .github/workflows/                 # CI/CD (Node 20 + 22)
    ├── ci.yml                        #   Build, lint, test on push/PR
    └── publish.yml                   #   npm publish on release
```

<br/>

---

<br/>

## Platform Support

| Platform | Method | Status |
|:---------|:-------|:------:|
| **Claude Code** | `claude mcp add` or `.mcp.json` | ✅ |
| **Claude Desktop** | `claude_desktop_config.json` | ✅ |
| **Cursor** | `.cursor/mcp.json` | ✅ |
| **VS Code** | `settings.json` | ✅ |
| **Gemini CLI** | `gemini-extension.json` | ✅ |
| **Codex** | `.codex-plugin/` | ✅ |

<br/>

---

<br/>

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Run checks: `npm test && npm run lint`
5. Commit and open a pull request

<br/>

---

<br/>

<p align="center">
  <sub>
    Built with
    <a href="https://modelcontextprotocol.io">Model Context Protocol</a> ·
    <a href="https://www.typescriptlang.org">TypeScript</a> ·
    <a href="https://wordpress.org">WordPress</a> ·
    <a href="https://woocommerce.com">WooCommerce</a>
  </sub>
</p>

<p align="center">
  <sub>MIT License © 2026 <a href="https://github.com/erayusta">erayusta</a></sub>
</p>
