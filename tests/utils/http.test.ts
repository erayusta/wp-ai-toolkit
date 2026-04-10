import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { stripHtml } from "../../src/utils/http.js";

// Suppress logger output during tests
vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
  });

  it("decodes HTML entities", () => {
    expect(stripHtml("&amp; &lt; &gt; &quot; &#039;")).toBe('& < > " \'');
  });

  it("collapses whitespace", () => {
    expect(stripHtml("Hello    World\n\n  Test")).toBe("Hello World Test");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });

  it("handles string with no HTML", () => {
    expect(stripHtml("Plain text")).toBe("Plain text");
  });

  it("strips nested tags", () => {
    expect(stripHtml("<div><p><span>Nested</span></p></div>")).toBe("Nested");
  });
});
