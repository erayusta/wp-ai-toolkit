/**
 * Tool: learn_wordpress_api
 *
 * MANDATORY FIRST STEP — must be called before any other WP AI Toolkit tool.
 * Returns a conversationId that is required for all subsequent tool calls.
 * Can be called multiple times to load context for different WordPress APIs.
 */

import { z } from "zod";
import { VALID_APIS, type WordPressApi, successResponse, errorResponse, type ToolResponse } from "../types.js";
import { createConversation, addApiToConversation } from "../utils/conversation.js";
import { API_DESCRIPTIONS } from "../data/wp-api-descriptions.js";
import { logger } from "../utils/logger.js";

export const learnWordPressApiSchema = z.object({
  api: z
    .enum(VALID_APIS as [string, ...string[]])
    .describe(
      `The WordPress API domain to learn about. Valid values:
- rest-api: WordPress REST API for CRUD operations
- hooks: Actions and Filters system
- blocks: Block development (Gutenberg blocks, block.json)
- themes: Theme development (classic & block themes, theme.json)
- plugins: Plugin development
- woocommerce: WooCommerce development and WC REST API
- wp-cli: WP-CLI command-line management
- gutenberg: Block Editor / Full Site Editing internals
- multisite: WordPress Multisite network
- custom-fields: Custom fields, post meta, user meta, options API`
    ),
  conversationId: z
    .string()
    .optional()
    .describe(
      "Pass an existing conversationId to add a new API context to the current conversation. Omit for the first call to create a new conversation."
    ),
});

export type LearnWordPressApiInput = z.infer<typeof learnWordPressApiSchema>;

export async function learnWordPressApi(input: LearnWordPressApiInput): Promise<ToolResponse> {
  try {
    const { api, conversationId } = input;
    const wpApi = api as WordPressApi;

    const description = API_DESCRIPTIONS[wpApi];
    if (!description) {
      return errorResponse(`Unknown API: ${api}. Valid APIs: ${VALID_APIS.join(", ")}`);
    }

    let conversation;
    if (conversationId) {
      conversation = addApiToConversation(conversationId, wpApi);
    } else {
      conversation = createConversation();
      addApiToConversation(conversation.id, wpApi);
    }

    logger.info("learn_wordpress_api called", { api: wpApi, conversationId: conversation.id });

    const response = `# WordPress AI Toolkit — API Context Loaded

**API**: ${wpApi}
**Conversation ID**: \`${conversation.id}\`
**Active APIs in this session**: ${conversation.activeApis.join(", ")}

---

${description}

---

## 🔄 IMPORTANT: Pass this conversationId to ALL subsequent tool calls

\`conversationId: "${conversation.id}"\`

If you need to work with a different WordPress API later, call \`learn_wordpress_api\` again with the same conversationId and the new API name.

## Available Tools
| Tool | Description |
|------|-------------|
| \`search_docs\` | Search WordPress developer documentation |
| \`fetch_full_docs\` | Retrieve complete documentation pages |
| \`introspect_rest_api\` | Explore REST API endpoints and schemas |
| \`validate_php\` | Validate PHP code (hooks, security, best practices) |
| \`validate_block_json\` | Validate block.json / theme.json files |
| \`manage_wp_site\` | Execute WP-CLI commands |

⚠️ DO NOT search the web for WordPress documentation. Use the \`search_docs\` and \`fetch_full_docs\` tools instead for accurate, up-to-date information.`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("learn_wordpress_api failed", { error: message });
    return errorResponse(message);
  }
}
