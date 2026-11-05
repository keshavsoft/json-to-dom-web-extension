/**
 * json-to-dom v6 Popup Controller
 * KeshavSoft
 * 
 * Features in v6:
 * 1. Hybrid Target Scanner: Scans for [id] AND [data-role] elements!
 * 2. Unending Chaining: Auto-rescans and repopulates targets immediately after each render.
 * 3. Mount Position Selector: replace, inside (append), or prepend.
 * 4. Spec-repo catalog + Custom JSON loader.
 * 5. Full-Screen Monaco Editor Workbench launcher.
 */

document.addEventListener("DOMContentLoaded", () => {
  const domIdInput = document.getElementById("domIdInput");
  const domIdDatalist = document.getElementById("domIdDatalist");
  const btnRefreshIds = document.getElementById("btnRefreshIds");
  const idCountBadge = document.getElementById("idCountBadge");
  const positionSelect = document.getElementById("positionSelect");
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
    await scanDomTargets();
    await loadSpecCatalog();

    // Refresh DOM Targets (both ID and data-role)
    btnRefreshIds.addEventListener("click", () => {
      scanDomTargets();
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

    // Open Monaco Workbench in new browser tab
    btnOpenMonaco.addEventListener("click", () => {
      const selectedSpecKey = specSelect.value || "table.simple.base";
      const targetSelector = domIdInput.value.trim();

      const editorUrl = chrome.runtime.getURL(
        `editor/editor.html?specKey=${encodeURIComponent(selectedSpecKey)}&targetSelector=${encodeURIComponent(targetSelector)}&tabId=${currentTabId || ""}`
      );

      chrome.tabs.create({ url: editorUrl });
    });

    // =========================================================================
    // RENDER HANDLER (with MAIN world & data-role unending chaining)
    // =========================================================================
    btnRender.addEventListener("click", async () => {
      const targetSelector = domIdInput.value.trim();
      const selectedSpecKey = specSelect.value;
      const jsonSpec = getSelectedSpecJson();
      const appendPosition = positionSelect ? positionSelect.value : "replace";

      if (!targetSelector) {
        setStatus("Please pick a Target (#id or [data-role=...]).", "error");
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
          args: [targetSelector, jsonSpec, selectedSpecKey, appendPosition],
          func: (selector, spec, specKey, position) => {
            console.log("[json-to-dom v6] Executing in MAIN world:", { selector, specKey, position, spec });

            // Find target element by #id, [data-role="..."], or raw selector
            let targetEl = null;
            if (selector.startsWith("#")) {
              targetEl = document.getElementById(selector.slice(1));
            } else if (selector.startsWith("[data-role=") || selector.startsWith("[data-role")) {
              targetEl = document.querySelector(selector);
            } else if (selector.startsWith("data-role=") || selector.startsWith("role=")) {
              const val = selector.replace(/^(data-)?role=/, "").replace(/['"]/g, "");
              targetEl = document.querySelector(`[data-role="${val}"]`);
            } else {
              // Try ID first, then [data-role]
              targetEl = document.getElementById(selector) || document.querySelector(`[data-role="${selector}"]`);
            }

            if (!targetEl) {
              return { success: false, error: `Target element "${selector}" not found on page.` };
            }

            // Ensure element has an ID for APIs that require targetHtmlId
            if (!targetEl.id) {
              targetEl.id = "ks-role-" + (targetEl.getAttribute("data-role") || "target-" + Date.now());
            }
            const targetHtmlId = targetEl.id;

            // 1. Tag Specification direct render via jsonToDom or specToDom
            if (spec && (spec.tagName || Array.isArray(spec))) {
              if (window.ks?.jsonToDom && typeof window.ks.jsonToDom.appendToDom === "function") {
                window.ks.jsonToDom.appendToDom({
                  jsonSpec: spec,
                  targetHtmlId,
                  appendPosition: position || "replace",
                  showLog: true
                });
                return { success: true, targetHtmlId, method: "jsonToDom" };
              }

              if (window.ks?.specToDom && typeof window.ks.specToDom.appendToDom === "function") {
                window.ks.specToDom.appendToDom({
                  buildSpec: spec,
                  targetHtmlId,
                  appendPosition: position || "replace",
                  showLog: true
                });
                return { success: true, targetHtmlId, method: "specToDom" };
              }
            }

            // 2. High-level table renderer
            if (
              window.ks?.jsonRenderers?.build?.table &&
              typeof window.ks.jsonRenderers.build.table.render === "function"
            ) {
              try {
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
                  appendPosition: position || "replace",
                  classToApply: "",
                  showLog: true
                });
                return { success: true, targetHtmlId, method: "jsonRenderers.build.table.render" };
              } catch (err) {
                console.error("[Extension v6] table.render error:", err);
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
          setStatus(`Rendered successfully to ${targetSelector}!`, "success");
          
          // UNENDING CHAIN: Automatically rescan DOM so newly generated [data-role] elements are immediately selectable!
          await scanDomTargets();
        } else {
          setStatus((res && res.error) || "Render finished.", "error");
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

      // Group 2: Full Specs
      if (specCatalog.spec && Object.keys(specCatalog.spec).length > 0) {
        const optGroupSpec = document.createElement("optgroup");
        optGroupSpec.label = "Complete Specs (spec-repo/spec.json)";
        Object.keys(specCatalog.spec).forEach((k) => {
          const opt = document.createElement("option");
          opt.value = k;
          opt.textContent = k;
          optGroupSpec.appendChild(opt);
        });
        specSelect.appendChild(optGroupSpec);
      }

      // Group 3: Semantic Tags
      if (specCatalog.tags && Object.keys(specCatalog.tags).length > 0) {
        const optGroupTags = document.createElement("optgroup");
        optGroupTags.label = "HTML Tags (spec-repo/tags.json)";
        Object.keys(specCatalog.tags).forEach((k) => {
          const opt = document.createElement("option");
          opt.value = k;
          opt.textContent = `<${k}>`;
          optGroupTags.appendChild(opt);
        });
        specSelect.appendChild(optGroupTags);
      }

      const totalCount = defPaths.length +
        Object.keys(specCatalog.spec || {}).length +
        Object.keys(specCatalog.tags || {}).length;

      specCountBadge.textContent = `${totalCount} specs`;
      setStatus(`Loaded ${totalCount} schemas from spec-repo.`, "info");
    } catch (err) {
      console.error("[json-to-dom v6] Could not load spec catalog:", err);
      specCountBadge.textContent = "Error";
      setStatus("Could not load bundled spec-repo catalog.", "error");
    }
  }

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
   * Scan active webpage for DOM IDs and data-role attributes
   * (Enables Unending Chaining!)
   */
  async function scanDomTargets() {
    domIdInput.disabled = true;
    idCountBadge.textContent = "Scanning...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        idCountBadge.textContent = "0 targets";
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
          // 1. Collect all elements with [id]
          const idNodes = Array.from(document.querySelectorAll("[id]"))
            .map((el) => ({
              type: "id",
              value: `#${el.id}`,
              display: `#${el.id} (${el.tagName.toLowerCase()})`
            }))
            .filter((x) => x.value.length > 1);

          // 2. Collect all elements with [data-role]
          const roleNodes = Array.from(document.querySelectorAll("[data-role]"))
            .map((el) => {
              const role = el.getAttribute("data-role");
              return {
                type: "role",
                value: `[data-role="${role}"]`,
                display: `[data-role="${role}"] (${el.tagName.toLowerCase()})`
              };
            })
            .filter((x) => x.value && x.value.length > 13);

          return { idNodes, roleNodes };
        }
      });

      const data = (results && results[0] && results[0].result) || { idNodes: [], roleNodes: [] };
      const { idNodes, roleNodes } = data;

      idNodes.sort((a, b) => a.value.localeCompare(b.value));
      roleNodes.sort((a, b) => a.value.localeCompare(b.value));

      domIdDatalist.innerHTML = "";

      const currentVal = domIdInput.value.trim();

      // Populate IDs
      idNodes.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.value;
        option.label = item.display;
        domIdDatalist.appendChild(option);
      });

      // Populate Roles
      roleNodes.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.value;
        option.label = item.display;
        domIdDatalist.appendChild(option);
      });

      const totalTargets = idNodes.length + roleNodes.length;
      idCountBadge.textContent = `${totalTargets} targets (${roleNodes.length} roles)`;

      domIdInput.disabled = false;
      domIdInput.placeholder = totalTargets > 0 ? "Pick #id or [data-role]..." : "No targets found";

      // If nothing selected yet, prefer first ID
      if (!currentVal && idNodes.length > 0) {
        domIdInput.value = idNodes[0].value;
      }
    } catch (err) {
      console.error("[json-to-dom v6] Target scan error:", err);
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
