(() => {
    console.log("✅ json-to-dom extension content script loaded on active page");

    // Optional: Inject standalone jsonToDom script if web accessible
    const inject = ({ inFile }) => {
        const localFile = inFile;
        try {
            const script = document.createElement("script");
            script.type = "module";
            script.src = (typeof browser !== "undefined" ? browser : chrome).runtime.getURL(localFile);
            script.onload = () => script.remove();
            (document.head || document.documentElement).appendChild(script);
        } catch (err) {
            console.warn("[json-to-dom] Script injection skipped:", err);
        }
    };

    inject({ inFile: "src/jsonToDom.min.js" });

    // Listen for messages from popup
    const runtime = typeof browser !== "undefined" ? browser.runtime : chrome.runtime;
    runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "PING") {
            sendResponse({ success: true, message: "PONG from json-to-dom content script" });
            return true;
        }
    });
})();
