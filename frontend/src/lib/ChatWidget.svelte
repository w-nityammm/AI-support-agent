<script lang="ts">
  import { onMount, tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import { sendMessage, fetchHistory, type Message } from './api';

  // ─── State ─────────────────────────────────────────────────────────────────

  let messages: (Message & { isError?: boolean })[] = $state([]);
  let inputText = $state('');
  let isLoading = $state(false);
  let sessionId: string | null = $state(null);
  let messagesContainer: HTMLElement;
  let inputEl: HTMLTextAreaElement;
  let isOpen = $state(false);
  let hasUnread = $state(false);

  const SESSION_KEY = 'spur_chat_session_id';
  const MAX_INPUT_LENGTH = 2000;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  onMount(async () => {
    // Restore session from localStorage
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      sessionId = stored;
      await loadHistory(stored);
    }
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  async function loadHistory(sid: string) {
    const history = await fetchHistory(sid);
    if (history && history.messages.length > 0) {
      messages = history.messages;
      await scrollToBottom();
    }
  }

  async function scrollToBottom() {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function persistSession(sid: string) {
    sessionId = sid;
    localStorage.setItem(SESSION_KEY, sid);
  }

  // ─── Send Message ──────────────────────────────────────────────────────────

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isLoading) return;

    // Client-side length guard (server also truncates, but warn here)
    if (text.length > MAX_INPUT_LENGTH) {
      alert(`Message is too long (max ${MAX_INPUT_LENGTH} characters).`);
      return;
    }

    inputText = '';
    isLoading = true;

    // Optimistically add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };
    messages = [...messages, userMsg];
    await scrollToBottom();

    try {
      const result = await sendMessage(text, sessionId ?? undefined);

      // Persist session
      if (result.sessionId) {
        persistSession(result.sessionId);
      }

      const isError = Boolean(result.error);
      const aiMsg: Message & { isError?: boolean } = {
        id: result.messageId || crypto.randomUUID(),
        sender: 'ai',
        text: result.reply || 'Sorry, something went wrong.',
        timestamp: Date.now(),
        isError,
      };
      messages = [...messages, aiMsg];

      if (!isOpen) hasUnread = true;
    } catch (err) {
      // Network-level failure
      const errorMsg: Message & { isError?: boolean } = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: 'Unable to reach the support agent. Please check your connection and try again.',
        timestamp: Date.now(),
        isError: true,
      };
      messages = [...messages, errorMsg];
    } finally {
      isLoading = false;
      await scrollToBottom();
      inputEl?.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      hasUnread = false;
      tick().then(() => {
        scrollToBottom();
        inputEl?.focus();
      });
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionId = null;
    messages = [];
  }

  const charCount = $derived(inputText.length);
  const isNearLimit = $derived(charCount > MAX_INPUT_LENGTH * 0.8);
  const isOverLimit = $derived(charCount > MAX_INPUT_LENGTH);
</script>

<!-- ─── Floating Action Button ───────────────────────────────────────────────── -->
<button
  id="chat-toggle-btn"
  class="chat-fab"
  class:open={isOpen}
  onclick={toggleWidget}
  aria-label={isOpen ? 'Close chat' : 'Open support chat'}
>
  {#if isOpen}
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
    </svg>
    {#if hasUnread}
      <span class="unread-dot" aria-label="Unread message"></span>
    {/if}
  {/if}
</button>

<!-- ─── Chat Widget Panel ──────────────────────────────────────────────────── -->
<div class="chat-widget" class:open={isOpen} role="dialog" aria-label="Support Chat">

  <!-- Header -->
  <div class="chat-header">
    <div class="header-left">
      <div class="agent-status">
        <div class="status-dot"></div>
      </div>
      <div class="header-info">
        <h2 class="agent-name">Spur Support</h2>
        <span class="agent-subtitle">AI Agent · Online 24/7</span>
      </div>
    </div>
    <div class="header-actions">
      {#if messages.length > 0}
        <button
          class="icon-btn"
          onclick={clearSession}
          title="Start new conversation"
          aria-label="Start new conversation"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      {/if}
      <button class="icon-btn close-btn" onclick={toggleWidget} aria-label="Close chat">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Messages -->
  <div class="messages-container" bind:this={messagesContainer}>
    {#if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
            <circle cx="12" cy="12" r="10" stroke="url(#g1)" stroke-width="1.5"/>
            <path d="M8 12h8M8 8.5h5M8 15.5h3" stroke="url(#g2)" stroke-width="1.5" stroke-linecap="round"/>
            <defs>
              <linearGradient id="g1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
              <linearGradient id="g2" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p class="empty-title">How can we help?</p>
        <p class="empty-subtitle">Ask about shipping, returns, orders, or anything else.</p>
        <div class="quick-prompts">
          {#each ['What\'s your return policy?', 'Do you ship internationally?', 'How do I track my order?'] as prompt}
            <button
              class="quick-prompt"
              onclick={() => { inputText = prompt; handleSend(); }}
            >
              {prompt}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      {#each messages as msg (msg.id)}
        <MessageBubble
          sender={msg.sender}
          text={msg.text}
          timestamp={msg.timestamp}
          isError={msg.isError ?? false}
        />
      {/each}
    {/if}

    {#if isLoading}
      <div class="typing-indicator">
        <div class="typing-avatar">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 6v2M12 16v2M6 12H8M16 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="typing-text">Agent is typing…</span>
      </div>
    {/if}
  </div>

  <!-- Input -->
  <div class="input-area">
    <div class="input-wrapper" class:over-limit={isOverLimit}>
      <textarea
        id="chat-input"
        bind:this={inputEl}
        bind:value={inputText}
        onkeydown={handleKeydown}
        placeholder="Type a message…"
        rows="1"
        disabled={isLoading}
        maxlength={MAX_INPUT_LENGTH + 500}
        aria-label="Message input"
        aria-describedby="char-count"
      ></textarea>
      {#if isNearLimit}
        <span id="char-count" class="char-count" class:warning={isNearLimit} class:danger={isOverLimit}>
          {charCount}/{MAX_INPUT_LENGTH}
        </span>
      {/if}
    </div>
    <button
      id="send-btn"
      class="send-btn"
      onclick={handleSend}
      disabled={isLoading || !inputText.trim() || isOverLimit}
      aria-label="Send message"
    >
      {#if isLoading}
        <svg class="spin" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      {/if}
    </button>
  </div>

  <div class="chat-footer">
    Powered by <span class="brand">Spur Store AI</span>
  </div>
</div>

<style>
  /* ─── FAB ─────────────────────────────────────────────────────────────── */

  .chat-fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.25s ease;
    z-index: 1000;
    position: fixed;
  }

  .chat-fab:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 40px rgba(99, 102, 241, 0.65);
  }

  .chat-fab.open {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .unread-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #f43f5e;
    border: 2px solid #0f0f1a;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.8; }
  }

  /* ─── Widget Panel ─────────────────────────────────────────────────── */

  .chat-widget {
    position: fixed;
    bottom: 100px;
    right: 28px;
    width: 380px;
    max-height: 600px;
    border-radius: 20px;
    background: rgba(13, 13, 28, 0.92);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 25px 80px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(99, 102, 241, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 999;
    transform: scale(0.92) translateY(20px);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.25s ease;
    transform-origin: bottom right;
  }

  .chat-widget.open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  /* ─── Header ──────────────────────────────────────────────────────── */

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    background: linear-gradient(135deg,
      rgba(99, 102, 241, 0.2) 0%,
      rgba(139, 92, 246, 0.15) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .agent-status {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
  }

  .status-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #22c55e;
    border: 2px solid rgba(13, 13, 28, 0.92);
    animation: statusPulse 2s ease-in-out infinite;
  }

  @keyframes statusPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
  }

  .agent-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
    letter-spacing: 0.01em;
  }

  .agent-subtitle {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.45);
  }

  .header-actions {
    display: flex;
    gap: 6px;
  }

  .icon-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.9);
  }

  /* ─── Messages ────────────────────────────────────────────────────── */

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 8px;
    scroll-behavior: smooth;
  }

  .messages-container::-webkit-scrollbar {
    width: 4px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  /* ─── Empty State ─────────────────────────────────────────────────── */

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 16px;
    gap: 8px;
  }

  .empty-icon {
    margin-bottom: 8px;
    opacity: 0.9;
  }

  .empty-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0;
  }

  .empty-subtitle {
    font-size: 0.83rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0 0 12px;
  }

  .quick-prompts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .quick-prompt {
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.08);
    color: #a5b4fc;
    font-size: 0.82rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
    font-family: inherit;
  }

  .quick-prompt:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.6);
    transform: translateX(3px);
  }

  /* ─── Typing Indicator ────────────────────────────────────────────── */

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    animation: fadeSlideIn 0.3s ease-out;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .typing-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .typing-dots {
    display: flex;
    gap: 4px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px 14px;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
  }

  .typing-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.7);
    animation: typingBounce 1.2s ease-in-out infinite;
  }

  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
    30% { transform: translateY(-5px); opacity: 1; }
  }

  .typing-text {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
    font-style: italic;
  }

  /* ─── Input ───────────────────────────────────────────────────────── */

  .input-area {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 14px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.02);
  }

  .input-wrapper {
    flex: 1;
    position: relative;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: border-color 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .input-wrapper.over-limit {
    border-color: rgba(239, 68, 68, 0.6);
  }

  textarea {
    width: 100%;
    min-height: 40px;
    max-height: 120px;
    background: transparent;
    border: none;
    outline: none;
    color: #e2e8f0;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.5;
    padding: 10px 14px;
    resize: none;
    box-sizing: border-box;
    overflow-y: auto;
  }

  textarea::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .char-count {
    position: absolute;
    bottom: 6px;
    right: 10px;
    font-size: 0.67rem;
    color: rgba(255, 255, 255, 0.35);
    pointer-events: none;
  }

  .char-count.warning { color: #fbbf24; }
  .char-count.danger { color: #ef4444; }

  .send-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  .spin {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ─── Footer ──────────────────────────────────────────────────────── */

  .chat-footer {
    text-align: center;
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.2);
    padding: 6px 0 10px;
  }

  .brand {
    color: rgba(99, 102, 241, 0.7);
    font-weight: 600;
  }

  /* ─── Responsive ──────────────────────────────────────────────────── */

  @media (max-width: 440px) {
    .chat-widget {
      right: 0;
      bottom: 0;
      width: 100vw;
      max-height: 100dvh;
      border-radius: 20px 20px 0 0;
      border-bottom: none;
    }

    .chat-fab {
      bottom: 20px;
      right: 20px;
    }
  }
</style>
