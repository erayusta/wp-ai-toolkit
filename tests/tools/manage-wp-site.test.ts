import { describe, it, expect, beforeEach, vi } from "vitest";
import { manageWpSite } from "../../src/tools/manage-wp-site.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock child_process
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("node:util", () => ({
  promisify: vi.fn(() => vi.fn()),
}));

// We need to re-import after mocking to get the mock behavior
// For manage-wp-site, we mock execFile indirectly through the module
import { execFile } from "node:child_process";
import { promisify } from "node:util";

describe("manage_wp_site", () => {
  let conversationId: string;
  const mockExecFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const conv = createConversation();
    addApiToConversation(conv.id, "wp-cli");
    conversationId = conv.id;

    // Setup the promisified mock
    (promisify as any).mockReturnValue(mockExecFile);
  });

  it("blocks eval commands", async () => {
    const result = await manageWpSite({
      command: "eval 'echo 1;'",
      conversationId,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blocked");
  });

  it("blocks shell injection characters", async () => {
    const result = await manageWpSite({
      command: "post list; rm -rf /",
      conversationId,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blocked");
  });

  it("blocks pipe operator", async () => {
    const result = await manageWpSite({
      command: "post list | grep test",
      conversationId,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blocked");
  });

  it("blocks backtick injection", async () => {
    const result = await manageWpSite({
      command: "option get `whoami`",
      conversationId,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blocked");
  });

  it("warns about dangerous db drop command", async () => {
    const result = await manageWpSite({
      command: "db drop",
      conversationId,
    });

    // Dangerous commands return a success response with warning, not an error
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("DANGEROUS");
  });

  it("warns about user delete command", async () => {
    const result = await manageWpSite({
      command: "user delete 1",
      conversationId,
    });

    expect(result.content[0].text).toContain("DANGEROUS");
  });

  it("warns about search-replace command", async () => {
    const result = await manageWpSite({
      command: "search-replace old new",
      conversationId,
    });

    expect(result.content[0].text).toContain("DANGEROUS");
  });

  it("warns about core update command", async () => {
    const result = await manageWpSite({
      command: "core update",
      conversationId,
    });

    expect(result.content[0].text).toContain("DANGEROUS");
  });

  it("throws on invalid conversation", async () => {
    const result = await manageWpSite({
      command: "post list",
      conversationId: "invalid-conv-id",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });
});
