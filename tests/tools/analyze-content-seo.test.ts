import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzeContentSeo } from "../../src/tools/analyze-content-seo.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("analyze_content_seo", () => {
  let conversationId: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "rest-api");
    conversationId = conv.id;
  });

  const sampleArticle = `
    <h1>How to Optimize WordPress for Speed</h1>
    <p>WordPress speed optimization is critical for SEO and user experience.
    In this guide, we cover everything you need to know about making your
    WordPress site faster. WordPress speed affects your search rankings directly.</p>
    <h2>Why WordPress Speed Matters</h2>
    <p>Google uses page speed as a ranking factor. A slow WordPress site loses
    visitors and revenue. Studies show that a 1-second delay reduces conversions by 7%.</p>
    <h2>Top 10 Speed Optimization Tips</h2>
    <p>Here are the most effective ways to speed up WordPress:</p>
    <ul>
      <li>Use a caching plugin like WP Rocket</li>
      <li>Optimize images with WebP format</li>
      <li>Minimize CSS and JavaScript files</li>
    </ul>
    <h2>Choosing the Right Hosting</h2>
    <p>Your hosting provider makes a huge difference. Managed WordPress hosting
    from providers like Kinsta or Cloudways can improve load times significantly.</p>
    <h3>Shared vs Managed Hosting</h3>
    <p>Shared hosting is cheap but slow. Managed hosting costs more but delivers
    better performance, security, and support for WordPress sites.</p>
    <img src="https://example.com/speed-test.png" alt="Speed test results">
    <p>Check out our <a href="/guide/caching">complete caching guide</a> and
    <a href="/guide/images">image optimization tutorial</a> for more details.
    Also see <a href="https://web.dev/vitals/">Google Core Web Vitals</a>.</p>
    <h2>Conclusion</h2>
    <p>WordPress speed optimization is an ongoing process. Start with hosting,
    add caching, optimize images, and monitor your Core Web Vitals regularly.</p>
  `;

  it("returns SEO score for well-structured content", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
      targetKeyword: "WordPress speed",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("SEO Score");
    expect(result.content[0].text).toContain("/100");
  });

  it("detects keyword density", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
      targetKeyword: "WordPress speed",
    });

    expect(result.content[0].text).toContain("Density");
    expect(result.content[0].text).toContain("WordPress speed");
  });

  it("checks keyword in H1", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
      targetKeyword: "WordPress",
    });

    expect(result.content[0].text).toContain("In H1");
  });

  it("counts headings structure", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("H1");
    expect(text).toContain("H2");
    expect(text).toContain("H3");
  });

  it("counts internal and external links", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("Internal Links");
    expect(text).toContain("External Links");
  });

  it("detects images with alt text", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
    });

    expect(result.content[0].text).toContain("image");
  });

  it("validates meta title length", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
      metaTitle: "How to Optimize WordPress for Speed — Complete Guide",
    });

    expect(result.content[0].text).toContain("Meta title");
    expect(result.content[0].text).toContain("chars");
  });

  it("validates meta description length", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
      metaDescription: "Learn how to optimize WordPress speed with our complete guide. Covers caching, hosting, images, and Core Web Vitals. Updated for 2026.",
    });

    expect(result.content[0].text).toContain("Meta description");
  });

  it("checks secondary keywords", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
      targetKeyword: "WordPress speed",
      secondaryKeywords: ["caching", "hosting", "nonexistent-keyword-xyz"],
    });

    const text = result.content[0].text;
    expect(text).toContain("Secondary Keywords");
    expect(text).toContain("caching");
    expect(text).toContain("Yes");
    expect(text).toContain("No");
  });

  it("calculates readability score", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
    });

    expect(result.content[0].text).toContain("Readability");
    expect(result.content[0].text).toContain("Grade Level");
  });

  it("shows headings outline", async () => {
    const result = await analyzeContentSeo({
      content: sampleArticle,
      conversationId,
    });

    expect(result.content[0].text).toContain("Headings Outline");
    expect(result.content[0].text).toContain("How to Optimize");
  });

  it("errors on invalid conversation", async () => {
    const result = await analyzeContentSeo({
      content: "test",
      conversationId: "invalid-id",
    });

    expect(result.isError).toBe(true);
  });
});
