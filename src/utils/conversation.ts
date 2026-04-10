/**
 * Conversation manager for tracking active API contexts per session.
 */

import { v4 as uuidv4 } from "uuid";
import type { Conversation, WordPressApi } from "../types.js";
import { logger } from "./logger.js";

const conversations = new Map<string, Conversation>();

const CONVERSATION_TTL_MS = 60 * 60 * 1000; // 1 hour

export function createConversation(): Conversation {
  const conversation: Conversation = {
    id: uuidv4(),
    activeApis: [],
    createdAt: new Date(),
    lastUsedAt: new Date(),
  };
  conversations.set(conversation.id, conversation);
  logger.info("Created conversation", { conversationId: conversation.id });
  return conversation;
}

export function getConversation(id: string): Conversation | undefined {
  const conversation = conversations.get(id);
  if (conversation) {
    conversation.lastUsedAt = new Date();
  }
  return conversation;
}

export function addApiToConversation(conversationId: string, api: WordPressApi): Conversation {
  let conversation = conversations.get(conversationId);

  if (!conversation) {
    conversation = createConversation();
    conversation.id = conversationId;
    conversations.set(conversationId, conversation);
  }

  if (!conversation.activeApis.includes(api)) {
    conversation.activeApis.push(api);
    logger.info("Added API to conversation", { conversationId, api });
  }

  conversation.lastUsedAt = new Date();
  return conversation;
}

export function requireConversation(conversationId: string | undefined): Conversation {
  if (!conversationId) {
    throw new Error(
      "conversationId is required. Call learn_wordpress_api first to obtain a conversationId."
    );
  }

  const conversation = getConversation(conversationId);
  if (!conversation) {
    throw new Error(
      `Conversation ${conversationId} not found or expired. Call learn_wordpress_api to start a new session.`
    );
  }

  return conversation;
}

/**
 * Remove stale conversations older than TTL.
 */
export function pruneConversations(): number {
  const now = Date.now();
  let pruned = 0;

  for (const [id, conv] of conversations) {
    if (now - conv.lastUsedAt.getTime() > CONVERSATION_TTL_MS) {
      conversations.delete(id);
      pruned++;
    }
  }

  if (pruned > 0) {
    logger.info("Pruned stale conversations", { pruned });
  }

  return pruned;
}
