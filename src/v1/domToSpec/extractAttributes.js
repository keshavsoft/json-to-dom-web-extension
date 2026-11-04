/**
 * extractAttributes (v2) - Extracts DOM element attributes into a clean dictionary.
 * Follows the parameter convention: single config object with 'in'-prefix and 'local'-prefixed internal variables.
 *
 * @param {Object} inArgs
 * @param {HTMLElement} inArgs.inElement - Target DOM element
 * @returns {Object|undefined} Key-value attributes map, or undefined if empty
 */
const extractAttributes = ({ inElement } = {}) => {
    const localElement = inElement;

    if (!localElement || !localElement.attributes || localElement.attributes.length === 0) {
        return undefined;
    }

    const localAttributes = {};
    for (const attr of localElement.attributes) {
        // Exclude browser extension internal attributes
        if (
            attr.name.startsWith("data-gr-") ||
            attr.name.startsWith("data-gramm") ||
            attr.name === "id" && attr.value === "GOOGLE_INPUT_CHEXT_FLAG"
        ) {
            continue;
        }
        localAttributes[attr.name] = attr.value;
    }

    return Object.keys(localAttributes).length > 0 ? localAttributes : undefined;
};

export { extractAttributes };
export default extractAttributes;
