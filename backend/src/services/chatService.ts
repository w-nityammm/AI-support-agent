import {
  createConversation,
  getConversation,
  getMessages,
  getRecentMessages,
  saveMessage,
} from './dbService';
import { generateReply } from './llmService';
import type {
  ChatMessageResponse,
  ConversationHistoryResponse,
  LLMMessage,
  Message,
} from '../types';

// Max characters for a single user message (server-side guard)
const MAX_MESSAGE_LENGTH = 2000;

// How many recent messages to include as LLM context
const CONTEXT_WINDOW = 20;

/**
 * Process an incoming chat message:
 * 1. Resolve or create a conversation (session)
 * 2. Persist the user message
 * 3. Build LLM context from history
 * 4. Call LLM for a reply
 * 5. Persist AI reply
 * 6. Return the reply + sessionId
 */
export async function handleChatMessage(
  rawMessage: string,
  sessionId?: string
): Promise<ChatMessageResponse> {
  // Truncate overly long messages (still process, just truncated)
  const message =
    rawMessage.length > MAX_MESSAGE_LENGTH
      ? rawMessage.slice(0, MAX_MESSAGE_LENGTH) + '… [message truncated]'
      : rawMessage;

  // Resolve existing conversation or create a new one
  let conversationId: string;

  if (sessionId) {
    const existing = getConversation(sessionId);
    if (existing) {
      conversationId = existing.id;
    } else {
      // sessionId provided but not found — start fresh
      const conversation = createConversation();
      conversationId = conversation.id;
    }
  } else {
    const conversation = createConversation();
    conversationId = conversation.id;
  }

  // Persist the user message
  saveMessage(conversationId, 'user', message);

  // Fetch recent history for context (last message is the one we just saved)
  const recentHistory = getRecentMessages(conversationId, CONTEXT_WINDOW);
  // Exclude the last message (just saved) — pass it separately to generateReply
  const historyForLLM = recentHistory.slice(0, -1);

  // Convert DB messages to LLM format
  const llmHistory: LLMMessage[] = historyForLLM.map((msg: Message) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));

  // Call Groq LLM (async)
  const reply = await generateReply(llmHistory, message);

  // Persist AI reply
  const aiMessage = saveMessage(conversationId, 'ai', reply);

  return {
    reply,
    sessionId: conversationId,
    messageId: aiMessage.id,
  };
}

/**
 * Fetch the full message history for a conversation.
 */
export function getConversationHistory(
  sessionId: string
): ConversationHistoryResponse | null {
  const conversation = getConversation(sessionId);
  if (!conversation) return null;

  const messages = getMessages(sessionId);
  return { sessionId, messages };
}
