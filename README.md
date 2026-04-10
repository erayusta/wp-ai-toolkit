<p align="center">
  <img src="https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white" alt="WordPress" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MCP-Model_Context_Protocol-8B5CF6?style=for-the-badge" alt="MCP" />
</p>

<h1 align="center">WordPress AI Toolkit</h1>

<p align="center">
  <strong>The ultimate MCP Server for WordPress development.</strong><br/>
  Connect Claude Code, Cursor, VS Code, Gemini CLI, or Codex to the WordPress ecosystem.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@erayusta/wp-ai-toolkit"><img src="https://img.shields.io/npm/v/@erayusta/wp-ai-toolkit?style=flat-square&color=CB3837" alt="npm" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/tools-16-blue?style=flat-square" alt="Tools" />
  <img src="https://img.shields.io/badge/skills-16-blue?style=flat-square" alt="Skills" />
  <img src="https://img.shields.io/badge/tests-106_passing-brightgreen?style=flat-square" alt="Tests" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#%EF%B8%8F-tools">Tools</a> &bull;
  <a href="#-skills">Skills</a> &bull;
  <a href="#-storefront-server">Storefront</a> &bull;
  <a href="#-mcp-configuration">Config</a> &bull;
  <a href="#-contributing">Contributing</a>
</p>

---

## Architecture

```
 Claude Code / Cursor / VS Code / Gemini CLI / Codex
                     |
                     |  stdio (JSON-RPC)
                     v
  ┌──────────────────────────────────┐   ┌───────────────────────────┐
  │     wp-ai-toolkit (Dev Server)   │   │  wp-storefront (Commerce) │
  │                                  │   │                           │
  │  learn_wordpress_api             │   │  search_products          │
  │  search_docs                     │   │  get_product_details      │
  │  fetch_full_docs                 │   │  get_orders               │
  │  introspect_rest_api             │   │  get_store_info           │
  │  validate_php                    │   │  get_store_stats          │
  │  validate_block_json             │   │                           │
  │  validate_theme_template         │   └───────────────────────────┘
  │  manage_wp_site                  │
  │  scaffold_component              │   ┌───────────────────────────┐
  │  analyze_theme                   │   │    16 Agent Skills        │
  │  analyze_plugin                  │   │                           │
  │                                  │   │  REST API · Hooks · Blocks│
  └──────────────────────────────────┘   │  Themes · Plugins · WooC  │
                                         │  Gutenberg · ACF/Meta     │
                                         │  Security · Multisite     │
                                         │  Page Builders · Perf     │
                                         │  Admin UI · Cron · SEO    │
                                         │  Migrations & Deploy      │
                                         └───────────────────────────┘
```

## Highlights

| | |
|---|---|
| **16 Tools** | 11 dev tools + 5 storefront tools across 2 MCP servers |
| **16 Skills** | Deep expertise files covering the entire WordPress ecosystem |
| **Code Validation** | PHP, block.json, theme.json, and template validation |
| **Scaffolding** | Generate plugins, blocks, CPTs, Elementor widgets, and 10+ more |
| **Live Introspection** | Query any WordPress site's REST API in real-time |
| **WP-CLI Bridge** | Execute site management commands with built-in safety |
| **Theme & Plugin Analysis** | Automated quality checks like Theme Check |
| **WooCommerce Storefront** | Product search, orders, store stats via REST API |
| **Multi-Platform** | Claude Code, Cursor, VS Code, Gemini CLI, Codex |

---

## Quick Start

### 1. Add the MCP server

**Claude Code (recommended):**

```bash
claude mcp add wp-ai-toolkit npx -y @erayusta/wp-ai-toolkit
```

**Or add `.mcp.json`** to your project root:

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

### 2. Start using it

Open Claude Code in your WordPress project and ask:

> "Analyze the theme in my wp-content/themes/flavor directory"

> "Scaffold a custom post type called Portfolio"

> "Validate this PHP code for WordPress security issues"

> "Search the WordPress docs for register_post_type"

That's it! The AI will automatically call the right tools.

---

## Installation

```bash
# Option 1: npx (zero install — recommended)
npx -y @erayusta/wp-ai-toolkit

# Option 2: Global install
npm install -g @erayusta/wp-ai-toolkit

# Option 3: Build from source
git clone https://github.com/erayusta/wp-ai-toolkit.git
cd wp-ai-toolkit
npm install && npm run build
```

---

## Tools

### Dev Server — 11 Tools

<table>
<tr><td width="50%">

#### Documentation & Discovery

| Tool | What it does |
|:-----|:-------------|
| `learn_wordpress_api` | **Start here.** Creates session, loads API context |
| `search_docs` | Search developer.wordpress.org |
| `fetch_full_docs` | Get full doc page as markdown |
| `introspect_rest_api` | Explore REST endpoints + live site discovery |

