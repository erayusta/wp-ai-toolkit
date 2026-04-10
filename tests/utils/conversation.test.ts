import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  createConversation,
  getConversation,
  addApiToConversation,
  requireConversation,
  pruneConversations,
} from "../../src/utils/conversation.js";

// Suppress logger output during tests
vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("conversation", () => {
  describe("createConversation", () => {
    it("returns a conversation with a valid id", () => {
      const conv = createConversation();
      expect(conv.id).toBeDefined();
      expect(typeof conv.id).toBe("string");
      expect(conv.id.length).toBeGreaterThan(0);
    });

    it("initializes with empty activeApis", () => {
      const conv = createConversation();
      expect(conv.activeApis).toEqual([]);
    });

    it("sets createdAt and lastUsedAt timestamps", () => {
      const before = new Date();
      const conv = createConversation();
      const after = new Date();
      expect(conv.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(conv.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(conv.lastUsedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe("getConversation", () => {
    it("returns conversation by id", () => {
      const conv = createConversation();
      const retrieved = getConversation(conv.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(conv.id);
    });

    it("returns undefined for unknown id", () => {
      expect(getConversation("nonexistent-id")).toBeUndefined();
    });

    it("updates lastUsedAt on access", () => {
      const conv = createConversation();
      const firstAccess = conv.lastUsedAt.getTime();

      // Small delay to ensure different timestamp
      const retrieved = getConversation(conv.id);
      expect(retrieved?.lastUsedAt.getTime()).toBeGreaterThanOrEqual(firstAccess);
    });
  });

  describe("addApiToConversation", () => {
    it("adds an API to existing conversation", () => {
      const conv = createConversation();
      const updated = addApiToConversation(conv.id, "rest-api");
      expect(updated.activeApis).toContain("rest-api");
    });

    it("does not duplicate APIs", () => {
      const conv = createConversation();
      addApiToConversation(conv.id, "hooks");
      addApiToConversation(conv.id, "hooks");
      const retrieved = getConversation(conv.id);
      expect(retrieved?.activeApis.filter((a) => a === "hooks").length).toBe(1);
    });

    it("can add multiple different APIs", () => {
      const conv = createConversation();
      addApiToConversation(conv.id, "rest-api");
      addApiToConversation(conv.id, "hooks");
      addApiToConversation(conv.id, "blocks");
      const retrieved = getConversation(conv.id);
      expect(retrieved?.activeApis).toEqual(["rest-api", "hooks", "blocks"]);
    });

    it("creates conversation if id does not exist", () => {
      const updated = addApiToConversation("new-conv-id", "themes");
      expect(updated.activeApis).toContain("themes");
      const retrieved = getConversation("new-conv-id");
      expect(retrieved).toBeDefined();
    });
  });

  describe("requireConversation", () => {
    it("returns conversation when valid", () => {
      const conv = createConversation();
      addApiToConversation(conv.id, "rest-api");
      const result = requireConversation(conv.id);
      expect(result.id).toBe(conv.id);
    });

    it("throws when conversationId is undefined", () => {
      expect(() => requireConversation(undefined)).toThrow(
        "conversationId is required"
      );
    });

    it("throws when conversation not found", () => {
      expect(() => requireConversation("invalid-id-123")).toThrow(
        "not found or expired"
      );
    });
  });

  describe("pruneConversations", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("removes conversations older than TTL", () => {
      const conv = createConversation();
      const convId = conv.id;

      // Advance time past TTL (1 hour + 1ms)
      vi.advanceTimersByTime(60 * 60 * 1000 + 1);

      const pruned = pruneConversations();
      expect(pruned).toBeGreaterThanOrEqual(1);
      expect(getConversation(convId)).toBeUndefined();
    });

    it("keeps recent conversations", () => {
      const conv = createConversation();
      const convId = conv.id;

      // Advance only 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      pruneConversations();
      expect(getConversation(convId)).toBeDefined();
    });
  });
});
