import { describe, it, expect, beforeEach, vi } from "vitest";
import { scaffoldComponent } from "../../src/tools/scaffold-component.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("scaffold_component", () => {
  let conversationId: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "plugins");
    conversationId = conv.id;
  });

  it("scaffolds a plugin", async () => {
    const result = await scaffoldComponent({
      type: "plugin",
      name: "My Awesome Plugin",
      conversationId,
      description: "A test plugin.",
    });
    expect(result.content[0].text).toContain("Plugin Name: My Awesome Plugin");
    expect(result.content[0].text).toContain("my-awesome-plugin.php");
    expect(result.content[0].text).toContain("uninstall.php");
  });

  it("scaffolds a block", async () => {
    const result = await scaffoldComponent({
      type: "block",
      name: "Hero Section",
      conversationId,
      namespace: "my-plugin",
    });
    expect(result.content[0].text).toContain("block.json");
    expect(result.content[0].text).toContain("my-plugin/hero-section");
    expect(result.content[0].text).toContain("render.php");
    expect(result.content[0].text).toContain("edit.js");
  });

  it("scaffolds a custom post type", async () => {
    const result = await scaffoldComponent({
      type: "custom-post-type",
      name: "Book",
      conversationId,
    });
    expect(result.content[0].text).toContain("register_post_type");
    expect(result.content[0].text).toContain("show_in_rest");
    expect(result.content[0].text).toContain("book");
  });

  it("scaffolds a taxonomy", async () => {
    const result = await scaffoldComponent({
      type: "taxonomy",
      name: "Genre",
      conversationId,
    });
    expect(result.content[0].text).toContain("register_taxonomy");
    expect(result.content[0].text).toContain("genre");
  });

  it("scaffolds a REST endpoint", async () => {
    const result = await scaffoldComponent({
      type: "rest-endpoint",
      name: "Products API",
      conversationId,
    });
    expect(result.content[0].text).toContain("register_rest_route");
    expect(result.content[0].text).toContain("permission_callback");
    expect(result.content[0].text).toContain("sanitize_callback");
  });

  it("scaffolds an Elementor widget", async () => {
    const result = await scaffoldComponent({
      type: "elementor-widget",
      name: "Price Card",
      conversationId,
    });
    expect(result.content[0].text).toContain("Widget_Base");
    expect(result.content[0].text).toContain("Controls_Manager");
    expect(result.content[0].text).toContain("register_controls");
  });

  it("scaffolds a settings page", async () => {
    const result = await scaffoldComponent({
      type: "settings-page",
      name: "My Settings",
      conversationId,
    });
    expect(result.content[0].text).toContain("register_setting");
    expect(result.content[0].text).toContain("add_settings_section");
    expect(result.content[0].text).toContain("options.php");
  });

  it("scaffolds a shortcode", async () => {
    const result = await scaffoldComponent({
      type: "shortcode",
      name: "Pricing Table",
      conversationId,
    });
    expect(result.content[0].text).toContain("add_shortcode");
    expect(result.content[0].text).toContain("shortcode_atts");
    expect(result.content[0].text).toContain("[pricing-table");
  });

  it("scaffolds a cron job", async () => {
    const result = await scaffoldComponent({
      type: "cron-job",
      name: "Data Sync",
      conversationId,
    });
    expect(result.content[0].text).toContain("wp_schedule_event");
    expect(result.content[0].text).toContain("wp_clear_scheduled_hook");
    expect(result.content[0].text).toContain("cron_schedules");
  });

  it("scaffolds an AJAX handler", async () => {
    const result = await scaffoldComponent({
      type: "ajax-handler",
      name: "Save Form",
      conversationId,
    });
    expect(result.content[0].text).toContain("wp_ajax_");
    expect(result.content[0].text).toContain("check_ajax_referer");
    expect(result.content[0].text).toContain("wp_send_json_success");
  });

  it("uses custom slug and namespace", async () => {
    const result = await scaffoldComponent({
      type: "custom-post-type",
      name: "Portfolio Item",
      conversationId,
      slug: "portfolio",
      namespace: "mysite",
    });
    expect(result.content[0].text).toContain("'portfolio'");
  });

  it("throws on invalid conversation", async () => {
    const result = await scaffoldComponent({
      type: "plugin",
      name: "Test",
      conversationId: "invalid-id",
    });
    expect(result.isError).toBe(true);
  });
});
