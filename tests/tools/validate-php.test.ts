import { describe, it, expect, beforeEach, vi } from "vitest";
import { validatePhp } from "../../src/tools/validate-php.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

// Suppress logger output during tests
vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("validate_php", () => {
  let conversationId: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "hooks");
    conversationId = conv.id;
  });

  it("passes valid PHP code", async () => {
    const result = await validatePhp({
      code: `<?php
add_action('init', 'myplugin_register_cpt');
function myplugin_register_cpt() {
    register_post_type('book', ['public' => true]);
}`,
      conversationId,
      context: "general",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("VALID");
  });

  it("detects missing plugin header", async () => {
    const result = await validatePhp({
      code: `<?php
function my_init() {}`,
      conversationId,
      context: "plugin",
    });

    expect(result.content[0].text).toContain("Plugin Name");
  });

  it("detects deprecated functions", async () => {
    const result = await validatePhp({
      code: `<?php
mysql_query("SELECT * FROM wp_posts");`,
      conversationId,
    });

    expect(result.content[0].text).toContain("deprecated");
    expect(result.content[0].text).toContain("mysql_query");
  });

  it("detects direct superglobal echo", async () => {
    const result = await validatePhp({
      code: `<?php
echo $_GET['name'];`,
      conversationId,
    });

    expect(result.content[0].text).toContain("superglobal");
  });

  it("detects unprepared SQL queries", async () => {
    const result = await validatePhp({
      code: `<?php
$wpdb->query("DELETE FROM wp_posts WHERE ID = $id");`,
      conversationId,
    });

    expect(result.content[0].text).toContain("prepare");
  });

  it("detects query_posts anti-pattern", async () => {
    const result = await validatePhp({
      code: `<?php
query_posts('cat=1');`,
      conversationId,
    });

    expect(result.content[0].text).toContain("query_posts");
    expect(result.content[0].text).toContain("WP_Query");
  });

  it("detects file_get_contents for HTTP", async () => {
    const result = await validatePhp({
      code: `<?php
$data = file_get_contents('https://api.example.com/data');`,
      conversationId,
    });

    expect(result.content[0].text).toContain("wp_remote_get");
  });

  it("detects hook type mismatch — action used as filter", async () => {
    const result = await validatePhp({
      code: `<?php
add_action('the_content', 'my_modify_content');`,
      conversationId,
    });

    expect(result.content[0].text).toContain("filter");
    expect(result.content[0].text).toContain("add_filter");
  });

  it("detects hook type mismatch — filter used as action", async () => {
    const result = await validatePhp({
      code: `<?php
add_filter('init', 'my_init_func');`,
      conversationId,
    });

    expect(result.content[0].text).toContain("action");
    expect(result.content[0].text).toContain("add_action");
  });

  it("detects unprefixed functions in plugin context", async () => {
    const result = await validatePhp({
      code: `<?php
/**
 * Plugin Name: Test Plugin
 */
function setup() {}`,
      conversationId,
      context: "plugin",
    });

    expect(result.content[0].text).toContain("prefix");
  });

  it("detects absolute include paths", async () => {
    const result = await validatePhp({
      code: `<?php
require_once('/var/www/html/wp-content/plugins/my-plugin/includes/class.php');`,
      conversationId,
    });

    expect(result.content[0].text).toContain("Absolute");
    expect(result.content[0].text).toContain("plugin_dir_path");
  });

  it("warns about PHP closing tag", async () => {
    const result = await validatePhp({
      code: `<?php
echo 'hello';
?>`,
      conversationId,
      context: "plugin",
    });

    expect(result.content[0].text).toContain("closing tag");
  });

  it("detects nonce verification missing with DB operations", async () => {
    const result = await validatePhp({
      code: `<?php
$name = $_POST['name'];
$wpdb->query("INSERT INTO table VALUES ('$name')");`,
      conversationId,
    });

    expect(result.content[0].text).toContain("nonce");
  });

  it("includes artifactId in response", async () => {
    const result = await validatePhp({
      code: "<?php echo 'hello';",
      conversationId,
      artifactId: "test-artifact-123",
      revision: 2,
    });

    expect(result.content[0].text).toContain("test-artifact-123");
    expect(result.content[0].text).toContain("2");
  });

  it("throws on missing conversationId", async () => {
    const result = await validatePhp({
      code: "<?php echo 'hello';",
      conversationId: "nonexistent-conv",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });
});
