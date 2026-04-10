import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzeCompetitors } from "../../src/tools/analyze-competitors.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../../src/utils/http.js", () => ({
  fetchText: vi.fn(),
  fetchJson: vi.fn(),
  stripHtml: vi.fn((html: string) => html.replace(/<[^>]*>/g, "").trim()),
}));

import { fetchText, fetchJson } from "../../src/utils/http.js";
const mockFetchText = vi.mocked(fetchText);
const mockFetchJson = vi.mocked(fetchJson);

describe("analyze_competitors", () => {
  let conversationId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    const conv = createConversation();
    addApiToConversation(conv.id, "rest-api");
    conversationId = conv.id;
  });

  it("detects WordPress site with theme and plugins", async () => {
    mockFetchText.mockResolvedValueOnce(`
      <html>
      <head>
        <meta name="generator" content="WordPress 6.7">
        <link rel="stylesheet" href="https://example.com/wp-content/themes/flavor/style.css">
        <link rel="stylesheet" href="https://example.com/wp-content/plugins/elementor/assets/css/frontend.css">
        <link rel="stylesheet" href="https://example.com/wp-content/plugins/woocommerce/assets/css/wc.css">
        <script src="https://www.googletagmanager.com/gtag/js?id=G-123"></script>
      </head>
      <body></body>
      </html>
    `);

    mockFetchJson
      .mockResolvedValueOnce({
        namespaces: ["wp/v2", "wc/v3", "yoast/v1", "elementor/v1"],
      })
      .mockResolvedValueOnce([{ id: 1 }]);

    const result = await analyzeCompetitors({
      url: "https://example.com",
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("WordPress");
    expect(text).toContain("6.7");
    expect(text).toContain("flavor");
    expect(text).toContain("elementor");
    expect(text).toContain("woocommerce");
    expect(text).toContain("WooCommerce");
    expect(text).toContain("Yoast");
    expect(text).toContain("Google Analytics");
  });

  it("detects non-WordPress site", async () => {
    mockFetchText.mockResolvedValueOnce(`
      <html>
      <head><title>Shopify Store</title></head>
      <body><p>A Shopify site</p></body>
      </html>
    `);

    const result = await analyzeCompetitors({
      url: "https://shopify-store.com",
      conversationId,
    });

    expect(result.content[0].text).toContain("not appear to be running WordPress");
  });

  it("handles REST API discovery", async () => {
    mockFetchText.mockResolvedValueOnce(`
      <html><head></head><body class="wp-content">WordPress site</body></html>
    `);

    mockFetchJson
      .mockResolvedValueOnce({
        namespaces: ["wp/v2", "wc/v3", "my-plugin/v1"],
      })
      .mockResolvedValueOnce([{ id: 1 }]);

    const result = await analyzeCompetitors({
      url: "https://wp-site.com",
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("REST API");
    expect(text).toContain("wp/v2");
    expect(text).toContain("my-plugin/v1");
  });

  it("handles connection errors gracefully", async () => {
    mockFetchText.mockRejectedValueOnce(new Error("Connection refused"));

    const result = await analyzeCompetitors({
      url: "https://unreachable.com",
      conversationId,
    });

    // Should not crash, returns analysis with empty data
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("not appear to be running WordPress");
  });

  it("detects security indicators", async () => {
    mockFetchText.mockResolvedValueOnce(`
      <html>
      <head>
        <link rel="stylesheet" href="https://example.com/wp-content/themes/flavor/style.css">
      </head>
      <body>WordPress site with https</body>
      </html>
    `);

    mockFetchJson.mockRejectedValueOnce(new Error("404"));

    const result = await analyzeCompetitors({
      url: "https://secure-wp.com",
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("Security");
    expect(text).toContain("HTTPS");
    expect(text).toContain("version hidden");
  });

  it("errors on invalid conversation", async () => {
    const result = await analyzeCompetitors({
      url: "https://example.com",
      conversationId: "invalid-id",
    });

    expect(result.isError).toBe(true);
  });
});
