/**
 * Tool: introspect_rest_api
 *
 * Explores WordPress REST API endpoints and their schemas.
 * Works both with the built-in schema reference and optionally with a live WP site.
 */

import { z } from "zod";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { searchEndpoints, getEndpointsByNamespace, WP_REST_ENDPOINTS } from "../data/wp-rest-schema.js";
import { fetchJson } from "../utils/http.js";
import { logger } from "../utils/logger.js";

export const introspectRestApiSchema = z.object({
  query: z
    .string()
    .describe(
      "Search query to find relevant REST API endpoints. Examples: 'posts', 'users', 'create page', 'media upload', 'categories', 'settings'. Use specific terms for better results."
    ),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  namespace: z
    .string()
    .optional()
    .describe("Filter endpoints by namespace. Examples: 'wp/v2', 'wc/v3'. Leave empty to search all namespaces."),
  siteUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional: URL of a live WordPress site to fetch real endpoint discovery data. Example: 'https://example.com'. If omitted, uses the built-in schema reference."
    ),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
    .optional()
    .describe("Filter endpoints by HTTP method."),
});

export type IntrospectRestApiInput = z.infer<typeof introspectRestApiSchema>;

interface WpDiscoveryRoute {
  namespace: string;
  methods: string[];
  endpoints: Array<{
    methods: string[];
    args: Record<string, { description?: string; type?: string; required?: boolean; default?: unknown; enum?: string[] }>;
  }>;
  _links?: Record<string, unknown>;
}

export async function introspectRestApi(input: IntrospectRestApiInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { query, namespace, siteUrl, method } = input;
    logger.info("introspect_rest_api called", { query, namespace, siteUrl });

    // If a live site URL is provided, try to fetch from the site's discovery endpoint
    if (siteUrl) {
      return await introspectLiveSite(siteUrl, query, namespace, method);
    }

    // Otherwise, use the built-in schema reference
    return introspectBuiltinSchema(query, namespace, method);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("introspect_rest_api failed", { error: message });
    return errorResponse(message);
  }
}

function introspectBuiltinSchema(
  query: string,
  namespace?: string,
  method?: string
): ToolResponse {
  let endpoints = namespace ? getEndpointsByNamespace(namespace) : searchEndpoints(query);

  if (method) {
    endpoints = endpoints.filter((ep) => ep.methods.includes(method));
  }

  if (endpoints.length === 0) {
    // Try a broader search
    const allRoutes = WP_REST_ENDPOINTS.map((ep) => `  ${ep.methods.join(", ")} ${ep.route}`).join("\n");

    return successResponse(
      `No endpoints found matching "${query}"${namespace ? ` in namespace "${namespace}"` : ""}.\n\n` +
        `Available endpoints:\n${allRoutes}\n\n` +
        `💡 Try a broader search term or remove the namespace filter.`
    );
  }

  const formatted = endpoints
    .map((ep) => {
      const args = Object.entries(ep.args)
        .map(([name, arg]) => {
          const required = arg.required ? " *(required)*" : "";
          const defaultVal = arg.default !== undefined ? ` (default: ${JSON.stringify(arg.default)})` : "";
          const enumVals = arg.enum ? ` [${arg.enum.join(", ")}]` : "";
          return `  - **${name}** (\`${arg.type}\`)${required}: ${arg.description}${defaultVal}${enumVals}`;
        })
        .join("\n");

      return `### ${ep.methods.join(", ")} \`${ep.route}\`\n**Namespace**: ${ep.namespace}\n**Description**: ${ep.description}\n\n**Arguments**:\n${args || "  _(none)_"}\n`;
    })
    .join("\n---\n\n");

  return successResponse(
    `# REST API Schema Introspection\n\n**Query**: "${query}"\n**Results**: ${endpoints.length} endpoint(s)\n\n---\n\n${formatted}\n\n---\n\n💡 **Tips**:\n- Use \`siteUrl\` parameter to introspect a live WordPress site's endpoints\n- Custom endpoints registered by plugins will only appear when using \`siteUrl\``
  );
}

async function introspectLiveSite(
  siteUrl: string,
  query: string,
  namespace?: string,
  method?: string
): Promise<ToolResponse> {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const discoveryUrl = `${baseUrl}/wp-json/`;

  try {
    const discovery = await fetchJson<{ routes: Record<string, WpDiscoveryRoute> }>(discoveryUrl, {
      timeout: 20_000,
    });

    if (!discovery.routes) {
      return errorResponse(`The site at ${siteUrl} did not return valid REST API discovery data.`);
    }

    const lowerQuery = query.toLowerCase();
    let matchingRoutes = Object.entries(discovery.routes).filter(([route, info]) => {
      const matchesQuery =
        route.toLowerCase().includes(lowerQuery) ||
        (info.namespace && info.namespace.toLowerCase().includes(lowerQuery));
      const matchesNamespace = !namespace || info.namespace === namespace;
      const matchesMethod =
        !method ||
        info.endpoints?.some((ep) => ep.methods.includes(method));

      return matchesQuery && matchesNamespace && matchesMethod;
    });

    // Limit results
    const total = matchingRoutes.length;
    matchingRoutes = matchingRoutes.slice(0, 15);

    if (matchingRoutes.length === 0) {
      const availableNamespaces = [
        ...new Set(Object.values(discovery.routes).map((r) => r.namespace).filter(Boolean)),
      ];

      return successResponse(
        `No endpoints matching "${query}" found on ${siteUrl}.\n\n` +
          `**Available namespaces**: ${availableNamespaces.join(", ")}\n\n` +
          `Try a different search term or namespace.`
      );
    }

    const formatted = matchingRoutes
      .map(([route, info]) => {
        const methods = info.endpoints?.flatMap((ep) => ep.methods) ?? info.methods ?? [];
        const uniqueMethods = [...new Set(methods)];

        const args = info.endpoints?.[0]?.args ?? {};
        const argList = Object.entries(args)
          .slice(0, 10) // Limit args display
          .map(([name, arg]) => {
            const required = arg.required ? " *(required)*" : "";
            return `  - **${name}** (\`${arg.type ?? "unknown"}\`)${required}: ${arg.description ?? ""}`;
          })
          .join("\n");

        return `### ${uniqueMethods.join(", ")} \`${route}\`\n**Namespace**: ${info.namespace ?? "unknown"}\n\n**Arguments**:\n${argList || "  _(none shown)_"}\n`;
      })
      .join("\n---\n\n");

    return successResponse(
      `# Live Site REST API Introspection\n\n**Site**: ${siteUrl}\n**Query**: "${query}"\n**Results**: ${matchingRoutes.length}${total > 15 ? ` (showing 15 of ${total})` : ""}\n\n---\n\n${formatted}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Live site introspection failed, falling back to built-in schema", { error: message });

    return introspectBuiltinSchema(query, namespace, method);
  }
}
