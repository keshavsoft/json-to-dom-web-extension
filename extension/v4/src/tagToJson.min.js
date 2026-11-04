const E = ({ inElement: o } = {}) => {
  const t = o;
  if (!t || !t.attributes || t.attributes.length === 0)
    return;
  const e = {};
  for (const n of t.attributes)
    n.name.startsWith("data-gr-") || n.name.startsWith("data-gramm") || n.name === "id" && n.value === "GOOGLE_INPUT_CHEXT_FLAG" || (e[n.name] = n.value);
  return Object.keys(e).length > 0 ? e : void 0;
}, T = ({ inElement: o } = {}) => {
  var n;
  const t = o;
  if (!t) return;
  const e = (n = t.textContent) == null ? void 0 : n.trim();
  if (!(!e || e.length === 0))
    return e;
}, p = ({ inElement: o, inConfig: t = {} } = {}) => {
  var f, d, m, h;
  const e = o, n = t;
  if (!e) return null;
  const i = typeof e == "string" && typeof document < "u" ? document.getElementById(e) : e;
  if (!i || i.nodeType !== 1)
    return null;
  const r = i.tagName.toLowerCase();
  if (!n.includeScripts && r === "script" || !n.includeStyles && r === "style" || r === "noscript" || !n.includeExtensionElements && (i.id === "GOOGLE_INPUT_CHEXT_FLAG" || (d = (f = i.getAttribute) == null ? void 0 : f.call(i, "style")) != null && d.includes("position: fixed") && i.children.length === 0 && !((m = i.textContent) != null && m.trim())))
    return null;
  const c = {
    tagName: r
  }, a = E({ inElement: i });
  if (a && (c.attributes = a), Array.from(i.children || []).length === 0) {
    const l = T({ inElement: i });
    l && (c.textContent = l);
  } else {
    const l = [], g = Array.from(i.childNodes || []);
    for (const u of g)
      if (u.nodeType === 1) {
        const s = p({ inElement: u, inConfig: n });
        s && l.push(s);
      } else if (u.nodeType === 3) {
        const s = (h = u.textContent) == null ? void 0 : h.trim();
        s && s.length > 0 && l.push(s);
      }
    l.length > 0 && (c.children = l);
  }
  return c;
}, x = {
  version: "v4",
  description: "DOM-to-JSON extractor with mixed-content support and native DOM traversal"
}, y = (o) => {
  const t = o, e = typeof t == "function" ? t : t == null ? void 0 : t.inFuncDefinition;
  if (typeof globalThis > "u" || !e) return;
  const n = {
    meta: x,
    domToSpec: e
  };
  globalThis.ks ?? (globalThis.ks = {}), globalThis.ks.tagToJson = n;
}, b = (o = {}) => {
  const t = o, e = (t == null ? void 0 : t.inElement) ?? (t instanceof Node || typeof t == "string" ? t : void 0), n = (t == null ? void 0 : t.inConfig) ?? {};
  return p({
    inElement: e,
    inConfig: n
  });
};
y({ inFuncDefinition: b });
export {
  b as default,
  p as domToSpec,
  b as tagToJson
};
