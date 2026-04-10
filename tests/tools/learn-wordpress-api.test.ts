import { describe, it, expect, vi } from "vitest";
import { learnWordPressApi } from "../../src/tools/learn-wordpress-api.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("learn_wordpress_api", () => {
  it("creates a new conversation when no conversationId provided", async () => {
    const result = await learnWordPressApi({ api: "rest-api" });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Conversation ID");
    expect(result.content[0].text).toContain("rest-api");
  });

  it("adds API to existing conversation", async () => {
    // First call creates the conversation
    const first = await learnWordPressApi({ api: "rest-api" });
    const conversationId = first.content[0].text.match(/`([0-9a-f-]{36})`/)?.[1];
    expect(conversationId).toBeDefined();

    // Second call adds another API
    const second = await learnWordPressApi({
      api: "hooks",
      conversationId,
    });

    expect(second.content[0].text).toContain("rest-api");
    expect(second.content[0].text).toContain("hooks");
  });

  it("returns error for invalid API name", async () => {
    const result = await learnWordPressApi({
      api: "invalid-api" as any,
    });

    // Zod validation happens at the server level, but our function checks too
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown API");
  });

  it("lists available tools in response", async () => {
    const result = await learnWordPressApi({ api: "blocks" });

    expect(result.content[0].text).toContain("search_docs");
    expect(result.content[0].text).toContain("fetch_full_docs");
    expect(result.content[0].text).toContain("introspect_rest_api");
    expect(result.content[0].text).toContain("validate_php");
    expect(result.content[0].text).toContain("validate_block_json");
    expect(result.content[0].text).toContain("manage_wp_site");
  });

  it("loads context for all valid API domains", async () => {
    const apis = [
      "rest-api", "hooks", "blocks", "themes", "plugins",
      "woocommerce", "wp-cli", "gutenberg", "multisite", "custom-fields",
    ];

    for (const api of apis) {
      const result = await learnWordPressApi({ api: api as any });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain(api);
    }
  });
});
