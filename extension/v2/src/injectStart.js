(() => {
    // 1. Inject tagToJson directly into page execution context
    const inject = (file) => {
        const script = document.createElement("script");
        script.type = "module";
        script.src = (typeof browser !== "undefined" ? browser : chrome).runtime.getURL(file);
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
    };

    inject("src/tagToJson.min.js");
    console.log("✅ tag-to-json v2 extension injected (window.tagToJson ready)");

    // 2. Listen for messages from the popup
    const runtime = typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

    runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "GET_ELEMENT_IDS") {
            // Find all elements with an ID on the current page
            const elements = document.querySelectorAll("[id]");
            const idList = [];

            // Add body as first convenience option
            idList.push({
                id: "body",
                tag: "body",
                label: "<body> (Whole Page)"
            });

            elements.forEach((el) => {
                const id = el.id?.trim();
                // Ignore internal extension or empty ids
                if (!id || id === "GOOGLE_INPUT_CHEXT_FLAG") return;

                const tagName = el.tagName.toLowerCase();
                const classSnippet = el.className && typeof el.className === "string" 
                    ? ` .${el.className.trim().split(/\s+/).slice(0, 2).join(".")}` 
                    : "";

                idList.push({
                    id,
                    tag: tagName,
                    label: `#${id} <${tagName}${classSnippet}>`
                });
            });

            sendResponse({ success: true, ids: idList });
            return true;
        }

        if (request.action === "EXTRACT_SPEC_BY_ID") {
            try {
                const targetId = request.targetId;
                const element = targetId === "body" 
                    ? document.body 
                    : document.getElementById(targetId);

                if (!element) {
                    sendResponse({ success: false, error: `Element with id "${targetId}" not found.` });
                    return true;
                }

                // Call window.tagToJson if available, otherwise inline lightweight extraction
                const spec = (typeof window.tagToJson === "function")
                    ? window.tagToJson({ inElement: element })
                    : extractInlineSpec(element);

                sendResponse({ success: true, spec, targetId });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
            return true;
        }
    });

    // Helper fallback if page context bridge is sandboxed
    function extractInlineSpec(el) {
        if (!el || el.nodeType !== 1) return null;
        const spec = { tagName: el.tagName.toLowerCase() };

        if (el.attributes && el.attributes.length > 0) {
            const attrs = {};
            for (const a of el.attributes) {
                if (!a.name.startsWith("data-gr-") && a.name !== "id" || a.value !== "GOOGLE_INPUT_CHEXT_FLAG") {
                    attrs[a.name] = a.value;
                }
            }
            if (Object.keys(attrs).length > 0) spec.attributes = attrs;
        }

        const childElements = Array.from(el.children || []);
        if (childElements.length > 0) {
            const children = childElements.map(extractInlineSpec).filter(Boolean);
            if (children.length > 0) spec.children = children;
        } else {
            const text = el.textContent?.trim();
            if (text) spec.textContent = text;
        }
        return spec;
    }
})();
