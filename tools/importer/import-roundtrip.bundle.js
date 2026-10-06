/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-roundtrip.js
  var import_roundtrip_exports = {};
  __export(import_roundtrip_exports, {
    default: () => import_roundtrip_default
  });
  function toBlockName(className) {
    const [name, ...variants] = className.trim().split(/\s+/);
    return variants.length ? `${name} (${variants.join(", ")})` : name;
  }
  var BLOCK_LEVEL = /^(P|UL|OL|DIV|H[1-6]|HR|PICTURE|TABLE|BLOCKQUOTE|PRE)$/;
  function cellContent(document, cell) {
    const nodes = [...cell.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
    if (nodes.some((n) => n.nodeType === 1 && BLOCK_LEVEL.test(n.tagName))) return nodes;
    if (!nodes.length) return "";
    const p = document.createElement("p");
    p.append(...nodes);
    return [p];
  }
  var HR_PLACEHOLDER = "[[hr]]";
  function restoreRules(document, root) {
    root.querySelectorAll("p").forEach((p) => {
      if (p.textContent.trim() === HR_PLACEHOLDER) p.replaceWith(document.createElement("hr"));
    });
  }
  function rebuildBlock(document, blockEl) {
    restoreRules(document, blockEl);
    const cells = [...blockEl.children].map((row) => [...row.children].map((cell) => cellContent(document, cell)));
    const table = WebImporter.Blocks.createBlock(document, {
      name: toBlockName(blockEl.className),
      cells
    });
    blockEl.replaceWith(table);
  }
  var import_roundtrip_default = {
    transform: (payload) => {
      const { document, params } = payload;
      const root = document.querySelector("main") || document.body;
      const main = document.createElement("div");
      const sections = [...root.children].filter((el) => el.tagName === "DIV");
      sections.forEach((section, i) => {
        [...section.querySelectorAll(":scope > div[class]")].forEach((b) => rebuildBlock(document, b));
        if (i > 0) main.append(document.createElement("hr"));
        main.append(...section.childNodes);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: "roundtrip" }
      }];
    }
  };
  return __toCommonJS(import_roundtrip_exports);
})();
