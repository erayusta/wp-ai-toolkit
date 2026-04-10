/**
 * Tool: search_docs
 *
 * Searches WordPress developer documentation (developer.wordpress.org)
 * and returns relevant documentation chunks with code examples.
 */

import { z } from "zod";
import { successResponse, errorResponse, type ToolResponse, type DocChunk } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { fetchJson, stripHtml } from "../utils/http.js";
import { logger } from "../utils/logger.js";

export const searchDocsSchema = z.object({
  query: z.string().describe("Search query for WordPress documentation. Be specific, e.g. 'register custom post type', 'enqueue scripts', 'block.json attributes'."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  category: z
    .enum(["reference", "handbook", "code-reference", "plugins", "themes", "rest-api", "block-editor", "all"])
    .optional()
    .default("all")
    .describe("Category to filter documentation search. Defaults to 'all'."),
  limit: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(5)
    .describe("Maximum number of results to return (1-20). Defaults to 5."),
});

export type SearchDocsInput = z.infer<typeof searchDocsSchema>;

interface WpOrgSearchResult {
  id: number;
  title: { rendered: string };
  link: string;
  excerpt: { rendered: string };
  type: string;
}

const DOC_URLS: Record<string, string> = {
  "code-reference": "https://developer.wordpress.org/wp-json/wp/v2/search?search={query}&type=post&subtype=wp-parser-function,wp-parser-hook,wp-parser-class,wp-parser-method&per_page={limit}",
  "rest-api": "https://developer.wordpress.org/wp-json/wp/v2/search?search={query}&type=post&per_page={limit}",
  "block-editor": "https://developer.wordpress.org/wp-json/wp/v2/search?search={query}&type=post&per_page={limit}",
  all: "https://developer.wordpress.org/wp-json/wp/v2/search?search={query}&per_page={limit}",
};

export async function searchDocs(input: SearchDocsInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { query, category, limit } = input;
    logger.info("search_docs called", { query, category, limit });

    const chunks: DocChunk[] = [];

    // Search developer.wordpress.org REST API
    const searchUrl = (DOC_URLS[category ?? "all"] ?? DOC_URLS.all)
      .replace("{query}", encodeURIComponent(query))
      .replace("{limit}", String(limit));

    try {
      const results = await fetchJson<WpOrgSearchResult[]>(searchUrl);

      for (const result of results) {
        chunks.push({
          title: stripHtml(result.title?.rendered ?? result.title?.toString() ?? "Untitled"),
          url: result.link ?? "",
          content: stripHtml(result.excerpt?.rendered ?? ""),
          section: result.type ?? "unknown",
          relevanceScore: 1,
        });
      }
    } catch (fetchError) {
      logger.warn("Primary doc search failed, using fallback", {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      });

      // Fallback: Search using the WordPress.org general search
      try {
        const fallbackUrl = `https://developer.wordpress.org/wp-json/wp/v2/search?search=${encodeURIComponent(query)}&per_page=${limit}`;
        const fallbackResults = await fetchJson<WpOrgSearchResult[]>(fallbackUrl);

        for (const result of fallbackResults) {
          chunks.push({
            title: stripHtml(result.title?.rendered ?? result.title?.toString() ?? "Untitled"),
            url: result.link ?? "",
            content: stripHtml(result.excerpt?.rendered ?? ""),
            section: result.type ?? "unknown",
            relevanceScore: 0.8,
          });
        }
      } catch {
        logger.warn("Fallback doc search also failed");
      }
    }

    if (chunks.length === 0) {
      return successResponse(
        `No documentation found for "${query}". Try:\n` +
          `- Using different search terms\n` +
          `- Checking the category filter (current: ${category})\n` +
          `- Using fetch_full_docs with a known URL path\n\n` +
          `Common documentation URLs:\n` +
          `- https://developer.wordpress.org/plugins/\n` +
          `- https://developer.wordpress.org/themes/\n` +
          `- https://developer.wordpress.org/rest-api/\n` +
          `- https://developer.wordpress.org/block-editor/\n` +
          `- https://developer.wordpress.org/apis/\n`
      );
    }

    const formatted = chunks
      .map((chunk, i) => {
        return `### ${i + 1}. ${chunk.title}\n**URL**: ${chunk.url}\n**Section**: ${chunk.section}\n\n${chunk.content}\n`;
      })
      .join("\n---\n\n");

    const response = `# Documentation Search Results

**Query**: "${query}"
**Category**: ${category}
**Results**: ${chunks.length}

---

${formatted}

---

💡 **Tip**: Use \`fetch_full_docs\` with any URL above to get the complete documentation page.`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("search_docs failed", { error: message });
    return errorResponse(message);
  }
}
