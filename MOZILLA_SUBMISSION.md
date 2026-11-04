# Mozilla Add-ons (AMO) Submission Guide

Step-by-step instructions and ready-to-copy metadata for publishing **json-to-dom Web Extension** to Mozilla Add-ons (AMO).

---

## 1. Quick Build & Package Command

Before uploading, ensure the latest bundle is generated:

```bash
npm run package
```

This compiles `json-renderers-build-table` via Vite and generates the ready-to-upload ZIP:
```text
docs/extension/json-to-dom-web-extension-v3.0.0.zip
```

---

## 2. Store Listing Information (Copy & Paste)

### **Name**
```text
json-to-dom Table Workbench
```

### **Summary**
```text
Declarative JSON to DOM Builder & Table Workbench. Renders columns and data into interactive native DOM tables anywhere in your browser.
```

### **Description**
```markdown
**json-to-dom Table Workbench** is a modern developer tool that transforms structured JSON datasets and schemas (`columns.json` + `data.json`) directly into rich, interactive, and searchable native DOM tables anywhere in your browser.

### Key Features
- **Instant Table Workbench**: Load sample data or edit your own column schemas and datasets directly from the browser popup.
- **Real-Time Row Search**: Automatically filters table records on the fly as you type with zero external dependencies.
- **Automated Serial Numbering**: Automatically maintains dynamic row indexing (`#`) across all filtered records.
- **In-Page DOM Injection**: One-click **Inject** button creates an interactive floating table overlay directly onto any active webpage.
- **DevTools Console Integration**: Automatically injects `window.ks.jsonRenderers.build.table.render` into the page execution context so you can render tables directly from the console on any website (`localhost`, staging, or production).
- **Zero External Telemetry**: 100% self-contained and private. Runs entirely offline in your browser.

### How to Use
1. Click the **json-to-dom** icon on your browser toolbar to open the workbench.
2. Click **Sample** and **Render** to see the table render instantly.
3. Click **Inject** to materialize the table directly on your current active webpage.
4. Or open Developer Tools (F12) Console on any page and call:
   ```javascript
   window.ks.jsonRenderers.build.table.render({
       type: "table.simple",
       data: myData,
       columns: myColumns,
       options: { showSerial: true, showSearch: true, showOptions: true },
       targetHtmlId: "myContainer"
   });
   ```
```

---

## 3. Form Options & Checkboxes

| Field | Recommended Value |
| :--- | :--- |
| **Distribution** | **On this site** (Public AMO Directory) |
| **This add-on is experimental** | **Unchecked** |
| **Requires payment / external software** | **Unchecked** |
| **Categories** | Select **Developer Tools** |
| **Support Website / Repository** | `https://github.com/keshavsoft/json-to-dom-web-extension` |

---

## 4. Privacy & Data Collection

- **Does this add-on collect data?**: **No**
- **Data Policy Statement**:
  > This extension does not collect, track, transmit, or store any personal data, browsing history, or analytics. All JSON parsing and DOM rendering executes 100% locally within the browser runtime.

---

## 5. File Upload Location

When prompted to upload your add-on file, select:
```text
D:\KeshavSoftRepos\nov\4-1\json-to-dom-web-extension\docs\extension\json-to-dom-web-extension-v3.0.0.zip
```
*(or from `extension/v3/json-to-dom-web-extension-v3.0.0.zip`)*

