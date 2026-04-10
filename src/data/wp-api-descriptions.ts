/**
 * API descriptions and learning context for learn_wordpress_api tool.
 * Maps each WordPress API domain to detailed guidance for AI agents.
 */

import type { WordPressApi } from "../types.js";

export const API_DESCRIPTIONS: Record<WordPressApi, string> = {
  "rest-api": `# WordPress REST API

The WordPress REST API provides an interface for applications to interact with your WordPress site by sending and receiving data as JSON objects. It is the foundation for the WordPress Block Editor (Gutenberg) and can be used to create, read, update, and delete WordPress content from client-side JavaScript or from external applications.

## Key Concepts
- **Endpoints**: Functions mapped to HTTP methods (GET, POST, PUT, DELETE) at specific URL patterns
- **Routes**: URL patterns like \`/wp/v2/posts\` mapped to endpoint handlers  
- **Schema**: Each endpoint describes its arguments and response format in JSON Schema
- **Authentication**: Cookie auth (for logged-in users), Application Passwords, or OAuth
- **Namespaces**: Routes are organized by namespace (e.g., \`wp/v2\`, \`wc/v3\` for WooCommerce)

## Common Tasks
- Use \`introspect_rest_api\` to explore available endpoints and their parameters
- Use \`search_docs\` to find documentation about specific REST API features
- Use \`validate_php\` to validate custom REST API endpoint registration code

## Available Tools for REST API
- \`introspect_rest_api\` - Explore endpoint schemas, methods, and arguments
- \`search_docs\` - Search WordPress developer documentation
- \`fetch_full_docs\` - Retrieve complete documentation pages
- \`validate_php\` - Validate PHP code that registers custom endpoints`,

  hooks: `# WordPress Hooks (Actions & Filters)

WordPress hooks are the backbone of WordPress extensibility. They allow you to "hook into" WordPress at specific points and run your own code or modify data.

## Actions vs Filters
- **Actions**: Allow you to add or change WordPress functionality. They run at specific points during execution but do NOT return a value.
- **Filters**: Allow you to modify data. They MUST return a value (the filtered data).

## Key Concepts
- \`add_action( 'hook_name', 'callback', priority, accepted_args )\`
- \`add_filter( 'hook_name', 'callback', priority, accepted_args )\`
- \`do_action( 'hook_name', ...args )\` — triggers an action
- \`apply_filters( 'hook_name', $value, ...args )\` — applies filters to a value
- **Priority**: Lower numbers = earlier execution (default: 10)
- **Dynamic hooks**: Some hooks include variable parts like \`save_post_{post_type}\`

## Available Tools for Hooks
- \`introspect_rest_api\` with query about hooks to see hook-related endpoints
- \`search_docs\` - Search for specific hooks and their documentation
- \`validate_php\` - Validate PHP code using hooks (checks for common mistakes)`,

  blocks: `# WordPress Block Development (Gutenberg)

Blocks are the fundamental elements of the WordPress Block Editor. Each piece of content in the editor is a block: paragraphs, headings, images, galleries, and all other content.

## Key Concepts
- **block.json**: The metadata file that defines a block's properties, attributes, and scripts
- **Edit Component**: React component rendered in the editor
- **Save Component**: Function returning the static HTML saved to the database
- **Block Attributes**: The data model for a block, defined in block.json
- **Block Supports**: Features a block can opt into (color, typography, spacing, etc.)
- **InnerBlocks**: Nested blocks within a parent block
- **Block Variations**: Predefined block configurations

## File Structure
\`\`\`
my-block/
├── block.json          # Block metadata (required)
├── index.js            # Block registration
├── edit.js             # Editor component
├── save.js             # Frontend output
├── style.css           # Styles (front + editor)
├── editor.css          # Editor-only styles
└── render.php          # Dynamic block server-side render
\`\`\`

## Available Tools for Blocks
- \`validate_block_json\` - Validate block.json files against the schema
- \`search_docs\` - Search for block development documentation
- \`validate_php\` - Validate PHP block registration code`,

  themes: `# WordPress Theme Development

Themes control the visual presentation of a WordPress site. Modern WordPress supports both Classic Themes and Block Themes (Full Site Editing).

## Block Themes (FSE)
- Use HTML template files with block markup
- Controlled by \`theme.json\` for global styles and settings
- Templates and template parts are editable in the Site Editor
- Support the Template Hierarchy

## Classic Themes
- Use PHP template files
- Use \`functions.php\` for theme setup
- Template tags and the Loop
- Widget areas and navigation menus

## Key Files
- \`style.css\` — Theme metadata header (required)
- \`theme.json\` — Global settings and styles (block themes)
- \`functions.php\` — Theme functions and feature registration
- \`templates/\` — Block templates (block themes)
- \`parts/\` — Block template parts (block themes)

## Available Tools for Themes
- \`search_docs\` - Search theme development documentation
- \`validate_php\` - Validate theme PHP code
- \`validate_block_json\` - Validate theme.json structure`,

  plugins: `# WordPress Plugin Development

Plugins extend and customize WordPress functionality. They can add features, modify behavior, integrate with external services, and more.

## Key Concepts
- **Plugin Header**: Required comment block in the main plugin file
- **Activation/Deactivation Hooks**: Run code when plugin is activated/deactivated
- **Uninstall Hook**: Clean up data when plugin is deleted
- **Settings API**: Register and render settings pages
- **Custom Post Types**: Register new content types
- **Custom Taxonomies**: Register new classification systems
- **Shortcodes**: Create reusable content snippets
- **Admin Pages**: Add custom admin interface pages

## Plugin Structure
\`\`\`
my-plugin/
├── my-plugin.php       # Main plugin file (required)
├── includes/           # PHP classes and functions
├── admin/              # Admin-specific code
├── public/             # Frontend-specific code
├── languages/          # Translation files
├── assets/             # CSS, JS, images
└── uninstall.php       # Cleanup on deletion
\`\`\`

## Available Tools for Plugins
- \`search_docs\` - Search plugin development documentation
- \`validate_php\` - Validate plugin PHP code
- \`manage_wp_site\` - Install, activate, deactivate plugins via WP-CLI`,

  woocommerce: `# WooCommerce Development

WooCommerce is the most popular WordPress e-commerce plugin. It provides a complete e-commerce solution with products, orders, payments, shipping, and more.

## Key Concepts
- **WC REST API**: Extended REST API under \`wc/v3\` namespace
- **Products**: Simple, Variable, Grouped, External product types
- **Orders**: Order lifecycle management, statuses, and metadata
- **Payment Gateways**: Custom payment integrations
- **Shipping Methods**: Custom shipping calculations
- **WooCommerce Hooks**: Hundreds of specific action and filter hooks
- **HPOS**: High-Performance Order Storage (replaces legacy post-based storage)
- **WooCommerce Blocks**: Checkout and Cart blocks

## Available Tools for WooCommerce
- \`introspect_rest_api\` - Explore WooCommerce REST endpoints (wc/v3 namespace)
- \`search_docs\` - Search WooCommerce developer documentation
- \`validate_php\` - Validate WooCommerce-specific PHP code`,

  "wp-cli": `# WP-CLI (WordPress Command Line Interface)

WP-CLI is the official command-line tool for managing WordPress installations. It provides commands for every action you'd perform in the WordPress admin.

## Key Commands
- \`wp core\` — Download, install, update WordPress core
- \`wp plugin\` — Manage plugins (install, activate, deactivate, update, delete)
- \`wp theme\` — Manage themes
- \`wp post\` — Manage posts and custom post types
- \`wp user\` — Manage users
- \`wp option\` — Manage options
- \`wp db\` — Database operations (export, import, query)
- \`wp search-replace\` — Search and replace in the database
- \`wp cron\` — Manage WordPress cron events
- \`wp scaffold\` — Generate boilerplate code (plugin, theme, block, etc.)
- \`wp rewrite\` — Manage rewrite rules

## Available Tools for WP-CLI
- \`manage_wp_site\` — Execute WP-CLI commands against a WordPress installation
- \`search_docs\` — Search WP-CLI documentation`,

  gutenberg: `# Gutenberg (Block Editor) Development

Gutenberg is the code name for the WordPress Block Editor project. It encompasses the editor itself, full site editing, and the block-based approach to WordPress content and customization.

## Key Concepts
- **Block Editor**: The React-based content editor
- **Site Editor**: Full site editing interface for block themes
- **@wordpress packages**: NPM packages providing editor functionality
- **SlotFill**: System for extending the editor UI
- **Block Controls**: Toolbar and inspector controls for blocks
- **Data Stores**: Redux-based state management (@wordpress/data)
- **Rich Text**: API for handling rich text editing

## Important Packages
- \`@wordpress/blocks\` — Block registration and management
- \`@wordpress/block-editor\` — Block editor components
- \`@wordpress/components\` — Reusable UI components
- \`@wordpress/data\` — State management
- \`@wordpress/element\` — React abstraction layer
- \`@wordpress/hooks\` — JavaScript hooks API
- \`@wordpress/i18n\` — Internationalization

## Available Tools for Gutenberg
- \`validate_block_json\` — Validate block.json metadata
- \`search_docs\` — Search Gutenberg development documentation`,

  multisite: `# WordPress Multisite

WordPress Multisite allows you to run a network of sites from a single WordPress installation. Each site shares the same WordPress core files, plugins, and themes but has its own database tables for content.

## Key Concepts
- **Network**: The overall multisite installation
- **Sites**: Individual sites within the network
- **Network Admin**: Administration panel for the entire network
- **Super Admin**: User role with full network permissions
- **Domain Mapping**: Custom domains for individual sites
- **Network-wide Plugins**: Plugins activated across all sites

## Key Functions
- \`is_multisite()\` — Check if multisite is enabled
- \`get_sites()\` — Retrieve sites in the network
- \`switch_to_blog()\` — Switch context to another site
- \`restore_current_blog()\` — Restore original site context
- \`get_network_option()\` / \`update_network_option()\` — Network-level options

## Available Tools for Multisite
- \`search_docs\` — Search multisite documentation
- \`validate_php\` — Validate multisite-specific PHP code
- \`manage_wp_site\` — WP-CLI multisite commands`,

  "custom-fields": `# WordPress Custom Fields & Meta

Custom fields (post meta, user meta, term meta, comment meta) allow you to store additional data associated with WordPress objects.

## Key Concepts
- **Post Meta**: Additional data attached to posts/pages/CPTs
- **User Meta**: Additional data attached to users
- **Term Meta**: Additional data attached to taxonomy terms
- **Options API**: Site-wide key-value storage
- **Metadata API**: Unified API for all meta types
- **Meta Boxes**: Custom UI sections in the editor
- **Custom Fields in REST API**: Registering meta for REST API exposure

## Key Functions
- \`register_meta()\` — Register meta with schema and REST visibility
- \`get_post_meta()\` / \`update_post_meta()\` / \`delete_post_meta()\`
- \`get_user_meta()\` / \`update_user_meta()\` / \`delete_user_meta()\`
- \`register_post_meta()\` — Register meta specifically for a post type

## Available Tools for Custom Fields
- \`search_docs\` — Search custom fields documentation
- \`validate_php\` — Validate meta registration and usage code
- \`introspect_rest_api\` — Explore meta endpoints in REST API`,
};
