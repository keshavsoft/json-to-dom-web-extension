# @keshavsoft/json-to-dom-web-extension

Declarative JSON to DOM Builder & Table Workbench Browser Extension.

Companion extension to convert declarative JSON specifications and tabular data (`columns.json` + `data.json`) into rich, interactive native DOM elements anywhere in your browser.

---

## 📂 Repository Structure

```text
json-to-dom-web-extension/
├── extension/
│   └── v1/
│       ├── manifest.json       # Manifest V3 configuration
│       ├── icons/              # Extension icons (48px, 96px)
│       ├── popup/              # Extension popup workbench
│       │   ├── popup.html      # Popup interface & modal dialog
│       │   ├── popup.css       # KeshavSoft dark theme styling
│       │   └── popup.js        # Event hooks & interactions
│       └── src/
│           ├── injectStart.js  # Active tab content script
│           └── jsonToDom.min.js# Injected page runtime
├── .gitignore
├── LICENSE
├── package.json
├── publish.js
└── README.md
```

---

## 🛠️ Testing the Extension in Chrome / Edge

1. Open Google Chrome (or Edge / Brave) and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the directory:
   ```text
   json-to-dom-web-extension/extension/v1
   ```
5. Pin **json-to-dom Web Extension** to your toolbar and click its icon to open the popup.

---

## 📜 License

MIT © KeshavSoft
