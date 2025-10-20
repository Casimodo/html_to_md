#!/usr/bin/env node
/**
 * ChatGPT HTML → Markdown converter
 *
 * Usage:
 *   node convert.js input.html output.md
 * or:
 *   node convert.js input.html
 *     (output filename will be inferred from the conversation title)
 *
 * Design goals:
 * - Minimal dependencies (only cheerio).
 * - Fast and memory-efficient.
 * - Resilient to minor DOM changes with reasonable fallbacks.
 */

import fs from 'fs';
import path from 'path';
import * as url from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function escapeTripleBackticks(s) {
  // Prevent code-fence collisions inside messages
  return s.replace(/```/g, '`` `');
}

function sanitizeFileName(name) {
  // Safe filename generation for cross-platform use
  return name.replace(/[\/\\?%*:|"<>]/g, '-').slice(0, 80).trim() || 'conversation';
}

function normalizeText(s) {
  // Normalize line breaks and collapse excess blank lines
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function textOf($el) {
  // Cheerio .text() approximates innerText; we normalize afterwards
  return normalizeText($el.text());
}

function buildMarkdown({ title, sourcePath, messages }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}`;

  const lines = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`- **Source**: ${path.basename(sourcePath)}`);
  lines.push(`- **Exported at**: ${iso}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const m of messages) {
    lines.push(`## ${m.role}`);
    lines.push('');
    lines.push(escapeTripleBackticks(m.content));
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

function inferRole($msg) {
  // Determine message role based on attributes/classes; default to Assistant
  const roleAttr = $msg.attr('data-message-author-role') || '';
  if (roleAttr.includes('user')) return 'User';
  if (roleAttr.includes('assistant')) return 'Assistant';
  if (roleAttr.includes('system')) return 'System';

  const cls = $msg.attr('class') || '';
  if (/assistant|bot/i.test(cls)) return 'Assistant';
  if (/user|me|author-user/i.test(cls)) return 'User';

  return 'Assistant';
}

function extractMessages($) {
  // Primary: elements with data-message-author-role
  let nodes = $('div[data-message-author-role]');
  if (!nodes.length) {
    // Fallbacks for alternative layouts
    nodes = $('[data-testid="conversation-turn"], article, section');
  }

  const messages = [];
  nodes.each((_, el) => {
    const $el = $(el);
    const role = inferRole($el);

    // Prefer the rendered markdown container when available
    const $md = $el.find('.markdown').first();
    const content = textOf($md.length ? $md : $el);

    if (content) {
      messages.push({ role, content });
    }
  });

  return messages;
}

async function main() {
  const [inputPath, outputPathArg] = process.argv.slice(2);
  if (!inputPath) {
    console.error('Usage: node convert.js input.html [output.md]');
    process.exit(1);
  }

  const html = fs.readFileSync(inputPath, 'utf8');
  const $ = cheerio.load(html);

  // Try to extract a readable title from common locations
  const rawTitle =
    $('h1, header h1, [data-testid="conversation-title"], title').first().text().trim() || 'ChatGPT Conversation';
  const title = rawTitle.replace(/ - ChatGPT.*$/i, '').trim() || 'ChatGPT Conversation';

  const messages = extractMessages($);
  const md = buildMarkdown({ title, sourcePath: inputPath, messages });

  const outputPath = outputPathArg || path.join(__dirname, sanitizeFileName(title) + '.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log('✅ Markdown export generated:', outputPath);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
