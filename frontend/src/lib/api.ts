// API client for the Spur Chatbot backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Message {
  id: string;
  conversationId?: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  messageId: string;
  error?: string;
}

export interface HistoryResponse {
  sessionId: string;
  messages: Message[];
}

/**
 * Send a chat message to the backend and receive an AI reply.
 */
export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  const data = await response.json();

  // Even on error status codes (503), we return the data — the backend
  // sends a friendly reply string in the error case too
  return data as ChatResponse;
}

/**
 * Fetch the conversation history for a given session ID.
 * Returns null if the session is not found.
 */
export async function fetchHistory(sessionId: string): Promise<HistoryResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/chat/${sessionId}`);
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return (await response.json()) as HistoryResponse;
  } catch {
    return null;
  }
}
