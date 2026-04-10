/**
 * Tool: fetch_full_docs
 *
 * Retrieves complete documentation pages from developer.wordpress.org.
 * Use this after finding relevant URLs via search_docs.
 */

import { z } from "zod";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { fetchText, stripHtml } from "../utils/http.js";
import { logger } from "../utils/logger.js";

export const fetchFullDocsSchema = z.object({
  url: z.string().url().describe(
    "Full URL or path of the documentation page to fetch. Example: 'https://developer.wordpress.org/rest-api/reference/posts/' or '/rest-api/reference/posts/'"
  ),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
});

export type FetchFullDocsInput = z.infer<typeof fetchFullDocsSchema>;

function normalizeUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base = "https://developer.wordpress.org";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Extract the main content from a WordPress.org developer documentation page.
 * Strips navigation, sidebar, footer, and other non-content elements.
 */
function extractMainContent(html: string): string {
  // Try to extract content from <main> or article
  let content = html;

  // Remove script and style tags
  content = content.replace(/<script[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  content = content.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  content = content.replace(/<header[\s\S]*?<\/header>/gi, "");

  // Try to extract main content area
  const mainMatch = content.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    content = mainMatch[1];
  } else {
    const articleMatch = content.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      content = articleMatch[1];
    }
  }

  // Extract title
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : "Documentation";

  // Preserve code blocks by converting them
  content = content.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return `\n\`\`\`\n${stripHtml(code)}\n\`\`\`\n`;
  });
  content = content.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => {
    return `\`${stripHtml(code)}\``;
  });

  // Convert headers
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n# ${stripHtml(text)}\n`);
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n## ${stripHtml(text)}\n`);
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n### ${stripHtml(text)}\n`);
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => `\n#### ${stripHtml(text)}\n`);

  // Convert lists
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `- ${stripHtml(text)}\n`);

  // Convert paragraphs
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `\n${stripHtml(text)}\n`);

  // Convert links
  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    return `[${stripHtml(text)}](${href})`;
  });

  // Final strip of remaining HTML tags
  content = stripHtml(content);

  // Clean up extra whitespace
  content = content.replace(/\n{3,}/g, "\n\n").trim();

  return `# ${title}\n\n${content}`;
}

export async function fetchFullDocs(input: FetchFullDocsInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const url = normalizeUrl(input.url);
    logger.info("fetch_full_docs called", { url });

    const html = await fetchText(url, { timeout: 20_000 });
    const content = extractMainContent(html);

    if (content.length < 100) {
      return errorResponse(
        `The page at ${url} returned very little content. The page may not exist or may require authentication. ` +
          `Try searching for the topic with search_docs instead.`
      );
    }

    // Truncate very long documents
    const MAX_LENGTH = 30_000;
    const truncated = content.length > MAX_LENGTH;
    const finalContent = truncated ? content.slice(0, MAX_LENGTH) + "\n\n[... content truncated ...]" : content;

    return successResponse(
      `# Full Documentation\n\n**Source**: ${url}\n${truncated ? "**Note**: Content was truncated due to length.\n" : ""}\n---\n\n${finalContent}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("fetch_full_docs failed", { error: message });
    return errorResponse(`Failed to fetch documentation from ${input.url}: ${message}`);
  }
}
