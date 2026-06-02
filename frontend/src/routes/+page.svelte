<script lang="ts">
  import ChatWidget from '$lib/ChatWidget.svelte';
</script>

<svelte:head>
  <title>Spur Store — Support</title>
  <meta name="description" content="Get instant AI-powered support for your Spur Store orders, shipping, returns, and more." />
</svelte:head>

<!-- Background landing page -->
<main>
  <div class="hero">
    <div class="hero-badge">✦ AI-Powered Support</div>
    <h1 class="hero-title">Spur Store</h1>
    <p class="hero-tagline">Your personal shopping assistant is ready.</p>
    <p class="hero-sub">
      Ask about shipping, returns, orders, or anything else — our AI agent answers instantly, 24/7.
    </p>

    <div class="feature-cards">
      <div class="card">
        <span class="card-label">Shipping Info</span>
      </div>
      <div class="card">
        <span class="card-label">Returns & Refunds</span>
      </div>
      <div class="card">
        <span class="card-label">Order Tracking</span>
      </div>
      <div class="card">
        <span class="card-label">Payments</span>
      </div>
    </div>

    <div class="cta-hint">
      <div class="cta-arrow">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>
        </svg>
      </div>
      <span>Click the chat button to get started</span>
    </div>
  </div>

  <!-- Decorative background orbs -->
  <div class="orb orb-1" aria-hidden="true"></div>
  <div class="orb orb-2" aria-hidden="true"></div>
  <div class="orb orb-3" aria-hidden="true"></div>
</main>

<!-- Chat widget is always rendered, toggled by FAB -->
<ChatWidget />

<style>
  main {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 20px;
  }

  /* ─── Decorative orbs ──────────────────────────────────────────── */

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    opacity: 0.25;
  }

  .orb-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #6366f1, transparent 70%);
    top: -100px;
    left: -150px;
    animation: float 8s ease-in-out infinite;
  }

  .orb-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #8b5cf6, transparent 70%);
    bottom: -80px;
    right: -100px;
    animation: float 10s ease-in-out infinite reverse;
  }

  .orb-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #06b6d4, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: float 12s ease-in-out infinite 2s;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -20px) scale(1.05); }
    66% { transform: translate(-15px, 15px) scale(0.97); }
  }

  /* ─── Hero Content ─────────────────────────────────────────────── */

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
    max-width: 540px;
    position: relative;
    z-index: 1;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 100px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.35);
    color: #a5b4fc;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .hero-title {
    font-size: clamp(2.5rem, 8vw, 4rem);
    font-weight: 700;
    background: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .hero-tagline {
    font-size: 1.2rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }

  .hero-sub {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
    line-height: 1.6;
    max-width: 420px;
  }

  /* ─── Feature Cards ────────────────────────────────────────────── */

  .feature-cards {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
  }

  .card {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
    cursor: default;
  }

  .card:hover {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }

  .card-icon {
    font-size: 1rem;
  }

  .card-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
  }

  /* ─── CTA Hint ─────────────────────────────────────────────────── */

  .cta-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.82rem;
    margin-top: 8px;
    animation: bounceDown 2s ease-in-out infinite;
  }

  .cta-arrow {
    color: rgba(99, 102, 241, 0.6);
  }

  @keyframes bounceDown {
    0%, 100% { transform: translateY(0); opacity: 0.6; }
    50% { transform: translateY(6px); opacity: 1; }
  }
</style>
