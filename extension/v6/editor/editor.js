/**
 * json-to-dom Monaco Editor Window Controller
 * KeshavSoft
 */

let editorInstance = null;
let currentTargetId = "";
let currentTabId = null;

document.addEventListener("DOMContentLoaded", () => {
  const schemaNameLabel = document.getElementById("schemaNameLabel");
  const targetIdBadge = document.getElementById("targetIdBadge");
  const btnFormatJson = document.getElementById("btnFormatJson");
  const btnApplyToPage = document.getElementById("btnApplyToPage");

  // Read URL query params passed from popup
  const urlParams = new URLSearchParams(window.location.search);
  const specKey = urlParams.get("specKey") || "table.simple.base";
  currentTargetId = urlParams.get("targetId") || "";
  const tabIdParam = urlParams.get("tabId");
  if (tabIdParam) currentTabId = parseInt(tabIdParam, 10);

  schemaNameLabel.textContent = `Spec: ${specKey}`;
  targetIdBadge.textContent = currentTargetId ? `Target: #${currentTargetId}` : "Target: (none selected)";

  // Initialize Monaco Editor
  initMonaco(specKey);

  // Format button
  btnFormatJson.addEventListener("click", () => {
    if (editorInstance) {
      editorInstance.getAction("editor.action.formatDocument").run();
    }
  });

  // Render to DOM button
  btnApplyToPage.addEventListener("click", async () => {
    if (!editorInstance) return;

    let parsedSpec = null;
    try {
      parsedSpec = JSON.parse(editorInstance.getValue());
    } catch (err) {
      alert("Invalid JSON syntax: " + err.message);
      return;
    }

    if (!currentTargetId) {
      const promptedId = prompt("Enter the target DOM ID on the webpage:", "");
      if (!promptedId) return;
      currentTargetId = promptedId.replace(/^#/, "");
      targetIdBadge.textContent = `Target: #${currentTargetId}`;
    }

    btnApplyToPage.textContent = "⏳ Rendering...";
    btnApplyToPage.disabled = true;

    try {
      // Find the tab to inject into
      let tabId = currentTabId;
      if (!tabId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab ? activeTab.id : null;
      }

      if (!tabId) {
        alert("Could not identify the target browser tab.");
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        args: [currentTargetId, parsedSpec],
        func: (targetHtmlId, jsonSpec) => {
          // If window.ks.jsonToDom.appendToDom exists, invoke it!
          if (window.ks && window.ks.jsonToDom && typeof window.ks.jsonToDom.appendToDom === "function") {
            return window.ks.jsonToDom.appendToDom({
              jsonSpec,
              targetHtmlId,
              appendPosition: "inside",
              showLog: true
            });
          }

          // Fallback: Check target element and build/append
          const targetEl = document.getElementById(targetHtmlId);
          if (!targetEl) {
            return { success: false, error: `Target #${targetHtmlId} not found on page.` };
          }

          // Visual feedback
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          targetEl.style.transition = "outline 0.3s ease";
          targetEl.style.outline = "3px solid #0d9488";
          setTimeout(() => { targetEl.style.outline = ""; }, 2500);

          return { success: true, targetHtmlId };
        }
      });

      const res = results && results[0] && results[0].result;
      if (res && res.success !== false) {
        btnApplyToPage.textContent = "✔ Rendered!";
        setTimeout(() => {
          btnApplyToPage.textContent = "⚡ Render to DOM";
          btnApplyToPage.disabled = false;
        }, 1500);
      } else {
        alert("Render result: " + JSON.stringify(res));
        btnApplyToPage.textContent = "⚡ Render to DOM";
        btnApplyToPage.disabled = false;
      }
    } catch (err) {
      console.error("[Monaco] Render error:", err);
      alert("Render error: " + err.message);
      btnApplyToPage.textContent = "⚡ Render to DOM";
      btnApplyToPage.disabled = false;
    }
  });
});

async function initMonaco(specKey) {
  // Load spec from bundled specCatalog.json or chrome.storage
  let specContent = {};

  try {
    const catalogUrl = chrome.runtime.getURL("src/specCatalog.json");
    const resp = await fetch(catalogUrl);
    const catalog = await resp.json();

    // Resolve specKey (e.g. "table.simple.base" or "definitions.table.simple.base")
    specContent = resolveSpec(catalog, specKey);
  } catch (err) {
    console.warn("Could not load spec catalog:", err);
    specContent = { error: "Could not load schema", key: specKey };
  }

  const initialJson = JSON.stringify(specContent, null, 2);

  // Configure Monaco loader
  const editorPath = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs";
  window.require.config({ paths: { vs: editorPath } });

  window.require(["vs/editor/editor.main"], () => {
    const container = document.getElementById("monacoContainer");
    editorInstance = monaco.editor.create(container, {
      value: initialJson,
      language: "json",
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 13,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      formatOnPaste: true,
      tabSize: 2
    });
  });
}

function resolveSpec(catalog, specKey) {
  if (!catalog) return {};

  // Check definitions
  const defs = catalog.definitions || {};
  const parts = specKey.split(".");

  let cur = defs;
  for (const part of parts) {
    if (cur && cur[part] !== undefined) {
      cur = cur[part];
    } else {
      cur = null;
      break;
    }
  }

  if (cur) return cur;

  // Check spec root
  if (catalog.spec && catalog.spec[specKey]) {
    return catalog.spec[specKey];
  }

  // Check tags root
  if (catalog.tags && catalog.tags[specKey]) {
    return catalog.tags[specKey];
  }

  return defs.table?.simple?.base || catalog;
}

