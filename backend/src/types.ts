// Shared TypeScript types for the Spur Chatbot backend

export type Sender = 'user' | 'ai';

export interface Conversation {
  id: string;
  createdAt: number;
  metadata: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  timestamp: number;
}

export interface ChatMessageRequest {
  message: string;
  sessionId?: string;
}

export interface ChatMessageResponse {
  reply: string;
  sessionId: string;
  messageId: string;
}

export interface ConversationHistoryResponse {
  sessionId: string;
  messages: Message[];
}

// LLM-specific types
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
