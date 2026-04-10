/**
 * Built-in WordPress REST API schema reference.
 * Contains core endpoints, their methods, and argument definitions.
 */

import type { RestEndpoint } from "../types.js";

export const WP_REST_ENDPOINTS: RestEndpoint[] = [
  // Posts
  {
    namespace: "wp/v2",
    route: "/wp/v2/posts",
    methods: ["GET", "POST"],
    description: "Retrieve or create posts.",
    args: {
      context: { type: "string", description: "Scope under which the request is made; determines fields present in response.", required: false, enum: ["view", "embed", "edit"] },
      page: { type: "integer", description: "Current page of the collection.", required: false, default: 1 },
      per_page: { type: "integer", description: "Maximum number of items to be returned in result set.", required: false, default: 10 },
      search: { type: "string", description: "Limit results to those matching a string.", required: false },
      status: { type: "string", description: "Limit result set to posts assigned one or more statuses.", required: false, default: "publish" },
      categories: { type: "array", description: "Limit result set to items with specific terms assigned in the categories taxonomy.", required: false },
      tags: { type: "array", description: "Limit result set to items with specific terms assigned in the tags taxonomy.", required: false },
      orderby: { type: "string", description: "Sort collection by post attribute.", required: false, enum: ["author", "date", "id", "include", "modified", "parent", "relevance", "slug", "include_slugs", "title"] },
      order: { type: "string", description: "Order sort attribute ascending or descending.", required: false, enum: ["asc", "desc"] },
    },
  },
  {
    namespace: "wp/v2",
    route: "/wp/v2/posts/<id>",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    description: "Retrieve, update, or delete a specific post.",
    args: {
      id: { type: "integer", description: "Unique identifier for the post.", required: true },
      force: { type: "boolean", description: "Whether to bypass Trash and force deletion.", required: false, default: false },
    },
  },
  // Pages
  {
    namespace: "wp/v2",
    route: "/wp/v2/pages",
    methods: ["GET", "POST"],
    description: "Retrieve or create pages.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false, enum: ["view", "embed", "edit"] },
      page: { type: "integer", description: "Current page of the collection.", required: false, default: 1 },
      per_page: { type: "integer", description: "Maximum number of items to be returned.", required: false, default: 10 },
      search: { type: "string", description: "Limit results to those matching a string.", required: false },
      parent: { type: "integer", description: "Limit result set to items with particular parent IDs.", required: false },
      status: { type: "string", description: "Limit result set to pages with one or more statuses.", required: false },
    },
  },
  // Media
  {
    namespace: "wp/v2",
    route: "/wp/v2/media",
    methods: ["GET", "POST"],
    description: "Retrieve or upload media items.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false, enum: ["view", "embed", "edit"] },
      page: { type: "integer", description: "Current page of the collection.", required: false },
      per_page: { type: "integer", description: "Maximum number of items.", required: false },
      media_type: { type: "string", description: "Limit result set to attachments of a particular media type.", required: false, enum: ["image", "video", "text", "application", "audio"] },
      mime_type: { type: "string", description: "Limit result set to attachments of a particular MIME type.", required: false },
    },
  },
  // Categories
  {
    namespace: "wp/v2",
    route: "/wp/v2/categories",
    methods: ["GET", "POST"],
    description: "Retrieve or create categories.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      page: { type: "integer", description: "Current page of the collection.", required: false },
      per_page: { type: "integer", description: "Maximum number of items.", required: false },
      search: { type: "string", description: "Limit results to those matching a string.", required: false },
      parent: { type: "integer", description: "Limit result set to terms assigned to a specific parent.", required: false },
      hide_empty: { type: "boolean", description: "Whether to hide terms not assigned to any posts.", required: false },
    },
  },
  // Tags
  {
    namespace: "wp/v2",
    route: "/wp/v2/tags",
    methods: ["GET", "POST"],
    description: "Retrieve or create tags.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      page: { type: "integer", description: "Current page of the collection.", required: false },
      per_page: { type: "integer", description: "Maximum number of items.", required: false },
      search: { type: "string", description: "Limit results to those matching a string.", required: false },
      hide_empty: { type: "boolean", description: "Whether to hide terms not assigned to any posts.", required: false },
    },
  },
  // Users
  {
    namespace: "wp/v2",
    route: "/wp/v2/users",
    methods: ["GET", "POST"],
    description: "Retrieve or create users. Requires appropriate capabilities.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false, enum: ["view", "embed", "edit"] },
      page: { type: "integer", description: "Current page of the collection.", required: false },
      per_page: { type: "integer", description: "Maximum number of items.", required: false },
      search: { type: "string", description: "Limit results to those matching a string.", required: false },
      roles: { type: "array", description: "Limit result set to users matching at least one specific role.", required: false },
    },
  },
  {
    namespace: "wp/v2",
    route: "/wp/v2/users/me",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    description: "Retrieve or update the current user.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
    },
  },
  // Comments
  {
    namespace: "wp/v2",
    route: "/wp/v2/comments",
    methods: ["GET", "POST"],
    description: "Retrieve or create comments.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      page: { type: "integer", description: "Current page of the collection.", required: false },
      per_page: { type: "integer", description: "Maximum number of items.", required: false },
      post: { type: "integer", description: "Limit result set to comments assigned to specific post IDs.", required: false },
      status: { type: "string", description: "Limit result set to comments assigned a specific status.", required: false },
    },
  },
  // Taxonomies
  {
    namespace: "wp/v2",
    route: "/wp/v2/taxonomies",
    methods: ["GET"],
    description: "Retrieve all registered taxonomies.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      type: { type: "string", description: "Limit results to taxonomies associated with a specific post type.", required: false },
    },
  },
  // Post Types
  {
    namespace: "wp/v2",
    route: "/wp/v2/types",
    methods: ["GET"],
    description: "Retrieve all registered post types.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
    },
  },
  // Search
  {
    namespace: "wp/v2",
    route: "/wp/v2/search",
    methods: ["GET"],
    description: "Search across multiple content types.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      search: { type: "string", description: "Limit results to those matching a string.", required: true },
      type: { type: "string", description: "Limit results to items of an object type.", required: false, enum: ["post", "term", "post-format"] },
      subtype: { type: "string", description: "Limit results to items of one or more object subtypes.", required: false },
      per_page: { type: "integer", description: "Maximum number of items to be returned.", required: false },
    },
  },
  // Settings
  {
    namespace: "wp/v2",
    route: "/wp/v2/settings",
    methods: ["GET", "POST", "PUT", "PATCH"],
    description: "Retrieve or update site settings. Requires 'manage_options' capability.",
    args: {
      title: { type: "string", description: "Site title.", required: false },
      description: { type: "string", description: "Site tagline.", required: false },
      url: { type: "string", description: "Site URL.", required: false },
      timezone: { type: "string", description: "A city in the same timezone as you.", required: false },
    },
  },
  // Plugins
  {
    namespace: "wp/v2",
    route: "/wp/v2/plugins",
    methods: ["GET", "POST"],
    description: "Retrieve or install plugins. Requires appropriate capabilities.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      search: { type: "string", description: "Limit results to those matching a string.", required: false },
      status: { type: "string", description: "Limits results to plugins with the given status.", required: false, enum: ["active", "inactive"] },
    },
  },
  // Themes
  {
    namespace: "wp/v2",
    route: "/wp/v2/themes",
    methods: ["GET"],
    description: "Retrieve themes. Requires appropriate capabilities.",
    args: {
      status: { type: "string", description: "Limits results to themes with the given status.", required: false, enum: ["active", "inactive"] },
    },
  },
  // Blocks (Block Types)
  {
    namespace: "wp/v2",
    route: "/wp/v2/block-types",
    methods: ["GET"],
    description: "Retrieve all registered block types.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      namespace: { type: "string", description: "Block type namespace.", required: false },
    },
  },
  // Reusable Blocks (wp_block)
  {
    namespace: "wp/v2",
    route: "/wp/v2/blocks",
    methods: ["GET", "POST"],
    description: "Retrieve or create reusable blocks (synced patterns).",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      page: { type: "integer", description: "Current page of the collection.", required: false },
      per_page: { type: "integer", description: "Maximum number of items.", required: false },
      search: { type: "string", description: "Limit results to those matching a string.", required: false },
    },
  },
  // Global Styles
  {
    namespace: "wp/v2",
    route: "/wp/v2/global-styles",
    methods: ["GET"],
    description: "Retrieve global styles (theme.json applied styles).",
    args: {},
  },
  // Block Patterns
  {
    namespace: "wp/v2",
    route: "/wp/v2/block-patterns/patterns",
    methods: ["GET"],
    description: "Retrieve all registered block patterns.",
    args: {},
  },
  {
    namespace: "wp/v2",
    route: "/wp/v2/block-patterns/categories",
    methods: ["GET"],
    description: "Retrieve all registered block pattern categories.",
    args: {},
  },
  // Sidebars / Widgets
  {
    namespace: "wp/v2",
    route: "/wp/v2/sidebars",
    methods: ["GET"],
    description: "Retrieve registered sidebars.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
    },
  },
  {
    namespace: "wp/v2",
    route: "/wp/v2/widgets",
    methods: ["GET", "POST"],
    description: "Retrieve or create widgets.",
    args: {
      context: { type: "string", description: "Scope under which the request is made.", required: false },
      sidebar: { type: "string", description: "The sidebar the widget belongs to.", required: false },
    },
  },
  // Application Passwords
  {
    namespace: "wp/v2",
    route: "/wp/v2/users/<user_id>/application-passwords",
    methods: ["GET", "POST", "DELETE"],
    description: "Manage application passwords for a user.",
    args: {
      user_id: { type: "integer", description: "The user ID.", required: true },
      name: { type: "string", description: "The name of the application password.", required: false },
    },
  },
];

/**
 * Search REST endpoints by query string.
 */
export function searchEndpoints(query: string): RestEndpoint[] {
  const lowerQuery = query.toLowerCase();
  return WP_REST_ENDPOINTS.filter(
    (ep) =>
      ep.route.toLowerCase().includes(lowerQuery) ||
      ep.description.toLowerCase().includes(lowerQuery) ||
      ep.namespace.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all endpoints for a namespace.
 */
export function getEndpointsByNamespace(namespace: string): RestEndpoint[] {
  return WP_REST_ENDPOINTS.filter((ep) => ep.namespace === namespace);
}
