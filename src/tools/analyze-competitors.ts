/**
 * Tool: analyze_competitors
 *
 * Fetches and analyzes competitor WordPress/WooCommerce sites.
 * Checks: site structure, active plugins (detectable), theme info,
 * REST API endpoints, content stats, and technology stack.
 */

import { z } from "zod";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { fetchText, fetchJson } from "../utils/http.js";
import { logger } from "../utils/logger.js";

export const analyzeCompetitorsSchema = z.object({
  url: z.string().url().describe("Competitor website URL to analyze."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
});

export type AnalyzeCompetitorsInput = z.infer<typeof analyzeCompetitorsSchema>;

interface SiteAnalysis {
  isWordPress: boolean;
  wpVersion?: string;
  theme?: string;
  plugins: string[];
  restApi: boolean;
  restNamespaces: string[];
  hasWooCommerce: boolean;
  hasYoast: boolean;
  hasElementor: boolean;
  contentStats: {
    recentPosts: number;
    hasCustomPostTypes: boolean;
    detectedCPTs: string[];
  };
  technology: string[];
  security: string[];
}

async function analyzeCompetitorSite(url: string): Promise<SiteAnalysis> {
  const baseUrl = url.replace(/\/$/, "");
  const analysis: SiteAnalysis = {
    isWordPress: false,
    plugins: [],
    restApi: false,
    restNamespaces: [],
    hasWooCommerce: false,
    hasYoast: false,
    hasElementor: false,
    contentStats: { recentPosts: 0, hasCustomPostTypes: false, detectedCPTs: [] },
    technology: [],
    security: [],
  };

  // 1. Fetch homepage HTML
  let html = "";
  try {
    html = await fetchText(baseUrl, { timeout: 15_000 });
  } catch {
    return analysis;
  }

  // Detect WordPress
  if (html.includes("wp-content") || html.includes("wp-includes") || html.includes("wordpress")) {
    analysis.isWordPress = true;
  }

  // Detect WP version from generator meta tag
  const versionMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']WordPress\s+([\d.]+)["']/i);
  if (versionMatch) {
    analysis.wpVersion = versionMatch[1];
    analysis.isWordPress = true;
  }

  // Detect theme from HTML
  const themeMatch = html.match(/wp-content\/themes\/([a-zA-Z0-9_-]+)/);
  if (themeMatch) {
    analysis.theme = themeMatch[1];
    analysis.isWordPress = true;
  }

  // Detect plugins from HTML
  const pluginRegex = /wp-content\/plugins\/([a-zA-Z0-9_-]+)/g;
  const detectedPlugins = new Set<string>();
  let pluginMatch;
  while ((pluginMatch = pluginRegex.exec(html)) !== null) {
    detectedPlugins.add(pluginMatch[1]);
  }
  analysis.plugins = [...detectedPlugins];

  // Known plugin detection
  analysis.hasYoast = html.includes("yoast") || detectedPlugins.has("wordpress-seo");
  analysis.hasElementor = html.includes("elementor") || detectedPlugins.has("elementor");
  analysis.hasWooCommerce = html.includes("woocommerce") || detectedPlugins.has("woocommerce");

  // Technology detection
  if (html.includes("elementor")) analysis.technology.push("Elementor");
  if (html.includes("wpbakery") || html.includes("js_composer")) analysis.technology.push("WPBakery");
  if (html.includes("divi")) analysis.technology.push("Divi");
  if (html.includes("beaver-builder")) analysis.technology.push("Beaver Builder");
  if (html.includes("woocommerce")) analysis.technology.push("WooCommerce");
  if (html.includes("yoast")) analysis.technology.push("Yoast SEO");
  if (html.includes("rank-math") || html.includes("rankmath")) analysis.technology.push("RankMath");
  if (html.includes("gtag") || html.includes("google-analytics") || html.includes("GA4")) analysis.technology.push("Google Analytics");
  if (html.includes("gtm.js") || html.includes("googletagmanager")) analysis.technology.push("Google Tag Manager");
  if (html.includes("cloudflare")) analysis.technology.push("Cloudflare");
  if (html.includes("wp-rocket")) analysis.technology.push("WP Rocket");
  if (html.includes("litespeed")) analysis.technology.push("LiteSpeed Cache");

  // Security indicators
  if (html.includes("https://")) analysis.security.push("HTTPS enabled");
  if (!versionMatch) analysis.security.push("WP version hidden (good)");
  else analysis.security.push("WP version exposed in HTML");

  // 2. Check REST API
  try {
    const restData = await fetchJson<{ namespaces?: string[]; name?: string; description?: string }>(
      `${baseUrl}/wp-json/`,
      { timeout: 10_000 }
    );

    analysis.restApi = true;
    analysis.restNamespaces = restData.namespaces ?? [];

    if (analysis.restNamespaces.includes("wc/v3")) analysis.hasWooCommerce = true;
    if (analysis.restNamespaces.includes("yoast/v1")) analysis.hasYoast = true;

    // Check for custom post types via REST
    const cptNamespaces = analysis.restNamespaces.filter((ns) => !["wp/v2", "oembed/1.0", "wp-site-health/v1"].includes(ns));
    if (cptNamespaces.length > 0) {
      analysis.contentStats.hasCustomPostTypes = true;
      analysis.contentStats.detectedCPTs = cptNamespaces;
    }
  } catch {
    // REST API not accessible or not WordPress
  }

  // 3. Check recent posts count
  try {
    const posts = await fetchJson<Array<{ id: number }>>(
      `${baseUrl}/wp-json/wp/v2/posts?per_page=1&_fields=id`,
      { timeout: 10_000 }
    );
    analysis.contentStats.recentPosts = posts.length > 0 ? 1 : 0; // At least has posts
  } catch {
    // ignore
  }

  return analysis;
}

