import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzeTheme } from "../../src/tools/analyze-theme.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("analyze_theme", () => {
  let conversationId: string;
  let tmpDir: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "themes");
    conversationId = conv.id;
    tmpDir = join(tmpdir(), `wp-theme-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  function writeThemeFile(path: string, content: string) {
    const full = join(tmpDir, path);
    const dir = full.substring(0, full.lastIndexOf("/"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(full, content);
  }

  it("analyzes a valid classic theme", async () => {
    writeThemeFile("style.css", `/*\nTheme Name: Test Theme\nVersion: 1.0\nText Domain: test-theme\nDescription: Test\nAuthor: Test\nLicense: GPL-2.0\n*/`);
    writeThemeFile("index.php", "<?php get_header(); ?><?php get_footer(); ?>");
    writeThemeFile("functions.php", `<?php\nadd_action('after_setup_theme', function() {\n  add_theme_support('title-tag');\n});\nadd_action('wp_enqueue_scripts', function() {\n  wp_enqueue_style('test', get_stylesheet_uri());\n});`);
    writeThemeFile("header.php", "<!DOCTYPE html><html <?php language_attributes(); ?>><head><?php wp_head(); ?></head><body <?php body_class(); ?>><?php wp_body_open(); ?>");
    writeThemeFile("footer.php", "<?php wp_footer(); ?></body></html>");
    writeThemeFile("screenshot.png", "fake-image");

    const result = await analyzeTheme({ themePath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("Classic theme detected");
    expect(result.content[0].text).toContain("pass");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects missing style.css", async () => {
    writeThemeFile("index.php", "<?php ?>");

    const result = await analyzeTheme({ themePath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("missing-style-css");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects block theme", async () => {
    writeThemeFile("style.css", "/*\nTheme Name: Block Theme\n*/");
    writeThemeFile("theme.json", JSON.stringify({ $schema: "https://schemas.wp.org/trunk/theme.json", version: 3, settings: {} }));
    writeThemeFile("templates/index.html", "<!-- wp:post-content /-->");
    writeThemeFile("parts/header.html", "<!-- wp:site-title /-->");

    const result = await analyzeTheme({ themePath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("Block theme detected");
    expect(result.content[0].text).toContain("theme-json-settings");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("errors on nonexistent path", async () => {
    const result = await analyzeTheme({ themePath: "/nonexistent/path", conversationId });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });

  it("detects missing theme.json in block theme", async () => {
    writeThemeFile("style.css", "/*\nTheme Name: Broken Block\n*/");
    writeThemeFile("templates/index.html", "<!-- wp:post-content /-->");

    const result = await analyzeTheme({ themePath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("missing-theme-json");
    rmSync(tmpDir, { recursive: true, force: true });
  });
});
