<p align="center">
  <img src="https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white" alt="WordPress" />
  <img src="https://img.shields.io/badge/WooCommerce-96588A?style=for-the-badge&logo=woocommerce&logoColor=white" alt="WooCommerce" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MCP-Model_Context_Protocol-8B5CF6?style=for-the-badge" alt="MCP" />
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
  <img src="https://img.shields.io/badge/tools-20-blue?style=flat-square" alt="Tools" />
  <img src="https://img.shields.io/badge/skills-20-blue?style=flat-square" alt="Skills" />
  <img src="https://img.shields.io/badge/tests-140%20passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/SEO-Yoast%20%7C%20RankMath%20%7C%20AIOSEO-orange?style=flat-square" alt="SEO Plugins" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-architecture">Architecture</a> &bull;
  <a href="#%EF%B8%8F-dev-server--15-tools">Dev Tools</a> &bull;
  <a href="#-storefront-server--5-tools">Storefront</a> &bull;
  <a href="#-agent-skills--20">Skills</a> &bull;
  <a href="#-seo-plugins">SEO Plugins</a> &bull;
  <a href="#-mcp-configuration">Config</a>
</p>

---

## Why?

WordPress powers 40%+ of the web but AI dev tools don't speak WordPress natively. This toolkit bridges that gap:

- **Ask your AI** to analyze a theme, scaffold a plugin, validate PHP, or publish a post
- **No context switching** between docs, terminal, and editor
- **Works with any AI** that supports MCP: Claude, Cursor, VS Code Copilot, Gemini, Codex

---

## Quick Start

```bash
# One command to connect Claude Code to WordPress
claude mcp add wp-ai-toolkit npx -y @erayusta/wp-ai-toolkit
```

Then open Claude Code and say:

> "Analyze the theme in my wp-content/themes directory"

> "Scaffold an Elementor widget called Pricing Card"

> "Score this article's SEO quality and check for AI patterns"

That's it. The AI calls the right tools automatically.

---

## Architecture

```
  Claude Code / Cursor / VS Code / Gemini CLI / Codex
                       |
                       |  stdio (JSON-RPC)
                       v
  ┌────────────────────────────────────┐   ┌────────────────────────────┐
  │      wp-ai-toolkit (Dev Server)    │   │   wp-storefront (Commerce) │
  │              15 tools              │   │          5 tools           │
  ├────────────────────────────────────┤   ├────────────────────────────┤
  │                                    │   │                            │
  │  DOCS & DISCOVERY                  │   │  search_products           │
  │  ├─ learn_wordpress_api            │   │  get_product_details       │
  │  ├─ search_docs                    │   │  get_orders                │
  │  ├─ fetch_full_docs                │   │  get_store_info            │
  │  └─ introspect_rest_api            │   │  get_store_stats           │
  │                                    │   │                            │
  │  VALIDATION                        │   └────────────────────────────┘
  │  ├─ validate_php                   │
  │  ├─ validate_block_json            │   ┌────────────────────────────┐
  │  └─ validate_theme_template        │   │   WordPress MU-Plugins     │
  │                                    │   ├────────────────────────────┤
  │  ANALYSIS                          │   │  Universal SEO REST API    │
  │  ├─ analyze_theme                  │   │  (auto-detects plugin)     │
  │  ├─ analyze_plugin                 │   │                            │
  │  ├─ analyze_content_seo            │   │  ✓ Yoast SEO              │
  │  ├─ analyze_competitors            │   │  ✓ Rank Math              │
  │  └─ score_content_quality          │   │  ✓ All in One SEO         │
  │                                    │   └────────────────────────────┘
  │  ACTIONS                           │
  │  ├─ manage_wp_site                 │   ┌────────────────────────────┐
  │  ├─ scaffold_component             │   │     20 Agent Skills        │
  │  └─ publish_to_wordpress           │   ├────────────────────────────┤
  │                                    │   │  REST API · Hooks · Blocks │
  └────────────────────────────────────┘   │  Themes · Plugins · WooC   │
                                           │  Gutenberg · Custom Fields │
                                           │  Security · Multisite      │
                                           │  Page Builders · Perf      │
                                           │  Admin UI · Cron · SEO     │
                                           │  Migrations · Copywriting  │
                                           │  Content Strategy · CRO    │
                                           │  Analytics & Tracking      │
                                           └────────────────────────────┘
```

---

## Highlights

<table>
<tr>
<td>

**20 Tools**<br/>
15 dev + 5 storefront across 2 MCP servers

**20 Agent Skills**<br/>
Deep expertise covering the entire WP ecosystem

