const g = ({ inElement: o } = {}) => {
  const t = o;
  if (!t || !t.attributes || t.attributes.length === 0)
    return;
  const n = {};
  for (const e of t.attributes)
    e.name.startsWith("data-gr-") || e.name.startsWith("data-gramm") || e.name === "id" && e.value === "GOOGLE_INPUT_CHEXT_FLAG" || (n[e.name] = e.value);
  return Object.keys(n).length > 0 ? n : void 0;
}, y = ({ inElement: o } = {}) => {
  var e;
  const t = o;
  if (!t) return;
  const n = (e = t.textContent) == null ? void 0 : e.trim();
  if (!(!n || n.length === 0))
    return n;
}, p = typeof Node < "u" ? Node.ELEMENT_NODE : 1, N = typeof Node < "u" ? Node.TEXT_NODE : 3, h = ({ inElement: o, inConfig: t = {} } = {}) => {
  var f, a, m, E;
  const n = o, e = t;
  if (!n) return null;
  const i = typeof n == "string" && typeof document < "u" ? document.getElementById(n) : n;
  if (!i || i.nodeType !== p)
    return null;
  const c = i.tagName.toLowerCase();
  if (!e.includeScripts && c === "script" || !e.includeStyles && c === "style" || c === "noscript" || !e.includeExtensionElements && (i.id === "GOOGLE_INPUT_CHEXT_FLAG" || (a = (f = i.getAttribute) == null ? void 0 : f.call(i, "style")) != null && a.includes("position: fixed") && i.children.length === 0 && !((m = i.textContent) != null && m.trim())))
    return null;
  const r = {
    tagName: c
  }, u = g({ inElement: i });
  if (u && (r.attributes = u), Array.from(i.children || []).length === 0) {
    const l = y({ inElement: i });
    l && (r.textContent = l);
  } else {
    const l = [], T = Array.from(i.childNodes || []);
    for (const d of T)
      if (d.nodeType === p) {
        const s = h({ inElement: d, inConfig: e });
        s && l.push(s);
      } else if (d.nodeType === N) {
        const s = (E = d.textContent) == null ? void 0 : E.trim();
        s && s.length > 0 && l.push(s);
      }
    l.length > 0 && (r.children = l);
  }
  return r;
}, x = {
  version: "v5",
  description: "Story-delivered DOM-to-JSON extractor with W3C nodeType standard mixed-content support"
}, C = (o) => {
  const t = o, n = typeof t == "function" ? t : t == null ? void 0 : t.inFuncDefinition;
  if (typeof globalThis > "u" || !n) return;
  const e = {
    meta: x,
    domToSpec: n
  };
  globalThis.ks ?? (globalThis.ks = {}), globalThis.ks.tagToJson = e;
}, b = (o = {}) => {
  const t = o, n = (t == null ? void 0 : t.inElement) ?? (t instanceof Node || typeof t == "string" ? t : void 0), e = (t == null ? void 0 : t.inConfig) ?? {};
  return h({
    inElement: n,
    inConfig: e
  });
};
C({ inFuncDefinition: b });
export {
  b as default,
  h as domToSpec,
  b as tagToJson
};
