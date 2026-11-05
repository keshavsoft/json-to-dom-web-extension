/**
 * json-to-dom v4 Popup Controller
 * KeshavSoft
 * 
 * Features:
 * 1. Datalist search for DOM IDs (sorted alphabetically).
 * 2. Local JSON file selector (parses uploaded .json).
 * 3. Render button click event handler left completely empty and ready for boss's code!
 */

document.addEventListener("DOMContentLoaded", () => {
  const domIdInput = document.getElementById("domIdInput");
  const domIdDatalist = document.getElementById("domIdDatalist");
  const btnRefreshIds = document.getElementById("btnRefreshIds");
  const idCountBadge = document.getElementById("idCountBadge");
  const jsonFileInput = document.getElementById("jsonFileInput");
  const fileStatusBadge = document.getElementById("fileStatusBadge");
  const btnRender = document.getElementById("btnRender");
  const statusMessage = document.getElementById("statusMessage");
  const statusBadge = document.getElementById("statusBadge");

  let currentTabId = null;
  let loadedJsonData = null; // Stores parsed JSON from user's file selection

  init();

  async function init() {
    await scanDomIds();

    // Refresh button: rescan page IDs
    btnRefreshIds.addEventListener("click", () => {
      scanDomIds();
    });

    // Handle JSON file selection (.json only)
    jsonFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        loadedJsonData = null;
        fileStatusBadge.textContent = "No file";
        return;
      }

      fileStatusBadge.textContent = "Reading...";
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          loadedJsonData = JSON.parse(event.target.result);
          fileStatusBadge.textContent = `${file.name.slice(0, 14)}...`;
          setStatus(`Loaded ${file.name} successfully.`, "success");
        } catch (err) {
          loadedJsonData = null;
          fileStatusBadge.textContent = "Invalid JSON";
          setStatus("Error parsing JSON file. Please check format.", "error");
        }
      };

      reader.onerror = () => {
        loadedJsonData = null;
        fileStatusBadge.textContent = "Read error";
        setStatus("Could not read selected file.", "error");
      };

      reader.readAsText(file);
    });

    // =========================================================================
    // BOSS: WRITE YOUR RENDER CODE RIGHT HERE!
    // Available variables you can use:
    // - domIdInput.value      => The DOM ID typed or selected by you
    // - loadedJsonData        => The parsed JSON object from your selected file
    // - currentTabId          => Active browser tab ID
    // =========================================================================
    btnRender.addEventListener("click", () => {
      const targetId = domIdInput.value;
      const jsonData = loadedJsonData;

      // TODO: Boss, your custom render code goes here!
      console.log("[json-to-dom v4] Render clicked with Target ID:", targetId, "and JSON Data:", jsonData);
    });
  }

  /**
   * Scan active webpage for all elements with an [id] attribute
   * and sort them alphabetically for easy searching in the datalist.
   */
  async function scanDomIds() {
    domIdInput.disabled = true;
    idCountBadge.textContent = "Scanning...";
    setStatus("Scanning page for DOM IDs...", "info");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        setStatus("No active tab found.", "error");
        idCountBadge.textContent = "0 IDs";
        return;
      }

      currentTabId = tab.id;

      if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
        domIdInput.placeholder = "Restricted browser page";
        idCountBadge.textContent = "N/A";
        setStatus("Extensions cannot inspect internal browser pages.", "error");
        return;
      }

      // Execute scanner inside the page
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

      // Sort alphabetically
      idList.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

      domIdDatalist.innerHTML = "";

      if (idList.length === 0) {
        domIdInput.placeholder = "No elements with ID found";
        idCountBadge.textContent = "0 IDs";
        setStatus("No elements with an id attribute found on this page.", "info");
        return;
      }

      // Populate datalist options
      idList.forEach((id) => {
        const option = document.createElement("option");
        option.value = id;
        domIdDatalist.appendChild(option);
      });

      domIdInput.disabled = false;
      domIdInput.placeholder = "Type or pick DOM ID...";
      idCountBadge.textContent = `${idList.length} IDs`;
      setStatus(`Found ${idList.length} IDs sorted alphabetically.`, "info");
    } catch (err) {
      console.error("[json-to-dom v4] Error scanning DOM IDs:", err);
      domIdInput.disabled = true;
      idCountBadge.textContent = "Error";
      setStatus(`Scan error: ${err.message}`, "error");
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
