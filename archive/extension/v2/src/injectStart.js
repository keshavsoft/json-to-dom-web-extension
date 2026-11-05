(() => {
    console.log("✅ json-to-dom v2 content script loaded on active page");

    const runtime = typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

    runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "PING") {
            sendResponse({ success: true, message: "PONG from json-to-dom v2 content script" });
            return true;
        }

        if (request.action === "INJECT_DOM_TABLE") {
            try {
                const { columns, data } = request;
                injectTableOverlay({ inColumns: columns, inData: data });
                sendResponse({ success: true });
            } catch (err) {
                console.error("[json-to-dom] In-page table injection error:", err);
                sendResponse({ success: false, error: err.message });
            }
            return true;
        }
    });

    // Function to render and inject floating table overlay onto host webpage
    function injectTableOverlay({ inColumns, inData }) {
        const localColumns = inColumns || [];
        const localData = inData || [];

        // Remove existing overlay if present
        const existing = document.getElementById("ks-json-to-dom-overlay");
        if (existing) existing.remove();

        // Create overlay container
        const container = document.createElement("div");
        container.id = "ks-json-to-dom-overlay";
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 480px;
            max-height: 420px;
            background: #ffffff;
            color: #1e293b;
            border: 2px solid #0d9488;
            border-radius: 10px;
            box-shadow: 0 20px 30px rgba(0,0,0,0.3);
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: ksSlideIn 0.25s ease-out;
        `;

        // Inject animation style
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
                <span style="background: #0d9488; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px;">KS</span>
                <span>json-to-dom Table Overlay</span>
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

        // Table scroll wrapper
        const tableWrapper = document.createElement("div");
        tableWrapper.style.cssText = `
            padding: 10px;
            overflow: auto;
            flex: 1;
        `;

        // Build Table
        const table = document.createElement("table");
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
        `;

        // Header
        const thead = document.createElement("thead");
        const htr = document.createElement("tr");

        const thSerial = document.createElement("th");
        thSerial.textContent = "#";
        thSerial.style.cssText = "background: #1e293b; color: #fff; padding: 6px 8px; border: 1px solid #334155; width: 28px; text-align: center;";
        htr.appendChild(thSerial);

        localColumns.forEach((col) => {
            const th = document.createElement("th");
            th.textContent = col.label || col.columnName || String(col);
            th.style.cssText = "background: #1e293b; color: #fff; padding: 6px 8px; border: 1px solid #334155; text-align: left;";
            htr.appendChild(th);
        });

        thead.appendChild(htr);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement("tbody");
        localData.forEach((row, idx) => {
            const tr = document.createElement("tr");
            tr.style.background = idx % 2 === 0 ? "#f8fafc" : "#ffffff";

            const tdSerial = document.createElement("td");
            tdSerial.textContent = idx + 1;
            tdSerial.style.cssText = "padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #64748b; font-weight: 600;";
            tr.appendChild(tdSerial);

            localColumns.forEach((col) => {
                const key = col.columnName || col;
                const td = document.createElement("td");
                td.textContent = row[key] !== undefined ? row[key] : "";
                td.style.cssText = "padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155;";
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);

        document.body.appendChild(container);
    }
})();
