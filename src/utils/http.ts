/**
 * HTTP utilities for fetching WordPress documentation and API data.
 */

import { logger } from "./logger.js";

const DEFAULT_TIMEOUT = 15_000;
const USER_AGENT = "wp-ai-toolkit/1.0.0";

export interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export async function fetchJson<T>(url: string, opts?: FetchOptions): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts?.timeout ?? DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        ...opts?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${opts?.timeout ?? DEFAULT_TIMEOUT}ms for ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchText(url: string, opts?: FetchOptions): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts?.timeout ?? DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html, text/plain, application/json",
        ...opts?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${opts?.timeout ?? DEFAULT_TIMEOUT}ms for ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch WordPress REST API discovery endpoint from a live site.
 */
export async function fetchWpApiDiscovery(siteUrl: string): Promise<unknown> {
  const url = `${siteUrl.replace(/\/$/, "")}/wp-json/`;
  logger.info("Fetching WP API discovery", { url });
  return fetchJson(url, { timeout: 20_000 });
}

/**
 * Strip HTML tags and return plain text.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
