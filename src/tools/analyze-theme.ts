/**
 * Tool: analyze_theme
 *
 * Analyzes a WordPress theme directory structure and checks for
 * best practices, missing files, and common issues.
 * Similar to WordPress Theme Check plugin.
 */

import { z } from "zod";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const analyzeThemeSchema = z.object({
  themePath: z.string().describe("Absolute path to the WordPress theme directory."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
});

export type AnalyzeThemeInput = z.infer<typeof analyzeThemeSchema>;

interface AnalysisItem {
  status: "pass" | "fail" | "warn" | "info";
  rule: string;
  message: string;
}

function fileExists(base: string, file: string): boolean {
  return existsSync(join(base, file));
}

function readFile(base: string, file: string): string | null {
  const path = join(base, file);
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function listFiles(dir: string, prefix = ""): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!["node_modules", ".git", "vendor"].includes(entry.name)) {
          results.push(...listFiles(join(dir, entry.name), rel));
        }
      } else {
        results.push(rel);
      }
    }
  } catch {
    // ignore errors
  }
  return results;
}

export async function analyzeTheme(input: AnalyzeThemeInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { themePath } = input;
    logger.info("analyze_theme called", { themePath });

    if (!existsSync(themePath)) {
      return errorResponse(`Directory not found: ${themePath}`);
    }

    const stat = statSync(themePath);
    if (!stat.isDirectory()) {
      return errorResponse(`Path is not a directory: ${themePath}`);
    }

    const items: AnalysisItem[] = [];
    const allFiles = listFiles(themePath);
    const themeName = basename(themePath);

    // Detect theme type
    const hasTemplatesDir = fileExists(themePath, "templates");
    const hasThemeJson = fileExists(themePath, "theme.json");
    const hasIndexPhp = fileExists(themePath, "index.php");
    const hasIndexHtml = fileExists(themePath, "templates/index.html");
    const isBlockTheme = hasTemplatesDir && hasIndexHtml;
    const isClassicTheme = hasIndexPhp && !isBlockTheme;

    items.push({
      status: "info",
      rule: "theme-type",
      message: isBlockTheme ? "Block theme detected (FSE)" : isClassicTheme ? "Classic theme detected" : "Hybrid or unknown theme type",
    });

    // --- Required files ---
    const styleContent = readFile(themePath, "style.css");
    if (!styleContent) {
      items.push({ status: "fail", rule: "missing-style-css", message: "style.css is required for all themes." });
    } else {
      // Check style.css header
      const requiredHeaders = ["Theme Name"];
      const recommendedHeaders = ["Version", "Text Domain", "Description", "Author", "License"];

      for (const h of requiredHeaders) {
        if (!styleContent.includes(`${h}:`)) {
          items.push({ status: "fail", rule: "missing-header", message: `style.css missing required header: ${h}` });
        }
      }
      for (const h of recommendedHeaders) {
        if (!styleContent.includes(`${h}:`)) {
          items.push({ status: "warn", rule: "missing-header", message: `style.css missing recommended header: ${h}` });
        }
      }
    }

    if (isBlockTheme) {
      if (!hasThemeJson) {
        items.push({ status: "fail", rule: "missing-theme-json", message: "Block themes require theme.json." });
      }
      if (!hasIndexHtml) {
        items.push({ status: "fail", rule: "missing-index-html", message: "Block themes require templates/index.html." });
      }

      // Check theme.json content
      const themeJsonContent = readFile(themePath, "theme.json");
      if (themeJsonContent) {
        try {
          const parsed = JSON.parse(themeJsonContent);
          if (!parsed.version) {
            items.push({ status: "fail", rule: "theme-json-no-version", message: "theme.json missing 'version' field." });
          }
          if (!parsed.$schema) {
            items.push({ status: "warn", rule: "theme-json-no-schema", message: "theme.json should include '$schema' field." });
          }
          if (parsed.settings) items.push({ status: "pass", rule: "theme-json-settings", message: "theme.json has settings configured." });
          if (parsed.styles) items.push({ status: "pass", rule: "theme-json-styles", message: "theme.json has styles configured." });
        } catch {
          items.push({ status: "fail", rule: "theme-json-invalid", message: "theme.json contains invalid JSON." });
        }
      }

      // Check template parts
      if (fileExists(themePath, "parts")) {
        const parts = allFiles.filter((f) => f.startsWith("parts/"));
        items.push({ status: "info", rule: "template-parts", message: `Found ${parts.length} template part(s): ${parts.join(", ")}` });
      }
    }

    if (isClassicTheme) {
      if (!hasIndexPhp) {
        items.push({ status: "fail", rule: "missing-index-php", message: "Classic themes require index.php." });
      }

      // Check common template files
      const classicFiles: Record<string, string> = {
        "header.php": "Header template",
        "footer.php": "Footer template",
        "sidebar.php": "Sidebar template",
        "single.php": "Single post template",
        "page.php": "Page template",
        "archive.php": "Archive template",
        "search.php": "Search results template",
        "404.php": "404 error template",
        "comments.php": "Comments template",
      };

      for (const [file, desc] of Object.entries(classicFiles)) {
        if (fileExists(themePath, file)) {
          items.push({ status: "pass", rule: "template-exists", message: `${desc} (${file}) found.` });
        } else {
          items.push({ status: "warn", rule: "template-missing", message: `${desc} (${file}) not found. WordPress will fall back to index.php.` });
        }
      }

      // Check functions.php
      const functionsContent = readFile(themePath, "functions.php");
      if (functionsContent) {
        if (functionsContent.includes("wp_enqueue_style") || functionsContent.includes("wp_enqueue_script")) {
          items.push({ status: "pass", rule: "proper-enqueue", message: "Scripts/styles are properly enqueued." });
        } else {
          items.push({ status: "warn", rule: "no-enqueue", message: "functions.php doesn't enqueue scripts or styles via wp_enqueue_scripts." });
        }

        if (functionsContent.includes("after_setup_theme")) {
          items.push({ status: "pass", rule: "theme-setup", message: "Theme setup hook (after_setup_theme) found." });
        } else {
          items.push({ status: "warn", rule: "no-theme-setup", message: "No after_setup_theme hook found in functions.php." });
        }

        if (functionsContent.includes("add_theme_support")) {
          items.push({ status: "pass", rule: "theme-support", message: "add_theme_support() calls found." });
        }

        // Check for hardcoded text (translation-readiness)
        if (!functionsContent.includes("__(" ) && !functionsContent.includes("_e(")) {
          items.push({ status: "warn", rule: "not-translation-ready", message: "No translation functions found. Theme may not be translation-ready." });
        }
      } else {
        items.push({ status: "fail", rule: "missing-functions-php", message: "functions.php not found. Required for classic themes." });
      }
    }

    // --- Universal checks ---

    // Screenshot
    const hasScreenshot = fileExists(themePath, "screenshot.png") || fileExists(themePath, "screenshot.jpg");
    if (hasScreenshot) {
      items.push({ status: "pass", rule: "screenshot", message: "Theme screenshot found." });
    } else {
      items.push({ status: "warn", rule: "no-screenshot", message: "No screenshot.png/jpg found (recommended: 1200×900px)." });
    }

    // License
    if (fileExists(themePath, "LICENSE") || fileExists(themePath, "license.txt") ||
        (styleContent && styleContent.includes("License:"))) {
      items.push({ status: "pass", rule: "license", message: "License information found." });
    } else {
      items.push({ status: "warn", rule: "no-license", message: "No license information found." });
    }

    // readme.txt
    if (fileExists(themePath, "readme.txt") || fileExists(themePath, "README.md")) {
      items.push({ status: "pass", rule: "readme", message: "Readme file found." });
    }

    // Check PHP files for common issues
    const phpFiles = allFiles.filter((f) => f.endsWith(".php"));
    let hasEscaping = false;

    for (const phpFile of phpFiles.slice(0, 20)) { // Limit to first 20 files
      const content = readFile(themePath, phpFile);
      if (!content) continue;

      if (content.includes("esc_html") || content.includes("esc_attr") || content.includes("esc_url")) {
        hasEscaping = true;
      }

      if (!content.includes("ABSPATH") && !content.includes("get_header") &&
          phpFile !== "functions.php" && phpFile !== "index.php" && !phpFile.includes("template")) {
        // Skip templates — they're loaded by WP
      }
    }

    if (hasEscaping) {
      items.push({ status: "pass", rule: "output-escaping", message: "Output escaping functions found in templates." });
    } else if (phpFiles.length > 0) {
      items.push({ status: "warn", rule: "no-escaping", message: "No escaping functions (esc_html, esc_attr, esc_url) detected in PHP files." });
    }

    // File count stats
    items.push({ status: "info", rule: "file-count", message: `Total files: ${allFiles.length} (PHP: ${phpFiles.length}, CSS: ${allFiles.filter((f) => f.endsWith(".css")).length}, JS: ${allFiles.filter((f) => f.endsWith(".js")).length})` });

    // --- Format output ---
    const fails = items.filter((i) => i.status === "fail");
    const warns = items.filter((i) => i.status === "warn");
    const passes = items.filter((i) => i.status === "pass");
    const infos = items.filter((i) => i.status === "info");

    const statusEmoji = fails.length === 0 ? "✅" : "❌";
    const formatItem = (i: AnalysisItem) => {
      const icon = { pass: "✅", fail: "❌", warn: "⚠️", info: "ℹ️" }[i.status];
      return `- ${icon} [${i.rule}] ${i.message}`;
    };

    const response = `# Theme Analysis ${statusEmoji}

**Theme**: ${themeName}
**Path**: ${themePath}
**Type**: ${isBlockTheme ? "Block (FSE)" : isClassicTheme ? "Classic" : "Unknown"}

## Errors (${fails.length})
${fails.length > 0 ? fails.map(formatItem).join("\n") : "_(none)_"}

## Warnings (${warns.length})
${warns.length > 0 ? warns.map(formatItem).join("\n") : "_(none)_"}

## Passed (${passes.length})
${passes.length > 0 ? passes.map(formatItem).join("\n") : "_(none)_"}

## Info
${infos.map(formatItem).join("\n")}

---

**Score**: ${passes.length}/${passes.length + fails.length + warns.length} checks passed
${fails.length > 0 ? "\n⚠️ Fix the errors above before submitting to WordPress.org." : "\n✅ Theme structure looks good!"}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("analyze_theme failed", { error: message });
    return errorResponse(message);
  }
}
