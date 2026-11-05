/**
 * json-to-dom v7 JSON Spec Viewer & Editor
 * KeshavSoft
 * 
 * Features:
 * - Direct JSON Spec Viewer with VS Code Dark Theme syntax highlighting.
 * - Dynamic line numbers gutter.
 * - Instant updates on dropdown change or "Show JSON" click.
 * - 100% compliant with Chrome Extension MV3 CSP (no dependencies on blocked external scripts).
 * - Optional seamless upgrade to Monaco if available in runtime.
 */

let specCatalog = null;
let monacoEditorInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  const specSelect = document.getElementById("specSelect");
  const btnShowJson = document.getElementById("btnShowJson");
  const statusIndicator = document.getElementById("statusIndicator");

  // Read URL query param if passed
  const urlParams = new URLSearchParams(window.location.search);
  const initialSpecKey = urlParams.get("specKey") || "table.simple.base";

  // 1. ATTACH BUTTON CLICK LISTENER IMMEDIATELY
  if (btnShowJson) {
    btnShowJson.addEventListener("click", () => {
      const selectedKey = specSelect.value || initialSpecKey;
      displayJson(selectedKey);
    });
  }

  // 2. ATTACH DROPDOWN CHANGE LISTENER IMMEDIATELY
  if (specSelect) {
    specSelect.addEventListener("change", () => {
      const selectedKey = specSelect.value;
      displayJson(selectedKey);
    });
  }

  // 3. LOAD CATALOG AND SHOW FIRST SCHEMA IMMEDIATELY
  loadCatalogAndDisplay(initialSpecKey);

  // 4. ATTEMPT MONACO LOADER IN BACKGROUND (non-blocking)
  tryInitMonaco(initialSpecKey);
});

/**
 * Load specCatalog.json, populate dropdown, and immediately render initial JSON
 */
async function loadCatalogAndDisplay(initialKey) {
  const specSelect = document.getElementById("specSelect");
  const statusIndicator = document.getElementById("statusIndicator");

  try {
    const catalogUrl = chrome.runtime.getURL("src/specCatalog.json");
    const resp = await fetch(catalogUrl);
    specCatalog = await resp.json();

    // Populate dropdown
    populateDropdown(initialKey);

    // Immediately display initial JSON!
    const keyToDisplay = specSelect.value || initialKey;
    displayJson(keyToDisplay);

    if (statusIndicator) {
      statusIndicator.textContent = `Showing: ${keyToDisplay}`;
    }
  } catch (err) {
    console.error("[json-to-dom v7] Could not load spec catalog:", err);
    if (statusIndicator) {
      statusIndicator.textContent = "Error loading catalog: " + err.message;
      statusIndicator.style.color = "#ef4444";
    }
  }
}

/**
 * Populate spec dropdown with Definitions, Complete Specs, and HTML Tags
 */
function populateDropdown(selectedKey) {
  const specSelect = document.getElementById("specSelect");
  if (!specSelect || !specCatalog) return;

  specSelect.innerHTML = "";

  // Group 1: Definitions
  const optGroupDefs = document.createElement("optgroup");
  optGroupDefs.label = "Definitions (spec-repo/definitions.json)";

  const defPaths = extractPaths(specCatalog.definitions || {});
  defPaths.forEach((path) => {
    const opt = document.createElement("option");
    opt.value = path;
    opt.textContent = path;
    if (path === selectedKey) opt.selected = true;
    optGroupDefs.appendChild(opt);
  });
  specSelect.appendChild(optGroupDefs);

  // Group 2: Complete Specs
  if (specCatalog.spec && Object.keys(specCatalog.spec).length > 0) {
    const optGroupSpec = document.createElement("optgroup");
    optGroupSpec.label = "Complete Specs (spec-repo/spec.json)";
    Object.keys(specCatalog.spec).forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      if (k === selectedKey) opt.selected = true;
      optGroupSpec.appendChild(opt);
    });
    specSelect.appendChild(optGroupSpec);
  }

  // Group 3: HTML Tags
  if (specCatalog.tags && Object.keys(specCatalog.tags).length > 0) {
    const optGroupTags = document.createElement("optgroup");
    optGroupTags.label = "HTML Tags (spec-repo/tags.json)";
    Object.keys(specCatalog.tags).forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = `<${k}>`;
      if (k === selectedKey) opt.selected = true;
      optGroupTags.appendChild(opt);
    });
    specSelect.appendChild(optGroupTags);
  }
}

/**
 * Displays the JSON representation of the given spec key
 */
function displayJson(specKey) {
  const codeContent = document.getElementById("codeContent");
  const lineGutter = document.getElementById("lineGutter");
  const statusIndicator = document.getElementById("statusIndicator");

  if (!specCatalog) return;

  const resolved = resolveSpec(specCatalog, specKey);
  const formattedRaw = JSON.stringify(resolved, null, 2);

  // 1. If Monaco is active, update Monaco
  if (monacoEditorInstance) {
    try {
      monacoEditorInstance.setValue(formattedRaw);
      monacoEditorInstance.revealPosition({ lineNumber: 1, column: 1 });
    } catch (e) {
      console.warn("Could not set Monaco value:", e);
    }
  }

  // 2. Update Built-in Editor (with line numbers & syntax highlighting)
  if (codeContent) {
    codeContent.innerHTML = highlightJson(formattedRaw);
  }

  // 3. Generate line numbers for gutter
  const lineCount = formattedRaw.split("\n").length;
  if (lineGutter) {
    let linesHtml = "";
    for (let i = 1; i <= lineCount; i++) {
      linesHtml += i + "<br>";
    }
    lineGutter.innerHTML = linesHtml;
  }

  // 4. Update status indicator
  if (statusIndicator) {
    statusIndicator.textContent = `Showing: ${specKey} (${lineCount} lines)`;
    statusIndicator.style.color = "#10b981";
  }
}

/**
 * Syntax highlighter for JSON strings (VS Code Dark Theme)
 */
function highlightJson(jsonStr) {
  const escaped = jsonStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

/**
 * Resolve spec object by dot notation path from catalog
 */
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

  return { error: `Schema "${specKey}" not found in catalog.` };
}

/**
 * Extract schema paths from definitions object
 */
function extractPaths(obj, prefix = "") {
  let paths = [];
  for (const k in obj) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && obj[k].tagName) {
      paths.push(p);
    } else if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      paths.push(...extractPaths(obj[k], p));
    }
  }
  return paths;
}

/**
 * Optional Monaco Loader (seamless progressive enhancement)
 */
function tryInitMonaco(initialKey) {
  try {
    if (typeof window.require !== "undefined" && typeof window.require.config === "function") {
      window.require.config({
        paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs" }
      });

      window.require(["vs/editor/editor.main"], () => {
        const monacoContainer = document.getElementById("monacoContainer");
        const builtInEditor = document.getElementById("builtInEditor");

        if (monacoContainer && window.monaco) {
          monacoEditorInstance = window.monaco.editor.create(monacoContainer, {
            value: "{}",
            language: "json",
            theme: "vs-dark",
            automaticLayout: true,
            fontSize: 13,
            lineNumbers: "on",
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            tabSize: 2
          });

          // Show Monaco, hide fallback
          monacoContainer.style.display = "block";
          if (builtInEditor) builtInEditor.style.display = "none";

          // Sync current spec into Monaco
          const specSelect = document.getElementById("specSelect");
          const key = (specSelect && specSelect.value) || initialKey;
          displayJson(key);
        }
      });
    }
  } catch (err) {
    console.log("[json-to-dom v7] Monaco CDN not available in this environment. Built-in editor active.");
  }
}
