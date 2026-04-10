/**
 * Tool: manage_wp_site
 *
 * Executes WP-CLI commands against a WordPress installation.
 * Provides store/site management capabilities similar to Shopify's store execute.
 */

import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

const execFileAsync = promisify(execFile);

export const manageWpSiteSchema = z.object({
  command: z
    .string()
    .describe(
      `WP-CLI command to execute (without the 'wp' prefix). Examples:
- "post list --post_type=page --format=json"
- "plugin list --format=table"
- "option get blogname"
- "user list --role=administrator"
- "theme status"
- "db export backup.sql"
- "scaffold plugin my-plugin"
- "cron event list"
- "rewrite flush"
- "cache flush"`
    ),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  wpPath: z
    .string()
    .optional()
    .describe("Path to the WordPress installation. Defaults to current directory."),
  format: z
    .enum(["table", "json", "csv", "yaml", "count"])
    .optional()
    .describe("Output format. Will be appended as --format flag if not already in the command."),
});

export type ManageWpSiteInput = z.infer<typeof manageWpSiteSchema>;

// Commands that are considered dangerous and need extra confirmation
const DANGEROUS_PATTERNS = [
  /\bdb\s+drop\b/i,
  /\bdb\s+reset\b/i,
  /\bsite\s+delete\b/i,
  /\buser\s+delete\b/i,
  /\b--force\b/i,
  /\bdb\s+query\s+.*DROP/i,
  /\bdb\s+query\s+.*DELETE/i,
  /\bdb\s+query\s+.*TRUNCATE/i,
  /\bsearch-replace\b/i,
  /\bcore\s+update\b/i,
];

// Commands that are blocked entirely
const BLOCKED_PATTERNS = [
  /\beval\b/i,
  /\beval-file\b/i,
  /\bshell\b/i,
  /[;&|`$]/,  // Shell injection characters
];

function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some((p) => p.test(command));
}

function isBlocked(command: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(command));
}

export async function manageWpSite(input: ManageWpSiteInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    let { command } = input;
    const { wpPath, format } = input;
    logger.info("manage_wp_site called", { command, wpPath });

    // Security: Block dangerous commands
    if (isBlocked(command)) {
      return errorResponse(
        `Command blocked for security reasons. The following are not allowed:\n` +
          `- eval / eval-file / shell commands\n` +
          `- Shell injection characters (; & | \` $)\n\n` +
          `If you need to run this command, please do it directly in your terminal.`
      );
    }

    // Warn about dangerous commands
    if (isDangerous(command)) {
      return successResponse(
        `⚠️ **DANGEROUS COMMAND DETECTED**\n\n` +
          `Command: \`wp ${command}\`\n\n` +
          `This command may cause data loss or irreversible changes:\n` +
          `- Database drops/resets\n` +
          `- User/site deletion\n` +
          `- Search-replace operations\n` +
          `- Core updates\n\n` +
          `If you're sure, run this command directly in your terminal:\n` +
          `\`\`\`bash\nwp ${command}${wpPath ? ` --path="${wpPath}"` : ""}\n\`\`\`\n\n` +
          `The manage_wp_site tool does not execute destructive commands automatically.`
      );
    }

    // Append format if specified and not already in command
    if (format && !command.includes("--format")) {
      command += ` --format=${format}`;
    }

    // Build the full command args
    const args = command.split(/\s+/);
    if (wpPath) {
      args.push(`--path=${wpPath}`);
    }

    try {
      const { stdout, stderr } = await execFileAsync("wp", args, {
        timeout: 30_000,
        maxBuffer: 1024 * 1024, // 1MB
        cwd: wpPath || process.cwd(),
      });

      const output = stdout.trim();
      const errorOutput = stderr.trim();

      let response = `# WP-CLI Command Result\n\n**Command**: \`wp ${command}\`\n`;

      if (wpPath) {
        response += `**Path**: ${wpPath}\n`;
      }

      response += `**Status**: ✅ Success\n\n`;

      if (output) {
        response += `## Output\n\`\`\`\n${output}\n\`\`\`\n`;
      } else {
        response += `## Output\n_(empty — command completed successfully with no output)_\n`;
      }

      if (errorOutput) {
        response += `\n## Notices\n\`\`\`\n${errorOutput}\n\`\`\`\n`;
      }

      return successResponse(response);
    } catch (execError) {
      const err = execError as { code?: number; stderr?: string; stdout?: string; message?: string };

      // WP-CLI not found
      if (err.message?.includes("ENOENT")) {
        return errorResponse(
          `WP-CLI is not installed or not in PATH.\n\n` +
            `## Install WP-CLI\n` +
            `\`\`\`bash\ncurl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar\nchmod +x wp-cli.phar\nsudo mv wp-cli.phar /usr/local/bin/wp\n\`\`\`\n\n` +
            `Or with Homebrew (macOS):\n` +
            `\`\`\`bash\nbrew install wp-cli\n\`\`\`\n\n` +
            `Verify installation:\n` +
            `\`\`\`bash\nwp --info\n\`\`\``
        );
      }

      // Command failed
      const output = err.stdout?.trim() ?? "";
      const errorOutput = err.stderr?.trim() ?? err.message ?? "Unknown error";

      return errorResponse(
        `WP-CLI command failed.\n\n` +
          `**Command**: \`wp ${command}\`\n` +
          `**Exit Code**: ${err.code ?? "unknown"}\n\n` +
          `## Error\n\`\`\`\n${errorOutput}\n\`\`\`\n` +
          (output ? `\n## Output\n\`\`\`\n${output}\n\`\`\`\n` : "") +
          `\n💡 **Tip**: Make sure you're running this from a WordPress installation directory, or specify the \`wpPath\` parameter.`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("manage_wp_site failed", { error: message });
    return errorResponse(message);
  }
}
