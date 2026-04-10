/**
 * Tool: validate_theme_template
 *
 * Validates PHP theme template files against WordPress best practices.
 * Checks for: template hierarchy compliance, proper escaping, The Loop usage,
 * template tags, get_template_part, enqueue patterns, and accessibility.
 */

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  successResponse,
  errorResponse,
  type ToolResponse,
  type ValidationError,
  type ValidationWarning,
} from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const validateThemeTemplateSchema = z.object({
  code: z.string().describe("The PHP template file content to validate."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  templateType: z
    .enum([
      "index", "single", "page", "archive", "category", "tag", "taxonomy",
      "author", "date", "search", "404", "front-page", "home",
      "header", "footer", "sidebar", "template-part", "functions", "general",
    ])
    .optional()
    .default("general")
    .describe("The type of template file being validated."),
  themeType: z
    .enum(["block", "classic", "hybrid"])
    .optional()
    .default("classic")
    .describe("Theme type: 'block' for block/FSE themes, 'classic' for traditional PHP themes, 'hybrid' for both."),
  artifactId: z.string().optional().describe("Artifact ID for tracking revisions."),
  revision: z.number().optional().default(1).describe("Revision number."),
});

export type ValidateThemeTemplateInput = z.infer<typeof validateThemeTemplateSchema>;

function findLineNumber(code: string, index: number): number {
  return code.substring(0, index).split("\n").length;
}

// Templates that should call get_header/get_footer
const FULL_PAGE_TEMPLATES = [
  "index", "single", "page", "archive", "category", "tag", "taxonomy",
  "author", "date", "search", "404", "front-page", "home",
];

const _ESCAPE_FUNCTIONS = [
  "esc_html", "esc_attr", "esc_url", "esc_js", "esc_textarea",
  "wp_kses", "wp_kses_post", "wp_kses_data",
  "esc_html__", "esc_html_e", "esc_attr__", "esc_attr_e",
  "absint", "intval",
];

export async function validateThemeTemplate(input: ValidateThemeTemplateInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { code, templateType, themeType, revision } = input;
    const artifactId = input.artifactId ?? uuidv4();
    logger.info("validate_theme_template called", { templateType, themeType, artifactId });

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // --- Classic theme checks ---
    if (themeType !== "block") {

      // Check for get_header() / get_footer() in full-page templates
      if (FULL_PAGE_TEMPLATES.includes(templateType)) {
        if (!code.includes("get_header(") && !code.includes("get_header (")) {
          errors.push({
            message: `Full-page template '${templateType}' should call get_header().`,
            severity: "error",
            rule: "missing-get-header",
            suggestion: "Add get_header(); at the top of the template.",
          });
        }
        if (!code.includes("get_footer(") && !code.includes("get_footer (")) {
          errors.push({
            message: `Full-page template '${templateType}' should call get_footer().`,
            severity: "error",
            rule: "missing-get-footer",
            suggestion: "Add get_footer(); at the bottom of the template.",
          });
        }
      }

      // Check header template for wp_head()
      if (templateType === "header" && !code.includes("wp_head(")) {
        errors.push({
          message: "Header template must call wp_head() before </head>.",
          severity: "error",
          rule: "missing-wp-head",
          suggestion: "Add <?php wp_head(); ?> just before </head>.",
        });
      }

      // Check footer template for wp_footer()
      if (templateType === "footer" && !code.includes("wp_footer(")) {
        errors.push({
          message: "Footer template must call wp_footer() before </body>.",
          severity: "error",
          rule: "missing-wp-footer",
          suggestion: "Add <?php wp_footer(); ?> just before </body>.",
        });
      }

      // Check header for wp_body_open()
      if (templateType === "header" && !code.includes("wp_body_open(")) {
        warnings.push({
          message: "Header should call wp_body_open() after the opening <body> tag.",
          severity: "warning",
          rule: "missing-wp-body-open",
          suggestion: "Add <?php wp_body_open(); ?> right after the <body> tag for plugin compatibility.",
        });
      }

      // Check header for language_attributes()
      if (templateType === "header" && !code.includes("language_attributes(")) {
        warnings.push({
          message: "Header should use language_attributes() in the <html> tag.",
          severity: "warning",
          rule: "missing-language-attributes",
          suggestion: '<html <?php language_attributes(); ?>>',
        });
      }

      // Check header for charset
      if (templateType === "header" && !code.includes("bloginfo") && !code.includes("charset")) {
        warnings.push({
          message: "Header should include charset meta tag using bloginfo('charset').",
          severity: "warning",
          rule: "missing-charset",
          suggestion: '<meta charset="<?php bloginfo(\'charset\'); ?>">',
        });
      }
    }

    // --- The Loop checks ---
    const hasLoop = code.includes("have_posts()") && code.includes("the_post()");
    const templateNeedsLoop = ["index", "single", "page", "archive", "category", "tag", "taxonomy", "author", "date", "search", "home"].includes(templateType);

    if (templateNeedsLoop && !hasLoop && themeType !== "block") {
      warnings.push({
        message: `Template '${templateType}' typically needs The Loop (have_posts/the_post).`,
        severity: "warning",
        rule: "missing-loop",
        suggestion: "Add: <?php if (have_posts()) : while (have_posts()) : the_post(); ?> ... <?php endwhile; endif; ?>",
      });
    }

    // Check for the_post() without rewind for custom queries
    const wpQueryMatches = code.match(/new\s+WP_Query/g);
    if (wpQueryMatches && wpQueryMatches.length > 0) {
      if (!code.includes("wp_reset_postdata(")) {
        errors.push({
          message: "Custom WP_Query found without wp_reset_postdata().",
          severity: "error",
          rule: "missing-reset-postdata",
          suggestion: "Call wp_reset_postdata() after your custom loop.",
        });
      }
    }

    // --- Escaping checks ---
    // Check for unescaped echo of template tags
    const unsafeEchoPatterns = [
      { pattern: /echo\s+get_the_title\s*\(/g, rule: "unescaped-title", message: "Use esc_html(get_the_title()) or the_title() which auto-escapes." },
      { pattern: /echo\s+get_permalink\s*\(/g, rule: "unescaped-permalink", message: "Use esc_url(get_permalink())." },
      { pattern: /echo\s+get_the_author\s*\(/g, rule: "unescaped-author", message: "Use esc_html(get_the_author())." },
      { pattern: /echo\s+get_option\s*\(/g, rule: "unescaped-option", message: "Escape get_option() output with esc_html(), esc_attr(), or esc_url()." },
      { pattern: /echo\s+get_post_meta\s*\(/g, rule: "unescaped-meta", message: "Escape get_post_meta() output with appropriate escaping function." },
      { pattern: /echo\s+get_field\s*\(/g, rule: "unescaped-acf", message: "Escape get_field() output. Use esc_html(), esc_url(), or wp_kses_post()." },
      { pattern: /echo\s+\$_/g, rule: "echo-superglobal", message: "Never echo superglobals directly. Sanitize and escape." },
    ];

    for (const check of unsafeEchoPatterns) {
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

    // Check for hardcoded script/style tags
    const hardcodedScript = /<script[^>]*src=/gi;
    let scriptMatch;
    while ((scriptMatch = hardcodedScript.exec(code)) !== null) {
      if (templateType !== "header" || !code.includes("wp_head")) {
        warnings.push({
          line: findLineNumber(code, scriptMatch.index),
          message: "Avoid hardcoded <script> tags. Use wp_enqueue_script() in functions.php.",
          severity: "warning",
          rule: "hardcoded-script",
        });
      }
    }

    const hardcodedStyle = /<link[^>]*stylesheet/gi;
    let styleMatch;
    while ((styleMatch = hardcodedStyle.exec(code)) !== null) {
      warnings.push({
        line: findLineNumber(code, styleMatch.index),
        message: "Avoid hardcoded <link> stylesheet tags. Use wp_enqueue_style() in functions.php.",
        severity: "warning",
        rule: "hardcoded-stylesheet",
      });
    }

    // --- Accessibility checks ---
    if (code.includes("<img") && !code.includes("alt=")) {
      warnings.push({
        message: "Images should have alt attributes for accessibility.",
        severity: "warning",
        rule: "missing-alt-attribute",
      });
    }

    if (code.includes("<form") && !code.includes("role=") && !code.includes("aria-")) {
      warnings.push({
        message: "Forms should include ARIA attributes for accessibility.",
        severity: "warning",
        rule: "missing-aria",
      });
    }

    // --- functions.php specific checks ---
    if (templateType === "functions") {
      if (!code.includes("wp_enqueue_script") && !code.includes("wp_enqueue_style")) {
        warnings.push({
          message: "functions.php should enqueue scripts and styles via wp_enqueue_scripts hook.",
          severity: "warning",
          rule: "no-enqueue",
        });
      }

      if (!code.includes("after_setup_theme")) {
        warnings.push({
          message: "functions.php should use after_setup_theme hook for theme setup.",
          severity: "warning",
          rule: "no-theme-setup",
        });
      }

      // Check for direct echo/output
      const directOutput = /^(?!<\?php)\s*<(?!php)/m;
      if (directOutput.test(code) && code.includes("<?php")) {
        warnings.push({
          message: "functions.php should not output HTML directly. Use hooks and template files.",
          severity: "warning",
          rule: "direct-output-functions",
        });
      }
    }

    // --- 404 template check ---
    if (templateType === "404") {
      if (!code.includes("get_search_form")) {
        warnings.push({
          message: "404 template should include a search form for better UX.",
          severity: "warning",
          rule: "404-no-search",
          suggestion: "Add <?php get_search_form(); ?> to help users find content.",
        });
      }
    }

    // --- search template check ---
    if (templateType === "search") {
      if (!code.includes("get_search_query")) {
        warnings.push({
          message: "Search template should display the search query for context.",
          severity: "warning",
          rule: "search-no-query",
          suggestion: "Use get_search_query() to show what the user searched for.",
        });
      }
    }

    // Build result
    const valid = errors.length === 0;
    const statusEmoji = valid ? "✅" : "❌";
    const errorsText = errors.length > 0
      ? errors.map((e) => `- **Line ${e.line ?? "?"}** [${e.rule}]: ${e.message}${e.suggestion ? `\n  💡 ${e.suggestion}` : ""}`).join("\n")
      : "_(none)_";
    const warningsText = warnings.length > 0
      ? warnings.map((w) => `- **Line ${w.line ?? "?"}** [${w.rule}]: ${w.message}${w.suggestion ? `\n  💡 ${w.suggestion}` : ""}`).join("\n")
      : "_(none)_";

    const response = `# Theme Template Validation ${statusEmoji}

**Artifact ID**: \`${artifactId}\`
**Revision**: ${revision}
**Template Type**: ${templateType}
**Theme Type**: ${themeType}
**Status**: ${valid ? "VALID" : "INVALID"}

## Errors (${errors.length})
${errorsText}

## Warnings (${warnings.length})
${warningsText}

---

${!valid ? `⚠️ Fix errors and re-validate with artifactId: "${artifactId}" and revision: ${revision + 1}` : "✅ Template passes WordPress theme validation checks."}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("validate_theme_template failed", { error: message });
    return errorResponse(message);
  }
}
