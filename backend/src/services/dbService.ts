import { getDb, persistDb } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import type { SqlValue } from 'sql.js';
import type { Conversation, Message, Sender } from '../types';

// sql.js BindParams compatible array
type QueryParams = SqlValue[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Execute a SELECT query and return typed rows.
 * sql.js returns results as { columns: string[], values: unknown[][] }
 */
function queryRows<T>(sql: string, params: QueryParams = []): T[] {
  const db = getDb();
  const results = db.exec(sql, params);
  if (!results || results.length === 0) return [];

  const { columns, values } = results[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

/**
 * Execute an INSERT/UPDATE/DELETE statement.
 */
function runStatement(sql: string, params: QueryParams = []): void {
  const db = getDb();
  db.run(sql, params);
  persistDb();
}

// ─── Conversations ────────────────────────────────────────────────────────────

export function createConversation(metadata?: string): Conversation {
  const conversation: Conversation = {
    id: uuidv4(),
    createdAt: Date.now(),
    metadata: metadata ?? null,
  };

  runStatement(
    `INSERT INTO conversations (id, created_at, metadata) VALUES (?, ?, ?)`,
    [conversation.id, conversation.createdAt, conversation.metadata as SqlValue]
  );

  return conversation;
}

export function getConversation(id: string): Conversation | undefined {
  interface RawConversation {
    id: string;
    created_at: number;
    metadata: string | null;
  }

  const rows = queryRows<RawConversation>(
    `SELECT id, created_at, metadata FROM conversations WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row.id,
    createdAt: row.created_at,
    metadata: row.metadata,
  };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function saveMessage(
  conversationId: string,
  sender: Sender,
  text: string
): Message {
  const message: Message = {
    id: uuidv4(),
    conversationId,
    sender,
    text,
    timestamp: Date.now(),
  };

  runStatement(
    `INSERT INTO messages (id, conversation_id, sender, text, timestamp) VALUES (?, ?, ?, ?, ?)`,
    [message.id, message.conversationId, message.sender, message.text, message.timestamp] as QueryParams
  );

  return message;
}

interface RawMessage {
  id: string;
  conversation_id: string;
  sender: string;
  text: string;
  timestamp: number;
}

function rawToMessage(row: RawMessage): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender as Sender,
    text: row.text,
    timestamp: row.timestamp,
  };
}

export function getMessages(conversationId: string): Message[] {
  const rows = queryRows<RawMessage>(
    `SELECT id, conversation_id, sender, text, timestamp
     FROM messages
     WHERE conversation_id = ?
     ORDER BY timestamp ASC`,
    [conversationId]
  );
  return rows.map(rawToMessage);
}

/**
 * Fetch the N most recent messages for a conversation (for LLM context window).
 */
export function getRecentMessages(conversationId: string, limit: number = 20): Message[] {
  const rows = queryRows<RawMessage>(
    `SELECT id, conversation_id, sender, text, timestamp
     FROM messages
     WHERE conversation_id = ?
     ORDER BY timestamp DESC
     LIMIT ?`,
    [conversationId, limit]
  );
  // Return in chronological order (oldest first)
  return rows.map(rawToMessage).reverse();
}
