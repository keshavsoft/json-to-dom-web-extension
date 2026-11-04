import extractAttributes from "./extractAttributes.js";
import extractText from "./extractText.js";

/**
 * W3C DOM Level 4 Standard - Node.nodeType specification:
 * https://dom.spec.whatwg.org/#dom-node-nodetype
 * MDN Reference: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 *
 * Node.ELEMENT_NODE (1): Represents an Element tag (e.g. <div>, <a>, <svg>, <button>).
 * Node.TEXT_NODE    (3): Represents the actual textual content between or inside tags.
 */
const ELEMENT_NODE = typeof Node !== "undefined" ? Node.ELEMENT_NODE : 1;
const TEXT_NODE = typeof Node !== "undefined" ? Node.TEXT_NODE : 3;

/**
 * domToSpec (v5) - The Story-Delivered Native DOM to json-to-tag Specification Extractor.
 *
 * Narrative Flow:
 * - Chapter 1: Target Resolution & Type Guard
 * - Chapter 2: Clean Gatekeeping & Noise Filtration
 * - Chapter 3: Attribute Dictionary Serialization
 * - Chapter 4: The Fork in the Road — Leaf Text vs. Mixed Container Nodes
 * - Chapter 5: The W3C Tree Walker (Ordered childNodes traversal preserving mixed elements & text)
 *
 * @param {Object} inArgs
 * @param {HTMLElement|string} inArgs.inElement - Target DOM element or string element ID
 * @param {Object} [inArgs.inConfig] - Extraction settings
 * @param {boolean} [inArgs.inConfig.includeScripts=false] - Whether to capture <script> tags
 * @param {boolean} [inArgs.inConfig.includeStyles=false] - Whether to capture <style> tags
 * @param {boolean} [inArgs.inConfig.includeExtensionElements=false] - Whether to capture third-party extension tags
 * @returns {Object|null} json-to-tag compliant specification object
 */
const domToSpec = ({ inElement, inConfig = {} } = {}) => {
    const localElement = inElement;
    const localConfig = inConfig;

    if (!localElement) return null;

    // -------------------------------------------------------------------------
    // Chapter 1: Target Resolution & Type Guard
    // -------------------------------------------------------------------------
    // Resolve string element ID in a browser environment
    const resolvedElement = (typeof localElement === "string" && typeof document !== "undefined")
        ? document.getElementById(localElement)
        : localElement;

    // Guard: Only process true W3C Element nodes (nodeType === Node.ELEMENT_NODE)
    if (!resolvedElement || resolvedElement.nodeType !== ELEMENT_NODE) {
        return null;
    }

    const tagName = resolvedElement.tagName.toLowerCase();

    // -------------------------------------------------------------------------
    // Chapter 2: Clean Gatekeeping & Noise Filtration
    // -------------------------------------------------------------------------
    // 1. Filter system & non-visual tags
    if (!localConfig.includeScripts && tagName === "script") return null;
    if (!localConfig.includeStyles && tagName === "style") return null;
    if (tagName === "noscript") return null;

    // 2. Filter injected extension containers unless explicitly requested
    if (!localConfig.includeExtensionElements) {
        if (resolvedElement.id === "GOOGLE_INPUT_CHEXT_FLAG") return null;
        if (resolvedElement.getAttribute?.("style")?.includes("position: fixed") && resolvedElement.children.length === 0 && !resolvedElement.textContent?.trim()) {
            return null;
        }
    }

    const localSpec = {
        tagName
    };

    // -------------------------------------------------------------------------
    // Chapter 3: Attribute Dictionary Serialization
    // -------------------------------------------------------------------------
    const localAttributes = extractAttributes({ inElement: resolvedElement });
    if (localAttributes) {
        localSpec.attributes = localAttributes;
    }

    // -------------------------------------------------------------------------
    // Chapter 4: The Fork in the Road — Leaf Text vs. Mixed Container Nodes
    // -------------------------------------------------------------------------
    // In the DOM, an element may be:
    // A) A Leaf Element: Has zero child element tags (e.g. <h1>Dashboard</h1>).
    //    We extract its clean, trimmed text content directly into `textContent`.
    // B) A Container Element: Has one or more child element tags (e.g. <a class="nav-link"><svg></svg> Orders</a>).
    //    We MUST preserve the exact document order of child tags and sibling text strings.
    const childElements = Array.from(resolvedElement.children || []);

    if (childElements.length === 0) {
        // Path A: Pure Leaf Element
        const localText = extractText({ inElement: resolvedElement });
        if (localText) {
            localSpec.textContent = localText;
        }
    } else {
        // ---------------------------------------------------------------------
        // Chapter 5: The W3C Tree Walker (childNodes Mixed-Content Preservation)
        // ---------------------------------------------------------------------
        // We traverse `childNodes` instead of `children` to capture both elements and text nodes.
        // See W3C DOM spec: https://dom.spec.whatwg.org/#dom-node-childnodes
        const parsedChildren = [];
        const childNodes = Array.from(resolvedElement.childNodes || []);

        for (const childNode of childNodes) {
            if (childNode.nodeType === ELEMENT_NODE) {
                // W3C Element Node (1): Recursively extract child specification tree
                const childSpec = domToSpec({ inElement: childNode, inConfig: localConfig });
                if (childSpec) {
                    parsedChildren.push(childSpec);
                }
            } else if (childNode.nodeType === TEXT_NODE) {
                // W3C Text Node (3): Extract trimmed string (preserves mixed-content sibling order)
                const text = childNode.textContent?.trim();
                if (text && text.length > 0) {
                    parsedChildren.push(text);
                }
            }
            // Other node types (e.g. Node.COMMENT_NODE === 8) are gracefully ignored.
        }

        if (parsedChildren.length > 0) {
            localSpec.children = parsedChildren;
        }
    }

    return localSpec;
};

export { domToSpec };
export default domToSpec;
