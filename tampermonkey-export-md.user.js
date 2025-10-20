// ==UserScript==
// @name         ChatGPT → Export Markdown (.md)
// @namespace    https://example.local/export-md
// @version      1.0.1
// @description  Adds a button to export the current ChatGPT conversation to Markdown
// @author       you
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ----------------------------- Utilities ----------------------------------

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function sanitizeFileName(name) {
    // Replace forbidden filename characters and trim length
    return name.replace(/[\/\\?%*:|"<>]/g, '-').slice(0, 80).trim() || 'conversation';
  }

  function toISODateTimeLocal(d = new Date()) {
    // YYYY-MM-DD HH:MM (local time, no seconds for readability)
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function escapeTripleBackticks(text) {
    // Prevent accidental code-fence collisions by splitting ``` sequences
    return text.replace(/```/g, '`` `');
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // --------------------------- Extraction logic -----------------------------

  function getTitle() {
    // Try to grab the visible conversation title; otherwise use <title> or a fallback
    const h1 = document.querySelector('h1, header h1, [data-testid="conversation-title"]');
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();

    const t = document.title?.replace(/ - ChatGPT.*$/i, '').trim();
    return t || 'ChatGPT Conversation';
  }

  function inferRole(el) {
    // Determine message role via known attributes/classes; default to Assistant
    const roleAttr = el.getAttribute('data-message-author-role');
    if (roleAttr) {
      if (roleAttr.includes('user')) return 'User';
      if (roleAttr.includes('assistant')) return 'Assistant';
      if (roleAttr.includes('system')) return 'System';
    }
    // Fallback heuristic: if the element starts with “You” it might be the user
    const txt = el.textContent || '';
    return txt.startsWith('You') ? 'User' : 'Assistant';
  }

  function extractMessageText(el) {
    // Prefer rendered markdown containers when available, else read the element text
    const md = el.querySelector('.markdown');
    const target = md || el;

    // innerText preserves line breaks; trim and protect code fences
    const text = target.innerText || '';
    return escapeTripleBackticks(text.trim());
  }

  function collectMessages() {
    // Primary selector: nodes tagged with data-message-author-role
    const nodes = Array.from(document.querySelectorAll('div[data-message-author-role]'));
    // Fallback for layout changes
    const list = nodes.length
      ? nodes
      : Array.from(document.querySelectorAll('[data-testid="conversation-turn"], article, section')).filter(Boolean);

    const messages = [];
    for (const el of list) {
      const content = extractMessageText(el);
      if (!content) continue;
      const role = inferRole(el);
      messages.push({ role, content });
    }
    return messages;
  }

  function buildMarkdown({ title, url, exportedAt, messages }) {
    // Simple, readable Markdown transcript with section headers per message
    const lines = [];
    lines.push(`# ${title}`);
    lines.push('');
    lines.push(`- **URL**: ${url}`);
    lines.push(`- **Exported at**: ${exportedAt}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const msg of messages) {
      lines.push(`## ${msg.role}`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    return lines.join('\n');
  }

  // ------------------------------- UI logic ---------------------------------

  function addExportButton() {
    // Avoid duplicates if the UI re-renders
    if (document.getElementById('export-md-chatgpt-btn')) return;

    // Reasonable container guesses; fallback to fixed button on body
    const container =
      document.querySelector('header') ||
      document.querySelector('[data-testid="header"]') ||
      document.body;

    const btn = document.createElement('button');
    btn.id = 'export-md-chatgpt-btn';
    btn.textContent = 'Export .md';
    Object.assign(btn.style, {
      position: container === document.body ? 'fixed' : 'relative',
      top: container === document.body ? '12px' : '',
      right: container === document.body ? '12px' : '',
      padding: '8px 12px',
      borderRadius: '10px',
      border: '1px solid #ccc',
      cursor: 'pointer',
      background: 'white',
      fontSize: '14px',
      zIndex: 999999
    });

    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;
        btn.textContent = 'Exporting...';
        await sleep(50);

        const title = getTitle();
        const messages = collectMessages();
        const md = buildMarkdown({
          title,
          url: location.href,
          exportedAt: toISODateTimeLocal(new Date()),
          messages
        });

        const file = sanitizeFileName(title) + '.md';
        downloadText(file, md);
        btn.textContent = 'Export .md';
      } catch (e) {
        console.error(e);
        alert('Markdown export failed. Open the console for details.');
        btn.textContent = 'Export .md';
      } finally {
        btn.disabled = false;
      }
    });

    container.appendChild(btn);
  }

  // Observe re-renders and ensure the button is present
  const obs = new MutationObserver(() => addExportButton());
  obs.observe(document.documentElement, { childList: true, subtree: true });
  addExportButton();
})();
