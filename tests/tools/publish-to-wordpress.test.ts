import { describe, it, expect, beforeEach, vi } from "vitest";
import { publishToWordPress } from "../../src/tools/publish-to-wordpress.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("publish_to_wordpress", () => {
  let conversationId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    const conv = createConversation();
    addApiToConversation(conv.id, "rest-api");
    conversationId = conv.id;
  });

  it("creates a draft post successfully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 42,
        link: "https://example.com/my-post/",
        status: "draft",
      }),
    }));

    const result = await publishToWordPress({
      siteUrl: "https://example.com",
      title: "Test Post",
      content: "<p>Hello world</p>",
      conversationId,
      username: "admin",
      applicationPassword: "xxxx xxxx xxxx",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("42");
    expect(result.content[0].text).toContain("draft");
    expect(result.content[0].text).toContain("Created");

    vi.unstubAllGlobals();
  });

  it("includes SEO metadata in request", async () => {
    let capturedBody = "";

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      capturedBody = opts.body as string;
      return {
        ok: true,
        json: async () => ({ id: 1, link: "https://example.com/p/", status: "draft" }),
      };
    }));

    await publishToWordPress({
      siteUrl: "https://example.com",
      title: "SEO Post",
      content: "<p>Content</p>",
      conversationId,
      seoTitle: "My SEO Title | Site",
      seoDescription: "Meta description here",
      seoFocusKeyword: "wordpress seo",
      username: "admin",
      applicationPassword: "xxxx",
    });

    const body = JSON.parse(capturedBody);
    expect(body.seo).toBeDefined();
    expect(body.seo.seo_title).toBe("My SEO Title | Site");
    expect(body.seo.meta_description).toBe("Meta description here");
    expect(body.seo.focus_keyword).toBe("wordpress seo");

    vi.unstubAllGlobals();
  });

  it("sends PUT for post updates", async () => {
    let capturedMethod = "";

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      capturedMethod = opts.method ?? "";
      return {
        ok: true,
        json: async () => ({ id: 99, link: "https://example.com/updated/", status: "publish" }),
      };
    }));

    const result = await publishToWordPress({
      siteUrl: "https://example.com",
      title: "Updated Post",
      content: "<p>Updated</p>",
      conversationId,
      postId: 99,
      username: "admin",
      applicationPassword: "xxxx",
    });

    expect(capturedMethod).toBe("PUT");
    expect(result.content[0].text).toContain("Updated");

    vi.unstubAllGlobals();
  });

  it("handles 401 authentication error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => JSON.stringify({ message: "Invalid credentials" }),
    }));

    const result = await publishToWordPress({
      siteUrl: "https://example.com",
      title: "Test",
      content: "Test",
      conversationId,
      username: "wrong",
      applicationPassword: "wrong",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Authentication failed");
    expect(result.content[0].text).toContain("Application Password");

    vi.unstubAllGlobals();
  });

  it("handles 403 permission error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => JSON.stringify({ message: "Sorry, you are not allowed" }),
    }));

    const result = await publishToWordPress({
      siteUrl: "https://example.com",
      title: "Test",
      content: "Test",
      conversationId,
      username: "subscriber",
      applicationPassword: "xxxx",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Permission denied");

    vi.unstubAllGlobals();
  });

  it("defaults to draft status", async () => {
    let capturedBody = "";

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      capturedBody = opts.body as string;
      return {
        ok: true,
        json: async () => ({ id: 1, link: "https://example.com/p/", status: "draft" }),
      };
    }));

    const result = await publishToWordPress({
      siteUrl: "https://example.com",
      title: "Safe Post",
      content: "Content",
      conversationId,
      status: "draft",
      username: "admin",
      applicationPassword: "xxxx",
    });

    expect(result.isError).toBeUndefined();
    const body = JSON.parse(capturedBody);
    expect(body.status).toBe("draft");

    vi.unstubAllGlobals();
  });

  it("errors on invalid conversation", async () => {
    const result = await publishToWordPress({
      siteUrl: "https://example.com",
      title: "Test",
      content: "Test",
      conversationId: "invalid-id",
    });

    expect(result.isError).toBe(true);
  });
});
