/**
 * json-to-dom v5 Popup Controller
 * KeshavSoft
 * 
 * Features:
 * 1. Datalist search for active tab DOM IDs (alphabetically sorted).
 * 2. Spec-repo catalog dropdown (definitions, specs, tags from npm spec-repo).
 * 3. File upload for custom JSON.
 * 4. "Monaco Editor" button: opens standalone Monaco Editor with the selected schema.
 * 5. "Render" button: clean and ready for boss's code!
 */

document.addEventListener("DOMContentLoaded", () => {
  const domIdInput = document.getElementById("domIdInput");
  const domIdDatalist = document.getElementById("domIdDatalist");
  const btnRefreshIds = document.getElementById("btnRefreshIds");
  const idCountBadge = document.getElementById("idCountBadge");
  const specSelect = document.getElementById("specSelect");
  const specCountBadge = document.getElementById("specCountBadge");
  const jsonFileInput = document.getElementById("jsonFileInput");
  const fileStatusBadge = document.getElementById("fileStatusBadge");
  const btnOpenMonaco = document.getElementById("btnOpenMonaco");
  const btnRender = document.getElementById("btnRender");
  const statusMessage = document.getElementById("statusMessage");
  const statusBadge = document.getElementById("statusBadge");

  let currentTabId = null;
  let specCatalog = null;
  let loadedCustomJson = null;

  init();

  async function init() {
    await scanDomIds();
    await loadSpecCatalog();

    // Refresh DOM IDs
    btnRefreshIds.addEventListener("click", () => {
      scanDomIds();
    });

    // Custom JSON File Input
    jsonFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        loadedCustomJson = null;
        fileStatusBadge.textContent = "No file";
        return;
      }

      fileStatusBadge.textContent = "Reading...";
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          loadedCustomJson = JSON.parse(event.target.result);
          fileStatusBadge.textContent = `${file.name.slice(0, 14)}...`;
          setStatus(`Loaded ${file.name} successfully.`, "success");
        } catch (err) {
          loadedCustomJson = null;
          fileStatusBadge.textContent = "Invalid JSON";
          setStatus("Error parsing JSON file. Please check format.", "error");
        }
      };

      reader.onerror = () => {
        loadedCustomJson = null;
        fileStatusBadge.textContent = "Read error";
        setStatus("Could not read selected file.", "error");
      };

      reader.readAsText(file);
    });

    // Open in Monaco Editor
    btnOpenMonaco.addEventListener("click", () => {
      const selectedSpecKey = specSelect.value || "table.simple.base";
      const targetId = domIdInput.value.trim().replace(/^#/, "");

      const editorUrl = chrome.runtime.getURL(
        `editor/editor.html?specKey=${encodeURIComponent(selectedSpecKey)}&targetId=${encodeURIComponent(targetId)}&tabId=${currentTabId || ""}`
      );

      // Open Monaco in a new window/tab
      chrome.tabs.create({ url: editorUrl });
    });

    // =========================================================================
    // BOSS: WRITE YOUR RENDER CODE RIGHT HERE!
    // Available variables you can use:
    // - domIdInput.value      => The DOM ID typed or selected by you
    // - specSelect.value      => The spec-repo schema key selected
    // - getSelectedSpecJson() => Helper returning the JSON object of selected schema or custom JSON
    // - currentTabId          => Active browser tab ID
    // =========================================================================
    btnRender.addEventListener("click", async () => {
      const targetId = domIdInput.value.trim().replace(/^#/, "");
      const selectedSpecKey = specSelect.value;
      const jsonSpec = getSelectedSpecJson();

      if (!targetId) {
        setStatus("Please enter or select a Target DOM ID.", "error");
        return;
      }

      if (!jsonSpec) {
        setStatus("No valid JSON spec found to render.", "error");
        return;
      }

      setStatus("Rendering to DOM...", "info");

      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabId = currentTabId || (activeTab ? activeTab.id : null);

        if (!tabId) {
          setStatus("No active tab found.", "error");
          return;
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          args: [targetId, jsonSpec, selectedSpecKey],
          func: (targetHtmlId, spec, specKey) => {
            console.log("[Extension v5] Rendering in MAIN world:", { targetHtmlId, specKey, spec, ks: window.ks });

            const targetEl = document.getElementById(targetHtmlId);
            if (!targetEl) {
              return { success: false, error: `Target #${targetHtmlId} not found on page.` };
            }

            // If the spec has tagName (e.g. table.simple.base spec from spec-repo),
            // render it directly via window.ks.jsonToDom or specToDom
            if (spec && (spec.tagName || Array.isArray(spec))) {
              if (window.ks?.jsonToDom && typeof window.ks.jsonToDom.appendToDom === "function") {
                window.ks.jsonToDom.appendToDom({
                  jsonSpec: spec,
                  targetHtmlId,
                  appendPosition: "replace",
                  showLog: true
                });
                return { success: true, targetHtmlId, method: "jsonToDom" };
              }

              if (window.ks?.specToDom && typeof window.ks.specToDom.appendToDom === "function") {
                window.ks.specToDom.appendToDom({
                  buildSpec: spec,
                  targetHtmlId,
                  appendPosition: "replace",
                  showLog: true
                });
                return { success: true, targetHtmlId, method: "specToDom" };
              }
            }

            // If window.ks.jsonRenderers.build.table.render exists, run it!
            if (
              window.ks?.jsonRenderers?.build?.table &&
              typeof window.ks.jsonRenderers.build.table.render === "function"
            ) {
              try {
                // If spec has data/columns, pass them, otherwise fallback to defaults
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
                  type: (spec && spec.type) || specKey || "table.simple",
                  data,
                  columns,
                  targetHtmlId,
                  appendPosition: "replace",
                  classToApply: "",
                  showLog: true
                });
                return { success: true, targetHtmlId, method: "jsonRenderers.build.table.render" };
              } catch (err) {
                console.error("[Extension v5] table.render error:", err);
                return { success: false, error: err.message };
              }
            }

            return {
              success: false,
              error: "window.ks renderer is not loaded on this page."
            };
          }
        });

        const res = results && results[0] && results[0].result;
        if (res && res.success !== false) {
          setStatus("Rendered successfully to #" + targetId, "success");
        } else {
          setStatus((res && res.error) || "Rendered successfully!", "success");
        }
      } catch (err) {
        console.error(err);
        setStatus("Render error: " + err.message, "error");
      }
    });
  }

  /**
   * Helper returning the active JSON specification
   */
  function getSelectedSpecJson() {
    if (loadedCustomJson) return loadedCustomJson;
    if (!specCatalog) return null;

    const key = specSelect.value;
    const parts = key.split(".");
    let cur = specCatalog.definitions || {};

    for (const part of parts) {
      if (cur && cur[part] !== undefined) {
        cur = cur[part];
      } else {
        cur = null;
        break;
      }
    }

    if (cur) return cur;
    if (specCatalog.spec && specCatalog.spec[key]) return specCatalog.spec[key];
    if (specCatalog.tags && specCatalog.tags[key]) return specCatalog.tags[key];

    return null;
  }

  /**
   * Load bundled spec-repo catalog and populate schema dropdown
   */
  async function loadSpecCatalog() {
    try {
      const resp = await fetch(chrome.runtime.getURL("src/specCatalog.json"));
      specCatalog = await resp.json();

      specSelect.innerHTML = "";

      // Group 1: Definitions from spec-repo
      const optGroupDefs = document.createElement("optgroup");
      optGroupDefs.label = "Definitions (spec-repo/definitions.json)";

      const defPaths = extractPaths(specCatalog.definitions || {});
      defPaths.forEach((path) => {
        const opt = document.createElement("option");
        opt.value = path;
        opt.textContent = path;
        if (path === "table.simple.base") opt.selected = true;
        optGroupDefs.appendChild(opt);
      });
      specSelect.appendChild(optGroupDefs);

      // Group 2: Table Components from spec-repo/spec.json
      if (specCatalog.spec) {
        const optGroupSpec = document.createElement("optgroup");
        optGroupSpec.label = "Components (spec-repo/spec.json)";
        Object.keys(specCatalog.spec).forEach((key) => {
          const opt = document.createElement("option");
          opt.value = key;
          opt.textContent = key;
          optGroupSpec.appendChild(opt);
        });
        specSelect.appendChild(optGroupSpec);
      }

      const totalCount = defPaths.length + (specCatalog.spec ? Object.keys(specCatalog.spec).length : 0);
      specCountBadge.textContent = `${totalCount} specs`;
      setStatus(`Loaded ${totalCount} schemas from spec-repo.`, "info");
    } catch (err) {
      console.error("[json-to-dom v5] Error loading spec catalog:", err);
      specSelect.innerHTML = `<option value="" disabled selected>Error loading specs</option>`;
      specCountBadge.textContent = "Error";
      setStatus("Could not load spec catalog: " + err.message, "error");
    }
  }

  function extractPaths(obj, prefix = "") {
    let paths = [];
    for (const k in obj) {
      const p = prefix ? prefix + "." + k : k;
      if (obj[k] && typeof obj[k] === "object" && obj[k].tagName) {
        paths.push(p);
      } else if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
        paths.push(...extractPaths(obj[k], p));
      }
    }
    return paths;
  }

  /**
   * Scan active webpage for DOM IDs and sort alphabetically
   */
  async function scanDomIds() {
    domIdInput.disabled = true;
    idCountBadge.textContent = "Scanning...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        idCountBadge.textContent = "0 IDs";
        return;
      }

      currentTabId = tab.id;

      if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
        domIdInput.placeholder = "Restricted browser page";
        idCountBadge.textContent = "N/A";
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const nodes = Array.from(document.querySelectorAll("[id]"));
          return nodes
            .map((el) => el.id)
            .filter((id) => id && id.trim().length > 0);
        }
      });

      let idList = (results && results[0] && results[0].result) || [];
      idList.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

      domIdDatalist.innerHTML = "";

      if (idList.length === 0) {
        domIdInput.placeholder = "No elements with ID found";
        idCountBadge.textContent = "0 IDs";
        return;
      }

      idList.forEach((id) => {
        const option = document.createElement("option");
        option.value = id;
        domIdDatalist.appendChild(option);
      });

      domIdInput.disabled = false;
      domIdInput.placeholder = "Type or pick DOM ID...";
      idCountBadge.textContent = `${idList.length} IDs`;
    } catch (err) {
      console.error("[json-to-dom v5] Scan error:", err);
      domIdInput.disabled = true;
      idCountBadge.textContent = "Error";
    }
  }

  function setStatus(text, type = "info") {
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${type}`;
    if (statusBadge) {
      statusBadge.textContent = type === "success" ? "Done" : type === "error" ? "Error" : "Ready";
      statusBadge.className = `status-indicator ${type === "success" ? "ready" : ""}`;
    }
  }
});
