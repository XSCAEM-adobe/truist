/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
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

  // tools/importer/import-footer.js
  var import_footer_exports = {};
  __export(import_footer_exports, {
    default: () => import_footer_default
  });
  var SOURCE_HOSTS = ["www.truist.com", "truist.com"];
  var ONETRUST_FALLBACK = "https://cdn.cookielaw.org/consent/a36cbfdc-000f-45ef-92ae-779176195d77/otSDKStub.js";
  var LOCAL_IMAGES = {
    "truist-logo.svg": "truist-logo.svg",
    "equal-housing-opportunity.webp": "equal-housing-opportunity.webp",
    "x-solid.svg": "x-solid.svg",
    "linkedin-solid-white.svg": "linkedin-solid-white.svg",
    "facebook-solid-white.svg": "facebook-solid-white.svg",
    "youtube-solid-white.svg": "youtube-solid-white.svg",
    "instagram-white.svg": "instagram-white.svg"
  };
  var LOCAL_IMAGES_BY_ALT = {
    truist: "truist-logo.svg",
    x: "x-solid.svg",
    linkedin: "linkedin-solid-white.svg",
    facebook: "facebook-solid-white.svg",
    youtube: "youtube-solid-white.svg",
    instagram: "instagram-white.svg"
  };
  function cleanText(text) {
    return (text || "").replace(/[\s ]+/g, " ").trim();
  }
  function visibleText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".sr-only, .footer-icon").forEach((n) => n.remove());
    return cleanText(clone.textContent);
  }
  function normalizeHref(href) {
    if (!href) return href;
    const raw = href.trim();
    if (/^(tel:|mailto:|#)/i.test(raw)) return raw;
    let url;
    try {
      url = new URL(raw, "https://www.truist.com/");
    } catch (e) {
      return raw;
    }
    if (!SOURCE_HOSTS.includes(url.hostname)) return /^https?:\/\//i.test(raw) ? raw : url.href;
    return `${url.pathname}${url.search}${url.hash}`;
  }
  function localImageSrc(img) {
    const src = (img.getAttribute("src") || "").split("?")[0];
    const base = src.split("/").pop();
    if (LOCAL_IMAGES[base]) return `images/${LOCAL_IMAGES[base]}`;
    const alt = cleanText(img.getAttribute("alt")).toLowerCase();
    if (LOCAL_IMAGES_BY_ALT[alt]) return `images/${LOCAL_IMAGES_BY_ALT[alt]}`;
    return null;
  }
  function copyInline(doc, from, to) {
    [...from.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        to.append(doc.createTextNode(node.textContent.replace(/[\s ]+/g, " ")));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (node.classList.contains("sr-only")) return;
      if (tag === "a") {
        if (!node.getAttribute("href")) {
          copyInline(doc, node, to);
          return;
        }
        const a = doc.createElement("a");
        a.setAttribute("href", normalizeHref(node.getAttribute("href")));
        copyInline(doc, node, a);
        to.append(a);
      } else if (tag === "img") {
        const local = localImageSrc(node);
        if (!local) return;
        const img = doc.createElement("img");
        img.setAttribute("src", local);
        img.setAttribute("alt", node.getAttribute("alt") || "");
        to.append(img);
      } else if (["strong", "b", "em", "i", "sup", "sub"].includes(tag)) {
        const map = { b: "strong", i: "em" };
        const el = doc.createElement(map[tag] || tag);
        copyInline(doc, node, el);
        to.append(el);
      } else if (tag === "br") {
        to.append(doc.createElement("br"));
      } else {
        copyInline(doc, node, to);
      }
    });
  }
  function trimInline(el) {
    const first = el.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = el.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return el;
  }
  function makeEl(doc, tag, source) {
    const el = doc.createElement(tag);
    copyInline(doc, source, el);
    return trimInline(el);
  }
  function makeList(doc, ul) {
    const list = doc.createElement("ul");
    ul.querySelectorAll(":scope > li").forEach((li) => {
      const item = makeEl(doc, "li", li);
      if (item.textContent.trim() || item.querySelector("img")) list.append(item);
    });
    return list;
  }
  function buildDisclosures(doc, footer) {
    const section = doc.createElement("div");
    const container = footer.querySelector("#footer-section-disclosure-container") || footer;
    const groups = [...container.querySelectorAll(".htmlcontainer")].filter((g) => !g.closest("#footer-local-disclosure-top, #footer-local-disclosure-bottom")).filter((g) => cleanText(g.textContent));
    const walk = (parent) => {
      [...parent.children].forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (el.classList.contains("footer-heading-inline-group")) {
          const h = el.querySelector("h3, h4");
          const p = el.querySelector("p");
          const out = doc.createElement("p");
          if (h) {
            const strong = doc.createElement("strong");
            strong.textContent = cleanText(h.textContent);
            out.append(strong, doc.createTextNode(" "));
          }
          if (p) copyInline(doc, p, out);
          section.append(trimInline(out));
        } else if (/^h[1-6]$/.test(tag)) {
          const level = tag === "h2" ? "h2" : "h3";
          section.append(makeEl(doc, level, el));
        } else if (tag === "p") {
          const p = makeEl(doc, "p", el);
          if (p.textContent.trim() || p.querySelector("img")) section.append(p);
        } else if (tag === "ul" || tag === "ol") {
          section.append(makeList(doc, el));
        } else if (tag === "div") {
          walk(el);
        }
      });
    };
    groups.forEach(walk);
    if (!section.querySelector("h2")) {
      const h2 = doc.createElement("h2");
      h2.textContent = "Disclosures";
      section.prepend(h2);
    }
    return section;
  }
  function buildBrand(doc, footer) {
    const section = doc.createElement("div");
    const logoWrap = footer.querySelector(".footer-nav-item--logo");
    const logoImg = logoWrap && logoWrap.querySelector("img.footer__logo, img");
    if (logoImg) {
      const p = doc.createElement("p");
      const a = doc.createElement("a");
      const link = logoWrap.querySelector("a");
      a.setAttribute("href", normalizeHref(link ? link.getAttribute("href") : "/"));
      const img = doc.createElement("img");
      img.setAttribute("src", localImageSrc(logoImg) || "images/truist-logo.svg");
      img.setAttribute("alt", cleanText(logoImg.getAttribute("alt")) || "Truist");
      a.append(img);
      p.append(a);
      section.append(p);
    }
    const policies = footer.querySelector("ul.footer-nav--disclosures");
    if (policies) section.append(makeList(doc, policies));
    return section;
  }
  function buildColumns(doc, footer, consentUrl) {
    const section = doc.createElement("div");
    footer.querySelectorAll(".footer__links-container .footer__details__header").forEach((col) => {
      const title = col.querySelector(".accordion__title");
      const h3 = doc.createElement("h3");
      h3.textContent = title ? visibleText(title) : "";
      section.append(h3);
      const ul = doc.createElement("ul");
      col.querySelectorAll(".accordion__content ul > li").forEach((li) => {
        const a = li.querySelector("a[href]");
        const button = li.querySelector("button");
        const item = doc.createElement("li");
        const link = doc.createElement("a");
        if (a) {
          link.setAttribute("href", normalizeHref(a.getAttribute("href")));
          link.textContent = visibleText(a);
        } else if (button) {
          link.setAttribute("href", consentUrl);
          link.textContent = visibleText(button);
        } else {
          return;
        }
        item.append(link);
        ul.append(item);
      });
      section.append(ul);
    });
    return section;
  }
  function buildSocial(doc, footer) {
    const section = doc.createElement("div");
    const ul = doc.createElement("ul");
    footer.querySelectorAll("ul.footer-nav--social > li").forEach((li) => {
      const a = li.querySelector("a[href]");
      const srcImg = li.querySelector("img");
      if (!a || !srcImg) return;
      const local = localImageSrc(srcImg);
      if (!local) return;
      const item = doc.createElement("li");
      const link = doc.createElement("a");
      link.setAttribute("href", normalizeHref(a.getAttribute("href")));
      const img = doc.createElement("img");
      img.setAttribute("src", local);
      img.setAttribute("alt", cleanText(srcImg.getAttribute("alt")));
      link.append(img);
      item.append(link);
      ul.append(item);
    });
    section.append(ul);
    return section;
  }
  function buildCopyright(doc, footer) {
    const section = doc.createElement("div");
    const legal = footer.querySelector(".footer__legal");
    if (legal) {
      const p = doc.createElement("p");
      p.textContent = cleanText(legal.textContent).replace(/\s+,/g, ",");
      section.append(p);
    }
    return section;
  }
  function findConsentUrl(document) {
    const stub = document.querySelector('script[src*="cdn.cookielaw.org/consent/"][src$="otSDKStub.js"]');
    return stub ? stub.getAttribute("src") : ONETRUST_FALLBACK;
  }
  var import_footer_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const footer = document.querySelector("footer.global-footer") || document.querySelector("footer");
      if (!footer) throw new Error("footer.global-footer not found on source page");
      const consentUrl = findConsentUrl(document);
      const sections = [
        buildDisclosures(document, footer),
        buildBrand(document, footer),
        buildColumns(document, footer, consentUrl),
        buildSocial(document, footer),
        buildCopyright(document, footer)
      ];
      const counts = {
        disclosureParagraphs: sections[0].querySelectorAll("p").length,
        policyLinks: sections[1].querySelectorAll("li").length,
        columns: sections[2].querySelectorAll("h3").length,
        columnLinks: sections[2].querySelectorAll("li").length,
        socialLinks: sections[3].querySelectorAll("li").length,
        images: sections.reduce((n, s) => n + s.querySelectorAll("img").length, 0)
      };
      const main = document.createElement("div");
      sections.forEach((section, i) => {
        if (i > 0) main.append(document.createElement("hr"));
        main.append(...section.childNodes);
      });
      return [{
        element: main,
        path: "/footer",
        report: __spreadValues({
          title: "footer",
          source: (params == null ? void 0 : params.originalURL) || url,
          sections: sections.length
        }, counts)
      }];
    }
  };
  return __toCommonJS(import_footer_exports);
})();
