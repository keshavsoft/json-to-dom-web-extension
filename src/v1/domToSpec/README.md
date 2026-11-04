# domToSpec Engine (v5)

## The Story of Native DOM to JSON Serialization

The `domToSpec` engine transforms any native browser DOM tree into a declarative, lightweight JSON specification tree compatible with `json-to-tag`.

Instead of treating DOM serialization as a flat recursion, the v5 engine models the process as a cohesive narrative across 5 distinct chapters:

```mermaid
flowchart TD
    DOMInput(["DOM Node Input"]) --> Ch1["Chapter 1: Target Resolution & Type Guard<br/><i>Resolve string IDs; verify Node.ELEMENT_NODE</i>"]
    Ch1 --> Ch2["Chapter 2: Clean Gatekeeping<br/><i>Filter &lt;script&gt;, &lt;style&gt;, &lt;noscript&gt;, extension noise</i>"]
    Ch2 --> Ch3["Chapter 3: Attribute Dictionary Serialization<br/><i>Map native attributes (class, href, etc.)</i>"]
    Ch3 --> Ch4{"Chapter 4: The Fork in the Road"}
    
    Ch4 -- "Zero Child Tags" --> PathA["Path A: Leaf Extraction<br/><i>Extract clean textContent</i>"]
    Ch4 -- "Has Child Tags" --> Ch5["Chapter 5: The W3C Tree Walker<br/><i>Traverse childNodes in exact document order</i>"]
    
    Ch5 --> N1["Node.ELEMENT_NODE (1)<br/><i>Recursive domToSpec</i>"]
    Ch5 --> N2["Node.TEXT_NODE (3)<br/><i>Sibling text string</i>"]
    Ch5 --> N3["Node.COMMENT_NODE (8)<br/><i>Gracefully skipped</i>"]
    
    N1 --> Spec(["Declarative JSON Tree"])
    N2 --> Spec
    PathA --> Spec

    classDef proc fill:#f0f7ff,stroke:#0d6efd,stroke-width:2px,color:#0b3c7b;
    classDef out fill:#e8f9ee,stroke:#198754,stroke-width:2px,color:#0a522a;
    classDef nodes fill:#fff8e6,stroke:#ffc107,stroke-width:1px,color:#664d03;
    class Ch1,Ch2,Ch3,Ch4,Ch5,PathA proc;
    class Spec out;
    class N1,N2,N3 nodes;
```

```
DOM Node Input
      │
      ▼
┌──────────────────────────────────────────────┐
│ Chapter 1: Target Resolution & Type Guard    │ ➔ Resolve string IDs; verify Node.ELEMENT_NODE
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Chapter 2: Clean Gatekeeping                 │ ➔ Filter <script>, <style>, <noscript>, extension noise
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Chapter 3: Attribute Dictionary Serialization│ ➔ Map native attributes (class, href, etc.)
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Chapter 4: The Fork in the Road              │
└──────────────┬────────────────┬──────────────┘
               │                │
       Zero Child Tags    Has Child Tags
               │                │
               ▼                ▼
     ┌──────────────────┐  ┌────────────────────────────────────────────────────────┐
     │ Path A: Leaf     │  │ Chapter 5: The W3C Tree Walker                         │
     │ Extract clean    │  │ Traverse childNodes in exact document order:            │
     │ `textContent`    │  │ • Node.ELEMENT_NODE (1) ➔ Recursive domToSpec           │
     └──────────────────┘  │ • Node.TEXT_NODE    (3) ➔ Sibling text string           │
                           │ • Node.COMMENT_NODE (8) ➔ Gracefully skipped            │
                           └────────────────────────────────────────────────────────┘
```

---

## W3C Standard Grounding

- **W3C/WHATWG DOM Level 4 Standard**: [https://dom.spec.whatwg.org/#dom-node-nodetype](https://dom.spec.whatwg.org/#dom-node-nodetype)
- **MDN Web Docs**: [https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)

### Node Types Utilized:
- `Node.ELEMENT_NODE === 1`: Identifies HTML and SVG element tags.
- `Node.TEXT_NODE === 3`: Identifies textual strings that live alongside element tags.

---

## Why `childNodes` is Required for Mixed Content

Modern UI frameworks like Bootstrap 5 frequently place SVG icons and text directly inside clickable links:
```html
<a class="nav-link d-flex align-items-center gap-2" href="#">
    <svg class="bi" aria-hidden="true"><use xlink:href="#cart"></use></svg>
    Products
</a>
```
Using `element.children` drops the text node `"Products"`.
Using `element.childNodes` with `nodeType` checks produces the exact mixed array:
```json
{
  "tagName": "a",
  "attributes": {
    "class": "nav-link d-flex align-items-center gap-2",
    "href": "#"
  },
  "children": [
    {
      "tagName": "svg",
      "attributes": {
        "class": "bi",
        "aria-hidden": "true"
      },
      "children": [
        {
          "tagName": "use",
          "attributes": {
            "xlink:href": "#cart"
          }
        }
      ]
    },
    "Products"
  ]
}
```
This specification round-trips 100% faithfully into `json-to-tag`.
