const T = ({ inElement: i } = {}) => {
  const t = i;
  if (!t || !t.attributes || t.attributes.length === 0)
    return;
  const n = {};
  for (const e of t.attributes)
    e.name.startsWith("data-gr-") || e.name.startsWith("data-gramm") || e.name === "id" && e.value === "GOOGLE_INPUT_CHEXT_FLAG" || (n[e.name] = e.value);
  return Object.keys(n).length > 0 ? n : void 0;
}, h = ({ inElement: i } = {}) => {
  var e;
  const t = i;
  if (!t) return;
  const n = (e = t.textContent) == null ? void 0 : e.trim();
  if (!(!n || n.length === 0))
    return n;
}, m = ({ inElement: i, inConfig: t = {} } = {}) => {
  var u, f, d;
  const n = i, e = t;
  if (!n) return null;
  const o = typeof n == "string" && typeof document < "u" ? document.getElementById(n) : n;
  if (!o || o.nodeType !== 1)
    return null;
  const s = o.tagName.toLowerCase();
  if (!e.includeScripts && s === "script" || !e.includeStyles && s === "style" || s === "noscript" || !e.includeExtensionElements && (o.id === "GOOGLE_INPUT_CHEXT_FLAG" || (f = (u = o.getAttribute) == null ? void 0 : u.call(o, "style")) != null && f.includes("position: fixed") && o.children.length === 0 && !((d = o.textContent) != null && d.trim())))
    return null;
  const r = {
    tagName: s
  }, c = T({ inElement: o });
  c && (r.attributes = c);
  const a = Array.from(o.children || []);
  if (a.length > 0) {
    const l = a.map((g) => m({ inElement: g, inConfig: e })).filter(Boolean);
    l.length > 0 && (r.children = l);
  } else {
    const l = h({ inElement: o });
    l && (r.textContent = l);
  }
  return r;
}, p = (i) => {
  const t = i, n = typeof t == "function" ? t : t == null ? void 0 : t.inFuncDefinition;
  typeof globalThis > "u" || !n || (globalThis.ks ?? (globalThis.ks = {}), globalThis.ks["tag-to-json"] = {
    domToSpec: n,
    tagToJson: n
  }, globalThis.ks.tagToJson = {
    domToSpec: n,
    tagToJson: n
  }, globalThis.domToSpec = n, globalThis.tagToJson = n);
}, b = (i = {}) => {
  const t = i, n = (t == null ? void 0 : t.inElement) ?? (t instanceof Node || typeof t == "string" ? t : void 0), e = (t == null ? void 0 : t.inConfig) ?? {};
  return m({
    inElement: n,
    inConfig: e
  });
};
p({ inFuncDefinition: b });
export {
  b as default,
  m as domToSpec,
  b as tagToJson
};
