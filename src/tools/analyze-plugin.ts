/**
 * Tool: analyze_plugin
 *
 * Analyzes a WordPress plugin directory structure and checks for
 * best practices, security patterns, and common issues.
 */

import { z } from "zod";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const analyzePluginSchema = z.object({
  pluginPath: z.string().describe("Absolute path to the WordPress plugin directory."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
});

export type AnalyzePluginInput = z.infer<typeof analyzePluginSchema>;

interface AnalysisItem {
  status: "pass" | "fail" | "warn" | "info";
  rule: string;
  message: string;
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
        if (!["node_modules", ".git", "vendor", "dist"].includes(entry.name)) {
          results.push(...listFiles(join(dir, entry.name), rel));
        }
      } else {
        results.push(rel);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

export async function analyzePlugin(input: AnalyzePluginInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { pluginPath } = input;
    logger.info("analyze_plugin called", { pluginPath });

    if (!existsSync(pluginPath)) {
      return errorResponse(`Directory not found: ${pluginPath}`);
    }

    if (!statSync(pluginPath).isDirectory()) {
      return errorResponse(`Path is not a directory: ${pluginPath}`);
    }

    const items: AnalysisItem[] = [];
    const allFiles = listFiles(pluginPath);
    const phpFiles = allFiles.filter((f) => f.endsWith(".php"));
    const pluginName = basename(pluginPath);

    // --- Find main plugin file ---
    let mainFile: string | null = null;
    let mainContent: string | null = null;

    // Check for file matching directory name
    const candidates = [`${pluginName}.php`, ...phpFiles.filter((f) => !f.includes("/"))];
    for (const candidate of candidates) {
      const content = readFile(pluginPath, candidate);
      if (content && content.includes("Plugin Name:")) {
        mainFile = candidate;
        mainContent = content;
        break;
      }
    }

    if (!mainFile || !mainContent) {
      items.push({ status: "fail", rule: "no-main-file", message: "No main plugin file found with 'Plugin Name:' header." });
    } else {
      items.push({ status: "pass", rule: "main-file", message: `Main plugin file: ${mainFile}` });

      // Check plugin headers
      const headers: Record<string, boolean> = {
        "Plugin Name": false,
        "Description": false,
        "Version": false,
        "Author": false,
        "Text Domain": false,
        "License": false,
        "Requires at least": false,
        "Requires PHP": false,
      };

      for (const h of Object.keys(headers)) {
        if (mainContent.includes(`${h}:`)) {
          headers[h] = true;
        }
      }

      const requiredHeaders = ["Plugin Name"];
      const importantHeaders = ["Version", "Text Domain", "Description", "Author"];
      const niceHeaders = ["License", "Requires at least", "Requires PHP"];

      for (const h of requiredHeaders) {
        if (!headers[h]) {
          items.push({ status: "fail", rule: "missing-header", message: `Missing required header: ${h}` });
        }
      }
      for (const h of importantHeaders) {
        if (!headers[h]) {
          items.push({ status: "warn", rule: "missing-header", message: `Missing important header: ${h}` });
        } else {
          items.push({ status: "pass", rule: "has-header", message: `Header found: ${h}` });
        }
      }
      for (const h of niceHeaders) {
        if (!headers[h]) {
          items.push({ status: "warn", rule: "missing-header", message: `Missing recommended header: ${h}` });
        }
      }

      // Check direct access prevention
      if (mainContent.includes("defined('ABSPATH')") || mainContent.includes("defined( 'ABSPATH' )")) {
        items.push({ status: "pass", rule: "abspath-check", message: "Direct access prevention (ABSPATH check) found." });
      } else {
        items.push({ status: "warn", rule: "no-abspath-check", message: "Main file should check: if (!defined('ABSPATH')) exit;" });
      }
    }

    // --- Check for uninstall cleanup ---
    const hasUninstallPhp = allFiles.includes("uninstall.php");
    const hasUninstallHook = mainContent?.includes("register_uninstall_hook") ?? false;

    if (hasUninstallPhp || hasUninstallHook) {
      items.push({ status: "pass", rule: "uninstall-cleanup", message: hasUninstallPhp ? "uninstall.php found." : "register_uninstall_hook() found." });
    } else {
      items.push({ status: "warn", rule: "no-uninstall", message: "No uninstall.php or register_uninstall_hook() found. Plugin should clean up data on uninstall." });
    }

    // --- Check for activation/deactivation hooks ---
    if (mainContent?.includes("register_activation_hook")) {
      items.push({ status: "pass", rule: "activation-hook", message: "Activation hook found." });
    }
    if (mainContent?.includes("register_deactivation_hook")) {
      items.push({ status: "pass", rule: "deactivation-hook", message: "Deactivation hook found." });
    }

    // --- Security analysis across PHP files ---
    let hasEscaping = false;
    let hasSanitization = false;
    let hasNonces = false;
    let hasCapabilityChecks = false;
    let hasPreparedQueries = false;
    let directSuperglobals = 0;

    for (const phpFile of phpFiles.slice(0, 30)) {
      const content = readFile(pluginPath, phpFile);
      if (!content) continue;

      if (content.includes("esc_html") || content.includes("esc_attr") || content.includes("esc_url")) hasEscaping = true;
      if (content.includes("sanitize_text_field") || content.includes("absint") || content.includes("wp_kses")) hasSanitization = true;
      if (content.includes("wp_nonce_field") || content.includes("wp_verify_nonce") || content.includes("check_ajax_referer")) hasNonces = true;
      if (content.includes("current_user_can")) hasCapabilityChecks = true;
      if (content.includes("$wpdb->prepare")) hasPreparedQueries = true;

      // Count direct superglobal usage without sanitization
      const superglobalMatches = content.match(/\$_(GET|POST|REQUEST|SERVER|COOKIE)\[/g);
      if (superglobalMatches) {
        directSuperglobals += superglobalMatches.length;
      }

      // Check for dangerous functions
      if (content.includes("eval(") || content.includes("eval (")) {
        items.push({ status: "fail", rule: "eval-usage", message: `eval() found in ${phpFile}. This is a security risk.` });
      }
      if (content.includes("extract(") || content.includes("extract (")) {
        items.push({ status: "warn", rule: "extract-usage", message: `extract() found in ${phpFile}. Makes debugging difficult.` });
      }
    }

    if (hasEscaping) items.push({ status: "pass", rule: "output-escaping", message: "Output escaping functions found." });
    else if (phpFiles.length > 1) items.push({ status: "warn", rule: "no-escaping", message: "No output escaping (esc_html, esc_attr, esc_url) detected." });

    if (hasSanitization) items.push({ status: "pass", rule: "input-sanitization", message: "Input sanitization functions found." });
    else if (directSuperglobals > 0) items.push({ status: "warn", rule: "no-sanitization", message: `${directSuperglobals} superglobal access(es) found but no sanitization functions detected.` });

    if (hasNonces) items.push({ status: "pass", rule: "nonce-verification", message: "Nonce verification found." });
    else items.push({ status: "info", rule: "no-nonces", message: "No nonce usage detected (may be fine for read-only plugins)." });

    if (hasCapabilityChecks) items.push({ status: "pass", rule: "capability-checks", message: "Capability checks (current_user_can) found." });

    if (hasPreparedQueries) items.push({ status: "pass", rule: "prepared-queries", message: "$wpdb->prepare() usage found." });

    // --- Code quality ---
    const hasReadme = allFiles.includes("readme.txt") || allFiles.includes("README.md");
    if (hasReadme) items.push({ status: "pass", rule: "readme", message: "Readme file found." });
    else items.push({ status: "warn", rule: "no-readme", message: "No readme.txt found (required for WordPress.org submission)." });

    // Check for translation functions
    let hasTranslations = false;
    for (const phpFile of phpFiles.slice(0, 10)) {
      const content = readFile(pluginPath, phpFile);
      if (content && (content.includes("__(" ) || content.includes("_e(") || content.includes("esc_html__("))) {
        hasTranslations = true;
        break;
      }
    }
    if (hasTranslations) items.push({ status: "pass", rule: "i18n", message: "Translation functions found." });
    else items.push({ status: "warn", rule: "no-i18n", message: "No translation functions detected. Plugin may not be translation-ready." });

    // Check for REST API
    for (const phpFile of phpFiles.slice(0, 10)) {
      const content = readFile(pluginPath, phpFile);
      if (content?.includes("register_rest_route")) {
        items.push({ status: "info", rule: "rest-api", message: "REST API endpoints registered." });
        if (!content.includes("permission_callback")) {
          items.push({ status: "warn", rule: "rest-no-permission", message: "REST route without permission_callback detected." });
        }
        break;
      }
    }

    // --- File stats ---
    const jsFiles = allFiles.filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
    const cssFiles = allFiles.filter((f) => f.endsWith(".css") || f.endsWith(".scss"));
    items.push({ status: "info", rule: "file-count", message: `Total files: ${allFiles.length} (PHP: ${phpFiles.length}, JS/TS: ${jsFiles.length}, CSS/SCSS: ${cssFiles.length})` });

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

    const response = `# Plugin Analysis ${statusEmoji}

**Plugin**: ${pluginName}
**Path**: ${pluginPath}
${mainFile ? `**Main File**: ${mainFile}` : ""}

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
${fails.length > 0 ? "\n⚠️ Fix the errors above for WordPress.org compliance." : "\n✅ Plugin structure looks good!"}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("analyze_plugin failed", { error: message });
    return errorResponse(message);
  }
}
