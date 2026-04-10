/**
 * Tool: validate_php
 *
 * Validates PHP code blocks against WordPress coding standards and best practices.
 * Checks for:
 * - Correct hook usage (actions/filters)
 * - Security best practices (nonces, escaping, sanitization)
 * - Common WordPress anti-patterns
 * - Deprecated function usage
 * - Proper function prefixing
 */

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  successResponse,
  errorResponse,
  type ToolResponse,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { ALL_HOOKS } from "../data/wp-hooks-registry.js";
import { logger } from "../utils/logger.js";

export const validatePhpSchema = z.object({
  code: z.string().describe("The PHP code block to validate. Include the full code, not just a snippet."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  context: z
    .enum(["plugin", "theme", "mu-plugin", "functions-php", "general"])
    .optional()
    .default("general")
    .describe("The context in which this PHP code is used. Affects which rules are applied."),
  artifactId: z
    .string()
    .optional()
    .describe("If re-validating a previously validated code block, pass the same artifactId."),
  revision: z
    .number()
    .optional()
    .default(1)
    .describe("Revision number when re-validating. Increment this when submitting updated code."),
});

export type ValidatePhpInput = z.infer<typeof validatePhpSchema>;

const DEPRECATED_FUNCTIONS: Record<string, string> = {
  mysql_query: "Use $wpdb->query() instead",
  mysql_connect: "Use $wpdb methods instead",
  ereg: "Use preg_match() instead",
  eregi: "Use preg_match() with 'i' flag instead",
  split: "Use preg_split() or explode() instead",
  get_currentuserinfo: "Deprecated since 4.5.0. Use wp_get_current_user() instead",
  wp_setcookie: "Deprecated since 2.5.0. Use wp_set_auth_cookie() instead",
  get_the_author_email: "Deprecated since 2.8.0. Use get_the_author_meta('email') instead",
  wp_specialchars: "Deprecated since 2.8.0. Use esc_html() instead",
  attribute_escape: "Deprecated since 2.8.0. Use esc_attr() instead",
  register_sidebar_widget: "Deprecated since 2.8.0. Use wp_register_sidebar_widget() instead",
  get_settings: "Deprecated since 2.1.0. Use get_option() instead",
  update_usermeta: "Deprecated since 3.0.0. Use update_user_meta() instead",
  get_usermeta: "Deprecated since 3.0.0. Use get_user_meta() instead",
};

const SECURITY_CHECKS = [
  { pattern: /echo\s+\$_(GET|POST|REQUEST|SERVER|COOKIE)/g, rule: "direct-output-superglobal", message: "Never echo superglobal variables directly. Use esc_html(), esc_attr(), or esc_url()." },
  { pattern: /echo\s+\$[a-zA-Z_]+\s*;/g, rule: "unescaped-output", message: "Variable output should be escaped with esc_html(), esc_attr(), esc_url(), or wp_kses()." },
  { pattern: /\$wpdb->query\(\s*["']/g, rule: "raw-sql-string", message: "Use $wpdb->prepare() for SQL queries with variable data to prevent SQL injection." },
  { pattern: /\$wpdb->query\(\s*\$/g, rule: "unprepared-query", message: "Use $wpdb->prepare() for SQL queries with variable data to prevent SQL injection." },
];

const ANTI_PATTERNS = [
  { pattern: /query_posts\s*\(/g, rule: "query-posts", message: "Avoid query_posts(). Use WP_Query or pre_get_posts filter instead." },
  { pattern: /extract\s*\(/g, rule: "extract-usage", message: "Avoid extract(). It creates variables from an array making code harder to debug." },
  { pattern: /file_get_contents\s*\(\s*['"]https?:/g, rule: "file-get-contents-url", message: "Use wp_remote_get() instead of file_get_contents() for HTTP requests." },
  { pattern: /curl_init\s*\(/g, rule: "curl-direct", message: "Use wp_remote_get()/wp_remote_post() instead of cURL directly." },
  { pattern: /\$_GET\[|\$_POST\[|\$_REQUEST\[/g, rule: "direct-superglobal", message: "Sanitize superglobal input with sanitize_text_field(), absint(), wp_unslash(), etc." },
  { pattern: /error_reporting\s*\(\s*0\s*\)/g, rule: "error-suppression", message: "Don't suppress errors. Use WP_DEBUG and proper error handling." },
  { pattern: /ini_set\s*\(/g, rule: "ini-set", message: "Avoid ini_set() in plugins/themes. Use wp-config.php for PHP configuration." },
];

function findLineNumber(code: string, index: number): number {
  return code.substring(0, index).split("\n").length;
}

export async function validatePhp(input: ValidatePhpInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { code, context, revision } = input;
    const artifactId = input.artifactId ?? uuidv4();
    logger.info("validate_php called", { context, artifactId, revision });

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for PHP opening tag
    if (!code.includes("<?php") && !code.includes("<?")) {
      warnings.push({
        message: "No PHP opening tag found. WordPress PHP files should start with <?php",
        severity: "warning",
        rule: "php-opening-tag",
        suggestion: "Add <?php at the beginning of the file.",
      });
    }

    // Check for closing PHP tag
    if (context !== "general" && code.trim().endsWith("?>")) {
      warnings.push({
        message: "PHP closing tag ?> should be omitted in pure PHP files to prevent 'headers already sent' errors.",
        severity: "warning",
        rule: "php-closing-tag",
        suggestion: "Remove the closing ?> tag.",
      });
    }

    // Plugin header check
    if (context === "plugin" && !code.includes("Plugin Name:")) {
      errors.push({
        message: "Plugin file is missing the required Plugin Name header comment.",
        severity: "error",
        rule: "plugin-header",
        suggestion: "Add: /* Plugin Name: My Plugin */",
      });
    }

    // Nonce verification check
    if (code.includes("$wpdb->") && !code.includes("wp_verify_nonce") && !code.includes("check_admin_referer")) {
      if (code.includes("$_POST") || code.includes("$_GET") || code.includes("$_REQUEST")) {
        errors.push({
          message: "Database operations with user input detected without nonce verification.",
          severity: "error",
          rule: "nonce-verification",
          suggestion: "Add wp_verify_nonce() or check_admin_referer() before processing user input.",
        });
      }
    }

    // Deprecated functions
    for (const [func, replacement] of Object.entries(DEPRECATED_FUNCTIONS)) {
      const regex = new RegExp(`\\b${func}\\s*\\(`, "g");
      let match;
      while ((match = regex.exec(code)) !== null) {
        errors.push({
          line: findLineNumber(code, match.index),
          message: `Deprecated function '${func}' used. ${replacement}`,
          severity: "error",
          rule: "deprecated-function",
          suggestion: replacement,
        });
      }
    }

    // Security checks
    for (const check of SECURITY_CHECKS) {
      const regex = new RegExp(check.pattern.source, check.pattern.flags);
      let match;
      while ((match = regex.exec(code)) !== null) {
        errors.push({
          line: findLineNumber(code, match.index),
          message: check.message,
          severity: "error",
          rule: check.rule,
        });
      }
    }

    // Anti-pattern checks
    for (const check of ANTI_PATTERNS) {
      const regex = new RegExp(check.pattern.source, check.pattern.flags);
      let match;
      while ((match = regex.exec(code)) !== null) {
        warnings.push({
          line: findLineNumber(code, match.index),
          message: check.message,
          severity: "warning",
          rule: check.rule,
        });
      }
    }

    // Hook type mismatch
    const addActionRegex = /add_action\s*\(\s*['"]([^'"]+)['"]/g;
    const addFilterRegex = /add_filter\s*\(\s*['"]([^'"]+)['"]/g;
    let hookMatch;

    while ((hookMatch = addActionRegex.exec(code)) !== null) {
      const hookName = hookMatch[1];
      const knownFilter = ALL_HOOKS.find((h) => h.name === hookName && h.type === "filter");
      if (knownFilter) {
        warnings.push({
          line: findLineNumber(code, hookMatch.index),
          message: `'${hookName}' is a filter, not an action. Use add_filter() instead.`,
          severity: "warning",
          rule: "hook-type-mismatch",
          suggestion: `Change add_action('${hookName}', ...) to add_filter('${hookName}', ...)`,
        });
      }
    }

    while ((hookMatch = addFilterRegex.exec(code)) !== null) {
      const hookName = hookMatch[1];
      const knownAction = ALL_HOOKS.find((h) => h.name === hookName && h.type === "action");
      if (knownAction) {
        warnings.push({
          line: findLineNumber(code, hookMatch.index),
          message: `'${hookName}' is an action, not a filter. Use add_action() instead.`,
          severity: "warning",
          rule: "hook-type-mismatch",
          suggestion: `Change add_filter('${hookName}', ...) to add_action('${hookName}', ...)`,
        });
      }
    }

    // Unprefixed functions check
    if (context === "plugin" || context === "theme") {
      const functionRegex = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
      let funcMatch;
      while ((funcMatch = functionRegex.exec(code)) !== null) {
        const funcName = funcMatch[1];
        const beforeFunc = code.substring(Math.max(0, funcMatch.index - 200), funcMatch.index);
        const isMethod = /class\s+\w+[\s\S]*$/.test(beforeFunc) || beforeFunc.includes("->");
        if (!isMethod && !funcName.startsWith("_") && funcName.split("_").length < 2) {
          warnings.push({
            line: findLineNumber(code, funcMatch.index),
            message: `Function '${funcName}' should be prefixed to avoid naming collisions.`,
            severity: "warning",
            rule: "function-prefix",
            suggestion: `Use a unique prefix, e.g., 'myplugin_${funcName}', or use a class/namespace.`,
          });
        }
      }
    }

    // Absolute path includes
    const includeRegex = /(?:include|require)(?:_once)?\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let includeMatch;
    while ((includeMatch = includeRegex.exec(code)) !== null) {
      const path = includeMatch[1];
      if (path.startsWith("/") || /^[A-Z]:/.test(path)) {
        errors.push({
          line: findLineNumber(code, includeMatch.index),
          message: "Absolute file paths in includes are not portable.",
          severity: "error",
          rule: "absolute-include-path",
          suggestion: "Use plugin_dir_path(__FILE__) or get_template_directory() instead.",
        });
      }
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      artifactId,
      revision,
    };

    const statusEmoji = result.valid ? "✅" : "❌";
    const errorsText = errors.length > 0
      ? errors.map((e) => `- **Line ${e.line ?? "?"}** [${e.rule}]: ${e.message}${e.suggestion ? `\n  💡 ${e.suggestion}` : ""}`).join("\n")
      : "_(none)_";
    const warningsText = warnings.length > 0
      ? warnings.map((w) => `- **Line ${w.line ?? "?"}** [${w.rule}]: ${w.message}${w.suggestion ? `\n  💡 ${w.suggestion}` : ""}`).join("\n")
      : "_(none)_";

    const response = `# PHP Validation Result ${statusEmoji}

**Artifact ID**: \`${result.artifactId}\`
**Revision**: ${result.revision}
**Context**: ${context}
**Status**: ${result.valid ? "VALID" : "INVALID"}

## Errors (${errors.length})
${errorsText}

## Warnings (${warnings.length})
${warningsText}

---

${!result.valid ? "⚠️ Fix the errors above and re-validate with the same artifactId and an incremented revision number." : "✅ Code passes WordPress validation checks. Note: This is a static analysis — runtime behavior may differ."}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("validate_php failed", { error: message });
    return errorResponse(message);
  }
}
