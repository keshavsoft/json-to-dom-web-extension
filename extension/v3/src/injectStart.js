(() => {
    // 1. Inject tagToJson directly into page execution context
    const inject = ({ inFile }) => {
        const localFile = inFile;
        const script = document.createElement("script");
        script.type = "module";
        script.src = (typeof browser !== "undefined" ? browser : chrome).runtime.getURL(localFile);
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
    };

    inject({ inFile: "src/tagToJson.min.js" });
    console.log("✅ tag-to-json v3 extension injected (window.tagToJson ready)");

    // 2. Listen for messages from the popup
    const runtime = typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

    runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "GET_ELEMENT_IDS") {
            // Find all elements with an ID on the current page
            const elements = document.querySelectorAll("[id]");
            const idList = [];

            // Add full page and body convenience options
            idList.push({
                id: "__html_full_page__",
                tag: "html",
                label: "🌐 <html> (Complete Page Document)"
            });

            idList.push({
                id: "body",
                tag: "body",
                label: "📄 <body> (Page Body)"
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

        if (request.action === "EXTRACT_FULL_PAGE") {
            try {
                const element = document.documentElement;
                const spec = (typeof window.tagToJson === "function")
                    ? window.tagToJson({ inElement: element })
                    : extractInlineSpec({ inElement: element });

                sendResponse({ success: true, spec, targetId: "full-page" });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
            return true;
        }

        if (request.action === "EXTRACT_SPEC_BY_ID") {
            try {
                const targetId = request.targetId;
                let element = null;

                if (targetId === "__html_full_page__") {
                    element = document.documentElement;
                } else if (targetId === "body") {
                    element = document.body;
                } else {
                    element = document.getElementById(targetId);
                }

                if (!element) {
                    sendResponse({ success: false, error: `Element with id "${targetId}" not found.` });
                    return true;
                }

                const spec = (typeof window.tagToJson === "function")
                    ? window.tagToJson({ inElement: element })
                    : extractInlineSpec({ inElement: element });

                const outputName = targetId === "__html_full_page__" ? "full-page" : targetId;
                sendResponse({ success: true, spec, targetId: outputName });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
            return true;
        }
    });

    // Helper fallback if page context bridge is sandboxed
    function extractInlineSpec({ inElement }) {
        const localElement = inElement;
        if (!localElement || localElement.nodeType !== 1) return null;
        const spec = { tagName: localElement.tagName.toLowerCase() };

        if (localElement.attributes && localElement.attributes.length > 0) {
            const attrs = {};
            for (const a of localElement.attributes) {
                if (!a.name.startsWith("data-gr-") && (a.name !== "id" || a.value !== "GOOGLE_INPUT_CHEXT_FLAG")) {
                    attrs[a.name] = a.value;
                }
            }
            if (Object.keys(attrs).length > 0) spec.attributes = attrs;
        }

        const childElements = Array.from(localElement.children || []);
        if (childElements.length > 0) {
            const children = childElements.map(child => extractInlineSpec({ inElement: child })).filter(Boolean);
            if (children.length > 0) spec.children = children;
        } else {
            const text = localElement.textContent?.trim();
            if (text) spec.textContent = text;
        }
        return spec;
    }
})();
