/**
 * Tool: score_content_quality
 *
 * Scores content quality across 5 dimensions: humanity, specificity,
 * structure, engagement, and originality. Returns an overall quality score.
 * Port of SEO Machine's content_scorer.py to TypeScript.
 */

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const scoreContentQualitySchema = z.object({
  content: z.string().describe("The article content to score (plain text or HTML)."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  contentType: z
    .enum(["blog-post", "landing-page", "product-page", "documentation", "general"])
    .optional()
    .default("blog-post")
    .describe("Type of content being scored."),
});

export type ScoreContentQualityInput = z.infer<typeof scoreContentQualitySchema>;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

// AI watermark patterns commonly found in AI-generated content
const AI_PATTERNS = [
  /\bin conclusion\b/gi,
  /\boverall,?\s/gi,
  /\bin summary\b/gi,
  /\bit'?s worth noting\b/gi,
  /\bit'?s important to note\b/gi,
  /\bin today'?s (?:world|digital|fast-paced)/gi,
  /\blet'?s dive (?:in|into|deeper)\b/gi,
  /\bwithout further ado\b/gi,
  /\bunlock (?:the|your)\b/gi,
  /\bgame.?changer\b/gi,
  /\bseamless(?:ly)?\b/gi,
  /\bleverage\b/gi,
  /\brobust\b/gi,
  /\bholistic\b/gi,
  /\btapestry\b/gi,
  /\bdelve\b/gi,
  /\bembark\b/gi,
  /\bfoster\b/gi,
  /\blandscape\b/gi,
  /\bparadigm\b/gi,
  /\bsupercharge\b/gi,
  /\bskyrocket\b/gi,
];

// Engagement patterns
const ENGAGEMENT_PATTERNS = {
  questions: /\?/g,
  personalPronouns: /\b(you|your|you're|we|our|we're|I|my)\b/gi,
  dataPoints: /\b(\d+%|\d+x|\$[\d,]+|\d+ (?:million|billion|thousand))\b/gi,
  examples: /\b(for example|for instance|such as|e\.g\.|like when|consider this)\b/gi,
  transitions: /\b(however|meanwhile|furthermore|additionally|in contrast|on the other hand|that said)\b/gi,
  powerWords: /\b(proven|exclusive|guaranteed|secret|instantly|free|ultimate|essential|critical|crucial)\b/gi,
  lists: /<(?:ul|ol)[\s>]/gi,
  codeBlocks: /```|<pre|<code/gi,
};

// Specificity indicators
const SPECIFICITY_PATTERNS = {
  numbers: /\b\d+\b/g,
  properNouns: /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g,
  quotes: /[""][^""]+[""]/g,
  urls: /https?:\/\/\S+/g,
  years: /\b20[12]\d\b/g,
  brands: /\b[A-Z][a-zA-Z]+(?:\.(?:com|io|org|net|dev))\b/g,
};

export async function scoreContentQuality(input: ScoreContentQualityInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { content, contentType } = input;
    const artifactId = uuidv4();
    logger.info("score_content_quality called", { artifactId, contentType });

    const plainText = stripHtml(content);
    const wordCount = countWords(plainText);

    if (wordCount < 50) {
      return errorResponse("Content is too short to score (minimum 50 words).");
    }

    // 1. HUMANITY SCORE (0-20) — how human does the writing feel?
    let humanityScore = 20;
    const aiMatches: string[] = [];

    for (const pattern of AI_PATTERNS) {
      const matches = plainText.match(pattern);
      if (matches) {
        humanityScore -= Math.min(2, matches.length);
        aiMatches.push(`"${matches[0]}" (${matches.length}x)`);
      }
    }
    humanityScore = Math.max(0, humanityScore);
    const humanityLabel = humanityScore >= 16 ? "Natural" : humanityScore >= 10 ? "Mostly Human" : humanityScore >= 5 ? "AI-ish" : "Robotic";

    // 2. SPECIFICITY SCORE (0-20) — how specific and evidence-based?
    let specificityScore = 0;
    const numbers = plainText.match(SPECIFICITY_PATTERNS.numbers)?.length ?? 0;
    const quotes = content.match(SPECIFICITY_PATTERNS.quotes)?.length ?? 0;
    const urls = plainText.match(SPECIFICITY_PATTERNS.urls)?.length ?? 0;
    const years = plainText.match(SPECIFICITY_PATTERNS.years)?.length ?? 0;

    const specificityPerWord = (numbers + quotes * 3 + urls * 2 + years * 2) / wordCount;
    if (specificityPerWord > 0.02) specificityScore = 20;
    else if (specificityPerWord > 0.015) specificityScore = 16;
    else if (specificityPerWord > 0.01) specificityScore = 12;
    else if (specificityPerWord > 0.005) specificityScore = 8;
    else specificityScore = 4;

    // 3. STRUCTURE SCORE (0-20) — how well organized?
    let structureScore = 0;
    const headingCount = (content.match(/<h[2-6]/gi) ?? []).length;
    const listCount = (content.match(/<(?:ul|ol)/gi) ?? []).length;
    const paragraphCount = (content.match(/<\/p>/gi) ?? []).length || plainText.split(/\n\n+/).length;
    const hasImages = /<img/i.test(content);
    const hasCodeBlocks = /```|<pre|<code/.test(content);

    if (headingCount >= 3) structureScore += 6;
    else if (headingCount >= 1) structureScore += 3;

    if (listCount >= 1) structureScore += 4;
    if (paragraphCount >= 5) structureScore += 4;
    else if (paragraphCount >= 3) structureScore += 2;
    if (hasImages) structureScore += 3;
    if (hasCodeBlocks && (contentType === "documentation" || contentType === "blog-post")) structureScore += 3;

    structureScore = Math.min(20, structureScore);

    // 4. ENGAGEMENT SCORE (0-20) — how engaging and readable?
    let engagementScore = 0;
    const questions = (plainText.match(ENGAGEMENT_PATTERNS.questions) ?? []).length;
    const personalPronouns = (plainText.match(ENGAGEMENT_PATTERNS.personalPronouns) ?? []).length;
    const examples = (plainText.match(ENGAGEMENT_PATTERNS.examples) ?? []).length;
    const dataPoints = (plainText.match(ENGAGEMENT_PATTERNS.dataPoints) ?? []).length;
    const transitions = (plainText.match(ENGAGEMENT_PATTERNS.transitions) ?? []).length;

    if (questions >= 3) engagementScore += 4; else if (questions >= 1) engagementScore += 2;
    if (personalPronouns / wordCount > 0.02) engagementScore += 4; else if (personalPronouns > 0) engagementScore += 2;
    if (examples >= 2) engagementScore += 4; else if (examples >= 1) engagementScore += 2;
    if (dataPoints >= 3) engagementScore += 4; else if (dataPoints >= 1) engagementScore += 2;
    if (transitions >= 3) engagementScore += 4; else if (transitions >= 1) engagementScore += 2;

    engagementScore = Math.min(20, engagementScore);

    // 5. COMPLETENESS SCORE (0-20) — does it cover the topic well?
    let completenessScore = 0;

    if (contentType === "blog-post") {
      if (wordCount >= 2000) completenessScore += 8;
      else if (wordCount >= 1500) completenessScore += 6;
      else if (wordCount >= 1000) completenessScore += 4;
      else completenessScore += 2;

      if (headingCount >= 5) completenessScore += 4;
      else if (headingCount >= 3) completenessScore += 3;

      // Conclusion/summary section
      if (/conclusion|summary|final thoughts|wrapping up|key takeaways/i.test(plainText)) {
        completenessScore += 4;
      }

      // Introduction
      if (wordCount > 200) completenessScore += 4;
    } else if (contentType === "landing-page") {
      if (wordCount >= 500) completenessScore += 6;
      if (/call to action|cta|sign up|get started|try free|buy now/i.test(plainText)) completenessScore += 6;
      if (/testimonial|review|customer|trust|social proof/i.test(plainText)) completenessScore += 4;
      if (/benefit|feature|advantage/i.test(plainText)) completenessScore += 4;
    } else {
      if (wordCount >= 500) completenessScore += 10;
      if (headingCount >= 2) completenessScore += 5;
      completenessScore += Math.min(5, Math.floor(paragraphCount / 2));
    }

    completenessScore = Math.min(20, completenessScore);

    // Total score
    const totalScore = humanityScore + specificityScore + structureScore + engagementScore + completenessScore;
    const grade = totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : totalScore >= 50 ? "D" : "F";

    const bar = (s: number) => {
      const f = Math.round((s / 20) * 10);
      return "█".repeat(f) + "░".repeat(10 - f);
    };

    const response = `# Content Quality Score

**Artifact ID**: \`${artifactId}\`
**Content Type**: ${contentType}
**Word Count**: ${wordCount}
**Overall Score**: **${totalScore}/100** (${grade})

---

## Score Breakdown

| Dimension | Score | Bar |
|:----------|:------|:----|
| Humanity | ${humanityScore}/20 | ${bar(humanityScore)} |
| Specificity | ${specificityScore}/20 | ${bar(specificityScore)} |
| Structure | ${structureScore}/20 | ${bar(structureScore)} |
| Engagement | ${engagementScore}/20 | ${bar(engagementScore)} |
| Completeness | ${completenessScore}/20 | ${bar(completenessScore)} |

---

## Humanity Analysis (${humanityLabel})
${aiMatches.length > 0 ? `AI-typical phrases detected:\n${aiMatches.slice(0, 10).map((m) => `- ${m}`).join("\n")}\n\n> Consider replacing these with more natural language.` : "No AI-typical patterns detected. Writing feels natural."}

## Engagement Stats
| Metric | Count |
|:-------|:------|
| Questions asked | ${questions} |
| Personal pronouns (you/we/I) | ${personalPronouns} |
| Examples/illustrations | ${examples} |
| Data points/statistics | ${dataPoints} |
| Transition words | ${transitions} |

## Structure Stats
| Element | Count |
|:--------|:------|
| Headings | ${headingCount} |
| Lists | ${listCount} |
| Paragraphs | ${paragraphCount} |
| Images | ${hasImages ? "Yes" : "No"} |
| Code blocks | ${hasCodeBlocks ? "Yes" : "No"} |

## Specificity Stats
| Indicator | Count |
|:----------|:------|
| Numbers/data | ${numbers} |
| Quotes | ${quotes} |
| URLs/references | ${urls} |
| Year references | ${years} |

---

## Recommendations
${humanityScore < 15 ? "- **Reduce AI patterns**: Remove overused filler phrases and be more direct\n" : ""}${specificityScore < 12 ? "- **Add specifics**: Include numbers, data, examples, quotes, and references\n" : ""}${structureScore < 12 ? "- **Improve structure**: Add more headings, lists, and visual breaks\n" : ""}${engagementScore < 12 ? "- **Boost engagement**: Ask questions, use 'you', include examples\n" : ""}${completenessScore < 12 ? "- **Expand content**: Cover the topic more thoroughly with more depth\n" : ""}${totalScore >= 80 ? "Content quality is strong! Minor tweaks could push it higher." : ""}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("score_content_quality failed", { error: message });
    return errorResponse(message);
  }
}
