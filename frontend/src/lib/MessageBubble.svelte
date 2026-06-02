<script lang="ts">
  interface Props {
    sender: 'user' | 'ai';
    text: string;
    timestamp: number;
    isError?: boolean;
  }

  let { sender, text, timestamp, isError = false }: Props = $props();

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<div class="message-row {sender}">
  {#if sender === 'ai'}
    <div class="avatar ai-avatar">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor" opacity="0.3"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
        <path d="M12 6v2M12 16v2M6 12H8M16 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
  {/if}

  <div class="bubble-wrap">
    <div class="bubble {sender} {isError ? 'error' : ''}">
      {#if isError}
        <span class="error-icon">⚠️</span>
      {/if}
      <p>{text}</p>
    </div>
    <span class="timestamp">{formatTime(timestamp)}</span>
  </div>
</div>

<style>
  .message-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin-bottom: 16px;
    animation: fadeSlideIn 0.3s ease-out;
  }

  .message-row.user {
    flex-direction: row-reverse;
  }

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    align-self: flex-start;
  }

  .ai-avatar {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
  }

  .ai-avatar svg {
    width: 18px;
    height: 18px;
  }


  .bubble-wrap {
    display: flex;
    flex-direction: column;
    max-width: 72%;
  }

  .message-row.user .bubble-wrap {
    align-items: flex-end;
  }

  .message-row.ai .bubble-wrap {
    align-items: flex-start;
  }

  .bubble {
    padding: 12px 16px;
    border-radius: 18px;
    line-height: 1.55;
    font-size: 0.92rem;
    word-break: break-word;
  }

  .bubble p {
    margin: 0;
    white-space: pre-wrap;
  }

  .bubble.ai {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    border-bottom-left-radius: 4px;
  }

  .bubble.user {
    background: linear-gradient(135deg, #6366f1, #7c3aed);
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
  }

  .bubble.error {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .error-icon {
    margin-right: 6px;
  }

  .timestamp {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 4px;
    padding: 0 4px;
  }
</style>
