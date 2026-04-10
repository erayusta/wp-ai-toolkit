/**
 * Core type definitions for the WordPress AI Toolkit MCP Server.
 */

// ---------------------------------------------------------------------------
// Conversation & Session
// ---------------------------------------------------------------------------

export interface Conversation {
  id: string;
  activeApis: string[];
  createdAt: Date;
  lastUsedAt: Date;
}

export type WordPressApi =
  | "rest-api"
  | "hooks"
  | "blocks"
  | "themes"
  | "plugins"
  | "woocommerce"
  | "wp-cli"
  | "gutenberg"
  | "multisite"
  | "custom-fields";

export const VALID_APIS: WordPressApi[] = [
  "rest-api",
  "hooks",
  "blocks",
  "themes",
  "plugins",
  "woocommerce",
  "wp-cli",
  "gutenberg",
  "multisite",
  "custom-fields",
];

// ---------------------------------------------------------------------------
// Documentation
// ---------------------------------------------------------------------------

export interface DocChunk {
  title: string;
  url: string;
  content: string;
  section: string;
  relevanceScore: number;
}

export interface FullDoc {
  title: string;
  url: string;
  content: string;
  lastUpdated?: string;
}

// ---------------------------------------------------------------------------
// REST API Schema
// ---------------------------------------------------------------------------

export interface RestEndpoint {
  namespace: string;
  route: string;
  methods: string[];
  description: string;
  args: Record<string, RestArg>;
}

export interface RestArg {
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

export interface RestSchema {
  namespace: string;
  routes: Record<string, RestEndpoint>;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  artifactId: string;
  revision: number;
}

export interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  severity: "error";
  rule: string;
  suggestion?: string;
}

export interface ValidationWarning {
  line?: number;
  column?: number;
  message: string;
  severity: "warning";
  rule: string;
  suggestion?: string;
}

export interface BlockJsonValidationResult extends ValidationResult {
  blockName?: string;
  detectedFields: string[];
  missingRequiredFields: string[];
}

// ---------------------------------------------------------------------------
// WP-CLI
// ---------------------------------------------------------------------------

export interface WpCliCommand {
  command: string;
  description: string;
  subcommands?: WpCliCommand[];
  synopsis?: string;
}

export interface WpCliResult {
  success: boolean;
  output: string;
  command: string;
  exitCode: number;
}

// ---------------------------------------------------------------------------
// Hook Registry
// ---------------------------------------------------------------------------

export interface HookDefinition {
  name: string;
  type: "action" | "filter";
  description: string;
  parameters: HookParameter[];
  since: string;
  file?: string;
  deprecated?: boolean;
  deprecatedSince?: string;
  alternative?: string;
}

export interface HookParameter {
  name: string;
  type: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Tool Response Helpers
// ---------------------------------------------------------------------------

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export function successResponse(text: string): ToolResponse {
  return {
    content: [{ type: "text", text }],
  };
}

export function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