</td><td>

#### Validation & Analysis

| Tool | What it does |
|:-----|:-------------|
| `validate_php` | Hooks, security, deprecated, anti-patterns |
| `validate_block_json` | block.json / theme.json schema checks |
| `validate_theme_template` | Template hierarchy, escaping, loop |
| `analyze_theme` | Full theme directory audit |
| `analyze_plugin` | Full plugin directory audit |

</td></tr>
<tr><td>

#### Scaffolding

| Tool | What it does |
|:-----|:-------------|
| `scaffold_component` | Generate 13 component types |

**Supported:** plugin, theme, block, custom-post-type, taxonomy, rest-endpoint, widget, shortcode, elementor-widget, meta-box, settings-page, cron-job, ajax-handler

</td><td>

#### Site Management

| Tool | What it does |
|:-----|:-------------|
| `manage_wp_site` | WP-CLI commands with safety checks |

**Safety:** Blocks `eval`, shell injection. Warns on `db drop`, `user delete`, `search-replace`. 30s timeout.

</td></tr>
</table>

### Storefront Server — 5 Tools

For WooCommerce store operations. Connects via WC REST API.

| Tool | What it does |
|:-----|:-------------|
| `search_products` | Search products with filters (category, price, stock) |
| `get_product_details` | Full product data by ID or slug |
| `get_orders` | Order listing with status filters |
| `get_store_info` | Settings, payment gateways, shipping zones |
| `get_store_stats` | Sales totals, top sellers, order counts |

```bash
# Add storefront server separately
claude mcp add wp-storefront node /path/to/wp-ai-toolkit/dist/storefront.js
```

---

## Skills

16 comprehensive instruction files that give AI agents deep WordPress expertise:

<table>
<tr>
<td width="33%">

**Core Development**
- `wp-rest-api` — Endpoints, auth, custom routes
- `wp-hooks` — Actions, filters, priority
- `wp-blocks` — block.json, attributes, supports
- `wp-gutenberg-components` — React, RichText, InnerBlocks
- `wp-custom-fields` — ACF, CMB2, native meta

</td>
<td width="33%">

**Theme & Plugin**
- `wp-themes` — Block vs classic, FSE, theme.json
- `wp-plugins` — Headers, settings API, CPTs
- `wp-page-builders` — Elementor, Divi, Beaver, WPBakery
- `wp-admin-ui` — Meta boxes, list tables, dashboards
- `wp-woocommerce` — Products, gateways, HPOS

</td>
<td width="34%">

**Infrastructure**
- `wp-security` — Escaping, nonces, roles, hardening
- `wp-performance` — Caching, query optimization
- `wp-multisite` — Network admin, shared tables
- `wp-cron-background` — WP-Cron, Action Scheduler
- `wp-seo-schema` — JSON-LD, Yoast, RankMath
- `wp-migrations-deploy` — DB migrations, Bedrock

</td>
</tr>
</table>

---

