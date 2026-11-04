(() => {
    const inject = (file) => {
        const script = document.createElement("script");
        script.src = (typeof browser !== "undefined" ? browser : chrome).runtime.getURL(file);
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
    };

    // Inject tagToJson onto the page's window object
    inject("src/tagToJson.min.js");

    console.log("✅ tag-to-json v2 extension injected (window.tagToJson ready)");
})();
