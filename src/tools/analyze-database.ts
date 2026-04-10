/**
 * Tool: analyze_database
 *
 * Analyzes WordPress database health: table sizes, orphaned data,
 * autoloaded options, revisions, transients, and optimization recommendations.
 */

import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

const execFileAsync = promisify(execFile);

export const analyzeDatabaseSchema = z.object({
  wpPath: z.string().describe("Absolute path to the WordPress installation."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
});

export type AnalyzeDatabaseInput = z.infer<typeof analyzeDatabaseSchema>;

async function wpQuery(sql: string, wpPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("wp", ["db", "query", sql, `--path=${wpPath}`], {
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
      cwd: wpPath,
    });
    return stdout.trim();
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return `[Error] ${e.stderr?.trim() || e.message || "Query failed"}`;
  }
}

async function wpCli(args: string[], wpPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("wp", [...args, `--path=${wpPath}`], {
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
      cwd: wpPath,
    });
    return stdout.trim();
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    return `[Error] ${e.stderr?.trim() || e.message || "Command failed"}`;
  }
}

export async function analyzeDatabase(input: AnalyzeDatabaseInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { wpPath } = input;
    logger.info("analyze_database called", { wpPath });

    // Get table prefix
    const prefix = await wpCli(["db", "prefix"], wpPath);
    const pfx = prefix.replace("[Error]", "wp_").trim();

    // Run all queries in parallel
    const [
      tableSizes,
      totalSize,
      revisionCount,
      trashCount,
      spamComments,
      trashComments,
      orphanedMeta,
      transientCount,
      autoloadSize,
      largestAutoload,
      postTypeCounts,
    ] = await Promise.all([
      wpCli(["db", "size", "--tables", "--human-readable", "--format=table"], wpPath),
      wpCli(["db", "size", "--human-readable"], wpPath),
      wpQuery(`SELECT COUNT(*) FROM ${pfx}posts WHERE post_type = 'revision';`, wpPath),
      wpQuery(`SELECT COUNT(*) FROM ${pfx}posts WHERE post_status = 'trash';`, wpPath),
      wpQuery(`SELECT COUNT(*) FROM ${pfx}comments WHERE comment_approved = 'spam';`, wpPath),
      wpQuery(`SELECT COUNT(*) FROM ${pfx}comments WHERE comment_approved = 'trash';`, wpPath),
      wpQuery(`SELECT COUNT(*) FROM ${pfx}postmeta pm LEFT JOIN ${pfx}posts p ON pm.post_id = p.ID WHERE p.ID IS NULL;`, wpPath),
      wpQuery(`SELECT COUNT(*) FROM ${pfx}options WHERE option_name LIKE '_transient_%';`, wpPath),
      wpQuery(`SELECT ROUND(SUM(LENGTH(option_value))/1024/1024, 2) FROM ${pfx}options WHERE autoload = 'yes';`, wpPath),
      wpQuery(`SELECT option_name, ROUND(LENGTH(option_value)/1024, 1) as size_kb FROM ${pfx}options WHERE autoload = 'yes' ORDER BY LENGTH(option_value) DESC LIMIT 15;`, wpPath),
      wpQuery(`SELECT post_type, COUNT(*) as cnt FROM ${pfx}posts GROUP BY post_type ORDER BY cnt DESC;`, wpPath),
    ]);

    // Parse counts (extract last number from query output)
    const parseCount = (s: string): number => {
      const lines = s.split("\n").filter((l) => /^\d+$/.test(l.trim()));
      return parseInt(lines[lines.length - 1] ?? "0") || 0;
    };

    const revisions = parseCount(revisionCount);
    const trash = parseCount(trashCount);
    const spam = parseCount(spamComments);
    const trashC = parseCount(trashComments);
    const orphaned = parseCount(orphanedMeta);
    const transients = parseCount(transientCount);

    // Parse autoload size
    const autoloadMB = parseFloat(autoloadSize.split("\n").pop()?.trim() ?? "0") || 0;

    // Build recommendations
    const recommendations: string[] = [];
    if (revisions > 100) recommendations.push(`Delete ${revisions} post revisions: \`wp post delete $(wp post list --post_type=revision --format=ids --path=${wpPath}) --force\``);
    if (trash > 0) recommendations.push(`Empty ${trash} trashed posts: \`wp post delete $(wp post list --post_status=trash --format=ids --path=${wpPath}) --force\``);
    if (spam > 0) recommendations.push(`Delete ${spam} spam comments: \`wp db query "DELETE FROM ${pfx}comments WHERE comment_approved = 'spam'" --path=${wpPath}\``);
    if (trashC > 0) recommendations.push(`Delete ${trashC} trashed comments`);
    if (orphaned > 0) recommendations.push(`Clean ${orphaned} orphaned postmeta entries: \`wp db query "DELETE pm FROM ${pfx}postmeta pm LEFT JOIN ${pfx}posts p ON pm.post_id = p.ID WHERE p.ID IS NULL" --path=${wpPath}\``);
    if (transients > 50) recommendations.push(`Clear ${transients} transients: \`wp transient delete --all --path=${wpPath}\``);
    if (autoloadMB > 1) recommendations.push(`Autoloaded options: ${autoloadMB}MB (should be < 1MB) — review large autoloaded options`);
    recommendations.push(`Optimize tables: \`wp db optimize --path=${wpPath}\``);

    // Calculate health score
    let score = 100;
    if (revisions > 500) score -= 15; else if (revisions > 100) score -= 5;
    if (orphaned > 100) score -= 15; else if (orphaned > 0) score -= 5;
    if (autoloadMB > 2) score -= 20; else if (autoloadMB > 1) score -= 10;
    if (spam > 100) score -= 10; else if (spam > 0) score -= 3;
    if (transients > 200) score -= 10; else if (transients > 50) score -= 3;
    score = Math.max(0, score);

    const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

    const response = `# Database Analysis

**Path**: ${wpPath}
**Total Size**: ${totalSize}
**Health Score**: **${score}/100** (${grade})

---

## Bloat Detection

| Metric | Count | Status |
|:-------|:------|:-------|
| Post Revisions | ${revisions} | ${revisions > 100 ? "⚠️ Clean up" : "✅"} |
| Trashed Posts | ${trash} | ${trash > 0 ? "⚠️ Empty trash" : "✅"} |
| Spam Comments | ${spam} | ${spam > 0 ? "⚠️ Delete" : "✅"} |
| Trashed Comments | ${trashC} | ${trashC > 0 ? "⚠️ Delete" : "✅"} |
| Orphaned Postmeta | ${orphaned} | ${orphaned > 0 ? "⚠️ Clean up" : "✅"} |
| Transients | ${transients} | ${transients > 50 ? "⚠️ Clear" : "✅"} |
| Autoloaded Options | ${autoloadMB} MB | ${autoloadMB > 1 ? "⚠️ Too large" : "✅"} |

## Table Sizes
\`\`\`
${tableSizes.substring(0, 2000)}
\`\`\`

## Post Type Distribution
\`\`\`
${postTypeCounts.substring(0, 1000)}
\`\`\`

## Largest Autoloaded Options
\`\`\`
${largestAutoload.substring(0, 1000)}
\`\`\`

## Recommendations
${recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("analyze_database failed", { error: message });
    return errorResponse(message);
  }
}