## MCP Configuration

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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
<summary><strong>Claude Code</strong></summary>

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
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json` in your project:

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

Add to your `settings.json`:

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

Uses the `gemini-extension.json` file included in the package root.
</details>

---

## Tool Reference

<details>
<summary><strong>learn_wordpress_api</strong> — Session bootstrap</summary>

Must be called before any other tool. Returns a `conversationId` for the session.

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `api` | string | Yes | `rest-api`, `hooks`, `blocks`, `themes`, `plugins`, `woocommerce`, `wp-cli`, `gutenberg`, `multisite`, `custom-fields` |
| `conversationId` | string | No | Existing session ID to add another API context |
</details>

<details>
<summary><strong>search_docs</strong> — Documentation search</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `query` | string | Yes | Search query (e.g., "register custom post type") |
| `conversationId` | string | Yes | Session ID |
| `category` | string | No | `reference`, `handbook`, `code-reference`, `plugins`, `themes`, `rest-api`, `block-editor`, `all` |
| `limit` | number | No | Max results 1-20 (default: 5) |
</details>

<details>
<summary><strong>validate_php</strong> — PHP code validation</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `code` | string | Yes | PHP code to validate |
| `conversationId` | string | Yes | Session ID |
| `context` | string | No | `plugin`, `theme`, `mu-plugin`, `functions-php`, `general` |
| `artifactId` | string | No | For re-validation tracking |
| `revision` | number | No | Revision number (default: 1) |

**Checks:** Hook mismatches, security (nonces, escaping, SQL injection), deprecated functions (30+), anti-patterns (`query_posts`, `extract`, direct cURL), function prefixing, absolute includes, plugin headers.
</details>

<details>
<summary><strong>validate_theme_template</strong> — Template validation</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `code` | string | Yes | Template PHP content |
| `conversationId` | string | Yes | Session ID |
| `templateType` | string | No | `index`, `single`, `page`, `archive`, `header`, `footer`, `functions`, `404`, `search`, etc. |
| `themeType` | string | No | `block`, `classic`, `hybrid` |

**Checks:** get_header/get_footer, wp_head/wp_footer, The Loop, wp_reset_postdata, output escaping, hardcoded scripts/styles, accessibility, wp_body_open.
</details>

<details>
<summary><strong>scaffold_component</strong> — Code generation</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `type` | string | Yes | Component type (see below) |
| `name` | string | Yes | Component name |
| `conversationId` | string | Yes | Session ID |
| `slug` | string | No | Custom slug override |
| `namespace` | string | No | PHP namespace/prefix |
| `description` | string | No | Component description |

**13 Types:** `plugin`, `theme`, `block`, `custom-post-type`, `taxonomy`, `rest-endpoint`, `widget`, `shortcode`, `elementor-widget`, `meta-box`, `settings-page`, `cron-job`, `ajax-handler`
</details>

<details>
<summary><strong>analyze_theme</strong> — Theme directory audit</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `themePath` | string | Yes | Absolute path to theme directory |
| `conversationId` | string | Yes | Session ID |

**Checks:** Required files, style.css headers, template hierarchy, theme.json validation, functions.php patterns, output escaping, translation-readiness, screenshot. Supports both block and classic themes.
</details>

<details>
<summary><strong>analyze_plugin</strong> — Plugin directory audit</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `pluginPath` | string | Yes | Absolute path to plugin directory |
| `conversationId` | string | Yes | Session ID |

**Checks:** Plugin header, ABSPATH check, security (escaping, sanitization, nonces, capabilities, prepared queries), uninstall cleanup, activation/deactivation hooks, translation functions, REST API permission callbacks, dangerous functions (eval, extract).
</details>

<details>
<summary><strong>introspect_rest_api</strong> — REST API explorer</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `query` | string | Yes | Search term (e.g., "posts", "media") |
| `conversationId` | string | Yes | Session ID |
| `namespace` | string | No | Filter by namespace (`wp/v2`, `wc/v3`) |
| `siteUrl` | string | No | Live site URL for real endpoint discovery |
| `method` | string | No | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
</details>

<details>
<summary><strong>manage_wp_site</strong> — WP-CLI bridge</summary>

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `command` | string | Yes | WP-CLI command without `wp` prefix |
| `conversationId` | string | Yes | Session ID |
| `wpPath` | string | No | WordPress installation path |
| `format` | string | No | `table`, `json`, `csv`, `yaml`, `count` |
</details>

---

## Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `WP_TOOLKIT_LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` — logs to stderr |

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode (tsx)
npm run build        # Compile TypeScript
npm test             # Run 106 tests
npm run lint         # ESLint check
npm run typecheck    # tsc --noEmit
```

### Project Structure

```
wp-ai-toolkit/
├── src/
│   ├── index.ts                    # Dev MCP server (11 tools)
│   ├── storefront.ts               # Storefront MCP server (5 tools)
│   ├── types.ts                    # Shared type definitions
│   ├── tools/                      # Tool implementations
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
│   │   └── analyze-plugin.ts
│   ├── data/                       # Built-in reference data
│   │   ├── wp-api-descriptions.ts
│   │   ├── wp-hooks-registry.ts
│   │   └── wp-rest-schema.ts
│   └── utils/
│       ├── conversation.ts
│       ├── http.ts
│       └── logger.ts
├── skills/                         # 16 agent skill files
├── tests/                          # 106 tests (Vitest)
├── examples/                       # MCP config examples
├── scripts/                        # Setup & install scripts
├── .claude-plugin/                 # Claude Code plugin
├── .cursor-plugin/                 # Cursor plugin
├── .codex-plugin/                  # Codex plugin
├── plugin.json                     # Plugin manifest
├── gemini-extension.json           # Gemini CLI extension
└── .github/workflows/              # CI/CD
```

---

## Platform Support

| Platform | Status | Config |
|:---------|:-------|:-------|
| Claude Code | Supported | `claude mcp add` or `.mcp.json` |
| Claude Desktop | Supported | `claude_desktop_config.json` |
| Cursor | Supported | `.cursor/mcp.json` |
| VS Code | Supported | `settings.json` |
| Gemini CLI | Supported | `gemini-extension.json` |
| Codex | Supported | `.codex-plugin/` |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run lint: `npm run lint`
6. Commit and push
7. Open a pull request

---

<p align="center">
  <strong>Built with</strong><br/>
  <a href="https://modelcontextprotocol.io">Model Context Protocol</a> &bull;
  <a href="https://www.typescriptlang.org">TypeScript</a> &bull;
  <a href="https://wordpress.org">WordPress</a>
</p>

<p align="center">
  <sub>MIT License &copy; 2025</sub>
</p>
