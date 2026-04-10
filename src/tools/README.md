# Tools Reference

> 18 dev tools + 5 storefront tools for WordPress development and e-commerce.

## Dev Server Tools (18)

### Documentation & Discovery

| Tool | Description | Example |
|:-----|:------------|:--------|
| [`learn_wordpress_api`](learn-wordpress-api.ts) | Session bootstrap — load API context | `learn_wordpress_api({ api: "rest-api" })` |
| [`search_docs`](search-docs.ts) | Search developer.wordpress.org | `search_docs({ query: "register_post_type", conversationId: "..." })` |
| [`fetch_full_docs`](fetch-full-docs.ts) | Get full doc page as markdown | `fetch_full_docs({ url: "https://developer.wordpress.org/reference/functions/wp_query/", conversationId: "..." })` |
| [`introspect_rest_api`](introspect-rest-api.ts) | Explore REST endpoints | `introspect_rest_api({ query: "posts", siteUrl: "http://wordpress.test", conversationId: "..." })` |

### Validation

| Tool | Description | Example |
|:-----|:------------|:--------|
| [`validate_php`](validate-php.ts) | PHP code validation | `validate_php({ code: "<?php echo $_GET['x'];", context: "plugin", conversationId: "..." })` |
| [`validate_block_json`](validate-block-json.ts) | block.json / theme.json | `validate_block_json({ json: '{"name":"my/block"}', type: "block", conversationId: "..." })` |
| [`validate_theme_template`](validate-theme-template.ts) | Template file validation | `validate_theme_template({ code: "<?php get_header(); ...", templateType: "single", conversationId: "..." })` |

### Analysis & SEO

| Tool | Description | Example |
|:-----|:------------|:--------|
| [`analyze_theme`](analyze-theme.ts) | Theme directory audit | `analyze_theme({ themePath: "/path/to/themes/flavor", conversationId: "..." })` |
| [`analyze_plugin`](analyze-plugin.ts) | Plugin directory audit | `analyze_plugin({ pluginPath: "/path/to/plugins/my-plugin", conversationId: "..." })` |
| [`analyze_content_seo`](analyze-content-seo.ts) | SEO scoring (0-100) | `analyze_content_seo({ content: "<h1>Title</h1>...", targetKeyword: "wordpress seo", conversationId: "..." })` |
| [`analyze_competitors`](analyze-competitors.ts) | Competitor site detection | `analyze_competitors({ url: "https://competitor.com", conversationId: "..." })` |
| [`analyze_database`](analyze-database.ts) | Database health & bloat | `analyze_database({ wpPath: "/path/to/wordpress", conversationId: "..." })` |
| [`score_content_quality`](score-content-quality.ts) | 5-dimension quality score | `score_content_quality({ content: "...", contentType: "blog-post", conversationId: "..." })` |

### Diagnostics

| Tool | Description | Example |
|:-----|:------------|:--------|
| [`debug_wordpress`](debug-wordpress.ts) | Debug log, config, health | `debug_wordpress({ wpPath: "/path/to/wordpress", action: "errors", conversationId: "..." })` |
| [`check_site_health`](check-site-health.ts) | Health score (0-100) | `check_site_health({ wpPath: "/path/to/wordpress", conversationId: "..." })` |

### Actions

| Tool | Description | Example |
|:-----|:------------|:--------|
| [`manage_wp_site`](manage-wp-site.ts) | WP-CLI bridge | `manage_wp_site({ command: "plugin list", wpPath: "/path/to/wordpress", conversationId: "..." })` |
| [`scaffold_component`](scaffold-component.ts) | Generate 13 types | `scaffold_component({ type: "plugin", name: "My Plugin", conversationId: "..." })` |
| [`publish_to_wordpress`](publish-to-wordpress.ts) | REST API publish + SEO | `publish_to_wordpress({ siteUrl: "http://wordpress.test", title: "My Post", content: "<p>...</p>", seoTitle: "...", conversationId: "..." })` |

## Storefront Server Tools (5)

Defined in [`../storefront.ts`](../storefront.ts):

| Tool | Description | Example |
|:-----|:------------|:--------|
| `search_products` | WooCommerce product search | `search_products({ siteUrl: "http://wordpress.test", query: "shirt", inStock: true })` |
| `get_product_details` | Product by ID/slug | `get_product_details({ siteUrl: "http://wordpress.test", productId: 42 })` |
| `get_orders` | Order listing | `get_orders({ siteUrl: "http://wordpress.test", status: "processing", consumerKey: "...", consumerSecret: "..." })` |
| `get_store_info` | Store settings | `get_store_info({ siteUrl: "http://wordpress.test", consumerKey: "...", consumerSecret: "..." })` |
| `get_store_stats` | Sales reports | `get_store_stats({ siteUrl: "http://wordpress.test", period: "month", consumerKey: "...", consumerSecret: "..." })` |

## Live Testing

Test all tools against a local WordPress site:

```bash
# Ensure WP-CLI works
wp --path=/Users/erayusta/code/wordpress core version

# Add MCP server
claude mcp add wp-ai-toolkit node /Users/erayusta/code/wp-ai-toolkit/dist/index.js

# Start Claude Code and ask:
# "Run a site health check on /Users/erayusta/code/wordpress"
# "Analyze the database of my WordPress site"
# "Debug wordpress — show me the last 20 errors"
```

---

*Part of [WordPress AI Toolkit](../../README.md)*
