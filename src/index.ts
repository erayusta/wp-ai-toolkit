#!/usr/bin/env node

/**
 * WordPress AI Toolkit — MCP Server
 *
 * Connects AI tools (Claude Code, Cursor, VS Code, Gemini CLI, Codex) to the
 * WordPress platform via the Model Context Protocol.
 *
 * Provides:
 * - Documentation search (developer.wordpress.org)
 * - REST API introspection
 * - PHP code validation (hooks, security, best practices)
 * - Block.json / theme.json validation
 * - WP-CLI site management
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "./utils/logger.js";
import { pruneConversations } from "./utils/conversation.js";
import {
  learnWordPressApiSchema,
  learnWordPressApi,
  searchDocsSchema,
  searchDocs,
  fetchFullDocsSchema,
  fetchFullDocs,
  introspectRestApiSchema,
  introspectRestApi,
  validatePhpSchema,
  validatePhp,
  validateBlockJsonSchema,
  validateBlockJsonTool,
  manageWpSiteSchema,
  manageWpSite,
  validateThemeTemplateSchema,
  validateThemeTemplate,
  scaffoldComponentSchema,
  scaffoldComponent,
  analyzeThemeSchema,
  analyzeTheme,
  analyzePluginSchema,
  analyzePlugin,
  analyzeContentSeoSchema,
  analyzeContentSeo,
  publishToWordPressSchema,
  publishToWordPress,
  analyzeCompetitorsSchema,
  analyzeCompetitors,
  scoreContentQualitySchema,
  scoreContentQuality,
  debugWordPressSchema,
  debugWordPress,
  checkSiteHealthSchema,
  checkSiteHealth,
  analyzeDatabaseSchema,
  analyzeDatabase,
} from "./tools/index.js";

// ---------------------------------------------------------------------------
// Server Setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "wp-ai-toolkit",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool Registration
// ---------------------------------------------------------------------------

server.tool(
  "learn_wordpress_api",
  `🚨 MANDATORY FIRST STEP: Call this tool BEFORE any other WordPress tool.
Returns a conversationId required for all subsequent tool calls.
Call multiple times with the same conversationId to load different API contexts.
Valid APIs: rest-api, hooks, blocks, themes, plugins, woocommerce, wp-cli, gutenberg, multisite, custom-fields.`,
  learnWordPressApiSchema.shape,
  async (params) => {
    const input = learnWordPressApiSchema.parse(params);
    return learnWordPressApi(input);
  }
);

server.tool(
  "search_docs",
  `Search WordPress developer documentation (developer.wordpress.org).
Returns relevant documentation chunks with titles, URLs, and content summaries.
Use specific search terms for best results. Categories: reference, handbook, code-reference, plugins, themes, rest-api, block-editor, all.`,
  searchDocsSchema.shape,
  async (params) => {
    const input = searchDocsSchema.parse(params);
    return searchDocs(input);
  }
);

server.tool(
  "fetch_full_docs",
  `Retrieve a complete documentation page from developer.wordpress.org.
Use this after finding relevant URLs via search_docs to get the full content.
Converts HTML to readable markdown format.`,
  fetchFullDocsSchema.shape,
  async (params) => {
    const input = fetchFullDocsSchema.parse(params);
    return fetchFullDocs(input);
  }
);

server.tool(
  "introspect_rest_api",
  `Explore WordPress REST API endpoints and their schemas.
Search for endpoints by name, description, or HTTP method.
Works with built-in schema reference or optionally with a live WordPress site via siteUrl parameter.
Use this to discover available endpoints, their arguments, and response schemas.`,
  introspectRestApiSchema.shape,
  async (params) => {
    const input = introspectRestApiSchema.parse(params);
    return introspectRestApi(input);
  }
);

server.tool(
  "validate_php",
  `Validate PHP code against WordPress coding standards and best practices.
Checks for: correct hook usage, security issues (nonces, escaping, sanitization),
deprecated functions, common anti-patterns, proper function prefixing.
Context options: plugin, theme, mu-plugin, functions-php, general.`,
  validatePhpSchema.shape,
  async (params) => {
    const input = validatePhpSchema.parse(params);
    return validatePhp(input);
  }
);

server.tool(
  "validate_block_json",
  `Validate block.json or theme.json files against WordPress schemas.
Checks required fields, valid values, attribute definitions, supports features, and common mistakes.
Type: 'block' for block.json, 'theme' for theme.json.`,
  validateBlockJsonSchema.shape,
  async (params) => {
    const input = validateBlockJsonSchema.parse(params);
    return validateBlockJsonTool(input);
  }
);

server.tool(
  "manage_wp_site",
  `Execute WP-CLI commands against a WordPress installation.
Provides site management: posts, pages, plugins, themes, users, options, database, scaffolding, cron, rewrite rules.
Requires WP-CLI to be installed. Dangerous commands (db drop, user delete, etc.) require manual execution.
Do NOT include the 'wp' prefix in the command.`,
  manageWpSiteSchema.shape,
  async (params) => {
    const input = manageWpSiteSchema.parse(params);
    return manageWpSite(input);
  }
);

server.tool(
  "validate_theme_template",
  `Validate a PHP theme template file against WordPress best practices.
Checks for: get_header/get_footer, wp_head/wp_footer, The Loop, output escaping,
hardcoded scripts/styles, accessibility, template hierarchy compliance.
Template types: index, single, page, archive, category, tag, search, 404, header, footer, sidebar, functions, etc.
Theme types: block, classic, hybrid.`,
  validateThemeTemplateSchema.shape,
  async (params) => {
    const input = validateThemeTemplateSchema.parse(params);
    return validateThemeTemplate(input);
  }
);

server.tool(
  "scaffold_component",
  `Generate boilerplate code for WordPress components.
Types: plugin, theme, block, custom-post-type, taxonomy, rest-endpoint,
widget, shortcode, elementor-widget, meta-box, settings-page, cron-job, ajax-handler.
Returns ready-to-use code with proper WordPress patterns, security, and i18n.`,
  scaffoldComponentSchema.shape,
  async (params) => {
    const input = scaffoldComponentSchema.parse(params);
    return scaffoldComponent(input);
  }
);

server.tool(
  "analyze_theme",
  `Analyze a WordPress theme directory for best practices and issues.
Checks: required files, style.css headers, template hierarchy, theme.json,
functions.php patterns, escaping, translation-readiness, screenshot.
Works with both block (FSE) and classic themes.`,
  analyzeThemeSchema.shape,
  async (params) => {
    const input = analyzeThemeSchema.parse(params);
    return analyzeTheme(input);
  }
);

server.tool(
  "analyze_plugin",
  `Analyze a WordPress plugin directory for best practices and issues.
Checks: plugin header, security (escaping, sanitization, nonces, capabilities),
uninstall cleanup, activation/deactivation hooks, translation-readiness,
REST API permission callbacks, dangerous function usage.`,
  analyzePluginSchema.shape,
  async (params) => {
    const input = analyzePluginSchema.parse(params);
    return analyzePlugin(input);
  }
);

server.tool(
  "analyze_content_seo",
  `Analyze content for SEO quality: readability score, keyword density, heading structure,
meta tag length, internal/external links, images, and overall SEO score (0-100).
Provide targetKeyword for keyword analysis, metaTitle and metaDescription for meta tag validation.`,
  analyzeContentSeoSchema.shape,
  async (params) => {
    const input = analyzeContentSeoSchema.parse(params);
    return analyzeContentSeo(input);
  }
);

server.tool(
  "publish_to_wordpress",
  `Publish or update content on WordPress via REST API.
Supports posts, pages, and custom post types. Includes Yoast SEO metadata (title, description, focus keyword).
Requires WordPress Application Password for authentication. Defaults to 'draft' status for safety.`,
  publishToWordPressSchema.shape,
  async (params) => {
    const input = publishToWordPressSchema.parse(params);
    return publishToWordPress(input);
  }
);

server.tool(
  "analyze_competitors",
  `Analyze a competitor WordPress site: detect theme, plugins, technology stack,
REST API endpoints, WooCommerce/Yoast/Elementor usage, and security indicators.
Works by inspecting publicly accessible HTML and REST API discovery endpoint.`,
  analyzeCompetitorsSchema.shape,
  async (params) => {
    const input = analyzeCompetitorsSchema.parse(params);
    return analyzeCompetitors(input);
  }
);

server.tool(
  "score_content_quality",
  `Score content quality across 5 dimensions: humanity (AI pattern detection),
specificity (data/examples), structure (headings/lists), engagement (questions/pronouns),
and completeness. Returns 0-100 score with detailed breakdown and recommendations.`,
  scoreContentQualitySchema.shape,
  async (params) => {
    const input = scoreContentQualitySchema.parse(params);
    return scoreContentQuality(input);
  }
);

server.tool(
  "debug_wordpress",
  `Debug and troubleshoot a WordPress installation.
Actions: status (debug constants, PHP version, log size), errors (read debug.log),
config (check wp-config.php constants), health (verify checksums, check DB, cron),
conflicts (list plugins for conflict detection).`,
  debugWordPressSchema.shape,
  async (params) => {
    const input = debugWordPressSchema.parse(params);
    return debugWordPress(input);
  }
);

server.tool(
  "check_site_health",
  `Comprehensive WordPress site health report.
Checks: core integrity (verify-checksums), PHP version, database health, plugin/theme updates,
WP-Cron, HTTPS, URL consistency, permalinks. Returns a 0-100 health score.`,
  checkSiteHealthSchema.shape,
  async (params) => {
    const input = checkSiteHealthSchema.parse(params);
    return checkSiteHealth(input);
  }
);

server.tool(
  "analyze_database",
  `Analyze WordPress database health and bloat.
Checks: table sizes, post revisions, orphaned postmeta, spam/trash comments,
transients, autoloaded options size. Returns cleanup recommendations with commands.`,
  analyzeDatabaseSchema.shape,
  async (params) => {
    const input = analyzeDatabaseSchema.parse(params);
    return analyzeDatabase(input);
  }
);

// ---------------------------------------------------------------------------
// Periodic Cleanup
// ---------------------------------------------------------------------------

setInterval(() => {
  pruneConversations();
}, 15 * 60 * 1000); // Every 15 minutes

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  logger.info("Starting WordPress AI Toolkit MCP Server v1.0.0");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("MCP Server connected and ready");
}

main().catch((error) => {
  logger.error("Fatal error starting MCP server", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
