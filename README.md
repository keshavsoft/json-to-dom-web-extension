# @keshavsoft/json-to-dom-web-extension

> **Declarative JSON-to-DOM Table Workbench & Browser Extension.**  
> Effortlessly transform structured JSON data (`columns.json` + `data.json`) into rich, responsive, searchable native DOM tables anywhere in your browser.

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-emerald.svg)](extension/v2/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version: v2.0.0](https://img.shields.io/badge/Version-v2.0.0-teal.svg)](extension/v2/)

---

## 📖 The Story Behind This Repository

### 1. The Dual Architecture Vision
In the KeshavSoft ecosystem, the journey began with [`@keshavsoft/tag-to-json`](https://github.com/keshavsoft/tag-to-json). That architecture traversed live rendered DOM nodes on any web page (implementing the W3C DOM Level 4 standard) and extracted them into declarative JSON specifications.

While `tag-to-json` solved **DOM $\rightarrow$ JSON**, the reverse journey remained: **How do we take raw, structured JSON datasets and schemas and materialize them instantly into beautiful, interactive DOM tables and UI components?**

```
┌──────────────────┐    tag-to-json Extension     ┌────────────────────────┐
│  Live Webpage    │ ───────────────────────────> │  Declarative JSON Spec │
│    DOM Nodes     │                              │   (Tags & Attributes)  │
└──────────────────┘                              └────────────────────────┘
         ▲                                                     │
         │             json-to-dom Extension                   ▼
         └───────────────────────────────────────── ┌────────────────────────┐
                 Materializes interactive           │ columns.json+data.json │
                   DOM tables anywhere              │   (Table Data & Schema)│
                                                    └────────────────────────┘
```

### 2. The Monaco Editor Discovery
In the `monacoEditor` workbench experiments (`docs/bs5/v3` and `v4`), developers edited `columns.json` and `data.json` in split panes, clicked **Render**, and watched the engine build an interactive Bootstrap 5 table with row numbering (`#`), real-time search filtering, and options.

The core realization emerged:  
> *"It was never about the Monaco editor itself—Monaco was just a text wrapper. The true architectural value was the **Declarative JSON-to-DOM Table Builder**!"*

Instead of keeping this capability tied to a standalone webpage, this repository extracts that workbench into a portable, **zero-dependency browser extension** that you can open and run on **any website, anywhere in the browser**.

---

## ⚡ Key Features

- 📊 **Instant Table Workbench**: Load sample inventory schemas or edit your own `columns.json` and `data.json` directly from the popup toolbar.
- 🔍 **Real-Time Live Search**: Instantly filters table rows as you type with zero external libraries.
- 🔢 **Automated Serial Numbering**: Automatically maintains dynamic `#` indexing across all filtered records.
- 🌐 **In-Page DOM Injection**: One-click **Inject** button materializes the rendered DOM table directly onto your active webpage inside a floating, dismissible card.
- 🛡️ **Zero External Runtime Dependencies**: Fully self-contained, 100% compliant with strict Chrome Manifest V3 Content Security Policies (no external CDNs required).
- 🎨 **Distinct Visual Identity**: High-contrast KeshavSoft Emerald & Cyan branding, custom multi-resolution icons (16px, 32px, 48px, 96px, 128px).

---

## 🌟 Version Evolution Matrix

| Version | Focus | Key Highlights |
|---|---|---|
| **v1.0.0** | **Foundation & Verification** | Clean Manifest V3 architecture, popup UI scaffolding, button click event listeners, status indicator, active tab query integration. |
| **v2.0.0** | **Table Workbench & In-Page Injection** | Full Table Workbench popup, real-time live search filter, columns/data editor modal, in-page DOM injection content script, and high-res Emerald-Teal branding icons. |

---

## 📂 Repository Structure

```text
json-to-dom-web-extension/
├── extension/
│   ├── v1/                       # Version 1 (Foundation & Event Scaffolding)
│   │   ├── manifest.json
│   │   ├── icons/                # Multi-resolution icons (16 to 128px)
│   │   ├── popup/                # Popup interface & modal
│   │   └── src/                  # Content script & runtime stub
│   │
│   └── v2/                       # Version 2 (Table Workbench & In-Page Injection)
│       ├── manifest.json         # Manifest V3 (v2.0.0)
│       ├── icons/                # High-res Emerald & Cyan icons
│       ├── popup/                # Table Workbench popup interface
│       │   ├── popup.html        # Table container, search bar & modal editor
│       │   ├── popup.css         # Modern dark theme styles
│       │   └── popup.js          # Table renderer, search filter & injection hooks
│       └── src/
│           ├── injectStart.js    # Active tab in-page DOM table injection
│           └── jsonToDom.min.js  # Client page runtime
│
├── .gitignore
├── LICENSE
├── package.json
├── publish.js                    # Automated zip packaging for Chrome / Firefox
└── README.md
```

---

## 🛠️ Installation & Testing Guide

### Load Unpacked Extension in Chrome / Edge / Brave:

1. Open your browser and navigate to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Select the extension directory:
   * To test the latest **Table Workbench (v2.0.0)**:
     ```text
     D:\KeshavSoftRepos\nov\4-1\json-to-dom-web-extension\extension\v2
     ```
   * Or to inspect the **Foundation (v1.0.0)**:
     ```text
     D:\KeshavSoftRepos\nov\4-1\json-to-dom-web-extension\extension\v1
     ```
5. Click the puzzle icon on your toolbar and **pin** `json-to-dom Web Extension`.
6. Click the extension icon to launch the Table Workbench!

---

## 🎮 How to Use Version 2

1. **Click the Extension Icon**: The Table Workbench opens instantly with a rendered sample table.
2. **Filter Records**: Type in the `🔍 Search table rows...` bar to filter records live.
3. **Inspect / Edit JSON**: Click the **⚙ JSON** button to open the editor dialog and customize `columns.json` or `data.json`.
4. **Inject into Active Webpage**: Click **🌐 Inject** to inject the rendered table directly onto the page you are currently viewing!

---

## 📜 License

MIT © KeshavSoft
