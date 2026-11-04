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
    btnRender.addEventListener("click", () => {
      const targetId = domIdInput.value.trim().replace(/^#/, "");
      const selectedSpecKey = specSelect.value;
      const jsonSpec = getSelectedSpecJson();

      // TODO: Boss, your custom render code goes here!
      console.log("[json-to-dom v5] Render clicked!", {
        targetId,
        selectedSpecKey,
        jsonSpec,
        currentTabId
      });
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
