document.addEventListener("DOMContentLoaded", async () => {
  const browserAPI = typeof browser !== "undefined" ? browser : chrome;

  const btnTestClick = document.getElementById("btnTestClick");
  const btnOpenModal = document.getElementById("btnOpenModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnModalAcknowledge = document.getElementById("btnModalAcknowledge");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTimestamp = document.getElementById("modalTimestamp");
  const feedbackMsg = document.getElementById("feedbackMessage");
  const clickCountDisplay = document.getElementById("clickCountDisplay");
  const activeTabDisplay = document.getElementById("activeTabDisplay");
  const statusBadge = document.getElementById("statusBadge");

  let clickCount = 0;

  // Helper to show user feedback message
  function showFeedback({ inText, inType }) {
    const localText = inText;
    const localType = inType;
    if (!feedbackMsg) return;
    feedbackMsg.textContent = localText;
    feedbackMsg.className = `feedback-msg ${localType || ""}`;
  }

  // Helper to get active tab information
  async function getActiveTab() {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (err) {
      console.warn("[json-to-dom] Could not query active tab:", err);
      return null;
    }
  }

  // Detect and display active tab information
  const activeTab = await getActiveTab();
  if (activeTab && activeTabDisplay) {
    const titleSnippet = activeTab.title
      ? (activeTab.title.length > 22 ? activeTab.title.substring(0, 22) + "..." : activeTab.title)
      : `Tab ID: ${activeTab.id}`;
    activeTabDisplay.textContent = `Tab: ${titleSnippet}`;
    activeTabDisplay.title = activeTab.title || "";
  } else if (activeTabDisplay) {
    activeTabDisplay.textContent = "Tab: Active";
  }

  // 1. Hook Click Event for "Test Click Event" button
  if (btnTestClick) {
    btnTestClick.addEventListener("click", () => {
      clickCount++;
      console.log(`✅ [json-to-dom] Test Click Event fired successfully! Total clicks: ${clickCount}`);

      if (clickCountDisplay) {
        clickCountDisplay.textContent = `Clicks: ${clickCount}`;
      }

      showFeedback({
        inText: `Click event #${clickCount} executed successfully!`,
        inType: "success"
      });

      if (statusBadge) {
        statusBadge.textContent = "Active";
        statusBadge.className = "status-indicator active";
      }

      // Ping active tab content script if reachable
      if (activeTab?.id) {
        browserAPI.tabs.sendMessage(activeTab.id, { action: "PING" }, (response) => {
          if (browserAPI.runtime.lastError) {
            // Content script may not be injected on restricted browser pages (chrome://, etc.)
            console.log("[json-to-dom] Tab ping skipped (page might be internal or loading).");
          } else if (response?.success) {
            console.log("✅ [json-to-dom] Content script responded:", response.message);
          }
        });
      }
    });
  }

  // 2. Hook Click Event for "Open Modal Popup" button
  if (btnOpenModal && modalOverlay) {
    btnOpenModal.addEventListener("click", () => {
      clickCount++;
      if (clickCountDisplay) {
        clickCountDisplay.textContent = `Clicks: ${clickCount}`;
      }

      if (modalTimestamp) {
        modalTimestamp.textContent = `Event logged at: ${new Date().toLocaleTimeString()}`;
      }

      modalOverlay.classList.remove("hidden");
      console.log(`✅ [json-to-dom] Modal popup displayed on click! Total clicks: ${clickCount}`);
    });
  }

  // 3. Close Modal handlers
  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add("hidden");
    showFeedback({
      inText: "Modal closed. Ready for next action.",
      inType: "info"
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", closeModal);
  }

  if (btnModalAcknowledge) {
    btnModalAcknowledge.addEventListener("click", closeModal);
  }

  // Close modal when pressing Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay && !modalOverlay.classList.contains("hidden")) {
      closeModal();
    }
  });

  console.log("✅ [json-to-dom] Extension popup initialized & click events hooked.");
});

