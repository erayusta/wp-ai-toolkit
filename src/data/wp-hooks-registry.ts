/**
 * Built-in WordPress hooks registry with the most commonly used actions and filters.
 * This serves as a local knowledge base for PHP validation and hook lookup.
 */

import type { HookDefinition } from "../types.js";

export const WP_ACTIONS: HookDefinition[] = [
  {
    name: "init",
    type: "action",
    description: "Fires after WordPress has finished loading but before any headers are sent. Most of WP is loaded at this stage.",
    parameters: [],
    since: "1.5.0",
  },
  {
    name: "wp_enqueue_scripts",
    type: "action",
    description: "Fires when scripts and styles are enqueued for the front-end.",
    parameters: [],
    since: "2.8.0",
  },
  {
    name: "admin_enqueue_scripts",
    type: "action",
    description: "Fires when scripts and styles are enqueued for the admin area.",
    parameters: [{ name: "hook_suffix", type: "string", description: "The current admin page hook suffix." }],
    since: "2.8.0",
  },
  {
    name: "admin_menu",
    type: "action",
    description: "Fires before the administration menu loads in the admin.",
    parameters: [],
    since: "1.5.0",
  },
  {
    name: "admin_init",
    type: "action",
    description: "Fires as an admin screen or script is being initialized. Triggered before any other hook when a user accesses the admin area.",
    parameters: [],
    since: "2.5.0",
  },
  {
    name: "wp_head",
    type: "action",
    description: "Fires within the <head> section of the theme template.",
    parameters: [],
    since: "1.5.0",
  },
  {
    name: "wp_footer",
    type: "action",
    description: "Fires before the closing </body> tag in the theme template.",
    parameters: [],
    since: "1.5.1",
  },
  {
    name: "save_post",
    type: "action",
    description: "Fires once a post has been saved. The dynamic portion of the hook name, `$post->post_type`, refers to the post type slug.",
    parameters: [
      { name: "post_id", type: "int", description: "Post ID." },
      { name: "post", type: "WP_Post", description: "Post object." },
      { name: "update", type: "bool", description: "Whether this is an existing post being updated." },
    ],
    since: "1.5.0",
  },
  {
    name: "pre_get_posts",
    type: "action",
    description: "Fires after the query variable object is created, but before the actual query is run.",
    parameters: [{ name: "query", type: "WP_Query", description: "The WP_Query instance (passed by reference)." }],
    since: "2.0.0",
  },
  {
    name: "wp_ajax_{action}",
    type: "action",
    description: "Fires authenticated Ajax actions for logged-in users. Replace {action} with your action name.",
    parameters: [],
    since: "2.1.0",
  },
  {
    name: "wp_ajax_nopriv_{action}",
    type: "action",
    description: "Fires non-authenticated Ajax actions for logged-out users. Replace {action} with your action name.",
    parameters: [],
    since: "2.8.0",
  },
  {
    name: "rest_api_init",
    type: "action",
    description: "Fires when preparing to serve a REST API request. Use this hook to register REST routes.",
    parameters: [{ name: "wp_rest_server", type: "WP_REST_Server", description: "Server object." }],
    since: "4.4.0",
  },
  {
    name: "widgets_init",
    type: "action",
    description: "Fires after all default WordPress widgets have been registered.",
    parameters: [],
    since: "2.2.0",
  },
  {
    name: "after_setup_theme",
    type: "action",
    description: "Fires after the theme is loaded. Used to setup theme defaults and register support for various WordPress features.",
    parameters: [],
    since: "3.0.0",
  },
  {
    name: "template_redirect",
    type: "action",
    description: "Fires before determining which template to load. Useful for redirecting before the template is loaded.",
    parameters: [],
    since: "1.5.0",
  },
  {
    name: "wp_loaded",
    type: "action",
    description: "Fires once WordPress, all plugins, and the theme are fully loaded and instantiated.",
    parameters: [],
    since: "3.0.0",
  },
  {
    name: "activate_{plugin}",
    type: "action",
    description: "Fires when a plugin is activated. Replace {plugin} with plugin file path.",
    parameters: [{ name: "network_wide", type: "bool", description: "Whether to enable the plugin for all sites in the network." }],
    since: "2.0.0",
  },
  {
    name: "deactivate_{plugin}",
    type: "action",
    description: "Fires when a plugin is deactivated. Replace {plugin} with plugin file path.",
    parameters: [{ name: "network_wide", type: "bool", description: "Whether the plugin was deactivated for the entire network." }],
    since: "2.0.0",
  },
  {
    name: "register_post_type",
    type: "action",
    description: "Fires after a post type is registered.",
    parameters: [
      { name: "post_type", type: "string", description: "Post type." },
      { name: "post_type_object", type: "WP_Post_Type", description: "Arguments used to register the post type." },
    ],
    since: "3.3.0",
  },
  {
    name: "wp_login",
    type: "action",
    description: "Fires after the user has successfully logged in.",
    parameters: [
      { name: "user_login", type: "string", description: "Username." },
      { name: "user", type: "WP_User", description: "WP_User object of the logged-in user." },
    ],
    since: "1.2.0",
  },
];

