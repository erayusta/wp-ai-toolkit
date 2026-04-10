import { describe, it, expect, beforeEach, vi } from "vitest";
import { searchDocs } from "../../src/tools/search-docs.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the http module to avoid real network calls
vi.mock("../../src/utils/http.js", () => ({
  fetchJson: vi.fn(),
  fetchText: vi.fn(),
  stripHtml: vi.fn((html: string) =>
    html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
  ),
}));

import { fetchJson } from "../../src/utils/http.js";
const mockFetchJson = vi.mocked(fetchJson);

describe("search_docs", () => {
  let conversationId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    const conv = createConversation();
    addApiToConversation(conv.id, "rest-api");
    conversationId = conv.id;
  });

  it("returns formatted results on successful search", async () => {
    mockFetchJson.mockResolvedValueOnce([
      {
        id: 1,
        title: { rendered: "register_post_type()" },
        link: "https://developer.wordpress.org/reference/functions/register_post_type/",
        excerpt: { rendered: "<p>Registers a post type.</p>" },
        type: "wp-parser-function",
      },
      {
        id: 2,
        title: { rendered: "Custom Post Types" },
        link: "https://developer.wordpress.org/plugins/post-types/",
        excerpt: { rendered: "<p>Learn about custom post types.</p>" },
        type: "handbook",
      },
    ]);

    const result = await searchDocs({
      query: "register post type",
      conversationId,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("register_post_type()");
    expect(result.content[0].text).toContain("Custom Post Types");
    expect(result.content[0].text).toContain("Results");
  });

  it("returns guidance when no results found", async () => {
    mockFetchJson.mockResolvedValueOnce([]);

    const result = await searchDocs({
      query: "xyznonexistent",
      conversationId,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("No documentation found");
    expect(result.content[0].text).toContain("developer.wordpress.org");
  });

  it("falls back on primary search failure", async () => {
    mockFetchJson
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce([
        {
          id: 1,
          title: { rendered: "Fallback Result" },
          link: "https://developer.wordpress.org/fallback",
          excerpt: { rendered: "<p>Fallback content</p>" },
          type: "post",
        },
      ]);

    const result = await searchDocs({
      query: "test query",
      conversationId,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Fallback Result");
  });

  it("throws on invalid conversation", async () => {
    const result = await searchDocs({
      query: "test",
      conversationId: "invalid-id",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });
});
