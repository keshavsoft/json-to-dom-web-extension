# tag-to-json (v5)

## Overview
`tag-to-json` v5 is a zero-dependency, high-performance DOM-to-JSON specification extractor built according to official W3C DOM Level 4 standards.

## The Story-First Architecture
Rather than mechanical fragmentation, `v5` structures code into clear chapters:
- **`domToSpec/index.js`**: Orchestrates the 5-chapter serialization pipeline.
- **`domToSpec/extractAttributes.js`**: Extracts clean attribute dictionaries while filtering browser extension artifacts.
- **`domToSpec/extractText.js`**: Handles leaf text extraction.
- **`meta.js`**: Version and metadata descriptor.
- **`registerGlobal.js`**: Safe browser global registration (`window.ks.tagToJson`).

## Standards & References
- **W3C/WHATWG DOM Standard**: [https://dom.spec.whatwg.org/#dom-node-nodetype](https://dom.spec.whatwg.org/#dom-node-nodetype)
- **MDN Web Docs**: [https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)

## Usage

```javascript
import { domToSpec } from "@keshavsoft/tag-to-json/v5";

// Extract any DOM element or document
const element = document.querySelector(".navbar");
const spec = domToSpec({ inElement: element });
console.log(spec);
```
