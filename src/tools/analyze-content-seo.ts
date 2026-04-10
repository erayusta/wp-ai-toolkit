/**
 * Tool: analyze_content_seo
 *
 * Analyzes content for SEO quality: readability, keyword density,
 * heading structure, meta length, internal links, and overall SEO score.
 * Port of SEO Machine's Python analysis modules to TypeScript.
 */

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const analyzeContentSeoSchema = z.object({
  content: z.string().describe("The article/page content to analyze. Can be HTML or plain text."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  targetKeyword: z.string().optional().describe("Primary target keyword to check density and placement."),
  secondaryKeywords: z.array(z.string()).optional().describe("Secondary keywords to check."),
  metaTitle: z.string().optional().describe("SEO meta title to validate length."),
  metaDescription: z.string().optional().describe("SEO meta description to validate length."),
});

export type AnalyzeContentSeoInput = z.infer<typeof analyzeContentSeoSchema>;

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 5).length;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g)?.length ?? 1;
  return Math.max(1, count);
}

function fleschReadingEase(text: string): number {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = text.split(/\s+/).reduce((sum, w) => sum + countSyllables(w), 0);
  if (words === 0 || sentences === 0) return 0;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

function fleschGradeLevel(text: string): number {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = text.split(/\s+/).reduce((sum, w) => sum + countSyllables(w), 0);
  if (words === 0 || sentences === 0) return 0;
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

function keywordDensity(text: string, keyword: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const matches = text.match(regex);
  const kwWords = keyword.split(/\s+/).length;
  return ((matches?.length ?? 0) * kwWords / words) * 100;
}

function extractHeadings(html: string): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = [];
  const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({ level: parseInt(match[1]), text: stripHtmlTags(match[2]) });
  }
  return headings;
}

function countInternalLinks(html: string): number {
  const linkRegex = /<a[^>]*href=["'](?!https?:\/\/|\/\/|#|mailto:|tel:)([^"']*)["'][^>]*>/gi;
  const relativeLinks = [...html.matchAll(linkRegex)];
  return relativeLinks.length;
}

function countExternalLinks(html: string): number {
  const linkRegex = /<a[^>]*href=["'](https?:\/\/[^"']*)["'][^>]*>/gi;
  return [...html.matchAll(linkRegex)].length;
}

function countImages(html: string): { total: number; withAlt: number; withoutAlt: number } {
  const imgRegex = /<img[^>]*>/gi;
  const imgs = [...html.matchAll(imgRegex)];
  const withAlt = imgs.filter((m) => /alt=["'][^"']+["']/.test(m[0])).length;
  return { total: imgs.length, withAlt, withoutAlt: imgs.length - withAlt };
}