**SEO Plugin Support**<br/>
Yoast, Rank Math, AIOSEO — unified REST API

</td>
<td>

**Content Intelligence**<br/>
SEO scoring, readability, AI pattern detection

**13 Scaffold Types**<br/>
Plugin, block, CPT, Elementor widget, and more

**WordPress Publishing**<br/>
REST API with SEO metadata in one call

</td>
<td>

**Competitor Analysis**<br/>
Detect themes, plugins, tech stack of any WP site

**Theme & Plugin Audit**<br/>
Automated quality checks like Theme Check

**Multi-Platform**<br/>
Claude, Cursor, VS Code, Gemini, Codex

</td>
</tr>
</table>

---

## Installation

```bash
# Option 1: npx (zero install)
npx -y @erayusta/wp-ai-toolkit

# Option 2: Global
npm install -g @erayusta/wp-ai-toolkit

# Option 3: From source
git clone https://github.com/erayusta/wp-ai-toolkit.git
cd wp-ai-toolkit && npm install && npm run build
```

---

## Dev Server — 15 Tools

<table>
<tr><td width="50%">

### Docs & Discovery

| Tool | Description |
|:-----|:------------|
| `learn_wordpress_api` | Start here — creates session, loads API context |
| `search_docs` | Search developer.wordpress.org |
| `fetch_full_docs` | Full doc page as markdown |
| `introspect_rest_api` | Explore REST endpoints + live site discovery |

### Validation

| Tool | Description |
|:-----|:------------|
| `validate_php` | Hooks, security, deprecated, anti-patterns |
| `validate_block_json` | block.json / theme.json schema checks |
| `validate_theme_template` | Template hierarchy, escaping, The Loop |

</td><td>

### Analysis

| Tool | Description |
|:-----|:------------|
| `analyze_theme` | Full theme directory audit |
| `analyze_plugin` | Full plugin directory audit |
| `analyze_content_seo` | Readability, keyword density, SEO score |
| `analyze_competitors` | Detect theme/plugins/tech of competitor sites |
| `score_content_quality` | 5-dimension quality score + AI pattern detection |

### Actions

| Tool | Description |
|:-----|:------------|
| `manage_wp_site` | WP-CLI commands with safety checks |
| `scaffold_component` | Generate 13 component types |
| `publish_to_wordpress` | REST API publish with SEO metadata |

</td></tr>
</table>

### scaffold_component — 13 Types

```
plugin · theme · block · custom-post-type · taxonomy · rest-endpoint
widget · shortcode · elementor-widget · meta-box · settings-page
cron-job · ajax-handler
```

### analyze_content_seo — What It Checks

```
Word count · Sentence length · Flesch readability · Grade level
Keyword density · Keyword in H1/H2/first paragraph
Heading structure (H1-H6) · Internal/external links · Images with alt
Meta title length (50-60 chars) · Meta description (140-160 chars)
→ Returns 0-100 SEO score with grade (A+ to F)
```

### score_content_quality — 5 Dimensions

```
Humanity     ████████░░  16/20  — AI pattern detection (delve, leverage, seamlessly...)
Specificity  ██████░░░░  12/20  — Numbers, data, quotes, examples
Structure    █████████░  18/20  — Headings, lists, images, code blocks
Engagement   ███████░░░  14/20  — Questions, pronouns, transitions
Completeness ████████░░  16/20  — Depth, conclusion, CTA
                         ──────
                         76/100 (B)
```

---

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

---

## Agent Skills — 20

<table>
<tr>
<td width="33%">

### Core Development
| Skill | |
|:------|:--|
| `wp-rest-api` | Endpoints, auth, custom routes |
| `wp-hooks` | Actions, filters, priority |
| `wp-blocks` | block.json, attributes, supports |
| `wp-gutenberg-components` | React, RichText, InnerBlocks |
| `wp-custom-fields` | ACF, CMB2, native meta |
| `wp-plugins` | Headers, settings, CPTs, AJAX |
| `wp-themes` | Block vs classic, FSE, theme.json |

</td>
<td width="33%">

### Infrastructure
| Skill | |
|:------|:--|
| `wp-security` | Escaping, nonces, roles, hardening |
| `wp-performance` | Caching, query optimization |
| `wp-multisite` | Network admin, shared tables |
| `wp-cron-background` | WP-Cron, Action Scheduler |
| `wp-admin-ui` | Meta boxes, list tables, dashboards |
| `wp-page-builders` | Elementor, Divi, Beaver, WPBakery |
| `wp-migrations-deploy` | DB migrations, Bedrock, deploys |

