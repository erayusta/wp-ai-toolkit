/**
 * Tool: check_site_health
 *
 * Comprehensive WordPress site health check.
 * Verifies checksums, checks for updates, PHP version,
 * database status, and security indicators.
 */

import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

const execFileAsync = promisify(execFile);

export const checkSiteHealthSchema = z.object({
  wpPath: z.string().describe("Absolute path to the WordPress installation."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
});

export type CheckSiteHealthInput = z.infer<typeof checkSiteHealthSchema>;

async function wpCli(args: string[], wpPath: string): Promise<{ ok: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync("wp", [...args, `--path=${wpPath}`], {
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
      cwd: wpPath,
    });
    return { ok: true, output: (stdout + stderr).trim() };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, output: (e.stdout ?? "") + (e.stderr ?? e.message ?? "Error") };
  }
}

export async function checkSiteHealth(input: CheckSiteHealthInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { wpPath } = input;
    logger.info("check_site_health called", { wpPath });

    // Run all checks in parallel
    const [
      coreVersion,
      coreChecksums,
      phpVersion,
      dbCheck,
      dbSize,
      pluginUpdates,
      themeUpdates,
      coreUpdate,
      cronTest,
      activePlugins,
      activeTheme,
      siteUrl,
      homeUrl,
      permalink,
      _options,
    ] = await Promise.all([
      wpCli(["core", "version"], wpPath),
      wpCli(["core", "verify-checksums"], wpPath),
      wpCli(["eval", "echo phpversion();"], wpPath),
      wpCli(["db", "check"], wpPath),
      wpCli(["db", "size", "--human-readable"], wpPath),
      wpCli(["plugin", "list", "--update=available", "--format=table", "--fields=name,version,update_version"], wpPath),
      wpCli(["theme", "list", "--update=available", "--format=table", "--fields=name,version,update_version"], wpPath),
      wpCli(["core", "check-update"], wpPath),
      wpCli(["cron", "test"], wpPath),
      wpCli(["plugin", "list", "--status=active", "--format=count"], wpPath),
      wpCli(["theme", "list", "--status=active", "--field=name"], wpPath),
      wpCli(["option", "get", "siteurl"], wpPath),
      wpCli(["option", "get", "home"], wpPath),
      wpCli(["option", "get", "permalink_structure"], wpPath),
      wpCli(["db", "query", `SELECT COUNT(*) as cnt FROM $(wp db prefix --path=${wpPath} 2>/dev/null || echo 'wp_')options WHERE autoload='yes'`], wpPath),
    ]);

    // Score calculation
    let score = 0;
    const checks: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Core integrity
    if (coreChecksums.ok && !coreChecksums.output.includes("File doesn't verify")) {
      score += 15;
      checks.push("Core files integrity verified");
    } else {
      errors.push("Core files have been modified — run `wp core download --force`");
    }

    // PHP version
    const phpVer = parseFloat(phpVersion.output);
    if (phpVer >= 8.2) { score += 10; checks.push(`PHP ${phpVersion.output}`); }
    else if (phpVer >= 8.0) { score += 7; checks.push(`PHP ${phpVersion.output}`); warnings.push("Consider upgrading to PHP 8.2+"); }
    else if (phpVer >= 7.4) { score += 3; warnings.push(`PHP ${phpVersion.output} — upgrade to 8.0+ recommended`); }
    else { errors.push(`PHP ${phpVersion.output} — critical: upgrade to 8.0+`); }

    // Database
    if (dbCheck.ok) { score += 10; checks.push("Database tables healthy"); }
    else { errors.push("Database tables have issues — run `wp db repair`"); }

    // WordPress version & updates
    if (coreUpdate.output.includes("WordPress is at the latest version") || coreUpdate.output.trim() === "") {
      score += 10; checks.push(`WordPress ${coreVersion.output} (latest)`);
    } else {
      warnings.push(`WordPress ${coreVersion.output} — update available`);
      score += 5;
    }

    // Plugin updates
    const pluginUpdateCount = pluginUpdates.output.split("\n").filter((l) => l.includes("available")).length;
    if (pluginUpdateCount === 0) {
      score += 10; checks.push("All plugins up to date");
    } else if (pluginUpdateCount <= 2) {
      score += 5; warnings.push(`${pluginUpdateCount} plugin update(s) available`);
    } else {
      errors.push(`${pluginUpdateCount} plugin updates available — update ASAP`);
    }

    // Theme updates
    const themeUpdateCount = themeUpdates.output.split("\n").filter((l) => l.includes("available")).length;
    if (themeUpdateCount === 0) {
      score += 5; checks.push("Theme up to date");
    } else {
      warnings.push(`${themeUpdateCount} theme update(s) available`);
    }

    // Cron
    if (cronTest.ok && !cronTest.output.includes("Error")) {
      score += 10; checks.push("WP-Cron operational");
    } else {
      warnings.push("WP-Cron may not be working properly");
      score += 3;
    }

    // HTTPS
    const isHttps = siteUrl.output.startsWith("https://");
    if (isHttps) { score += 10; checks.push("HTTPS enabled"); }
    else { errors.push("Site not using HTTPS — enable SSL"); }

    // URL consistency
    if (siteUrl.output === homeUrl.output) {
      score += 5; checks.push("Site URL and Home URL match");
    } else {
      warnings.push(`URL mismatch: siteurl=${siteUrl.output}, home=${homeUrl.output}`);
    }

    // Permalinks
    if (permalink.output && permalink.output !== "") {
      score += 5; checks.push(`Permalinks: ${permalink.output}`);
    } else {
      warnings.push("Using plain permalinks — set to /%postname%/ for SEO");
    }

    // DB size
    score += 10; // baseline for having a running DB

    const totalScore = Math.min(100, score);
    const grade = totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : totalScore >= 50 ? "D" : "F";

    const response = `# WordPress Site Health Report

**Site**: ${siteUrl.output}
**WordPress**: ${coreVersion.output}
**PHP**: ${phpVersion.output}
**Theme**: ${activeTheme.output}
**Active Plugins**: ${activePlugins.output}
**Health Score**: **${totalScore}/100** (${grade})

---

## Passed (${checks.length})
${checks.map((c) => `- ✅ ${c}`).join("\n")}

## Warnings (${warnings.length})
${warnings.length > 0 ? warnings.map((w) => `- ⚠️ ${w}`).join("\n") : "_(none)_"}

## Errors (${errors.length})
${errors.length > 0 ? errors.map((e) => `- ❌ ${e}`).join("\n") : "_(none)_"}

---

## Database
\`\`\`
${dbSize.output.substring(0, 1000)}
\`\`\`

${pluginUpdateCount > 0 ? `## Plugin Updates Available\n\`\`\`\n${pluginUpdates.output.substring(0, 500)}\n\`\`\`\n` : ""}
${themeUpdateCount > 0 ? `## Theme Updates Available\n\`\`\`\n${themeUpdates.output.substring(0, 300)}\n\`\`\`\n` : ""}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("check_site_health failed", { error: message });
    return errorResponse(message);
  }
}
