import render from "json-renderers-build-table";

// Verify global registration in execution context
if (typeof globalThis !== "undefined") {
    console.log("✅ [json-to-dom v3] json-renderers-build-table initialized (window.ks ready)");
}

export { render };
export default render;