export async function analyzeContentSeo(input: AnalyzeContentSeoInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { content, targetKeyword, secondaryKeywords, metaTitle, metaDescription } = input;
    const artifactId = uuidv4();
    logger.info("analyze_content_seo called", { artifactId, hasKeyword: !!targetKeyword });

    const plainText = stripHtmlTags(content);
    const wordCount = countWords(plainText);
    const sentenceCount = countSentences(plainText);
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const readingTime = Math.ceil(wordCount / 250);

    // Readability
    const fre = Math.round(fleschReadingEase(plainText));
    const gradeLevel = Math.round(fleschGradeLevel(plainText) * 10) / 10;
    const readabilityLabel = fre >= 80 ? "Easy" : fre >= 60 ? "Standard" : fre >= 40 ? "Difficult" : "Very Difficult";

    // Structure
    const headings = extractHeadings(content);
    const h1Count = headings.filter((h) => h.level === 1).length;
    const h2Count = headings.filter((h) => h.level === 2).length;
    const h3Count = headings.filter((h) => h.level === 3).length;
    const paragraphs = content.split(/<\/p>/gi).length - 1 || plainText.split(/\n\n+/).length;

    // Links & Images
    const internalLinks = countInternalLinks(content);
    const externalLinks = countExternalLinks(content);
    const images = countImages(content);

    // SEO Score calculation (0-100)
    let score = 0;
    const checks: string[] = [];
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Word count (max 15 pts)
    if (wordCount >= 2000) { score += 15; checks.push("Word count 2000+ (excellent)"); }
    else if (wordCount >= 1500) { score += 12; checks.push("Word count 1500+ (good)"); }
    else if (wordCount >= 1000) { score += 8; checks.push("Word count 1000+ (adequate)"); }
    else if (wordCount >= 500) { score += 4; issues.push(`Word count ${wordCount} — aim for 1500+`); }
    else { issues.push(`Word count ${wordCount} — too short for SEO, aim for 1500+`); }

    // Readability (max 10 pts)
    if (fre >= 60 && fre <= 80) { score += 10; checks.push("Readability optimal (60-80)"); }
    else if (fre >= 50) { score += 7; checks.push("Readability acceptable"); }
    else if (fre >= 40) { score += 4; suggestions.push("Content is somewhat difficult to read"); }
    else { suggestions.push("Content is very difficult to read — simplify sentences"); }

    // Headings (max 15 pts)
    if (h1Count === 1) { score += 5; checks.push("Single H1 tag"); }
    else if (h1Count === 0) { issues.push("No H1 tag found"); }
    else { issues.push(`${h1Count} H1 tags — should be exactly 1`); }

    if (h2Count >= 3) { score += 5; checks.push(`${h2Count} H2 subheadings`); }
    else if (h2Count >= 1) { score += 3; suggestions.push("Add more H2 subheadings (aim for 3+)"); }
    else { issues.push("No H2 subheadings — add section headers"); }

    if (h3Count >= 1) { score += 5; checks.push(`${h3Count} H3 subheadings`); }
    else { suggestions.push("Consider adding H3 subheadings for depth"); }

    // Keyword optimization (max 20 pts)
    if (targetKeyword) {
      const density = keywordDensity(plainText, targetKeyword);
      const inTitle = headings.some((h) => h.level === 1 && h.text.toLowerCase().includes(targetKeyword.toLowerCase()));
      const inH2 = headings.some((h) => h.level === 2 && h.text.toLowerCase().includes(targetKeyword.toLowerCase()));
      const inFirst100 = plainText.substring(0, 500).toLowerCase().includes(targetKeyword.toLowerCase());

      if (density >= 0.5 && density <= 2.5) { score += 8; checks.push(`Keyword density ${density.toFixed(1)}% (optimal)`); }
      else if (density > 2.5) { issues.push(`Keyword density ${density.toFixed(1)}% — possible stuffing (aim for 0.5-2.5%)`); score += 2; }
      else if (density > 0) { score += 4; suggestions.push(`Keyword density ${density.toFixed(1)}% — could use more mentions`); }
      else { issues.push("Target keyword not found in content"); }

      if (inTitle) { score += 4; checks.push("Keyword in H1"); }
      else { suggestions.push("Add target keyword to the H1 title"); }

      if (inH2) { score += 4; checks.push("Keyword in H2"); }
      else { suggestions.push("Include keyword in at least one H2"); }

      if (inFirst100) { score += 4; checks.push("Keyword in first paragraph"); }
      else { suggestions.push("Include keyword in the first 100 words"); }
    } else {
      suggestions.push("Provide a targetKeyword for keyword analysis");
    }

    // Meta tags (max 10 pts)
    if (metaTitle) {
      const titleLen = metaTitle.length;
      if (titleLen >= 50 && titleLen <= 60) { score += 5; checks.push(`Meta title length ${titleLen} chars (optimal)`); }
      else if (titleLen >= 30 && titleLen <= 70) { score += 3; suggestions.push(`Meta title ${titleLen} chars — aim for 50-60`); }
      else { issues.push(`Meta title ${titleLen} chars — should be 50-60`); }
    }

    if (metaDescription) {
      const descLen = metaDescription.length;
      if (descLen >= 140 && descLen <= 160) { score += 5; checks.push(`Meta description ${descLen} chars (optimal)`); }
      else if (descLen >= 120 && descLen <= 170) { score += 3; suggestions.push(`Meta description ${descLen} chars — aim for 140-160`); }
      else { issues.push(`Meta description ${descLen} chars — should be 140-160`); }
    }

    // Links (max 10 pts)
    if (internalLinks >= 3) { score += 5; checks.push(`${internalLinks} internal links`); }
    else if (internalLinks >= 1) { score += 2; suggestions.push(`Only ${internalLinks} internal link(s) — aim for 3+`); }
    else { issues.push("No internal links — add links to related content"); }

    if (externalLinks >= 1) { score += 5; checks.push(`${externalLinks} external links`); }
    else { suggestions.push("Add 1-2 external links to authoritative sources"); }

    // Images (max 10 pts)
    if (images.total >= 1) { score += 5; checks.push(`${images.total} image(s)`); }
    else { suggestions.push("Add at least 1 image for engagement"); }

    if (images.withoutAlt === 0 && images.total > 0) { score += 5; checks.push("All images have alt text"); }
    else if (images.withoutAlt > 0) { issues.push(`${images.withoutAlt} image(s) missing alt text`); }

    // Sentence length (max 10 pts)
    if (avgWordsPerSentence <= 20) { score += 10; checks.push(`Avg sentence length ${avgWordsPerSentence} words (good)`); }
    else if (avgWordsPerSentence <= 25) { score += 6; suggestions.push(`Avg sentence ${avgWordsPerSentence} words — aim for under 20`); }
    else { suggestions.push(`Avg sentence ${avgWordsPerSentence} words — too long, break up sentences`); }

    score = Math.min(100, score);
    const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

    // Secondary keywords
    let secondaryAnalysis = "";
    if (secondaryKeywords && secondaryKeywords.length > 0) {
      const rows = secondaryKeywords.map((kw) => {
        const d = keywordDensity(plainText, kw);
        const found = d > 0;
        return `| ${kw} | ${found ? "Yes" : "No"} | ${d.toFixed(1)}% |`;
      });
      secondaryAnalysis = `\n## Secondary Keywords\n| Keyword | Found | Density |\n|:--------|:------|:--------|\n${rows.join("\n")}\n`;
    }

    const response = `# SEO Content Analysis

**Artifact ID**: \`${artifactId}\`
**SEO Score**: **${score}/100** (${grade})

---

## Content Stats
| Metric | Value |
|:-------|:------|
| Word Count | ${wordCount} |
| Sentences | ${sentenceCount} |
| Avg Words/Sentence | ${avgWordsPerSentence} |
| Reading Time | ~${readingTime} min |
| Paragraphs | ${paragraphs} |
| Readability (Flesch) | ${fre} — ${readabilityLabel} |
| Grade Level | ${gradeLevel} |

## Structure
| Element | Count |
|:--------|:------|
| H1 | ${h1Count} |
| H2 | ${h2Count} |
| H3 | ${h3Count} |
| Internal Links | ${internalLinks} |
| External Links | ${externalLinks} |
| Images | ${images.total} (${images.withAlt} with alt) |

${targetKeyword ? `## Primary Keyword: "${targetKeyword}"\n| Metric | Value |\n|:-------|:------|\n| Density | ${keywordDensity(plainText, targetKeyword).toFixed(1)}% |\n| In H1 | ${headings.some((h) => h.level === 1 && h.text.toLowerCase().includes(targetKeyword.toLowerCase())) ? "Yes" : "No"} |\n| In H2 | ${headings.some((h) => h.level === 2 && h.text.toLowerCase().includes(targetKeyword.toLowerCase())) ? "Yes" : "No"} |\n| In First Paragraph | ${plainText.substring(0, 500).toLowerCase().includes(targetKeyword.toLowerCase()) ? "Yes" : "No"} |\n` : ""}${secondaryAnalysis}
## Passed (${checks.length})
${checks.map((c) => `- ${c}`).join("\n")}

## Issues (${issues.length})
${issues.length > 0 ? issues.map((i) => `- ${i}`).join("\n") : "_(none)_"}

## Suggestions (${suggestions.length})
${suggestions.length > 0 ? suggestions.map((s) => `- ${s}`).join("\n") : "_(none)_"}

---

## Headings Outline
${headings.map((h) => `${"  ".repeat(h.level - 1)}- H${h.level}: ${h.text}`).join("\n") || "_(no headings found)_"}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("analyze_content_seo failed", { error: message });
    return errorResponse(message);
  }
}
