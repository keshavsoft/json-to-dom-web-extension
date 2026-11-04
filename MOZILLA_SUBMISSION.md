# Mozilla Add-ons (AMO) Submission Guide

Step-by-step instructions and store metadata for publishing **tag-to-json Inspector** to the Mozilla Add-ons Directory.

---

## 1. Quick Build & Package Command

To generate the latest ready-to-upload zip package:

```bash
npm run package
```

This updates `extension/src/tagToJson.min.js` and creates:
```
tag-to-json-extension-1.0.0.zip
```

---

## 2. Store Listing Information (Copy & Paste)

### **Name**
```
tag-to-json Inspector
```

### **Summary**
```
Extract live DOM elements into clean json-to-tag declarative specifications with one click or from console.
```

### **Description**
```markdown
**tag-to-json Inspector** is a developer tool that extracts live HTML DOM elements directly into clean, declarative JSON specifications compatible with `@keshavsoft/json-to-tag`.

### Key Features
- **Zero-Friction DOM Extraction**: Convert any DOM node, table, header, navigation bar, or card component into a structured JSON specification.
- **Round-Trip Fidelity**: Generated specifications can be immediately re-rendered with `@keshavsoft/json-to-tag` or edited in the KeshavSoft Visual Renderer.
- **DevTools Console Integration**: Automatically injects `window.tagToJson` and `window.domToSpec` on any webpage so you can inspect elements and extract specs on the fly.
- **Zero External Dependencies**: Pure native DOM traversal with zero telemetry and zero external network tracking.

### How to Use
1. Open any webpage in Firefox.
2. Open Developer Tools (F12) -> **Console**.
3. Select or query any element and run:
   `tagToJson({ inElement: document.querySelector('header') })`
   or pass an element ID:
   `tagToJson('stockItemsTable')`
4. Copy the resulting JSON tree and paste it into your json-to-tag project or visual renderer.
```

---

## 3. Options & Checkboxes

| Field | Setting |
| :--- | :--- |
| **This add-on is experimental** | **Unchecked** |
| **Requires payment / external software** | **Unchecked** |
| **Categories** | Select **Developer Tools** |
| **Support Website / Repository** | `https://github.com/keshavsoft/json-render-table` (or your repo URL) |

---

## 4. Privacy & Data Collection

- **Does this add-on collect data?**: **No**
- **Data Policy**: 
  > This extension does not collect, store, transmit, or share any personal data, browsing history, or analytics. It operates 100% locally within the user's browser runtime.

---

## 5. Firefox Debugging / Local Testing

To test this extension locally in Firefox before or during review:
1. Open Firefox and type in the address bar: `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Select either:
   - `tag-to-json/extension/manifest.json`
   - or `tag-to-json-extension-1.0.0.zip`
4. Open any webpage and open DevTools Console (`F12`), then run:
   ```javascript
   tagToJson({ inElement: document.body })
   ```
