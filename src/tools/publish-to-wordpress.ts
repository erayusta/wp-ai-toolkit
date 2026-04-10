/**
 * Tool: publish_to_wordpress
 *
 * Publishes content to WordPress via REST API with Yoast SEO metadata support.
 * Handles post creation/update, featured images, categories, tags, and Yoast fields.
 * Port of SEO Machine's wordpress_publisher.py to TypeScript.
 */

import { z } from "zod";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const publishToWordPressSchema = z.object({
  siteUrl: z.string().url().describe("WordPress site URL (e.g., https://example.com)"),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  title: z.string().describe("Post title."),
  content: z.string().describe("Post content (HTML)."),
  status: z
    .enum(["draft", "publish", "pending", "private", "future"])
    .optional()
    .default("draft")
    .describe("Post status. Defaults to 'draft' for safety."),
  postType: z
    .string()
    .optional()
    .default("posts")
    .describe("Post type endpoint: 'posts', 'pages', or custom post type slug."),
  excerpt: z.string().optional().describe("Post excerpt."),
  slug: z.string().optional().describe("URL slug."),
  categories: z.array(z.number()).optional().describe("Category IDs."),
  tags: z.array(z.number()).optional().describe("Tag IDs."),
  featuredImageId: z.number().optional().describe("Featured image (attachment) ID."),
  author: z.number().optional().describe("Author user ID."),
  // Yoast SEO fields
  yoastTitle: z.string().optional().describe("Yoast SEO title (meta title)."),
  yoastDescription: z.string().optional().describe("Yoast SEO meta description."),
  yoastFocusKeyword: z.string().optional().describe("Yoast focus keyword."),
  // Authentication
  username: z.string().optional().describe("WordPress username for Basic Auth."),
  applicationPassword: z.string().optional().describe("WordPress Application Password for auth."),
  postId: z.number().optional().describe("If provided, updates an existing post instead of creating a new one."),
});

export type PublishToWordPressInput = z.infer<typeof publishToWordPressSchema>;

export async function publishToWordPress(input: PublishToWordPressInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const {
      siteUrl, title, content, status, postType, excerpt, slug,
      categories, tags, featuredImageId, author, postId,
      yoastTitle, yoastDescription, yoastFocusKeyword,
      username, applicationPassword,
    } = input;

    logger.info("publish_to_wordpress called", { siteUrl, title: title.substring(0, 50), status, postId });

    const baseUrl = siteUrl.replace(/\/$/, "");
    const endpoint = postId
      ? `${baseUrl}/wp-json/wp/v2/${postType}/${postId}`
      : `${baseUrl}/wp-json/wp/v2/${postType}`;

    const method = postId ? "PUT" : "POST";

    // Build post data
    const postData: Record<string, unknown> = {
      title,
      content,
      status,
    };

    if (excerpt) postData.excerpt = excerpt;
    if (slug) postData.slug = slug;
    if (categories) postData.categories = categories;
    if (tags) postData.tags = tags;
    if (featuredImageId) postData.featured_media = featuredImageId;
    if (author) postData.author = author;

    // Yoast SEO metadata (requires Yoast REST API plugin or our MU-plugin)
    const meta: Record<string, string> = {};
    if (yoastTitle) meta._yoast_wpseo_title = yoastTitle;
    if (yoastDescription) meta._yoast_wpseo_metadesc = yoastDescription;
    if (yoastFocusKeyword) meta._yoast_wpseo_focuskw = yoastFocusKeyword;

    if (Object.keys(meta).length > 0) {
      postData.meta = meta;
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "wp-ai-toolkit/1.0.0",
    };

    if (username && applicationPassword) {
      const credentials = Buffer.from(`${username}:${applicationPassword}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    // Make request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(postData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // use default message
        }

        if (response.status === 401) {
          return errorResponse(
            `Authentication failed (401).\n\n` +
            `Make sure you provide valid credentials:\n` +
            `- **username**: Your WordPress username\n` +
            `- **applicationPassword**: Generate at WordPress Admin > Users > Profile > Application Passwords\n\n` +
            `Error: ${errorMessage}`
          );
        }

        if (response.status === 403) {
          return errorResponse(
            `Permission denied (403). The user doesn't have permission to ${postId ? "edit" : "create"} ${postType}.\n\n` +
            `Error: ${errorMessage}`
          );
        }

        return errorResponse(`WordPress API error: ${errorMessage}`);
      }

      const result = await response.json() as Record<string, unknown>;
      const resultId = result.id as number;
      const resultLink = result.link as string;
      const resultStatus = result.status as string;

      const action = postId ? "Updated" : "Created";

      let yoastInfo = "";
      if (yoastTitle || yoastDescription || yoastFocusKeyword) {
        yoastInfo = `\n## Yoast SEO Metadata\n`;
        if (yoastTitle) yoastInfo += `- **SEO Title**: ${yoastTitle}\n`;
        if (yoastDescription) yoastInfo += `- **Meta Description**: ${yoastDescription}\n`;
        if (yoastFocusKeyword) yoastInfo += `- **Focus Keyword**: ${yoastFocusKeyword}\n`;
        yoastInfo += `\n> Note: Yoast fields require the seo-machine-yoast-rest.php MU-plugin to be installed.\n> See \`wordpress/\` directory in the toolkit.\n`;
      }

      return successResponse(
        `# WordPress Post ${action}\n\n` +
        `**Post ID**: ${resultId}\n` +
        `**Status**: ${resultStatus}\n` +
        `**URL**: ${resultLink}\n` +
        `**Action**: ${action}\n` +
        `**Type**: ${postType}\n` +
        yoastInfo +
        `\n---\n\n` +
        (resultStatus === "draft"
          ? `Post saved as draft. Preview it in WordPress admin or change status to 'publish' to make it live.`
          : `Post is now live at: ${resultLink}`)
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return errorResponse("Request timed out after 30 seconds. Check if the WordPress site is accessible.");
      }
      throw fetchError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("publish_to_wordpress failed", { error: message });
    return errorResponse(message);
  }
}
