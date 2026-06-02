import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { chatMessageSchema, validateBody } from '../middleware/validation';
import { handleChatMessage, getConversationHistory } from '../services/chatService';

const router = Router();

// ─── POST /api/chat/message ───────────────────────────────────────────────────

type ChatMessageParsed = z.infer<typeof chatMessageSchema>;

router.post(
  '/message',
  validateBody(chatMessageSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { message, sessionId } = (req as Request & { parsed: ChatMessageParsed }).parsed;

    try {
      const result = await handleChatMessage(message, sessionId);
      res.json(result);
    } catch (error) {
      console.error('[POST /chat/message] Error:', error);

      const err = error as Error;
      let userMessage =
        'Our AI agent is temporarily unavailable. Please try again in a moment or contact support@spurstore.com.';

      if (err.message?.includes('GROQ_API_KEY')) {
        userMessage =
          'The AI service is not configured. Please add your GROQ_API_KEY to the .env file.';
      } else if (
        err.message?.toLowerCase().includes('rate limit') ||
        err.message?.toLowerCase().includes('429')
      ) {
        userMessage =
          'The AI agent is handling a high volume of requests. Please wait a moment and try again.';
      } else if (
        err.message?.toLowerCase().includes('timeout') ||
        err.message?.toLowerCase().includes('network')
      ) {
        userMessage = 'The AI service timed out. Please try again.';
      }

      res.status(503).json({
        error: 'LLM service error',
        reply: userMessage,
        sessionId: sessionId ?? null,
      });
    }
  }
);

// ─── GET /api/chat/:sessionId ─────────────────────────────────────────────────

router.get('/:sessionId', (req: Request, res: Response): void => {
  const { sessionId } = req.params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(sessionId)) {
    res.status(400).json({ error: 'Invalid sessionId format' });
    return;
  }

  try {
    const history = getConversationHistory(sessionId);
    if (!history) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(history);
  } catch (error) {
    console.error('[GET /chat/:sessionId] Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

export default router;
