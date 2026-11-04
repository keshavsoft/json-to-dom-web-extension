(() => {
    // 1. Inject bundled npm package (json-renderers-build-table) directly into page execution context (Main World)
    const inject = ({ inFile }) => {
        const localFile = inFile;
        try {
            const script = document.createElement("script");
            script.type = "module";
            script.src = (typeof browser !== "undefined" ? browser : chrome).runtime.getURL(localFile);
            script.onload = () => script.remove();
            (document.head || document.documentElement).appendChild(script);
        } catch (err) {
            console.warn("[json-to-dom v4] Script injection error:", err);
        }
    };

    inject({ inFile: "src/jsonToDom.min.js" });
    console.log("✅ [json-to-dom v4] Extension injected (window.ks.jsonRenderers.build.table ready)");

    // 2. Listen for messages from extension popup
    const runtime = typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

    runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "PING") {
            sendResponse({ success: true, message: "PONG from json-to-dom v4 content script" });
            return true;
        }

        if (request.action === "INJECT_DOM_TABLE") {
            try {
                const { columns, data } = request;
                injectTableOverlay({ inColumns: columns, inData: data });
                sendResponse({ success: true });
            } catch (err) {
                console.error("[json-to-dom v4] In-page table injection error:", err);
                sendResponse({ success: false, error: err.message });
            }
            return true;
        }
    });

    // Helper: Floating dismissible table overlay on host webpage
    function injectTableOverlay({ inColumns, inData }) {
        const localColumns = inColumns || [];
        const localData = inData || [];

        const existing = document.getElementById("ks-json-to-dom-overlay");
        if (existing) existing.remove();

        const container = document.createElement("div");
        container.id = "ks-json-to-dom-overlay";
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 520px;
            max-height: 440px;
            background: #ffffff;
            color: #1e293b;
            border: 2px solid #0d9488;
            border-radius: 10px;
            box-shadow: 0 20px 35px rgba(0,0,0,0.3);
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: ksSlideIn 0.25s ease-out;
        `;

        const style = document.createElement("style");
        style.textContent = `
            @keyframes ksSlideIn {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        container.appendChild(style);

        // Header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: #0f172a;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
        `;
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #0d9488; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">KS</span>
                <span>json-to-dom v3 Table Overlay</span>
            </div>
        `;

        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.cssText = `
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 20px;
            cursor: pointer;
            line-height: 1;
        `;
        closeBtn.onclick = () => container.remove();
        header.appendChild(closeBtn);
        container.appendChild(header);

        // Table scroll container
        const tableWrapper = document.createElement("div");
        tableWrapper.id = "ks-table-render-mount";
        tableWrapper.style.cssText = `
            padding: 12px;
            overflow: auto;
            flex: 1;
        `;
        container.appendChild(tableWrapper);

        document.body.appendChild(container);

        // Use window.ks renderer if mounted, or fallback
        if (window.ks?.jsonRenderers?.build?.table?.render) {
            window.ks.jsonRenderers.build.table.render({
                type: "table.simple",
                data: localData,
                columns: localColumns,
                options: {
                    showSerial: true,
                    showSearch: true,
                    showOptions: true
                },
                targetHtmlId: "ks-table-render-mount",
                appendPosition: "replace"
            });
        }
    }
})();
