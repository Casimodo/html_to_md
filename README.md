[![GitHub release](https://img.shields.io/github/v/release/Casimodo/html_to_md)](https://github.com/Casimodo/html_to_md/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/Casimodo/html_to_md/total)](https://github.com/Casimodo/html_to_md/releases)

# ChatGPT Conversation → Markdown Export

This repository provides two practical ways to export your ChatGPT conversations to a clean **Markdown (.md)** file:

1) **Tampermonkey Userscript (browser-side)**  
   Adds an **“Export .md”** button directly on the ChatGPT page and downloads the conversation as Markdown immediately.

2) **Node.js HTML → Markdown Converter (offline)**  
   Converts a **saved HTML** file of your ChatGPT conversation into a Markdown file.

---

## Why two options?

- **Userscript**: quickest workflow, one click on the ChatGPT page, no external tools after installation.  
- **Node.js converter**: robust offline processing; useful when you prefer to export from saved transcripts or need batch/CI processing.

---

## 1) Tampermonkey Userscript

### Prerequisites
- A modern browser (Chrome, Edge, Firefox).
- [Tampermonkey](https://www.tampermonkey.net/) extension installed.

### Installation
1. Open Tampermonkey → **Create a new script**.
2. Paste the code from `tampermonkey-export-md.user.js` (see below).
3. Save the script.
4. Visit a ChatGPT conversation page.

### Usage
- Click the **“Export .md”** button that appears in the header (or fixed at the top-right if no header is found).
- A Markdown file with your conversation is downloaded automatically.

> **Privacy note:** The script performs **no network requests**. It reads the DOM locally and saves a `.md` file to your machine.

---

## 2) Node.js HTML → Markdown Converter

### Prerequisites
- Node.js 18+ (recommended).
- npm (comes with Node.js).

### Installation
```bash
mkdir chatgpt-html-to-md && cd $_
# Create files:
# - package.json (from this README)
# - convert.js (from this README)
npm install
```

### Usage

Save your ChatGPT conversation page as an HTML file:
- In your browser: File → Save Page As… (Webpage, HTML only is fine).

```bash
node convert.js /path/to/conversation.html conversation.md
```

---

## Legal / Disclaimer

- This code is provided “as is”, without warranty.

- You are responsible for complying with the terms of service of the platform(s) you use.

- This tool runs locally and does not send your data anywhere.

--- 

