/**
 * Tool: debug_wordpress
 *
 * Debug and troubleshoot a WordPress installation.
 * Reads debug.log, checks debug constants, identifies PHP errors,
 * and provides diagnostic information.
 */

import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

const execFileAsync = promisify(execFile);

export const debugWordPressSchema = z.object({
  wpPath: z.string().describe("Absolute path to the WordPress installation."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  action: z
    .enum(["status", "errors", "config", "health", "conflicts"])
    .optional()
    .default("status")
    .describe(`Action to perform:
- status: Overall debug status (constants, PHP version, log size)
- errors: Read last errors from debug.log
- config: Check wp-config.php debug constants
- health: Run WP-CLI diagnostics (verify checksums, check DB, cron)
- conflicts: List active plugins for conflict detection`),
  lines: z.number().optional().default(30).describe("Number of log lines to read (for 'errors' action)."),
});

export type DebugWordPressInput = z.infer<typeof debugWordPressSchema>;

async function wpCli(args: string[], wpPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("wp", [...args, `--path=${wpPath}`], {
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
      cwd: wpPath,
    });
    return stdout.trim();
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    return `[WP-CLI Error] ${e.stderr?.trim() || e.message || "Unknown error"}`;
  }
}

export async function debugWordPress(input: DebugWordPressInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { wpPath, action, lines } = input;
    logger.info("debug_wordpress called", { wpPath, action });

    if (!existsSync(wpPath)) {
      return errorResponse(`WordPress path not found: ${wpPath}`);
    }

    let response = "";

    switch (action) {
      case "status": {
        const [phpVersion, wpVersion, plugins, debugLog] = await Promise.all([
          wpCli(["eval", "echo phpversion();"], wpPath),
          wpCli(["core", "version"], wpPath),
          wpCli(["plugin", "list", "--format=csv", "--fields=name,status,version,update"], wpPath),
          (async () => {
            const logPath = join(wpPath, "wp-content/debug.log");
            if (!existsSync(logPath)) return { exists: false, size: 0 };
            const stat = statSync(logPath);
            return { exists: true, size: stat.size };
          })(),
        ]);

        // Check wp-config for debug constants
        const configPath = join(wpPath, "wp-config.php");
        let debugEnabled = false;
        let debugLogEnabled = false;
        let debugDisplay = false;
        let scriptDebug = false;

        if (existsSync(configPath)) {
          const config = readFileSync(configPath, "utf-8");
          debugEnabled = /define\s*\(\s*['"]WP_DEBUG['"]\s*,\s*true\s*\)/i.test(config);
          debugLogEnabled = /define\s*\(\s*['"]WP_DEBUG_LOG['"]\s*,\s*true\s*\)/i.test(config);
          debugDisplay = /define\s*\(\s*['"]WP_DEBUG_DISPLAY['"]\s*,\s*true\s*\)/i.test(config);
          scriptDebug = /define\s*\(\s*['"]SCRIPT_DEBUG['"]\s*,\s*true\s*\)/i.test(config);
        }

        const activePlugins = plugins.split("\n").filter((l) => l.includes(",active,")).length;
        const updatesAvailable = plugins.split("\n").filter((l) => l.includes("available")).length;

        response = `# WordPress Debug Status

**WordPress**: ${wpVersion}
**PHP**: ${phpVersion}
**Path**: ${wpPath}

## Debug Constants
| Constant | Value |
|:---------|:------|
| WP_DEBUG | ${debugEnabled ? "**ON**" : "OFF"} |
| WP_DEBUG_LOG | ${debugLogEnabled ? "**ON**" : "OFF"} |
| WP_DEBUG_DISPLAY | ${debugDisplay ? "**ON** (dangerous in production!)" : "OFF"} |
| SCRIPT_DEBUG | ${scriptDebug ? "ON" : "OFF"} |

## Debug Log
- **Exists**: ${debugLog.exists ? "Yes" : "No"}
${debugLog.exists ? `- **Size**: ${(debugLog.size / 1024).toFixed(1)} KB${debugLog.size > 10 * 1024 * 1024 ? " (LARGE — consider clearing)" : ""}` : "- Enable WP_DEBUG_LOG to start logging"}

## Plugins
- **Active**: ${activePlugins}
- **Updates available**: ${updatesAvailable}${updatesAvailable > 0 ? " (update recommended)" : ""}

${!debugEnabled ? "**Tip**: Enable WP_DEBUG in wp-config.php to see errors:\n```php\ndefine('WP_DEBUG', true);\ndefine('WP_DEBUG_LOG', true);\ndefine('WP_DEBUG_DISPLAY', false);\n```" : ""}`;
        break;
      }

      case "errors": {
        const logPath = join(wpPath, "wp-content/debug.log");
        if (!existsSync(logPath)) {
          response = `# Debug Log\n\n**File not found**: ${logPath}\n\nEnable debug logging in wp-config.php:\n\`\`\`php\ndefine('WP_DEBUG', true);\ndefine('WP_DEBUG_LOG', true);\n\`\`\``;
          break;
        }

        const logContent = readFileSync(logPath, "utf-8");
        const logLines = logContent.split("\n").filter((l) => l.trim().length > 0);
        const lastLines = logLines.slice(-lines);

        // Categorize errors
        const fatals = lastLines.filter((l) => /fatal/i.test(l));
        const warnings = lastLines.filter((l) => /warning/i.test(l) && !/fatal/i.test(l));
        const notices = lastLines.filter((l) => /notice|deprecated/i.test(l));
        const others = lastLines.filter((l) => !/fatal|warning|notice|deprecated/i.test(l));

        response = `# Debug Log — Last ${lastLines.length} entries

**Total lines in log**: ${logLines.length}
**Fatal errors**: ${fatals.length}
**Warnings**: ${warnings.length}
**Notices/Deprecated**: ${notices.length}

${fatals.length > 0 ? `## Fatal Errors\n\`\`\`\n${fatals.slice(-10).join("\n")}\n\`\`\`\n` : ""}
${warnings.length > 0 ? `## Warnings\n\`\`\`\n${warnings.slice(-10).join("\n")}\n\`\`\`\n` : ""}
${notices.length > 0 ? `## Notices & Deprecated\n\`\`\`\n${notices.slice(-10).join("\n")}\n\`\`\`\n` : ""}
${others.length > 0 ? `## Other\n\`\`\`\n${others.slice(-5).join("\n")}\n\`\`\`\n` : ""}`;
        break;
      }

      case "config": {
        const configPath = join(wpPath, "wp-config.php");
        if (!existsSync(configPath)) {
          return errorResponse(`wp-config.php not found at ${configPath}`);
        }

        const config = readFileSync(configPath, "utf-8");
        const constants: Array<{ name: string; value: string; recommendation: string }> = [];

        const checks = [
          { name: "WP_DEBUG", rec: "true for dev, false for production" },
          { name: "WP_DEBUG_LOG", rec: "true to log errors to debug.log" },
          { name: "WP_DEBUG_DISPLAY", rec: "false in production (never show errors to users)" },
          { name: "SCRIPT_DEBUG", rec: "true for unminified core JS/CSS" },
          { name: "SAVEQUERIES", rec: "true to log all DB queries (dev only, performance impact)" },
          { name: "WP_MEMORY_LIMIT", rec: "256M recommended" },
          { name: "WP_MAX_MEMORY_LIMIT", rec: "512M for admin" },
          { name: "DISALLOW_FILE_EDIT", rec: "true in production" },
          { name: "DISALLOW_FILE_MODS", rec: "true to prevent plugin/theme installs" },
          { name: "WP_POST_REVISIONS", rec: "5 to limit database bloat" },
          { name: "EMPTY_TRASH_DAYS", rec: "7 to auto-empty trash" },
          { name: "DISABLE_WP_CRON", rec: "true + system cron for production" },
          { name: "FORCE_SSL_ADMIN", rec: "true for HTTPS admin" },
        ];

        for (const check of checks) {
          const regex = new RegExp(`define\\s*\\(\\s*['"]${check.name}['"]\\s*,\\s*(.+?)\\s*\\)`, "i");
          const match = config.match(regex);
          constants.push({
            name: check.name,
            value: match ? match[1].replace(/['"]/g, "").trim() : "not set",
            recommendation: check.rec,
          });
        }

        const rows = constants.map((c) => `| \`${c.name}\` | ${c.value} | ${c.recommendation} |`).join("\n");

        response = `# wp-config.php Debug Constants

| Constant | Current Value | Recommendation |
|:---------|:-------------|:---------------|
${rows}`;
        break;
      }

      case "health": {
        const [checksums, dbCheck, cronTest, phpVersion] = await Promise.all([
          wpCli(["core", "verify-checksums"], wpPath),
          wpCli(["db", "check"], wpPath),
          wpCli(["cron", "test"], wpPath),
          wpCli(["eval", "echo phpversion();"], wpPath),
        ]);

        const coreOk = !checksums.includes("Error") && !checksums.includes("File doesn't verify");
        const dbOk = dbCheck.includes("OK") || !dbCheck.includes("Error");
        const cronOk = !cronTest.includes("Error");

        response = `# WordPress Health Check

## Core File Integrity
${coreOk ? "✅ Core files verified — no modifications detected" : "❌ Core file issues:\n```\n" + checksums.substring(0, 500) + "\n```"}

## Database
${dbOk ? "✅ Database tables are healthy" : "❌ Database issues:\n```\n" + dbCheck.substring(0, 500) + "\n```"}

## WP-Cron
${cronOk ? "✅ WP-Cron is operational" : "⚠️ WP-Cron issue:\n```\n" + cronTest.substring(0, 200) + "\n```"}

## PHP Version
**${phpVersion}** ${parseFloat(phpVersion) >= 8.0 ? "✅" : "⚠️ Consider upgrading to PHP 8.0+"}`;
        break;
      }

      case "conflicts": {
        const plugins = await wpCli(["plugin", "list", "--format=table", "--fields=name,status,version"], wpPath);

        response = `# Plugin Conflict Detection

## Active Plugins
\`\`\`
${plugins}
\`\`\`

## Troubleshooting Steps

1. **Deactivate all plugins**: \`wp plugin deactivate --all --path=${wpPath}\`
2. **Check if issue persists** — if fixed, it's a plugin conflict
3. **Activate one by one**: \`wp plugin activate <name> --path=${wpPath}\`
4. **Check after each activation** until the conflict appears
5. **Reactivate all**: \`wp plugin activate --all --path=${wpPath}\`

**Quick test** (deactivate/reactivate in one session):
\`\`\`bash
wp plugin deactivate --all --path=${wpPath}
# Test your site...
wp plugin activate --all --path=${wpPath}
\`\`\``;
        break;
      }
    }

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("debug_wordpress failed", { error: message });
    return errorResponse(message);
  }
}