export async function analyzeCompetitors(input: AnalyzeCompetitorsInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { url } = input;
    logger.info("analyze_competitors called", { url });

    const analysis = await analyzeCompetitorSite(url);

    if (!analysis.isWordPress) {
      return successResponse(
        `# Competitor Analysis: ${url}\n\n` +
        `This site does **not appear to be running WordPress**.\n\n` +
        `Detected technologies:\n` +
        (analysis.technology.length > 0 ? analysis.technology.map((t) => `- ${t}`).join("\n") : "- None detected from HTML analysis") +
        `\n\n> Try analyzing WordPress-based competitors for more detailed results.`
      );
    }

    const response = `# Competitor Analysis: ${url}

**Platform**: WordPress ${analysis.wpVersion ? `v${analysis.wpVersion}` : "(version hidden)"}
**Theme**: ${analysis.theme ?? "Not detected"}
**REST API**: ${analysis.restApi ? "Accessible" : "Not accessible"}

## Detected Plugins (${analysis.plugins.length})
${analysis.plugins.length > 0 ? analysis.plugins.map((p) => `- ${p}`).join("\n") : "_(none detected from HTML)_"}

## Technology Stack
${analysis.technology.length > 0 ? analysis.technology.map((t) => `- ${t}`).join("\n") : "_(none detected)_"}

## Key Integrations
| Integration | Detected |
|:------------|:---------|
| WooCommerce | ${analysis.hasWooCommerce ? "Yes" : "No"} |
| Yoast SEO | ${analysis.hasYoast ? "Yes" : "No"} |
| Elementor | ${analysis.hasElementor ? "Yes" : "No"} |

## REST API Namespaces
${analysis.restNamespaces.length > 0 ? analysis.restNamespaces.map((ns) => `- \`${ns}\``).join("\n") : "_(not accessible)_"}

## Content
- Custom post types: ${analysis.contentStats.hasCustomPostTypes ? "Yes" : "Not detected"}
${analysis.contentStats.detectedCPTs.length > 0 ? `- Detected namespaces: ${analysis.contentStats.detectedCPTs.join(", ")}` : ""}

## Security
${analysis.security.map((s) => `- ${s}`).join("\n")}

---

> Note: This analysis is based on publicly accessible HTML and REST API endpoints. Private plugins, configurations, and server-side details are not detectable.`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("analyze_competitors failed", { error: message });
    return errorResponse(message);
  }
}
