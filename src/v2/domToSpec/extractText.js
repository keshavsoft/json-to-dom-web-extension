/**
 * extractText (v2) - Extracts trimmed text content for leaf elements.
 *
 * @param {Object} inArgs
 * @param {HTMLElement} inArgs.inElement - Target DOM element
 * @returns {string|undefined} Trimmed text content, or undefined if empty
 */
const extractText = ({ inElement } = {}) => {
    const localElement = inElement;

    if (!localElement) return undefined;

    const text = localElement.textContent?.trim();
    if (!text || text.length === 0) return undefined;

    return text;
};

export { extractText };
export default extractText;