</td>
<td width="34%">

### Content & Marketing
| Skill | |
|:------|:--|
| `wp-woocommerce` | Products, gateways, HPOS |
| `wp-seo-schema` | JSON-LD, Yoast, RankMath |
| `wp-content-strategy` | Topic clusters, calendars |
| `wp-copywriting` | Headlines, meta, snippets |
| `wp-cro-optimization` | Landing pages, A/B, forms |
| `wp-analytics-tracking` | GA4, GTM, GSC, UTM |

</td>
</tr>
</table>

---

## SEO Plugins

WordPress MU-plugins that expose SEO data via REST API.

### Universal Plugin (Recommended)

**One file, three SEO plugins.** Auto-detects which is active:

```bash
# Copy to your WordPress site
cp wordpress/wp-ai-toolkit-seo-rest.php /path/to/wp-content/mu-plugins/
```

Works with **Yoast SEO**, **Rank Math**, and **All in One SEO**. Exposes a unified `seo` field on all post types:

```json
GET /wp-json/wp/v2/posts/123

{
  "title": "My Post",
  "content": "...",
  "seo": {
    "plugin": "rankmath",
    "seo_title": "My Post | My Site",
    "meta_description": "A great post about...",
    "focus_keyword": "wordpress seo",
    "canonical_url": "",
    "seo_score": "87",
    "og_title": "My Post",
    "og_description": "...",
    "og_image": "https://...",
    "twitter_title": "...",
    "twitter_description": "..."
  }
}
```

```json
POST /wp-json/wp/v2/posts/123

{
  "seo": {
    "seo_title": "Updated Title | My Site",
    "meta_description": "Updated description",
    "focus_keyword": "new keyword"
  }
}
```

### Individual Plugins

If you prefer a single-plugin file:

| File | SEO Plugin |
|:-----|:-----------|
| `wordpress/wp-ai-toolkit-seo-rest.php` | **Universal** (auto-detect) |
| `wordpress/seo-machine-yoast-rest.php` | Yoast SEO only |
| `wordpress/wp-ai-toolkit-rankmath-rest.php` | Rank Math only |
| `wordpress/wp-ai-toolkit-aioseo-rest.php` | All in One SEO only |

### SEO Status Endpoint

Check which SEO plugin is detected:

```
GET /wp-json/wp-ai-toolkit/v1/seo-status

{ "active_plugin": "rankmath", "supported": ["yoast", "rankmath", "aioseo"] }
```

---

## MCP Configuration

<details>
<summary><strong>Claude Code</strong> (recommended)</summary>

```bash
claude mcp add wp-ai-toolkit npx -y @erayusta/wp-ai-toolkit
```

Or add `.mcp.json` to your project root:

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

Uses the `gemini-extension.json` file in the package root.
</details>

---

## Tool Reference

<details>
<summary><strong>learn_wordpress_api</strong> — Session bootstrap (required first)</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `api` | string | Yes | `rest-api` `hooks` `blocks` `themes` `plugins` `woocommerce` `wp-cli` `gutenberg` `multisite` `custom-fields` |
| `conversationId` | string | No | Existing session to add another API context |
</details>

<details>
<summary><strong>validate_php</strong> — PHP code validation</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `code` | string | Yes | PHP code to validate |
| `conversationId` | string | Yes | Session ID |
| `context` | string | No | `plugin` `theme` `mu-plugin` `functions-php` `general` |

**Checks:** Hook mismatches, security (nonces, escaping, SQL injection), deprecated functions (30+), anti-patterns (`query_posts`, `extract`, direct cURL), function prefixing, absolute includes, plugin headers.
</details>

<details>
<summary><strong>scaffold_component</strong> — Code generation</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `type` | string | Yes | See 13 types above |
| `name` | string | Yes | Component name |
| `conversationId` | string | Yes | Session ID |
| `slug` | string | No | Custom slug override |
| `namespace` | string | No | PHP namespace/prefix |
</details>

<details>
<summary><strong>analyze_content_seo</strong> — Content SEO analysis</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `content` | string | Yes | Article content (HTML or text) |
| `conversationId` | string | Yes | Session ID |
| `targetKeyword` | string | No | Primary keyword to check |
| `secondaryKeywords` | string[] | No | Additional keywords |
| `metaTitle` | string | No | Meta title to validate |
| `metaDescription` | string | No | Meta description to validate |
</details>

