import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzePlugin } from "../../src/tools/analyze-plugin.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("analyze_plugin", () => {
  let conversationId: string;
  let tmpDir: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "plugins");
    conversationId = conv.id;
    tmpDir = join(tmpdir(), `wp-plugin-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  function writePluginFile(path: string, content: string) {
    const full = join(tmpDir, path);
    const dir = full.substring(0, full.lastIndexOf("/"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(full, content);
  }

  it("analyzes a well-structured plugin", async () => {
    writePluginFile("my-plugin.php", `<?php
/**
 * Plugin Name: My Plugin
 * Description: A test plugin
 * Version: 1.0.0
 * Author: Test
 * Text Domain: my-plugin
 * License: GPL-2.0+
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */
if (!defined('ABSPATH')) exit;

register_activation_hook(__FILE__, function() {});
register_deactivation_hook(__FILE__, function() {});

add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('my-plugin', plugin_dir_url(__FILE__) . 'style.css');
});

$value = sanitize_text_field($_POST['data'] ?? '');
echo esc_html($value);
wp_nonce_field('my_action', 'my_nonce');
if (current_user_can('manage_options')) {}
$wpdb->prepare("SELECT * FROM table WHERE id = %d", $id);
echo __('Hello', 'my-plugin');
`);
    writePluginFile("uninstall.php", "<?php if (!defined('WP_UNINSTALL_PLUGIN')) exit; delete_option('my_plugin_data');");
    writePluginFile("readme.txt", "=== My Plugin ===");

    const result = await analyzePlugin({ pluginPath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("main-file");
    expect(result.content[0].text).toContain("output-escaping");
    expect(result.content[0].text).toContain("input-sanitization");
    expect(result.content[0].text).toContain("nonce-verification");
    expect(result.content[0].text).toContain("capability-checks");
    expect(result.content[0].text).toContain("prepared-queries");
    expect(result.content[0].text).toContain("uninstall-cleanup");
    expect(result.content[0].text).toContain("i18n");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects missing plugin header", async () => {
    writePluginFile("bad-plugin.php", "<?php\necho 'hello';");

    const result = await analyzePlugin({ pluginPath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("no-main-file");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects eval usage", async () => {
    writePluginFile("evil-plugin.php", `<?php
/**
 * Plugin Name: Evil Plugin
 */
eval($_POST['code']);
`);

    const result = await analyzePlugin({ pluginPath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("eval-usage");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects missing uninstall cleanup", async () => {
    writePluginFile("simple.php", `<?php
/**
 * Plugin Name: Simple Plugin
 * Version: 1.0
 */
if (!defined('ABSPATH')) exit;
`);

    const result = await analyzePlugin({ pluginPath: tmpDir, conversationId });
    expect(result.content[0].text).toContain("no-uninstall");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("errors on nonexistent path", async () => {
    const result = await analyzePlugin({ pluginPath: "/nonexistent/path", conversationId });
    expect(result.isError).toBe(true);
  });
});
