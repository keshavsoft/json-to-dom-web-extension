/**
 * json-to-dom v6 Monaco Editor Window Controller
 * KeshavSoft
 * 
 * Features:
 * 1. Targets #id and [data-role] elements directly from Monaco.
 * 2. Unending Chaining: auto-rescans host webpage DOM targets after every render.
 * 3. MAIN world execution of window.ks.jsonRenderers.build.table.render and window.ks.jsonToDom.
 */

let editorInstance = null;
let currentTabId = null;

document.addEventListener("DOMContentLoaded", () => {
  const schemaNameLabel = document.getElementById("schemaNameLabel");
  const targetSelectorInput = document.getElementById("targetSelectorInput");
  const monacoTargetList = document.getElementById("monacoTargetList");
  const btnRescanTargets = document.getElementById("btnRescanTargets");
  const monacoPositionSelect = document.getElementById("monacoPositionSelect");
  const btnFormatJson = document.getElementById("btnFormatJson");
  const btnApplyToPage = document.getElementById("btnApplyToPage");

  // Read URL query params passed from popup
  const urlParams = new URLSearchParams(window.location.search);
  const specKey = urlParams.get("specKey") || "table.simple.base";
  const initialTarget = urlParams.get("targetSelector") || urlParams.get("targetId") || "";
  const tabIdParam = urlParams.get("tabId");
  if (tabIdParam) currentTabId = parseInt(tabIdParam, 10);

  schemaNameLabel.textContent = `Spec: ${specKey}`;
  if (initialTarget) {
    targetSelectorInput.value = initialTarget.startsWith("#") || initialTarget.startsWith("[") ? initialTarget : `#${initialTarget}`;
  }

  // Scan host page targets
  scanPageTargets();

  // Initialize Monaco Editor
  initMonaco(specKey);

  // Rescan targets button
  btnRescanTargets.addEventListener("click", () => {
    scanPageTargets();
  });

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

    const selector = targetSelectorInput.value.trim();
    if (!selector) {
      alert("Please enter or pick a target selector (#id or [data-role=...]).");
      return;
    }

    const position = monacoPositionSelect ? monacoPositionSelect.value : "replace";

    btnApplyToPage.textContent = "⏳ Rendering...";
    btnApplyToPage.disabled = true;

    try {
      let tabId = currentTabId;
      if (!tabId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab ? activeTab.id : null;
      }

      if (!tabId) {
        alert("Could not identify the target browser tab.");
        btnApplyToPage.textContent = "⚡ Render to DOM";
        btnApplyToPage.disabled = false;
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        args: [selector, parsedSpec, specKey, position],
        func: (targetSelector, spec, key, appendPosition) => {
          let targetEl = null;
          if (targetSelector.startsWith("#")) {
            targetEl = document.getElementById(targetSelector.slice(1));
          } else if (targetSelector.startsWith("[data-role=") || targetSelector.startsWith("[data-role")) {
            targetEl = document.querySelector(targetSelector);
          } else if (targetSelector.startsWith("data-role=") || targetSelector.startsWith("role=")) {
            const val = targetSelector.replace(/^(data-)?role=/, "").replace(/['"]/g, "");
            targetEl = document.querySelector(`[data-role="${val}"]`);
          } else {
            targetEl = document.getElementById(targetSelector) || document.querySelector(`[data-role="${targetSelector}"]`);
          }

          if (!targetEl) {
            return { success: false, error: `Target "${targetSelector}" not found on page.` };
          }

          if (!targetEl.id) {
            targetEl.id = "ks-role-" + (targetEl.getAttribute("data-role") || "target-" + Date.now());
          }
          const targetHtmlId = targetEl.id;

          // 1. Tag spec direct render
          if (spec && (spec.tagName || Array.isArray(spec))) {
            if (window.ks?.jsonToDom && typeof window.ks.jsonToDom.appendToDom === "function") {
              window.ks.jsonToDom.appendToDom({
                jsonSpec: spec,
                targetHtmlId,
                appendPosition: appendPosition || "replace",
                showLog: true
              });
              return { success: true, targetHtmlId, method: "jsonToDom" };
            }

            if (window.ks?.specToDom && typeof window.ks.specToDom.appendToDom === "function") {
              window.ks.specToDom.appendToDom({
                buildSpec: spec,
                targetHtmlId,
                appendPosition: appendPosition || "replace",
                showLog: true
              });
              return { success: true, targetHtmlId, method: "specToDom" };
            }
          }

          // 2. High-level table render
          if (
            window.ks?.jsonRenderers?.build?.table &&
            typeof window.ks.jsonRenderers.build.table.render === "function"
          ) {
            const data = (spec && spec.data) || [
              { id: 1, name: "Sample Item 1", status: "Active" },
              { id: 2, name: "Sample Item 2", status: "Pending" }
            ];
            const columns = (spec && spec.columns) || [
              { field: "id", label: "ID" },
              { field: "name", label: "Name" },
              { field: "status", label: "Status" }
            ];

            window.ks.jsonRenderers.build.table.render({
              type: (spec && spec.type) || key || "table.simple",
              data,
              columns,
              targetHtmlId,
              appendPosition: appendPosition || "replace",
              classToApply: "",
              showLog: true
            });
            return { success: true, targetHtmlId, method: "jsonRenderers.build.table.render" };
          }

          return { success: false, error: "window.ks renderer is not loaded on this page." };
        }
      });

      const res = results && results[0] && results[0].result;
      if (res && res.success !== false) {
        btnApplyToPage.textContent = "✔ Rendered!";
        
        // Auto-refresh target list after render
        await scanPageTargets();

        setTimeout(() => {
          btnApplyToPage.textContent = "⚡ Render to DOM";
          btnApplyToPage.disabled = false;
        }, 1500);
      } else {
        alert("Render result: " + (res?.error || JSON.stringify(res)));
        btnApplyToPage.textContent = "⚡ Render to DOM";
        btnApplyToPage.disabled = false;
      }
    } catch (err) {
      console.error("[Monaco v6] Render error:", err);
      alert("Render error: " + err.message);
      btnApplyToPage.textContent = "⚡ Render to DOM";
      btnApplyToPage.disabled = false;
    }
  });

  async function scanPageTargets() {
    try {
      let tabId = currentTabId;
      if (!tabId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab ? activeTab.id : null;
      }
      if (!tabId) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const idNodes = Array.from(document.querySelectorAll("[id]"))
            .map((el) => `#${el.id}`)
            .filter((x) => x.length > 1);

          const roleNodes = Array.from(document.querySelectorAll("[data-role]"))
            .map((el) => `[data-role="${el.getAttribute("data-role")}"]`)
            .filter((x) => x.length > 13);

          return { idNodes, roleNodes };
        }
      });

      const data = (results && results[0] && results[0].result) || { idNodes: [], roleNodes: [] };
      monacoTargetList.innerHTML = "";

      data.idNodes.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val;
        monacoTargetList.appendChild(opt);
      });

      data.roleNodes.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val;
        monacoTargetList.appendChild(opt);
      });
    } catch (err) {
      console.warn("Could not scan targets from Monaco:", err);
    }
  }
});

async function initMonaco(specKey) {
  let specContent = {};

  try {
    const catalogUrl = chrome.runtime.getURL("src/specCatalog.json");
    const resp = await fetch(catalogUrl);
    const catalog = await resp.json();

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

  const parts = specKey.split(".");
  let cur = catalog.definitions || {};

  for (const part of parts) {
    if (cur && cur[part] !== undefined) {
      cur = cur[part];
    } else {
      cur = null;
      break;
    }
  }

  if (cur) return cur;
  if (catalog.spec && catalog.spec[specKey]) return catalog.spec[specKey];
  if (catalog.tags && catalog.tags[specKey]) return catalog.tags[specKey];

  return { type: specKey, note: "Custom schema key" };
}