<details>
<summary><strong>publish_to_wordpress</strong> — REST API publishing</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `siteUrl` | string | Yes | WordPress site URL |
| `title` | string | Yes | Post title |
| `content` | string | Yes | Post content (HTML) |
| `conversationId` | string | Yes | Session ID |
| `status` | string | No | `draft` `publish` `pending` `private` (default: `draft`) |
| `seoTitle` | string | No | SEO title (Yoast/RankMath/AIOSEO) |
| `seoDescription` | string | No | Meta description |
| `seoFocusKeyword` | string | No | Focus keyword |
| `ogTitle` | string | No | Open Graph title |
| `username` | string | No | WP username for auth |
| `applicationPassword` | string | No | WP Application Password |
</details>

<details>
<summary><strong>analyze_competitors</strong> — Competitor site analysis</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `url` | string | Yes | Competitor website URL |
| `conversationId` | string | Yes | Session ID |

**Detects:** WordPress version, theme, plugins (from HTML), technology stack (Elementor, WooCommerce, GA, GTM, Cloudflare, etc.), REST API namespaces, security indicators.
</details>

<details>
<summary><strong>score_content_quality</strong> — Content quality scoring</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `content` | string | Yes | Content to score |
| `conversationId` | string | Yes | Session ID |
| `contentType` | string | No | `blog-post` `landing-page` `product-page` `documentation` `general` |

**Dimensions:** Humanity (AI pattern detection), Specificity (data/examples), Structure (headings/lists), Engagement (questions/pronouns), Completeness (depth/CTA).
</details>

<details>
<summary><strong>All other tools</strong></summary>

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
</details>

---

## Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `WP_TOOLKIT_LOG_LEVEL` | `INFO` | `DEBUG` `INFO` `WARN` `ERROR` — logs to stderr |

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode
npm run build        # Compile TypeScript
npm test             # Run 106 tests
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

### Project Structure

```
wp-ai-toolkit/
├── src/
│   ├── index.ts                       # Dev MCP server (15 tools)
│   ├── storefront.ts                  # Storefront MCP server (5 tools)
│   ├── types.ts                       # Shared types
│   ├── tools/                         # 15 tool implementations
│   │   ├── learn-wordpress-api.ts
│   │   ├── search-docs.ts
│   │   ├── fetch-full-docs.ts
│   │   ├── introspect-rest-api.ts
│   │   ├── validate-php.ts
│   │   ├── validate-block-json.ts
│   │   ├── validate-theme-template.ts
│   │   ├── manage-wp-site.ts
│   │   ├── scaffold-component.ts
│   │   ├── analyze-theme.ts
│   │   ├── analyze-plugin.ts
│   │   ├── analyze-content-seo.ts
│   │   ├── analyze-competitors.ts
│   │   ├── publish-to-wordpress.ts
│   │   └── score-content-quality.ts
│   ├── data/                          # Built-in reference data
│   └── utils/                         # Conversation, HTTP, logger
├── skills/                            # 20 agent skill files
├── wordpress/                         # SEO REST API MU-plugins
│   ├── wp-ai-toolkit-seo-rest.php     #   Universal (auto-detect)
│   ├── wp-ai-toolkit-rankmath-rest.php
│   ├── wp-ai-toolkit-aioseo-rest.php
│   └── seo-machine-yoast-rest.php
├── tests/                             # 106 tests (Vitest)
├── examples/                          # MCP config examples
├── scripts/                           # Setup & install scripts
├── .claude-plugin/                    # Claude Code plugin
├── .cursor-plugin/                    # Cursor plugin
├── .codex-plugin/                     # Codex plugin
├── plugin.json                        # Plugin manifest
├── gemini-extension.json              # Gemini CLI extension
└── .github/workflows/                 # CI/CD (Node 20+22)
```

---

## Platform Support

| Platform | Method |
|:---------|:-------|
| **Claude Code** | `claude mcp add` or `.mcp.json` |
| **Claude Desktop** | `claude_desktop_config.json` |
| **Cursor** | `.cursor/mcp.json` |
| **VS Code** | `settings.json` |
| **Gemini CLI** | `gemini-extension.json` |
| **Codex** | `.codex-plugin/` |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes, run `npm test && npm run lint`
4. Commit and open a pull request

---

<p align="center">
  <sub>
    Built with
    <a href="https://modelcontextprotocol.io">Model Context Protocol</a> &bull;
    <a href="https://www.typescriptlang.org">TypeScript</a> &bull;
    <a href="https://wordpress.org">WordPress</a> &bull;
    <a href="https://woocommerce.com">WooCommerce</a>
  </sub>
</p>

<p align="center">
  <sub>MIT License &copy; 2026 <a href="https://github.com/erayusta">erayusta</a></sub>
</p>
