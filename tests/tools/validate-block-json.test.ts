import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateBlockJsonTool } from "../../src/tools/validate-block-json.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("validate_block_json", () => {
  let conversationId: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "blocks");
    conversationId = conv.id;
  });

  const validBlockJson = JSON.stringify({
    $schema: "https://schemas.wp.org/trunk/block.json",
    apiVersion: 3,
    name: "my-plugin/my-block",
    version: "1.0.0",
    title: "My Block",
    category: "widgets",
    description: "A custom block.",
    attributes: {
      content: { type: "string" },
    },
    supports: {
      html: false,
      color: { background: true, text: true },
    },
    editorScript: "file:./index.js",
    style: "file:./style-index.css",
  });

  it("passes valid block.json", async () => {
    const result = await validateBlockJsonTool({
      json: validBlockJson,
      conversationId,
      type: "block",
    });

    expect(result.content[0].text).toContain("VALID");
    expect(result.isError).toBeUndefined();
  });

  it("detects missing required fields", async () => {
    const json = JSON.stringify({ name: "my-plugin/my-block" });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
      type: "block",
    });

    expect(result.content[0].text).toContain("INVALID");
    expect(result.content[0].text).toContain("missing-required-field");
  });

  it("detects invalid block name format", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/block.json",
      apiVersion: 3,
      name: "InvalidName",
      version: "1.0.0",
      title: "Test",
      category: "widgets",
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
    });

    expect(result.content[0].text).toContain("invalid-block-name");
  });

  it("warns about reserved core namespace", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/block.json",
      apiVersion: 3,
      name: "core/my-block",
      version: "1.0.0",
      title: "Test",
      category: "widgets",
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
    });

    expect(result.content[0].text).toContain("reserved-namespace");
  });

  it("warns about unknown category", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/block.json",
      apiVersion: 3,
      name: "my-plugin/my-block",
      version: "1.0.0",
      title: "Test",
      category: "nonexistent-category",
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
    });

    expect(result.content[0].text).toContain("unknown-category");
  });

  it("detects invalid apiVersion", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/block.json",
      apiVersion: 99,
      name: "my-plugin/my-block",
      version: "1.0.0",
      title: "Test",
      category: "widgets",
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
    });

    expect(result.content[0].text).toContain("invalid-api-version");
  });

  it("detects attribute without type", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/block.json",
      apiVersion: 3,
      name: "my-plugin/my-block",
      version: "1.0.0",
      title: "Test",
      category: "widgets",
      attributes: {
        content: { default: "hello" },
      },
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
    });

    expect(result.content[0].text).toContain("missing-attribute-type");
  });

  it("handles invalid JSON string", async () => {
    const result = await validateBlockJsonTool({
      json: "{ invalid json }}}",
      conversationId,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid JSON");
  });

  // --- theme.json tests ---

  it("passes valid theme.json", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/theme.json",
      version: 3,
      settings: {
        color: { palette: [] },
        typography: { fontSizes: [] },
      },
      styles: {
        color: { background: "#fff" },
      },
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
      type: "theme",
    });

    expect(result.content[0].text).toContain("VALID");
  });

  it("detects invalid theme.json version", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/theme.json",
      version: 99,
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
      type: "theme",
    });

    expect(result.content[0].text).toContain("invalid-theme-json-version");
  });

  it("detects missing theme.json version", async () => {
    const json = JSON.stringify({
      $schema: "https://schemas.wp.org/trunk/theme.json",
      settings: {},
    });
    const result = await validateBlockJsonTool({
      json,
      conversationId,
      type: "theme",
    });

    expect(result.content[0].text).toContain("missing-required-field");
  });

  it("includes artifactId in response", async () => {
    const result = await validateBlockJsonTool({
      json: validBlockJson,
      conversationId,
      artifactId: "block-artifact-1",
      revision: 3,
    });

    expect(result.content[0].text).toContain("block-artifact-1");
    expect(result.content[0].text).toContain("3");
  });
});
