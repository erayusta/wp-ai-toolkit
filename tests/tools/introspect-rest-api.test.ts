import { describe, it, expect, beforeEach, vi } from "vitest";
import { introspectRestApi } from "../../src/tools/introspect-rest-api.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock http for live site tests
vi.mock("../../src/utils/http.js", () => ({
  fetchJson: vi.fn(),
  fetchText: vi.fn(),
  stripHtml: vi.fn((html: string) => html.replace(/<[^>]*>/g, "").trim()),
}));

import { fetchJson } from "../../src/utils/http.js";
const mockFetchJson = vi.mocked(fetchJson);

describe("introspect_rest_api", () => {
  let conversationId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    const conv = createConversation();
    addApiToConversation(conv.id, "rest-api");
    conversationId = conv.id;
  });

  describe("built-in schema", () => {
    it("finds post endpoints when searching 'posts'", async () => {
      const result = await introspectRestApi({
        query: "posts",
        conversationId,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("/wp/v2/posts");
    });

    it("filters by namespace", async () => {
      const result = await introspectRestApi({
        query: "posts",
        conversationId,
        namespace: "wp/v2",
      });

      expect(result.content[0].text).toContain("wp/v2");
    });

    it("filters by HTTP method", async () => {
      const result = await introspectRestApi({
        query: "posts",
        conversationId,
        method: "GET",
      });

      expect(result.content[0].text).toContain("GET");
    });

    it("returns available endpoints when no match found", async () => {
      const result = await introspectRestApi({
        query: "zzzznonexistent",
        conversationId,
      });

      expect(result.content[0].text).toContain("No endpoints found");
      expect(result.content[0].text).toContain("Available endpoints");
    });

    it("finds user endpoints", async () => {
      const result = await introspectRestApi({
        query: "users",
        conversationId,
      });

      expect(result.content[0].text).toContain("users");
    });

    it("finds media endpoints", async () => {
      const result = await introspectRestApi({
        query: "media",
        conversationId,
      });

      expect(result.content[0].text).toContain("media");
    });
  });

  describe("live site mode", () => {
    it("fetches from live site discovery endpoint", async () => {
      mockFetchJson.mockResolvedValueOnce({
        routes: {
          "/wp/v2/posts": {
            namespace: "wp/v2",
            methods: ["GET", "POST"],
            endpoints: [
              {
                methods: ["GET", "POST"],
                args: {
                  page: { type: "integer", description: "Current page", required: false },
                },
              },
            ],
          },
        },
      });

      const result = await introspectRestApi({
        query: "posts",
        conversationId,
        siteUrl: "https://example.com",
      });

      expect(result.content[0].text).toContain("Live Site");
      expect(result.content[0].text).toContain("/wp/v2/posts");
      expect(mockFetchJson).toHaveBeenCalledWith(
        "https://example.com/wp-json/",
        expect.any(Object)
      );
    });

    it("falls back to built-in schema on live site failure", async () => {
      mockFetchJson.mockRejectedValueOnce(new Error("Connection refused"));

      const result = await introspectRestApi({
        query: "posts",
        conversationId,
        siteUrl: "https://invalid-site.example",
      });

      // Should fall back to built-in schema
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("/wp/v2/posts");
    });
  });
});
