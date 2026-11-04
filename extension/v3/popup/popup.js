document.addEventListener("DOMContentLoaded", async () => {
  const btnDownloadFullPage = document.getElementById("btnDownloadFullPage");
  const idSelect = document.getElementById("idSelect");
  const filterInput = document.getElementById("filterInput");
  const btnRefresh = document.getElementById("btnRefresh");
  const btnDownload = document.getElementById("btnDownload");
  const btnCopy = document.getElementById("btnCopy");
  const statsBar = document.getElementById("elementCount");
  const feedbackMsg = document.getElementById("feedbackMessage");

  let allIds = [];

  const browserAPI = typeof browser !== "undefined" ? browser : chrome;

  // 1. Get active tab
  async function getActiveTab() {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // Helper to show user feedback
  function showFeedback({ inText, inType }) {
    const localText = inText;
    const localType = inType;
    feedbackMsg.textContent = localText;
    feedbackMsg.className = `feedback-msg ${localType || ""}`;
  }

  // Helper to trigger file download
  function triggerDownload({ inJsonData, inFileName }) {
    const localJsonData = inJsonData;
    const localFileName = inFileName;

    const jsonString = JSON.stringify(localJsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = localFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 2. Fetch all IDs from active tab
  async function fetchIds() {
    idSelect.innerHTML = `<option value="" disabled selected>Scanning page elements...</option>`;
    btnDownload.disabled = true;
    btnCopy.disabled = true;
    showFeedback({ inText: "", inType: "" });

    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        showFeedback({ inText: "No active tab found.", inType: "error" });
        return;
      }

      // Query the injected content script
      browserAPI.tabs.sendMessage(tab.id, { action: "GET_ELEMENT_IDS" }, (response) => {
        if (browserAPI.runtime.lastError || !response?.success) {
          showFeedback({ inText: "Cannot inspect this page (reload page to re-inject).", inType: "error" });
          idSelect.innerHTML = `<option value="__html_full_page__">🌐 Complete Page Document</option><option value="body">📄 <body> (Page Body)</option>`;
          allIds = [
            { id: "__html_full_page__", label: "🌐 Complete Page Document" },
            { id: "body", label: "📄 <body> (Page Body)" }
          ];
          btnDownload.disabled = false;
          btnCopy.disabled = false;
          statsBar.textContent = "Full page options available";
          return;
        }

        allIds = response.ids || [];
        renderDropdown({ inItems: allIds });
      });
    } catch (err) {
      showFeedback({ inText: `Error: ${err.message}`, inType: "error" });
    }
  }

  // 3. Render dropdown options
  function renderDropdown({ inItems }) {
    const localItems = inItems;
    idSelect.innerHTML = "";
    if (localItems.length === 0) {
      idSelect.innerHTML = `<option value="" disabled>No elements found</option>`;
      btnDownload.disabled = true;
      btnCopy.disabled = true;
      statsBar.textContent = "0 elements found";
      return;
    }

    localItems.forEach((item, idx) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.label;
      if (idx === 0) opt.selected = true;
      idSelect.appendChild(opt);
    });

    btnDownload.disabled = false;
    btnCopy.disabled = false;
    statsBar.textContent = `Found ${localItems.length} element${localItems.length === 1 ? '' : 's'}`;
  }

  // 4. Quick filter
  filterInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderDropdown({ inItems: allIds });
      return;
    }
    const filtered = allIds.filter(item => 
      item.id.toLowerCase().includes(query) || 
      item.label.toLowerCase().includes(query)
    );
    renderDropdown({ inItems: filtered });
  });

  // 5. Extract Spec from Selected ID
  async function extractSpecFromSelected() {
    const selectedId = idSelect.value;
    if (!selectedId) return null;

    const tab = await getActiveTab();
    return new Promise((resolve, reject) => {
      browserAPI.tabs.sendMessage(tab.id, { action: "EXTRACT_SPEC_BY_ID", targetId: selectedId }, (response) => {
        if (browserAPI.runtime.lastError || !response?.success) {
          reject(new Error(response?.error || browserAPI.runtime.lastError?.message || "Failed to extract spec"));
        } else {
          resolve({ spec: response.spec, targetId: response.targetId });
        }
      });
    });
  }

  // 6. Extract Full Page Spec
  async function extractFullPageSpec() {
    const tab = await getActiveTab();
    return new Promise((resolve, reject) => {
      browserAPI.tabs.sendMessage(tab.id, { action: "EXTRACT_FULL_PAGE" }, (response) => {
        if (browserAPI.runtime.lastError || !response?.success) {
          reject(new Error(response?.error || browserAPI.runtime.lastError?.message || "Failed to extract full page"));
        } else {
          resolve({ spec: response.spec, targetId: "full-page" });
        }
      });
    });
  }

  // 7. Download Full Page Button Action
  btnDownloadFullPage.addEventListener("click", async () => {
    try {
      showFeedback({ inText: "Extracting complete HTML document...", inType: "" });
      const result = await extractFullPageSpec();
      if (!result?.spec) throw new Error("Received empty specification for full page.");

      triggerDownload({
        inJsonData: result.spec,
        inFileName: "full-page-spec.json"
      });

      showFeedback({ inText: "Saved full-page-spec.json!", inType: "success" });
    } catch (err) {
      showFeedback({ inText: err.message, inType: "error" });
    }
  });

  // 8. Download Selected Element Button Action
  btnDownload.addEventListener("click", async () => {
    try {
      showFeedback({ inText: "Extracting specification...", inType: "" });
      const result = await extractSpecFromSelected();
      if (!result?.spec) throw new Error("Received empty spec");

      triggerDownload({
        inJsonData: result.spec,
        inFileName: `${result.targetId}-spec.json`
      });

      showFeedback({ inText: `Saved ${result.targetId}-spec.json!`, inType: "success" });
    } catch (err) {
      showFeedback({ inText: err.message, inType: "error" });
    }
  });

  // 9. Copy Action
  btnCopy.addEventListener("click", async () => {
    try {
      showFeedback({ inText: "Extracting specification...", inType: "" });
      const result = await extractSpecFromSelected();
      if (!result?.spec) throw new Error("Received empty spec");

      const jsonString = JSON.stringify(result.spec, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showFeedback({ inText: "Copied specification to clipboard!", inType: "success" });
    } catch (err) {
      showFeedback({ inText: err.message, inType: "error" });
    }
  });

  // 10. Refresh Button
  btnRefresh.addEventListener("click", fetchIds);

  // Initial scan
  fetchIds();
});