export const WP_FILTERS: HookDefinition[] = [
  {
    name: "the_content",
    type: "filter",
    description: "Filters the post content.",
    parameters: [{ name: "content", type: "string", description: "Content of the current post." }],
    since: "0.71",
  },
  {
    name: "the_title",
    type: "filter",
    description: "Filters the post title.",
    parameters: [
      { name: "title", type: "string", description: "The post title." },
      { name: "id", type: "int", description: "The post ID." },
    ],
    since: "0.71",
  },
  {
    name: "the_excerpt",
    type: "filter",
    description: "Filters the displayed post excerpt.",
    parameters: [{ name: "post_excerpt", type: "string", description: "The post excerpt." }],
    since: "0.71",
  },
  {
    name: "body_class",
    type: "filter",
    description: "Filters the list of CSS body class names for the current post or page.",
    parameters: [
      { name: "classes", type: "string[]", description: "An array of body class names." },
      { name: "css_class", type: "string[]", description: "An array of additional class names added to the body." },
    ],
    since: "2.8.0",
  },
  {
    name: "wp_nav_menu_items",
    type: "filter",
    description: "Filters the HTML list content for navigation menus.",
    parameters: [
      { name: "items", type: "string", description: "The HTML list content for the menu items." },
      { name: "args", type: "stdClass", description: "An object containing wp_nav_menu() arguments." },
    ],
    since: "3.0.0",
  },
  {
    name: "query_vars",
    type: "filter",
    description: "Filters the query variables allowed before processing.",
    parameters: [{ name: "public_query_vars", type: "string[]", description: "The array of allowed query variable names." }],
    since: "1.5.0",
  },
  {
    name: "posts_where",
    type: "filter",
    description: "Filters the WHERE clause of the query.",
    parameters: [
      { name: "where", type: "string", description: "The WHERE clause of the query." },
      { name: "query", type: "WP_Query", description: "The WP_Query instance." },
    ],
    since: "1.5.0",
  },
  {
    name: "plugin_action_links_{plugin_file}",
    type: "filter",
    description: "Filters the action links displayed for each plugin in the Plugins list table.",
    parameters: [
      { name: "actions", type: "string[]", description: "An array of plugin action links." },
      { name: "plugin_file", type: "string", description: "Path to the plugin file relative to the plugins directory." },
      { name: "plugin_data", type: "array", description: "An array of plugin data." },
      { name: "context", type: "string", description: "The plugin context." },
    ],
    since: "2.7.0",
  },
  {
    name: "upload_mimes",
    type: "filter",
    description: "Filters the list of allowed mime types and file extensions.",
    parameters: [{ name: "mimes", type: "array", description: "Array of mime types keyed by the file extension regex." }],
    since: "2.0.0",
  },
  {
    name: "authenticate",
    type: "filter",
    description: "Filters whether the user is authenticated. Allows custom authentication methods.",
    parameters: [
      { name: "user", type: "WP_User|WP_Error|null", description: "WP_User or WP_Error object if a previous callback has authenticated the user." },
      { name: "username", type: "string", description: "Username or email address." },
      { name: "password", type: "string", description: "User password." },
    ],
    since: "2.8.0",
  },
  {
    name: "wp_mail",
    type: "filter",
    description: "Filters the wp_mail() arguments.",
    parameters: [{ name: "args", type: "array", description: "Array of the `wp_mail()` arguments." }],
    since: "2.2.0",
  },
  {
    name: "login_redirect",
    type: "filter",
    description: "Filters the login redirect URL.",
    parameters: [
      { name: "redirect_to", type: "string", description: "The redirect destination URL." },
      { name: "requested_redirect_to", type: "string", description: "The requested redirect destination URL." },
      { name: "user", type: "WP_User|WP_Error", description: "WP_User object if login was successful, WP_Error object otherwise." },
    ],
    since: "3.0.0",
  },
  {
    name: "manage_posts_columns",
    type: "filter",
    description: "Filters the columns displayed in the Posts list table.",
    parameters: [{ name: "columns", type: "string[]", description: "An associative array of column headings." }],
    since: "1.5.0",
  },
  {
    name: "cron_schedules",
    type: "filter",
    description: "Filters the non-default cron schedules.",
    parameters: [{ name: "new_schedules", type: "array", description: "An array of non-default cron schedules." }],
    since: "2.1.0",
  },
  {
    name: "excerpt_length",
    type: "filter",
    description: "Filters the maximum number of words in a post excerpt.",
    parameters: [{ name: "number", type: "int", description: "The maximum number of words. Default 55." }],
    since: "2.7.0",
  },
];

export const ALL_HOOKS: HookDefinition[] = [...WP_ACTIONS, ...WP_FILTERS];

/**
 * Search hooks by name or description.
 */
export function searchHooks(query: string, type?: "action" | "filter"): HookDefinition[] {
  const lowerQuery = query.toLowerCase();
  let hooks = ALL_HOOKS;

  if (type) {
    hooks = hooks.filter((h) => h.type === type);
  }

  return hooks.filter(
    (h) =>
      h.name.toLowerCase().includes(lowerQuery) ||
      h.description.toLowerCase().includes(lowerQuery)
  );
}
