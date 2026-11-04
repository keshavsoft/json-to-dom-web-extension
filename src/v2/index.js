import domToSpec from "./domToSpec/index.js";
import registerGlobal from "./registerGlobal.js";

export const tagToJson = (inArgs = {}) => {
    const localArgs = inArgs;
    // Allow either tagToJson({ inElement }) or direct node tagToJson(element)
    const localElement = localArgs?.inElement ?? (localArgs instanceof Node || typeof localArgs === "string" ? localArgs : undefined);
    const localConfig = localArgs?.inConfig ?? {};

    return domToSpec({
        inElement: localElement,
        inConfig: localConfig
    });
};

registerGlobal({ inFuncDefinition: tagToJson });

export { domToSpec };
export default tagToJson;
