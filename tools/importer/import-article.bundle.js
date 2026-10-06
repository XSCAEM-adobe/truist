/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

  // tools/importer/import-article.js
  var import_article_exports = {};
  __export(import_article_exports, {
    default: () => import_article_default
  });

  // tools/importer/parsers/hero-article.js
  function absoluteUrl(src) {
    if (!src) return "";
    if (src.startsWith("//")) return `https:${src}`;
    if (src.startsWith("/")) return `https://www.truist.com${src}`;
    return src;
  }
  function heroImage(document, container) {
    if (!container) return null;
    const srcImg = container.querySelector("img.orion-hero-carousel-background-img, picture img, img");
    let src = "";
    if (srcImg) {
      const lazy = srcImg.getAttribute("data-src");
      const raw = srcImg.getAttribute("src") || "";
      src = lazy && (!raw || raw.startsWith("data:")) ? lazy : raw;
    }
    if (!src) {
      const source = container.querySelector("source[srcset]");
      if (source) src = source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
    }
    if (!src || src.startsWith("data:")) return null;
    const img = document.createElement("img");
    img.src = absoluteUrl(src);
    img.alt = srcImg && srcImg.getAttribute("alt") || "";
    return img;
  }
  function richParagraphs(document, scope) {
    if (!scope) return [];
    return [...scope.querySelectorAll("p")].filter((p) => p.textContent.trim()).map((p) => {
      const out = document.createElement("p");
      out.innerHTML = p.innerHTML.trim();
      return out;
    });
  }
  function parse(element, { document }) {
    const heroContainer = element.querySelector(".tmp__article--hero--container") || (element.ownerDocument || document).querySelector(".tmp__article--hero--container");
    const img = heroImage(document, heroContainer);
    const titleSrc = element.querySelector(".tmp__article--title-text h1") || element.querySelector("h1, .tmp__article--title-text h2");
    const dateLines = richParagraphs(document, element.querySelector(".tmp__article--title-eyebrow"));
    const intro = richParagraphs(document, element.querySelector(".tmp__article--subhead"));
    if (!titleSrc && !intro.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const content = [];
    if (titleSrc) {
      const h1 = document.createElement("h1");
      h1.innerHTML = titleSrc.innerHTML.trim();
      content.push(h1);
    }
    content.push(...dateLines, ...intro);
    const cells = [];
    if (img) cells.push([img]);
    cells.push([content]);
    if (heroContainer) heroContainer.remove();
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/callout-box.js
  var CONTENT_TAGS = "h1, h2, h3, h4, h5, h6, p, ul, ol, table, blockquote";
  function cleanFootnoteLinks(scope) {
    scope.querySelectorAll('sup a[href^="#disc"], a[name="disclaimer-sup"]').forEach((a) => {
      a.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
      const marker = a.textContent.replace(/\s+/g, " ").trim();
      const href = a.getAttribute("href");
      [...a.attributes].forEach((attr) => a.removeAttribute(attr.name));
      a.setAttribute("href", href);
      a.textContent = marker;
    });
    scope.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
    scope.querySelectorAll("[class]").forEach((n) => n.removeAttribute("class"));
  }
  function collectContent(scope) {
    const rtes = [...scope.querySelectorAll(".author-rte-styling")];
    const sources = rtes.length ? rtes : [scope];
    const out = [];
    sources.forEach((rte) => {
      [...rte.children].forEach((child) => {
        if (!child.matches(CONTENT_TAGS) || !child.textContent.trim()) return;
        const clone = child.cloneNode(true);
        cleanFootnoteLinks(clone);
        out.push(clone);
      });
    });
    return out;
  }
  function precedingHeading(element) {
    const prev = element.previousElementSibling;
    if (!prev || !prev.matches(".text")) return null;
    const rte = prev.querySelector(".author-rte-styling") || prev;
    const kids = [...rte.children].filter((c) => c.textContent.trim());
    if (kids.length !== 1 || !/^H[1-6]$/.test(kids[0].tagName)) return null;
    return { wrapper: prev, heading: kids[0] };
  }
  function parse2(element, { document }) {
    const isMist = element.matches(".grid__bg-color--light-purple, .bg-mist") || !!element.querySelector(":scope > .bg-mist, .grid__bg-color--light-purple");
    const content = collectContent(element);
    if (!content.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    if (!/^H[1-6]$/.test(content[0].tagName)) {
      const pre = precedingHeading(element);
      if (pre) {
        const h = pre.heading.cloneNode(true);
        cleanFootnoteLinks(h);
        content.unshift(h);
        pre.wrapper.remove();
      }
    }
    const cells = [[content]];
    const block = WebImporter.Blocks.createBlock(document, {
      name: "callout-box",
      variants: isMist ? ["mist"] : [],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-sidebar.js
  var CONTENT_TAGS2 = "h2, h3, h4, h5, h6, p, ul, ol";
  function fixImage(document, img) {
    if (!img) return null;
    const lazy = img.getAttribute("data-src");
    const raw = img.getAttribute("src") || "";
    let src = lazy && (!raw || raw.startsWith("data:")) ? lazy : raw;
    if (!src || src.startsWith("data:")) return null;
    if (/\.svg$/i.test(src)) src = `${src}?img=1`;
    const out = document.createElement("img");
    out.setAttribute("src", src);
    out.setAttribute("alt", img.getAttribute("alt") || "");
    return out;
  }
  function cleanClone(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
    clone.querySelectorAll("[class]").forEach((n) => n.removeAttribute("class"));
    clone.removeAttribute("class");
    return clone;
  }
  function columnContent(document, col) {
    const out = [];
    col.querySelectorAll(".author-image-styling img, .image img, .author-rte-styling").forEach((node) => {
      if (node.tagName === "IMG") {
        const img = fixImage(document, node);
        if (img && !out.some((o) => o.querySelector && o.querySelector(`img[src="${img.getAttribute("src")}"]`))) {
          const p = document.createElement("p");
          p.append(img);
          out.push(p);
        }
        return;
      }
      [...node.children].forEach((child) => {
        if (child.matches(CONTENT_TAGS2) && child.textContent.trim()) out.push(cleanClone(child));
      });
    });
    return out;
  }
  function parse3(element, { document }) {
    let cols = [...element.querySelectorAll(":scope > div > div > .gridlayoutcontainer")];
    if (cols.length < 2) {
      cols = [...element.querySelectorAll(".gridlayoutcontainer")].filter((c) => c.parentElement && c.parentElement.parentElement && c.parentElement.parentElement.parentElement === element);
    }
    const asideCol = cols.find((c) => c.matches(".grid__bg-color--midnight-purple") || c.querySelector(".grid__bg-color--midnight-purple"));
    const mainCol = cols.find((c) => c !== asideCol);
    const mainCell = mainCol ? columnContent(document, mainCol) : [];
    const asideCell = asideCol ? columnContent(document, asideCol) : [];
    if (!mainCell.length && !asideCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[mainCell.length ? mainCell : "", asideCell.length ? asideCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-sidebar", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table.js
  function cellContent(document, cell) {
    const clone = cell.cloneNode(true);
    clone.querySelectorAll(".sr-only, .visually-hidden, style, script").forEach((n) => n.remove());
    clone.querySelectorAll("[style], [class]").forEach((n) => {
      n.removeAttribute("style");
      n.removeAttribute("class");
    });
    const html = clone.innerHTML.replace(/&nbsp;/g, " ").trim();
    if (!html || !clone.textContent.trim() && !clone.querySelector("img")) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return [...div.childNodes];
  }
  function parse4(element, { document }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = [...table.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr")];
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const colCount = Math.max(...rows.map((r) => [...r.children].filter((c) => /^T[HD]$/.test(c.tagName)).reduce((n, c) => n + (parseInt(c.getAttribute("colspan"), 10) || 1), 0)));
    const cells = rows.map((tr) => {
      const row = [];
      [...tr.children].filter((c) => /^T[HD]$/.test(c.tagName)).forEach((c) => {
        row.push(cellContent(document, c));
        const span = parseInt(c.getAttribute("colspan"), 10) || 1;
        for (let i = 1; i < span; i += 1) row.push("");
      });
      while (row.length < colCount) row.push("");
      return row;
    });
    const bodyRows = rows.filter((tr) => !tr.closest("thead"));
    const rowHeaders = bodyRows.length > 0 && bodyRows.every((tr) => {
      const first = tr.querySelector(":scope > th, :scope > td");
      return first && first.tagName === "TH" && (first.getAttribute("scope") || "row") === "row";
    });
    const captionEl = table.querySelector(":scope > caption");
    const captionText = captionEl ? captionEl.textContent.replace(/\s+/g, " ").trim() : "";
    const variants = ["striped"];
    if (rowHeaders) variants.push("row-headers");
    if (captionText) {
      variants.push("caption");
      const p = document.createElement("p");
      p.innerHTML = captionEl.innerHTML.trim();
      p.querySelectorAll("[style], [class]").forEach((n) => {
        n.removeAttribute("style");
        n.removeAttribute("class");
      });
      element.before(p);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "table", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function para(document, value) {
    const p = document.createElement("p");
    p.textContent = value;
    return p;
  }
  function articleCard(document, body, card) {
    const out = [];
    const heading = body.querySelector("h1, h2, h3, h4, h5, h6, .card-title");
    const eyebrowEl = heading && heading.querySelector(".eyebrow") || body.querySelector(".eyebrow");
    const eyebrow = text(eyebrowEl);
    if (eyebrow) out.push(para(document, eyebrow));
    let title = "";
    if (heading) {
      const clone = heading.cloneNode(true);
      clone.querySelectorAll(".eyebrow, .sr-only, .visually-hidden").forEach((n) => n.remove());
      title = text(clone);
    }
    const anchor = body.closest("a[href]") || (card && card.matches("a[href]") ? card : null) || card && card.querySelector("a[href]");
    if (title) {
      const h3 = document.createElement("h3");
      if (anchor) {
        const a = document.createElement("a");
        a.href = anchor.getAttribute("href");
        a.textContent = title;
        h3.append(a);
      } else {
        h3.textContent = title;
      }
      out.push(h3);
    }
    body.querySelectorAll("p").forEach((p) => {
      if (p.closest(".ArticleView-noResults")) return;
      const value = text(p);
      if (value) out.push(para(document, value));
    });
    const footer = card && card.querySelector(".card-footer") || (body.nextElementSibling && body.nextElementSibling.matches(".card-footer") ? body.nextElementSibling : null);
    if (footer) {
      const type = text(footer.querySelector(".article-type, .article-footer"));
      const date = text(footer.querySelector(".article-pubTime"));
      const meta = [type, date].filter(Boolean).join(" | ");
      if (meta) out.push(para(document, meta));
    }
    return out;
  }
  function ctaCard(document, card) {
    const out = [];
    const heading = card.querySelector(".custom-card-title, h1, h2, h3, h4");
    if (text(heading)) {
      const h3 = document.createElement("h3");
      h3.textContent = text(heading);
      out.push(h3);
    }
    card.querySelectorAll("a[href]").forEach((link) => {
      if (!text(link)) return;
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = text(link);
      const p = document.createElement("p");
      p.append(a);
      out.push(p);
    });
    return out;
  }
  function parse5(element, { document }) {
    const cells = [];
    let bodies = [...element.querySelectorAll(".card-body")].filter((b) => !b.closest(".ArticleView-noResults"));
    if (!bodies.length) {
      bodies = [...element.querySelectorAll(".card")];
    }
    bodies.forEach((body) => {
      const card = body.closest(".card") || body.parentElement;
      const isCta = card && card.matches(".ret2Movmnt") || !!body.querySelector(".customCardContent, .card-cta");
      const content = isCta ? ctaCard(document, body) : articleCard(document, body, card);
      if (content.length) cells.push([content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/disclosures-footnotes.js
  function unwrap(el) {
    el.replaceWith(...el.childNodes);
  }
  function cleanParagraph(document, p) {
    const clone = p.cloneNode(true);
    clone.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
    clone.querySelectorAll("a").forEach((a) => {
      if (!a.getAttribute("href") && !a.textContent.trim()) a.remove();
    });
    clone.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      [...a.attributes].forEach((attr) => a.removeAttribute(attr.name));
      a.setAttribute("href", href);
    });
    clone.querySelectorAll("em em, i i, em i, i em").forEach(unwrap);
    clone.querySelectorAll("[class], [id], [style]").forEach((n) => {
      n.removeAttribute("class");
      n.removeAttribute("id");
      n.removeAttribute("style");
    });
    const out = document.createElement("p");
    const sup = clone.querySelector("sup");
    const supText = sup ? sup.textContent.replace(/\s+/g, "") : "";
    const isFootnote = sup && supText && clone.textContent.replace(/\s+/g, "").indexOf(supText) === 0;
    if (isFootnote) {
      const marker = document.createElement("sup");
      marker.textContent = supText;
      sup.remove();
      out.append(marker, document.createTextNode(" "));
      const rest = document.createElement("div");
      rest.innerHTML = clone.innerHTML.replace(/^(\s|&nbsp;)+/, "");
      let first = rest.firstChild;
      while (first && first.nodeType === 1 && first.firstChild) {
        if (first.firstChild.nodeType === 3) {
          first.firstChild.textContent = first.firstChild.textContent.replace(/^\s+/, "");
          break;
        }
        first = first.firstChild;
      }
      out.append(...rest.childNodes);
    } else {
      out.innerHTML = clone.innerHTML.trim();
    }
    return out;
  }
  function parse6(element, { document }) {
    const paragraphs = [...element.querySelectorAll(".author-rte-styling p, .text p")].filter((p, i, arr) => arr.indexOf(p) === i).filter((p) => p.textContent.replace(/\s+/g, " ").trim());
    const source = paragraphs.length ? paragraphs : [...element.querySelectorAll("p")].filter((p) => p.textContent.trim());
    const cells = source.map((p) => [cleanParagraph(document, p)]).filter(([p]) => p.textContent.trim());
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "disclosures-footnotes", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/truist-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // OneTrust cookie consent: <div id="onetrust-consent-sdk">
        "#onetrust-consent-sdk",
        // Floating chat/help widget: <div id="tru-floating--bottom-right"> (contains #idLpMessagingHelp)
        "#tru-floating--bottom-right",
        // Hidden personalized home-equity offer: <div id="cro-heloc-personalization">
        "#cro-heloc-personalization",
        // Hidden mobile-only duplicate product slider: <div class="... cro-personalization-slider-mobile">
        ".cro-personalization-slider-mobile",
        // Visually hidden source H1 wrapper: <div id="gridLayout-h1-sr-only"> > h1.sr-only
        "#gridLayout-h1-sr-only",
        // Empty subpage-navigation container: <div id="gridLayout-subpage-navigation">
        "#gridLayout-subpage-navigation",
        // Eligibility modal popup (not page content): <div class="global-popup"> > #popup-component-*
        ".global-popup",
        // JS loading spinners ("Loading" + dots) in login widget and item slider
        ".loading-container-login",
        ".loading-container"
      ]);
      if (element.querySelector(".tmp__article")) {
        const localDisc = element.querySelector("footer .footer-local-disclosure-top-orientation-change");
        const main = element.querySelector("main#main") || element.querySelector("main");
        if (localDisc && main && localDisc.textContent.trim()) {
          main.append(localDisc);
        }
        WebImporter.DOMUtils.remove(element, [
          // 2. Social share rail (rendered by an EDS auto-block):
          //    <div class="page-sharing"> > <div id="pagesharing-*" class="cmp-pagesharing ...">
          ".cmp-pagesharing",
          ".tmp__article--header--page-share .page-sharing",
          // 3. Hidden "No card error message" in related-resources cards:
          //    <div class="ArticleView-noResults hidden">
          ".ArticleView-noResults"
        ]);
        element.querySelectorAll("main style").forEach((el) => el.remove());
        element.querySelectorAll("sup .sr-only").forEach((el) => el.remove());
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Global header (migrated separately): <div class="headertag"> > header.global-header
        "div.headertag",
        "header.global-header",
        // Global footer incl. disclosures panel (migrated separately): <div class="footertag"> > footer.global-footer
        "div.footertag",
        "footer.global-footer",
        // Empty skip-content shell: <div class="maincontent"> > .author-maincontent-styling
        "div.maincontent",
        // Tracking / third-party leftovers
        "wistia-tag-manager",
        '[id^="batBeacon"]',
        "iframe",
        "noscript",
        "link"
      ]);
      element.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        const tiny = img.getAttribute("width") === "1" || img.getAttribute("height") === "1";
        if (tiny || /rtactivate|doubleclick|bat\.bing|facebook\.com\/tr/.test(src)) {
          (img.closest("picture") || img).remove();
        }
      });
      element.querySelectorAll("div.htmlcontainer").forEach((el) => {
        if (!el.children.length && !el.textContent.trim()) el.remove();
      });
    }
  }

  // tools/importer/transformers/truist-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = element.ownerDocument.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-article.js
  var parsers = {
    "hero-article": parse,
    "callout-box": parse2,
    "columns-sidebar": parse3,
    "table": parse4,
    "cards-article": parse5,
    "disclosures-footnotes": parse6
  };
  var PAGE_TEMPLATE = {
    "name": "article",
    "urls": [
      "https://www.truist.com/money-mindset/principles/outsmarting-debt/how-when-to-consolidate-debt",
      "https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans"
    ],
    "description": "Money and Mindset article: title + date line, intro, highlights callout, rich body (headings, lists, tables), Q&A / next-steps callouts, related resources, closing CTA",
    "blocks": [
      {
        "name": "hero-article",
        "instances": [
          ".tmp__article--header"
        ]
      },
      {
        "name": "callout-box",
        "instances": [
          ".tmp__article--body .grid__bg-color--light-gray",
          ".tmp__article--body .grid__bg-color--light-purple",
          ".tmp__article--body .gridlayoutcontainer:has(> .bg-mist)"
        ]
      },
      {
        "name": "columns-sidebar",
        "instances": [
          ".tmp__article--body > .aem-Grid > .responsivegrid > .aem-Grid > .gridlayoutcontainer:has(.grid__bg-color--midnight-purple)"
        ]
      },
      {
        "name": "table",
        "instances": [
          ".tmp__article--body table"
        ]
      },
      {
        "name": "cards-article",
        "instances": [
          ".tmp__article--related-resources .cmp-articlecards-list"
        ]
      },
      {
        "name": "disclosures-footnotes",
        "instances": [
          "footer .footer-local-disclosure-top-orientation-change",
          ".footer-local-disclosure-top-orientation-change"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Article header",
        "selector": [
          ".tmp__article--hero--container",
          ".tmp__article--header"
        ],
        "style": null,
        "blocks": [
          "hero-article"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Article body",
        "selector": [
          ".tmp__article--body"
        ],
        "style": null,
        "blocks": [
          "callout-box",
          "columns-sidebar",
          "table"
        ],
        "defaultContent": [
          ".tmp__article--body > .aem-Grid > .responsivegrid > .aem-Grid > .text"
        ]
      },
      {
        "id": "section-3",
        "name": "Related resources",
        "selector": [
          ".tmp__article--related-resources"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-article"
        ],
        "defaultContent": [
          ".tmp__article--related-resources .text h2"
        ]
      },
      {
        "id": "section-4",
        "name": "Page-specific disclosures (footnotes)",
        "selector": [
          "footer .footer-local-disclosure-top-orientation-change",
          ".footer-local-disclosure-top-orientation-change"
        ],
        "style": null,
        "blocks": [
          "disclosures-footnotes"
        ],
        "defaultContent": []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  function readArticleMeta(document) {
    var _a, _b;
    const eyebrow = ((_a = document.querySelector(".tmp__article--title-eyebrow")) == null ? void 0 : _a.textContent.replace(/\s+/g, " ").trim()) || "";
    const [category, date] = eyebrow.split("|").map((s) => s.trim());
    const topic = (_b = document.querySelector(".cmp-breadcrumb__item--active, .tmp__article--title-eyebrow + * .topic")) == null ? void 0 : _b.textContent.trim();
    return __spreadValues(__spreadValues(__spreadValues({
      template: PAGE_TEMPLATE.name
    }, category ? { category } : {}), date ? { "publication-date": date } : {}), topic ? { topic } : {});
  }
  var import_article_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const articleMeta = readArticleMeta(document);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      Object.assign(meta, articleMeta);
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_article_exports);
})();
