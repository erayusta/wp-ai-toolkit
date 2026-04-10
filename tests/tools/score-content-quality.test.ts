import { describe, it, expect, beforeEach, vi } from "vitest";
import { scoreContentQuality } from "../../src/tools/score-content-quality.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("score_content_quality", () => {
  let conversationId: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "rest-api");
    conversationId = conv.id;
  });

  const humanContent = `
    <h1>Why We Switched from Shared Hosting to Kinsta</h1>
    <p>Last month, our WordPress site was loading in 4.2 seconds. After moving
    to Kinsta, we hit 1.1 seconds. Here's exactly what happened and why you
    might want to consider the same move.</p>
    <h2>The Problem with Our Old Setup</h2>
    <p>We were on SiteGround's shared plan — $14.99/month. For a site getting
    50,000 monthly visitors, it was buckling. Our Time to First Byte (TTFB) was
    averaging 890ms, which Google considers slow.</p>
    <p>Have you checked your own TTFB recently? If it's over 600ms, you're
    leaving rankings on the table.</p>
    <h2>What We Changed</h2>
    <p>For example, we enabled Redis object caching on day one. That single
    change dropped our database query time from 340ms to 45ms. The numbers
    don't lie — our bounce rate went from 67% to 41%.</p>
    <ul>
      <li>Migrated 2,847 posts without downtime</li>
      <li>Set up staging environment for testing</li>
      <li>Configured Cloudflare APO for edge caching</li>
    </ul>
    <h2>Results After 30 Days</h2>
    <p>However, the real surprise was organic traffic. We saw a 23% increase
    in the first month — not from new content, just from speed improvements.
    Google rewarded us almost immediately.</p>
    <img src="/results.png" alt="Traffic comparison chart showing 23% increase">
    <h2>Should You Switch?</h2>
    <p>If you're running a WordPress site with more than 10,000 monthly visitors
    on shared hosting, you're probably losing money. The $35/month for managed
    hosting pays for itself in better rankings and lower bounce rates.</p>
    <p>Check your current Core Web Vitals at web.dev/measure and see where you stand.</p>
  `;

  const aiContent = `
    In today's digital landscape, website speed optimization has become a
    game-changer for businesses. It's worth noting that leveraging robust
    hosting solutions can seamlessly transform your online presence. Let's
    dive into how you can unlock the full potential of your WordPress site.
    In conclusion, fostering a holistic approach to performance is essential.
    Without further ado, let's delve into the paradigm of speed optimization
    and embark on this journey to supercharge your website.
  `;

  it("scores human-written content higher than AI content", async () => {
    const humanResult = await scoreContentQuality({
      content: humanContent,
      conversationId,
    });

    const aiResult = await scoreContentQuality({
      content: aiContent,
      conversationId,
    });

    // Extract scores
    const humanScore = parseInt(humanResult.content[0].text.match(/\*\*(\d+)\/100\*\*/)?.[1] ?? "0");
    const aiScore = parseInt(aiResult.content[0].text.match(/\*\*(\d+)\/100\*\*/)?.[1] ?? "0");

    expect(humanScore).toBeGreaterThan(aiScore);
  });

  it("detects AI patterns in robotic content", async () => {
    const result = await scoreContentQuality({
      content: aiContent,
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("AI-typical phrases");
    // Should detect common AI patterns
    expect(text).toMatch(/digital landscape|game-changer|seamlessly|leverage|delve|holistic|paradigm/i);
  });

  it("returns 5-dimension score breakdown", async () => {
    const result = await scoreContentQuality({
      content: humanContent,
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("Humanity");
    expect(text).toContain("Specificity");
    expect(text).toContain("Structure");
    expect(text).toContain("Engagement");
    expect(text).toContain("Completeness");
    expect(text).toContain("/20");
  });

  it("shows engagement stats", async () => {
    const result = await scoreContentQuality({
      content: humanContent,
      conversationId,
    });

    const text = result.content[0].text;
    expect(text).toContain("Questions asked");
    expect(text).toContain("Personal pronouns");
    expect(text).toContain("Data points");
  });

  it("assigns a letter grade", async () => {
    const result = await scoreContentQuality({
      content: humanContent,
      conversationId,
    });

    expect(result.content[0].text).toMatch(/\(A\+?\)|(\(B\))|(\(C\))/);
  });

  it("handles different content types", async () => {
    const result = await scoreContentQuality({
      content: humanContent,
      conversationId,
      contentType: "landing-page",
    });

    expect(result.content[0].text).toContain("landing-page");
    expect(result.isError).toBeUndefined();
  });

  it("rejects too-short content", async () => {
    const result = await scoreContentQuality({
      content: "Too short.",
      conversationId,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("too short");
  });

  it("provides recommendations", async () => {
    const result = await scoreContentQuality({
      content: aiContent,
      conversationId,
    });

    expect(result.content[0].text).toContain("Recommendations");
  });

  it("errors on invalid conversation", async () => {
    const result = await scoreContentQuality({
      content: humanContent,
      conversationId: "invalid-id",
    });

    expect(result.isError).toBe(true);
  });
});
