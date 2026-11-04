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
    console.log("✅ tag-to-json v5 extension injected (window.tagToJson ready)");

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
                const spec = domToSpec({ inElement: element });
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

                const spec = domToSpec({ inElement: element });
                const outputName = targetId === "__html_full_page__" ? "full-page" : targetId;
                sendResponse({ success: true, spec, targetId: outputName });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
            return true;
        }
    });

    // W3C DOM Level 4 Standard: https://dom.spec.whatwg.org/#dom-node-nodetype
    const ELEMENT_NODE = typeof Node !== "undefined" ? Node.ELEMENT_NODE : 1;
    const TEXT_NODE = typeof Node !== "undefined" ? Node.TEXT_NODE : 3;

    // Native domToSpec (v5) with full mixed-content and childNodes support
    function extractAttributes({ inElement } = {}) {
        const localElement = inElement;
        if (!localElement || !localElement.attributes || localElement.attributes.length === 0) {
            return undefined;
        }
        const localAttributes = {};
        for (const attr of localElement.attributes) {
            if (
                attr.name.startsWith("data-gr-") ||
                attr.name.startsWith("data-gramm") ||
                (attr.name === "id" && attr.value === "GOOGLE_INPUT_CHEXT_FLAG")
            ) {
                continue;
            }
            localAttributes[attr.name] = attr.value;
        }
        return Object.keys(localAttributes).length > 0 ? localAttributes : undefined;
    }

    function domToSpec({ inElement, inConfig = {} } = {}) {
        const localElement = inElement;
        const localConfig = inConfig;

        if (!localElement || localElement.nodeType !== ELEMENT_NODE) return null;

        const tagName = localElement.tagName.toLowerCase();
        if (!localConfig.includeScripts && tagName === "script") return null;
        if (!localConfig.includeStyles && tagName === "style") return null;
        if (tagName === "noscript") return null;

        if (!localConfig.includeExtensionElements) {
            if (localElement.id === "GOOGLE_INPUT_CHEXT_FLAG") return null;
            if (localElement.getAttribute?.("style")?.includes("position: fixed") && localElement.children.length === 0 && !localElement.textContent?.trim()) {
                return null;
            }
        }

        const localSpec = { tagName };

        const localAttributes = extractAttributes({ inElement: localElement });
        if (localAttributes) {
            localSpec.attributes = localAttributes;
        }

        const childElements = Array.from(localElement.children || []);
        if (childElements.length === 0) {
            const text = localElement.textContent?.trim();
            if (text && text.length > 0) {
                localSpec.textContent = text;
            }
        } else {
            const parsedChildren = [];
            const childNodes = Array.from(localElement.childNodes || []);

            for (const childNode of childNodes) {
                if (childNode.nodeType === ELEMENT_NODE) {
                    const childSpec = domToSpec({ inElement: childNode, inConfig: localConfig });
                    if (childSpec) parsedChildren.push(childSpec);
                } else if (childNode.nodeType === TEXT_NODE) {
                    const text = childNode.textContent?.trim();
                    if (text && text.length > 0) {
                        parsedChildren.push(text);
                    }
                }
            }

            if (parsedChildren.length > 0) {
                localSpec.children = parsedChildren;
            }
        }

        return localSpec;
    }
})();
