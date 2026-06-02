import Groq from 'groq-sdk';
import type { LLMMessage } from '../types';

// ─── Store Knowledge Base ─────────────────────────────────────────────────────
// Hardcoded FAQ for the fictional "Spur Store". 
// This is injected into the system prompt so the AI can answer reliably.

const STORE_KNOWLEDGE = `
=== SPUR STORE — SUPPORT KNOWLEDGE BASE ===

STORE INFO:
- Name: Spur Store
- Type: Online e-commerce store selling fashion, accessories, and lifestyle products
- Website: spurstore.com (fictional)

SHIPPING POLICY:
- Free standard shipping on all orders over $50 (US only)
- Standard shipping: 3–7 business days, costs $4.99 for orders under $50
- Express shipping: 1–2 business days, costs $12.99
- International shipping available to: USA, Canada, UK, Australia, Germany, France
- International standard: 7–14 business days, costs $14.99
- Orders are processed within 1 business day (Mon–Fri)
- No shipping on weekends or public holidays

RETURNS & REFUNDS:
- 30-day return policy from date of delivery
- Items must be unused, unworn, and in original packaging with tags attached
- Sale items are final sale — no returns or exchanges
- To initiate a return: email returns@spurstore.com with order number and reason
- Refunds processed within 5–7 business days after we receive the item
- Refunds go back to the original payment method
- Exchange available for size/color if in stock (free of charge)

ORDER & TRACKING:
- Order confirmation email sent immediately after purchase
- Shipping confirmation with tracking number sent within 1 business day
- Track orders via the link in shipping email or at spurstore.com/track
- For order issues, email support@spurstore.com with order number

PAYMENT:
- Accepted: Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay
- All transactions secured with 256-bit SSL encryption
- No payment by check or wire transfer

SUPPORT HOURS:
- Live human agents: Monday–Friday, 9am–6pm EST
- AI support agent: Available 24/7
- Email response time: Within 24 hours on business days
- Phone support: Not available (email/chat only)

PRODUCTS & SIZING:
- Size guide available on every product page
- If item doesn't fit, exchanges are free within the 30-day window
- Product questions: check product page or email support@spurstore.com

ACCOUNT & PRIVACY:
- No account required to place an order
- Guest checkout available
- We never sell customer data to third parties
===
`.trim();

const SYSTEM_PROMPT = `You are a friendly and professional AI support agent for Spur Store, an online e-commerce brand.

Your job is to help customers with questions about orders, shipping, returns, products, and anything else related to Spur Store.

Use the knowledge base below to answer questions accurately. If you don't know something that isn't in the knowledge base, say so politely and offer to connect them with the human support team (support@spurstore.com).

Keep answers clear, concise, and friendly. Use bullet points for lists. Don't make up information.

${STORE_KNOWLEDGE}`;

// ─── Groq Client ──────────────────────────────────────────────────────────────

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error(
        'GROQ_API_KEY is not set. Please add it to your .env file.'
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ─── Core LLM Function ────────────────────────────────────────────────────────

/**
 * Generate an AI reply given the conversation history and the new user message.
 * 
 * @param history - Array of previous messages (user + ai), max 20 for context window
 * @param userMessage - The current user message
 * @returns The AI's text reply
 */
export async function generateReply(
  history: LLMMessage[],
  userMessage: string
): Promise<string> {
  const client = getGroqClient();

  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 512,
    temperature: 0.5,
    // Stop sequences to prevent runaway responses
    stop: null,
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    throw new Error('LLM returned an empty response');
  }

  return reply.trim();
}
