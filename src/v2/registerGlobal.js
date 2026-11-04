import meta from "./meta.js";
/**
 * registerGlobal (v5) - Registers the public API onto globalThis in browser / extension environments.
 * Follows the parameter convention: single config object with 'in'-prefix and 'local'-prefixed internal variables.
 */
export const registerGlobal = (inArgs) => {
    const localArgs = inArgs;
    const localFuncDefinition = typeof localArgs === "function" ? localArgs : localArgs?.inFuncDefinition;

    if (typeof globalThis === "undefined" || !localFuncDefinition) return;

    const api = {
        meta,
        domToSpec: localFuncDefinition
    };

    globalThis.ks ??= {};
    globalThis.ks.tagToJson = api;
};

export default registerGlobal;