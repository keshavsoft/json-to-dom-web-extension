document.addEventListener("DOMContentLoaded", async () => {
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

  // 2. Fetch all IDs from active tab
  async function fetchIds() {
    idSelect.innerHTML = `<option value="" disabled selected>Scanning page elements...</option>`;
    btnDownload.disabled = true;
    btnCopy.disabled = true;
    showFeedback("", "");

    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        showFeedback("No active tab found.", "error");
        return;
      }

      // Query the injected content script
      browserAPI.tabs.sendMessage(tab.id, { action: "GET_ELEMENT_IDS" }, (response) => {
        if (browserAPI.runtime.lastError || !response?.success) {
          showFeedback("Cannot inspect this page (reload page to re-inject).", "error");
          idSelect.innerHTML = `<option value="body"><body> (Whole Page)</option>`;
          allIds = [{ id: "body", label: "<body> (Whole Page)" }];
          btnDownload.disabled = false;
          btnCopy.disabled = false;
          statsBar.textContent = "1 element available";
          return;
        }

        allIds = response.ids || [];
        renderDropdown(allIds);
      });
    } catch (err) {
      showFeedback(`Error: ${err.message}`, "error");
    }
  }

  // 3. Render dropdown options
  function renderDropdown(items) {
    idSelect.innerHTML = "";
    if (items.length === 0) {
      idSelect.innerHTML = `<option value="" disabled>No elements with ID found</option>`;
      btnDownload.disabled = true;
      btnCopy.disabled = true;
      statsBar.textContent = "0 elements found";
      return;
    }

    items.forEach((item, idx) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.label;
      if (idx === 0) opt.selected = true;
      idSelect.appendChild(opt);
    });

    btnDownload.disabled = false;
    btnCopy.disabled = false;
    statsBar.textContent = `Found ${items.length} element${items.length === 1 ? '' : 's'}`;
  }

  // 4. Quick filter
  filterInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderDropdown(allIds);
      return;
    }
    const filtered = allIds.filter(item => 
      item.id.toLowerCase().includes(query) || 
      item.label.toLowerCase().includes(query)
    );
    renderDropdown(filtered);
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

  // 6. Download Action
  btnDownload.addEventListener("click", async () => {
    try {
      showFeedback("Extracting specification...", "");
      const result = await extractSpecFromSelected();
      if (!result?.spec) throw new Error("Received empty spec");

      const jsonString = JSON.stringify(result.spec, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.targetId}-spec.json`;
      a.click();
      URL.revokeObjectURL(url);

      showFeedback(`Saved ${result.targetId}-spec.json!`, "success");
    } catch (err) {
      showFeedback(err.message, "error");
    }
  });

  // 7. Copy Action
  btnCopy.addEventListener("click", async () => {
    try {
      showFeedback("Extracting specification...", "");
      const result = await extractSpecFromSelected();
      if (!result?.spec) throw new Error("Received empty spec");

      const jsonString = JSON.stringify(result.spec, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showFeedback("Copied specification to clipboard!", "success");
    } catch (err) {
      showFeedback(err.message, "error");
    }
  });

  // 8. Refresh Button
  btnRefresh.addEventListener("click", fetchIds);

  function showFeedback(text, type) {
    feedbackMsg.textContent = text;
    feedbackMsg.className = `feedback-msg ${type}`;
  }

  // Initial scan
  fetchIds();
});
