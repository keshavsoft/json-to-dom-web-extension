document.addEventListener("DOMContentLoaded", async () => {
  const browserAPI = typeof browser !== "undefined" ? browser : chrome;

  // DOM Elements
  const btnLoadSample = document.getElementById("btnLoadSample");
  const btnRenderTable = document.getElementById("btnRenderTable");
  const btnInjectPage = document.getElementById("btnInjectPage");
  const btnOpenModal = document.getElementById("btnOpenModal");
  const tableSearchInput = document.getElementById("tableSearchInput");
  const rowCountBadge = document.getElementById("rowCountBadge");
  const domPreview = document.getElementById("domPreview");
  const feedbackMsg = document.getElementById("feedbackMessage");
  const statusBadge = document.getElementById("statusBadge");
  const activeTabSnippet = document.getElementById("activeTabSnippet");

  // Modal Elements
  const modalOverlay = document.getElementById("modalOverlay");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const tabBtnColumns = document.getElementById("tabBtnColumns");
  const tabBtnData = document.getElementById("tabBtnData");
  const jsonEditorArea = document.getElementById("jsonEditorArea");
  const btnModalReset = document.getElementById("btnModalReset");
  const btnModalApply = document.getElementById("btnModalApply");

  // Default Samples matching KeshavSoft Table Workbench
  const defaultColumns = [
    { columnName: "itemName", label: "ITEMNAME" },
    { columnName: "category", label: "CATEGORY" },
    { columnName: "baseUnit", label: "BASEUNIT" },
    { columnName: "openingRate", label: "RATE" }
  ];

  const defaultData = [
    { itemName: "0.09/30mm High Tensile Bolt", category: "Fasteners", baseUnit: "kgs", openingRate: "1200.00/kgs" },
    { itemName: "0.11-25 Galvanized Wire Coil", category: "Raw Materials", baseUnit: "kgs", openingRate: "1450.00/kgs" },
    { itemName: "0.11-30 Stainless Steel Rod", category: "Raw Materials", baseUnit: "pcs", openingRate: "890.00/pcs" },
    { itemName: "M10 Hex Flange Nut", category: "Fasteners", baseUnit: "pcs", openingRate: "4.50/pcs" },
    { itemName: "Alloy Steel Socket Cap Screw", category: "Fasteners", baseUnit: "boxes", openingRate: "650.00/box" },
    { itemName: "Grade 8 Zinc Plated Washer", category: "Hardware", baseUnit: "pkts", openingRate: "120.00/pkt" }
  ];

  // Workbench State
  let currentColumns = [...defaultColumns];
  let currentData = [...defaultData];
  let activeModalTab = "columns"; // 'columns' or 'data'

  // Helper: Show Feedback Message
  function showFeedback({ inText, inType }) {
    const localText = inText;
    const localType = inType;
    if (!feedbackMsg) return;
    feedbackMsg.textContent = localText;
    feedbackMsg.className = `feedback-msg ${localType || ""}`;
  }

  // Helper: Get Active Tab
  async function getActiveTab() {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (err) {
      console.warn("[json-to-dom v2] Could not query tab:", err);
      return null;
    }
  }

  const activeTab = await getActiveTab();
  if (activeTab && activeTabSnippet) {
    const title = activeTab.title ? (activeTab.title.length > 20 ? activeTab.title.substring(0, 20) + "..." : activeTab.title) : `ID: ${activeTab.id}`;
    activeTabSnippet.textContent = `Tab: ${title}`;
    activeTabSnippet.title = activeTab.url || "";
  }

  // Core Function: Render Declarative JSON to Native DOM Table
  function renderTable({ inColumns, inData, inFilterText }) {
    const localColumns = inColumns || currentColumns;
    const localData = inData || currentData;
    const localFilter = (inFilterText || "").trim().toLowerCase();

    // Filter rows based on search
    const filteredRows = localFilter
      ? localData.filter((row) =>
          Object.values(row).some((val) => String(val).toLowerCase().includes(localFilter))
        )
      : localData;

    domPreview.innerHTML = "";

    if (!filteredRows || filteredRows.length === 0) {
      domPreview.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p class="empty-title">No Matching Records</p>
          <p class="empty-desc">No rows matched your search filter "${localFilter}".</p>
        </div>
      `;
      if (rowCountBadge) rowCountBadge.textContent = "0 rows";
      return;
    }

    // Build Native Table DOM Elements
    const table = document.createElement("table");
    table.className = "ks-table";

    // Build thead
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Serial header
    const thSerial = document.createElement("th");
    thSerial.className = "serial-col";
    thSerial.textContent = "#";
    headerRow.appendChild(thSerial);

    // Columns headers
    localColumns.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col.label || col.columnName || String(col);
      headerRow.appendChild(th);
    });

    // Action header
    const thAction = document.createElement("th");
    thAction.textContent = "ACTION";
    headerRow.appendChild(thAction);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Build tbody
    const tbody = document.createElement("tbody");
    filteredRows.forEach((row, idx) => {
      const tr = document.createElement("tr");

      // Serial cell
      const tdSerial = document.createElement("td");
      tdSerial.className = "serial-col";
      tdSerial.textContent = idx + 1;
      tr.appendChild(tdSerial);

      // Data cells
      localColumns.forEach((col) => {
        const key = col.columnName || col;
        const td = document.createElement("td");
        td.textContent = row[key] !== undefined ? row[key] : "";
        tr.appendChild(td);
      });

      // Action cell
      const tdAction = document.createElement("td");
      const btnAction = document.createElement("button");
      btnAction.className = "btn-table-action";
      btnAction.textContent = "view";
      btnAction.addEventListener("click", () => {
        showFeedback({
          inText: `Inspecting row #${idx + 1}: ${row.itemName || JSON.stringify(row)}`,
          inType: "info"
        });
      });
      tdAction.appendChild(btnAction);
      tr.appendChild(tdAction);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    domPreview.appendChild(table);

    if (rowCountBadge) {
      rowCountBadge.textContent = `${filteredRows.length} rows`;
    }
  }

  // 1. Load Sample Button Click
  btnLoadSample.addEventListener("click", () => {
    currentColumns = [...defaultColumns];
    currentData = [...defaultData];
    renderTable({ inColumns: currentColumns, inData: currentData });
    showFeedback({ inText: "Sample columns & inventory dataset loaded!", inType: "success" });
    if (statusBadge) statusBadge.textContent = "Sample Loaded";
  });

  // 2. Render Button Click
  btnRenderTable.addEventListener("click", () => {
    renderTable({
      inColumns: currentColumns,
      inData: currentData,
      inFilterText: tableSearchInput.value
    });
    showFeedback({ inText: `Rendered ${currentData.length} records into DOM table!`, inType: "success" });
    if (statusBadge) statusBadge.textContent = "Rendered";
  });

  // 3. Live Search Input
  tableSearchInput.addEventListener("input", (e) => {
    renderTable({
      inColumns: currentColumns,
      inData: currentData,
      inFilterText: e.target.value
    });
  });

  // 4. Inject Table into Active Webpage
  btnInjectPage.addEventListener("click", () => {
    if (!activeTab?.id) {
      showFeedback({ inText: "No active webpage tab found to inject.", inType: "error" });
      return;
    }

    const payload = {
      action: "INJECT_DOM_TABLE",
      columns: currentColumns,
      data: currentData
    };

    browserAPI.tabs.sendMessage(activeTab.id, payload, (response) => {
      if (browserAPI.runtime.lastError) {
        showFeedback({
          inText: "Cannot inject into internal browser pages (try on http/https).",
          inType: "error"
        });
        console.warn("[json-to-dom v2] Injection failed:", browserAPI.runtime.lastError.message);
      } else if (response?.success) {
        showFeedback({ inText: "✅ Table successfully injected into active webpage!", inType: "success" });
      }
    });
  });

  // 5. Modal Dialog & JSON Editor
  function updateModalEditor() {
    if (activeModalTab === "columns") {
      jsonEditorArea.value = JSON.stringify(currentColumns, null, 2);
    } else {
      jsonEditorArea.value = JSON.stringify(currentData, null, 2);
    }
  }

  btnOpenModal.addEventListener("click", () => {
    updateModalEditor();
    modalOverlay.classList.remove("hidden");
  });

  btnCloseModal.addEventListener("click", () => {
    modalOverlay.classList.add("hidden");
  });

  tabBtnColumns.addEventListener("click", () => {
    activeModalTab = "columns";
    tabBtnColumns.classList.add("active");
    tabBtnData.classList.remove("active");
    updateModalEditor();
  });

  tabBtnData.addEventListener("click", () => {
    activeModalTab = "data";
    tabBtnData.classList.add("active");
    tabBtnColumns.classList.remove("active");
    updateModalEditor();
  });

  btnModalReset.addEventListener("click", () => {
    if (activeModalTab === "columns") {
      currentColumns = [...defaultColumns];
    } else {
      currentData = [...defaultData];
    }
    updateModalEditor();
    showFeedback({ inText: "Reset to default schema/dataset.", inType: "info" });
  });

  btnModalApply.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(jsonEditorArea.value);
      if (activeModalTab === "columns") {
        if (!Array.isArray(parsed)) throw new Error("Columns must be a JSON array.");
        currentColumns = parsed;
      } else {
        if (!Array.isArray(parsed)) throw new Error("Data must be a JSON array.");
        currentData = parsed;
      }

      modalOverlay.classList.add("hidden");
      renderTable({ inColumns: currentColumns, inData: currentData });
      showFeedback({ inText: "Applied custom JSON & re-rendered DOM table!", inType: "success" });
    } catch (err) {
      alert(`Invalid JSON format: ${err.message}`);
    }
  });

  // Initial Auto-Render
  renderTable({ inColumns: currentColumns, inData: currentData });
  console.log("✅ [json-to-dom v2] Table Workbench ready.");
});
