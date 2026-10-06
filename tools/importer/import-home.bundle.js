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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-login.js
  function cleanLink(document, a) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href") || a.href;
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".sr-only, .visually-hidden, img, svg").forEach((n) => n.remove());
    link.textContent = clone.textContent.replace(/\s+/g, " ").trim();
    return link;
  }
  function parse(element, { document }) {
    const bgImage = element.querySelector("img.hero-login-bg-image, .hero-login-left-container > img, .jumbotron img");
    const content = element.querySelector(".hero-content") || element;
    const titleEl = content.querySelector(".hero-title");
    const subtitleEl = content.querySelector(".hero-subtitle");
    const headingEl = content.querySelector("h1, h2, h3");
    const contentCell = [];
    if (titleEl && subtitleEl) {
      const eyebrow = document.createElement("p");
      eyebrow.textContent = titleEl.textContent.trim();
      contentCell.push(eyebrow);
      const h1 = document.createElement("h1");
      h1.textContent = subtitleEl.textContent.trim();
      contentCell.push(h1);
    } else if (headingEl || titleEl || subtitleEl) {
      const src = headingEl || titleEl || subtitleEl;
      const h1 = document.createElement("h1");
      h1.textContent = src.textContent.trim();
      contentCell.push(h1);
    }
    const description = content.querySelector(".hero-description");
    if (description) {
      description.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
      const paras = [...description.querySelectorAll("p")];
      if (paras.length) contentCell.push(...paras);
      else if (description.textContent.trim()) {
        const p = document.createElement("p");
        p.append(...description.childNodes);
        contentCell.push(p);
      }
    }
    const ctas = [...content.querySelectorAll(".hero-btn-container a, a.btn-cta")].filter((a, i, arr) => arr.indexOf(a) === i);
    ctas.forEach((a, i) => {
      const p = document.createElement("p");
      const wrap = document.createElement(i === 0 ? "strong" : "em");
      wrap.append(cleanLink(document, a));
      p.append(wrap);
      contentCell.push(p);
    });
    if (!bgImage && !contentCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    cells.push([contentCell]);
    const login = element.querySelector(".login-component, .hero--login-menu--row");
    if (login) {
      const linksCell = [];
      const seen = /* @__PURE__ */ new Set();
      login.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href || href.startsWith("#") || seen.has(href)) return;
        seen.add(href);
        const p = document.createElement("p");
        const para = a.closest("p");
        const strong = para && para.querySelector("strong");
        if (strong && strong.textContent.trim()) {
          p.append(`${strong.textContent.trim()} `);
        }
        p.append(cleanLink(document, a));
        linksCell.push(p);
      });
      if (linksCell.length) cells.push([linksCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-login", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-shortcuts.js
  function parse2(element, { document }) {
    let items = [...element.querySelectorAll("li.splide__slide, .item-slider-items > li")].filter((li, i, arr) => arr.indexOf(li) === i).filter((li) => !li.classList.contains("splide__slide--clone"));
    if (!items.length) {
      items = [...element.querySelectorAll("a.item-slider-card-link")];
    }
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const a = item.matches("a") ? item : item.querySelector("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      const labelEl = item.querySelector(".item-slider-thumb-text");
      const label = (labelEl ? labelEl.textContent : a.textContent).replace(/\s+/g, " ").trim();
      const key = `${href}|${label}`;
      if (seen.has(key)) return;
      seen.add(key);
      const img = item.querySelector("img");
      if (img) {
        img.alt = img.alt || "";
        const src = img.getAttribute("src") || "";
        if (/\.svg$/i.test(src)) img.setAttribute("src", `${src}?img=1`);
      }
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      const p = document.createElement("p");
      p.append(link);
      cells.push([img || "", p]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-shortcuts", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo-mosaic.js
  function cleanLink2(document, a) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href") || a.href;
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".sr-only, .visually-hidden, img, svg").forEach((n) => n.remove());
    link.textContent = clone.textContent.replace(/\s+/g, " ").trim();
    return link;
  }
  function parse3(element, { document }) {
    let cards = [...element.querySelectorAll(".staticcardv2 .card, .staticcard > div > .card")].filter((c, i, arr) => arr.indexOf(c) === i);
    if (!cards.length) cards = [...element.querySelectorAll(".card")];
    const cells = [];
    cards.forEach((card) => {
      const body = card.querySelector(".card-body") || card;
      const eyebrowEl = body.querySelector(".eyebrow");
      const headingEl = body.querySelector(".heading, h1, h2, h3, h4");
      const textEls = [...body.querySelectorAll("p.card-text, .card-text")].filter((p, i, arr) => arr.indexOf(p) === i);
      const content = [];
      if (eyebrowEl && eyebrowEl.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = eyebrowEl.textContent.trim();
        content.push(p);
      }
      if (headingEl && headingEl.textContent.trim()) {
        const h2 = document.createElement("h2");
        h2.textContent = headingEl.textContent.trim();
        content.push(h2);
      }
      textEls.forEach((t) => {
        t.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
        const p = document.createElement("p");
        p.append(...t.childNodes);
        content.push(p);
      });
      const ctas = [...card.querySelectorAll(".card-footer a[href], .cta-container a[href]")].filter((a, i, arr) => arr.indexOf(a) === i);
      ctas.forEach((a) => {
        const p = document.createElement("p");
        const link = cleanLink2(document, a);
        if (a.classList.contains("btn-primary")) {
          const strong = document.createElement("strong");
          strong.append(link);
          p.append(strong);
        } else {
          p.append(link);
        }
        content.push(p);
      });
      if (!content.length) return;
      const img = card.querySelector(":scope > img, :scope > picture img, .card-img-top");
      cells.push([img || "", content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo-mosaic", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-offer.js
  function cleanLink3(document, a) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href") || a.href;
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".sr-only, .visually-hidden, img, svg").forEach((n) => n.remove());
    link.textContent = clone.textContent.replace(/\s+/g, " ").trim();
    return link;
  }
  function parse4(element, { document }) {
    let cards = [...element.querySelectorAll(".staticcardv2 .card")];
    if (!cards.length) cards = [...element.querySelectorAll(".card")];
    const cells = [];
    cards.forEach((card) => {
      const body = card.querySelector(".card-body") || card;
      const eyebrowEl = body.querySelector(".eyebrow");
      const headingEl = body.querySelector(".subheading, .heading, h2, h3, h4");
      const textEls = [...body.querySelectorAll(".card-text")];
      const content = [];
      if (eyebrowEl && eyebrowEl.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = eyebrowEl.textContent.trim();
        content.push(p);
      }
      if (headingEl && headingEl.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = headingEl.textContent.trim();
        content.push(h3);
      }
      textEls.forEach((t) => {
        t.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
        if (!t.textContent.trim()) return;
        const p = document.createElement("p");
        p.append(...t.childNodes);
        content.push(p);
      });
      const ctas = [...card.querySelectorAll(".card-footer a[href]")];
      ctas.forEach((a) => {
        const p = document.createElement("p");
        const link = cleanLink3(document, a);
        if (a.classList.contains("btn-primary") || a.classList.contains("btn-secondary")) {
          const em = document.createElement("em");
          em.append(link);
          p.append(em);
        } else {
          p.append(link);
        }
        content.push(p);
      });
      if (content.length) cells.push([content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-offer", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-app-promo.js
  function keepSvgAsImage(img) {
    if (!img) return img;
    const src = img.getAttribute("src") || "";
    if (/\.svg$/i.test(src)) img.setAttribute("src", `${src}?img=1`);
    return img;
  }
  function realImage(img) {
    if (!img) return null;
    const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
    const src = img.getAttribute("src") || "";
    if (src.startsWith("data:")) {
      if (!lazy) return null;
      img.setAttribute("src", lazy);
    }
    img.removeAttribute("data-src");
    img.removeAttribute("data-lazy-src");
    return keepSvgAsImage(img);
  }
  function parse5(element, { document }) {
    const grids = [...element.querySelectorAll(":scope > .aem-Grid > .gridlayoutcontainer")];
    const mediaCol = grids[0] || element;
    const textCol = grids[1] || element;
    const phoneImg = realImage(mediaCol.querySelector(".image img, img"));
    const content = [];
    const eyebrowEl = textCol.querySelector(".text__type--eyebrow h2, .text__type--eyebrow h3, .text__type--eyebrow p, .text__type--eyebrow");
    if (eyebrowEl && eyebrowEl.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = eyebrowEl.textContent.trim();
      content.push(p);
    }
    const textBlocks = [...textCol.querySelectorAll(".text:not(.text__type--eyebrow) .author-rte-styling")];
    textBlocks.forEach((tb) => {
      tb.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
      [...tb.children].forEach((child) => {
        if (!child.textContent.trim()) return;
        if (/^H[1-6]$/.test(child.tagName)) {
          const h2 = document.createElement("h2");
          h2.textContent = child.textContent.trim();
          content.push(h2);
        } else {
          content.push(child);
        }
      });
    });
    textCol.querySelectorAll(".cta a[href]").forEach((a) => {
      a.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.replace(/\s+/g, " ").trim();
      const p = document.createElement("p");
      p.append(link);
      content.push(p);
    });
    const qrCard = textCol.querySelector(".staticcardv2, .staticcard");
    if (qrCard) {
      const qrImg = realImage(qrCard.querySelector("img"));
      if (qrImg) {
        const p = document.createElement("p");
        p.append(qrImg);
        content.push(p);
      }
      const caption = qrCard.querySelector(".card-text");
      if (caption && caption.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = caption.textContent.replace(/\s+/g, " ").trim();
        content.push(p);
      }
    }
    const badgeLinks = [...textCol.querySelectorAll(".app-store-mobile-view a[href]")].map((a) => ({ a, img: realImage(a.querySelector("img")) })).filter(({ img }) => img);
    if (badgeLinks.length) {
      const p = document.createElement("p");
      badgeLinks.forEach(({ a, img }) => {
        const link = document.createElement("a");
        link.href = a.getAttribute("href");
        link.append(img);
        p.append(link);
      });
      content.push(p);
    }
    if (!phoneImg && !content.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[phoneImg || "", content]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-app-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-video.js
  function getWistiaId(root) {
    const player = root.querySelector("wistia-player[media-id]");
    const mid = player && player.getAttribute("media-id");
    if (mid && mid !== "null") return mid;
    const asyncEl = root.querySelector('[class*="wistia_async_"]');
    if (asyncEl) {
      const m = asyncEl.className.match(/wistia_async_([a-z0-9]+)/i);
      if (m) return m[1];
    }
    const html = root.innerHTML || "";
    const patterns = [
      /fast\.wistia\.(?:com|net)\/embed\/(?:iframe|medias)\/([a-z0-9]{6,})/i,
      /fast\.wistia\.(?:com|net)\/embed\/([a-z0-9]{6,})\.js/i,
      /wistia-player\[media-id=['"]([a-z0-9]{6,})['"]\]/i,
      /data-wistia-id=["']([a-z0-9]{6,})["']/i
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m) return m[1];
    }
    return null;
  }
  function getPoster(document, root) {
    let src = null;
    let alt = "";
    const lightImg = root.querySelector('img:not([src^="data:"])');
    if (lightImg) {
      src = lightImg.getAttribute("src");
      alt = lightImg.getAttribute("alt") || "";
    } else {
      const player = root.querySelector("wistia-player");
      const shadowImg = player && player.shadowRoot && player.shadowRoot.querySelector("img[src]");
      if (shadowImg) src = shadowImg.getAttribute("src");
    }
    if (!src) return null;
    src = src.replace(/\.webp(\?|$)/, ".jpg$1").replace(/image_crop_resized=\d+x\d+/, "image_crop_resized=1280x720");
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    return img;
  }
  function parse6(element, { document }) {
    const accordions = [...element.querySelectorAll(".aem-Grid > .accordion")].filter((acc) => !acc.parentElement.closest(".accordion"));
    let anchor = element;
    accordions.forEach((acc) => {
      anchor.after(acc);
      anchor = acc;
    });
    const grids = [...element.querySelectorAll(":scope > div > .aem-Grid > .gridlayoutcontainer, :scope > .aem-Grid > .gridlayoutcontainer")].filter((g, i, arr) => arr.indexOf(g) === i);
    const videoCol = element.querySelector('#gridLayout-video-container, [id*="video-container"]') || grids.find((g) => g.querySelector("wistia-player, .wistia-video-wrapper, iframe")) || grids[1];
    const textCol = grids.find((g) => g !== videoCol && !g.contains(videoCol)) || grids[0] || element;
    const textCell = [];
    const headingEl = textCol.querySelector("h1, h2, h3, h4");
    if (headingEl) {
      const h2 = document.createElement("h2");
      h2.textContent = headingEl.textContent.trim();
      textCell.push(h2);
    }
    textCol.querySelectorAll(".text .author-rte-styling > p").forEach((p) => {
      if (p.textContent.trim()) textCell.push(p);
    });
    textCol.querySelectorAll(".cta a[href]").forEach((a) => {
      a.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.replace(/\s+/g, " ").trim();
      const strong = document.createElement("strong");
      strong.append(link);
      const p = document.createElement("p");
      p.append(strong);
      textCell.push(p);
    });
    const videoCell = [];
    const videoRoot = videoCol || element;
    const poster = getPoster(document, videoRoot);
    if (poster) {
      const p = document.createElement("p");
      p.append(poster);
      videoCell.push(p);
    }
    const wistiaId = getWistiaId(videoRoot);
    if (wistiaId) {
      const url = `https://fast.wistia.net/embed/iframe/${wistiaId}`;
      const link = document.createElement("a");
      link.href = url;
      link.textContent = url;
      const p = document.createElement("p");
      p.append(link);
      videoCell.push(p);
    }
    if (!textCell.length && !videoCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell, videoCell.length ? videoCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-transcript.js
  var DEBUG_RE = /Component ID\s*:|Model\s*:\s*"?disclaimer|Position\s*:\s*"?left/i;
  function parse7(element, { document }) {
    let items = [...element.querySelectorAll(".border-container")];
    if (!items.length) {
      items = [...element.querySelectorAll(".accordion-card-header")].map((h) => h.parentElement);
    }
    const cells = [];
    items.forEach((item) => {
      const labelEl = item.querySelector(".accordion-text, .accordion-card-header button, .accordion-card-header");
      const label = labelEl ? labelEl.textContent.replace(/\s+/g, " ").trim() : "Transcript";
      const body = item.querySelector(".collapse .card-body, .collapse, .card-body");
      const content = [];
      if (body) {
        body.querySelectorAll(".sr-only, .visually-hidden, script, style").forEach((n) => n.remove());
        const blocks = [...body.querySelectorAll("p, ul, ol, h2, h3, h4, h5, h6, table")].filter((n) => !n.parentElement.closest("p, ul, ol, table"));
        blocks.forEach((n) => {
          const text = n.textContent.trim();
          if (!text || DEBUG_RE.test(text)) return;
          content.push(n);
        });
        if (!content.length && body.textContent.trim() && !DEBUG_RE.test(body.textContent)) {
          const p = document.createElement("p");
          p.textContent = body.textContent.replace(/\s+/g, " ").trim();
          content.push(p);
        }
      }
      if (!label && !content.length) return;
      cells.push([label || "Transcript", content.length ? content : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-transcript", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-spotlight.js
  function keepSvgAsImage2(img) {
    if (!img) return img;
    const lazy = img.getAttribute("data-src");
    if (lazy && (img.getAttribute("src") || "").startsWith("data:")) img.setAttribute("src", lazy);
    img.removeAttribute("data-src");
    const src = img.getAttribute("src") || "";
    if (/\.svg$/i.test(src)) img.setAttribute("src", `${src}?img=1`);
    return img;
  }
  function parse8(element, { document }) {
    const cols = [...element.querySelectorAll(":scope > .gridlayoutcontainer")];
    const mediaCol = cols[0] || element;
    const textCol = cols[1] || element;
    const photo = mediaCol.querySelector(".image img, img");
    if (photo) keepSvgAsImage2(photo);
    const content = [];
    const logo = textCol.querySelector(".image img");
    if (logo && logo !== photo) {
      keepSvgAsImage2(logo);
      const p = document.createElement("p");
      p.append(logo);
      content.push(p);
    }
    const headingEl = textCol.querySelector("h1, h2, h3, h4");
    if (headingEl) {
      const h2 = document.createElement("h2");
      h2.textContent = headingEl.textContent.trim();
      content.push(h2);
    }
    textCol.querySelectorAll(".text .author-rte-styling > p, .text .author-rte-styling > ul, .text .author-rte-styling > ol").forEach((n) => {
      n.querySelectorAll(".sr-only, .visually-hidden").forEach((s) => s.remove());
      if (n.textContent.trim()) content.push(n);
    });
    textCol.querySelectorAll(".cta a[href]").forEach((a) => {
      a.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.replace(/\s+/g, " ").trim();
      const strong = document.createElement("strong");
      strong.append(link);
      const p = document.createElement("p");
      p.append(strong);
      content.push(p);
    });
    if (!photo && !content.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[photo || "", content]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-spotlight", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-intro-list.js
  function fixImage(img) {
    if (!img) return img;
    const lazy = img.getAttribute("data-src");
    if (lazy && (img.getAttribute("src") || "").startsWith("data:")) img.setAttribute("src", lazy);
    img.removeAttribute("data-src");
    const src = img.getAttribute("src") || "";
    if (/\.svg$/i.test(src)) img.setAttribute("src", `${src}?img=1`);
    return img;
  }
  function cleanLink4(document, a) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href") || a.href;
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".sr-only, .visually-hidden, img, svg").forEach((n) => n.remove());
    link.textContent = clone.textContent.replace(/\s+/g, " ").trim();
    return link;
  }
  function cardContent(document, card, headingTag) {
    const out = [];
    const body = card.querySelector(".card-body") || card;
    const eyebrow = body.querySelector(".eyebrow");
    if (eyebrow && eyebrow.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = eyebrow.textContent.trim();
      out.push(p);
    }
    const heading = body.querySelector(".heading, .subheading, h2, h3, h4");
    if (heading && heading.textContent.trim()) {
      const h = document.createElement(headingTag);
      h.textContent = heading.textContent.trim();
      out.push(h);
    }
    body.querySelectorAll(".card-text").forEach((t) => {
      t.querySelectorAll(".sr-only, .visually-hidden").forEach((n) => n.remove());
      if (!t.textContent.trim()) return;
      const p = document.createElement("p");
      p.append(...t.childNodes);
      out.push(p);
    });
    card.querySelectorAll(".card-footer a[href]").forEach((a) => {
      const p = document.createElement("p");
      p.append(cleanLink4(document, a));
      out.push(p);
    });
    return out;
  }
  function parse9(element, { document }) {
    const cols = [...element.querySelectorAll(":scope > div > .aem-Grid > .gridlayoutcontainer")];
    const introCol = cols[0] || element;
    const listCol = cols[1] || null;
    const introCell = [];
    const introCard = introCol.querySelector(".card");
    if (introCard) {
      const icon = fixImage(introCard.querySelector(":scope > img, .card-img-icon-default, img"));
      if (icon) {
        const p = document.createElement("p");
        p.append(icon);
        introCell.push(p);
      }
      introCell.push(...cardContent(document, introCard, "h2"));
    }
    const listCell = [];
    const cards = listCol ? [...listCol.querySelectorAll(".staticcardv2 .card, .staticcard .card")].filter((c, i, arr) => arr.indexOf(c) === i) : [];
    cards.forEach((card, i) => {
      const content = cardContent(document, card, "h3");
      if (!content.length) return;
      if (listCell.length) listCell.push(document.createElement("hr"));
      listCell.push(...content);
    });
    if (!introCell.length && !listCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[introCell, listCell.length ? listCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-intro-list", cells });
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
  function cleanDivFootnote(document, div) {
    const lead = document.createElement("p");
    const rest = [];
    [...div.childNodes].forEach((n) => {
      const isBlock = n.nodeType === 1 && /^(P|UL|OL|DIV)$/.test(n.tagName);
      if (!isBlock && !rest.length) {
        lead.append(n.cloneNode(true));
      } else if (isBlock && n.textContent.replace(/[\s ]+/g, "")) {
        rest.push(n);
      }
    });
    const out = [cleanParagraph(document, lead)];
    rest.forEach((n) => {
      if (n.tagName === "P") {
        out.push(cleanParagraph(document, n));
        return;
      }
      const list = n.cloneNode(true);
      list.querySelectorAll("[class], [id], [style]").forEach((x) => {
        x.removeAttribute("class");
        x.removeAttribute("id");
        x.removeAttribute("style");
      });
      out.push(list);
    });
    return out.filter((el) => el.textContent.trim());
  }
  function parse10(element, { document }) {
    const divNotes = [...element.querySelectorAll("div.disc-anchor")];
    const inDivNote = (p) => divNotes.some((d) => d.contains(p));
    const paragraphs = [...element.querySelectorAll(".author-rte-styling p, .text p, div.disc-anchor")].filter((p, i, arr) => arr.indexOf(p) === i).filter((p) => p.tagName === "DIV" || !inDivNote(p)).filter((p) => p.textContent.replace(/\s+/g, " ").trim());
    const source = paragraphs.length ? paragraphs : [...element.querySelectorAll("p")].filter((p) => p.textContent.trim());
    const cells = source.map((p) => p.tagName === "DIV" ? [cleanDivFootnote(document, p)] : [cleanParagraph(document, p)]).filter(([c]) => Array.isArray(c) ? c.length : c.textContent.trim());
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
      if (element.querySelector(".homepage-main-content")) {
        const homeDisc = element.querySelector("footer .footer-local-disclosure-top-orientation-change");
        const homeMain = element.querySelector("main#main") || element.querySelector("main");
        if (homeDisc && homeMain) {
          homeDisc.querySelectorAll(".unique-target").forEach((el) => el.remove());
          if (homeDisc.textContent.trim()) homeMain.append(homeDisc);
        }
      }
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

  // tools/importer/import-home.js
  var parsers = {
    "hero-login": parse,
    "cards-shortcuts": parse2,
    "cards-promo-mosaic": parse3,
    "cards-offer": parse4,
    "columns-app-promo": parse5,
    "columns-video": parse6,
    "accordion-transcript": parse7,
    "columns-spotlight": parse8,
    "columns-intro-list": parse9,
    "disclosures-footnotes": parse10
  };
  var PAGE_TEMPLATE = {
    "name": "home",
    "urls": [
      "https://www.truist.com/"
    ],
    "representativeUrl": "https://www.truist.com/",
    "description": "To be named in naming step",
    "blocks": [
      {
        "name": "hero-login",
        "instances": [
          ".custom-herobanner .hero-login-component"
        ]
      },
      {
        "name": "cards-shortcuts",
        "instances": [
          ".cro-personalization-slider-desktop .itemslider"
        ]
      },
      {
        "name": "cards-promo-mosaic",
        "instances": [
          ".merch-two-col .merch-section"
        ]
      },
      {
        "name": "cards-offer",
        "instances": [
          ".policy_static-cardv2-four-col-border-preset"
        ]
      },
      {
        "name": "columns-app-promo",
        "instances": [
          ".policy_container_mobile-banking-feature-v2 .gridlayout-flex-height"
        ]
      },
      {
        "name": "columns-video",
        "instances": [
          ".radius-40.bg-sky-blue-ltr .grid__border-radius-all-40"
        ]
      },
      {
        "name": "accordion-transcript",
        "instances": [
          ".radius-40.bg-sky-blue-ltr .aem-Grid > .accordion"
        ]
      },
      {
        "name": "columns-spotlight",
        "instances": [
          ".radius-40.bg-mist > .aem-Grid"
        ]
      },
      {
        "name": "columns-intro-list",
        "instances": [
          ".special-ankle > .aem-Grid > .gridlayoutcontainer"
        ]
      },
      {
        "name": "disclosures-footnotes",
        "instances": [
          ".footer-local-disclosure-top-orientation-change"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Hero with sign-in panel",
        "selector": [
          ".custom-herobanner"
        ],
        "style": null,
        "blocks": [
          "hero-login"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Product shortcuts",
        "selector": [
          ".cro-personalization-slider-desktop"
        ],
        "style": null,
        "blocks": [
          "cards-shortcuts"
        ],
        "defaultContent": [
          ".cro-personalization-slider-desktop h2.tru-one-slider-heading",
          ".cro-personalization-slider-desktop .text__align--center"
        ]
      },
      {
        "id": "section-3",
        "name": "Featured promotions mosaic",
        "selector": [
          ".merch-two-col"
        ],
        "style": null,
        "blocks": [
          "cards-promo-mosaic"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "Product offer cards row",
        "selector": [
          ".bg-ntrl-white:has(> .aem-Grid > .policy_static-cardv2-four-col-border-preset)",
          ".homepage-main-content > .aem-Grid > .tp__margin-bottom--lg"
        ],
        "style": null,
        "blocks": [
          "cards-offer"
        ],
        "defaultContent": []
      },
      {
        "id": "section-5",
        "name": "Mobile app promo",
        "selector": [
          ".policy_container_mobile-banking-feature-v2"
        ],
        "style": null,
        "blocks": [
          "columns-app-promo"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Brand video",
        "selector": [
          ".radius-40.bg-sky-blue-ltr"
        ],
        "style": "teal",
        "blocks": [
          "columns-video",
          "accordion-transcript"
        ],
        "defaultContent": []
      },
      {
        "id": "section-7",
        "name": "Sponsorship feature (Miami Dolphins)",
        "selector": [
          ".radius-40.bg-mist"
        ],
        "style": null,
        "blocks": [
          "columns-spotlight"
        ],
        "defaultContent": []
      },
      {
        "id": "section-8",
        "name": "Fraud protection",
        "selector": [
          ".special-ankle",
          ".grid__type--section"
        ],
        "style": null,
        "blocks": [
          "columns-intro-list"
        ],
        "defaultContent": []
      },
      {
        "id": "section-9",
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
    ],
    "urlPattern": "/"
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
  var import_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
      WebImporter.rules.createMetadata(main, document);
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
  return __toCommonJS(import_home_exports);
})();
