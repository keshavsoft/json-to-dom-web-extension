import render from "../../../docs/dist/v47/min.js";
import data from "../common/data.json" with { type: "json" };
import columns from "../common/columns.json" with { type: "json" };

const container = document.getElementById("dom-render-container");

const start = () => {
    try {
        render({
            type: "table.simple",
            data,
            columns,
            options: {
                showSerial: true,
                showOptions: true
            },
            targetHtmlId: "dom-render-container",
            classToApply: "",
            appendPosition: "replace"
        });
    } catch (err) {
        console.error("Render error:", err);
        if (container) {
            container.innerHTML = `<div class="alert alert-danger font-monospace small">${err.message}</div>`;
        }
    }
};

start();

