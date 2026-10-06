/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-video. Base: columns. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/columns-video/source.html
 *
 * Output (per blocks/columns-video/README.md): 1 row, 2 columns:
 *   [<h2>heading</h2><p>body</p><p><strong><a>CTA</a></strong></p>
 *    | <p>poster image (optional)</p><p><a>https://fast.wistia.net/embed/iframe/<id></a></p>]
 *
 * The transcript accordion (.accordion) lives inside the right column. It is NOT part of
 * this block: it is moved to directly after this element before replacement so the
 * accordion-transcript parser still runs on it (same node reference is preserved).
 */
function getWistiaId(root) {
  const player = root.querySelector('wistia-player[media-id]');
  const mid = player && player.getAttribute('media-id');
  if (mid && mid !== 'null') return mid;
  const asyncEl = root.querySelector('[class*="wistia_async_"]');
  if (asyncEl) {
    const m = asyncEl.className.match(/wistia_async_([a-z0-9]+)/i);
    if (m) return m[1];
  }
  const html = root.innerHTML || '';
  const patterns = [
    /fast\.wistia\.(?:com|net)\/embed\/(?:iframe|medias)\/([a-z0-9]{6,})/i,
    /fast\.wistia\.(?:com|net)\/embed\/([a-z0-9]{6,})\.js/i,
    /wistia-player\[media-id=['"]([a-z0-9]{6,})['"]\]/i,
    /data-wistia-id=["']([a-z0-9]{6,})["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

function getPoster(document, root) {
  // Light-DOM poster first, then the Wistia player's shadow-root thumbnail (live page)
  let src = null;
  let alt = '';
  const lightImg = root.querySelector('img:not([src^="data:"])');
  if (lightImg) {
    src = lightImg.getAttribute('src');
    alt = lightImg.getAttribute('alt') || '';
  } else {
    const player = root.querySelector('wistia-player');
    const shadowImg = player && player.shadowRoot && player.shadowRoot.querySelector('img[src]');
    if (shadowImg) src = shadowImg.getAttribute('src');
  }
  if (!src) return null;
  // Prefer a full-size jpg rendition of Wistia delivery thumbnails
  src = src.replace(/\.webp(\?|$)/, '.jpg$1').replace(/image_crop_resized=\d+x\d+/, 'image_crop_resized=1280x720');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}

export default function parse(element, { document }) {
  // Pull the transcript accordion out so it is not part of this table but still gets parsed
  const accordions = [...element.querySelectorAll('.aem-Grid > .accordion')]
    .filter((acc) => !acc.parentElement.closest('.accordion'));
  let anchor = element;
  accordions.forEach((acc) => {
    anchor.after(acc);
    anchor = acc;
  });

  const grids = [...element.querySelectorAll(':scope > div > .aem-Grid > .gridlayoutcontainer, :scope > .aem-Grid > .gridlayoutcontainer')]
    .filter((g, i, arr) => arr.indexOf(g) === i);
  const videoCol = element.querySelector('#gridLayout-video-container, [id*="video-container"]')
    || grids.find((g) => g.querySelector('wistia-player, .wistia-video-wrapper, iframe'))
    || grids[1];
  const textCol = grids.find((g) => g !== videoCol && !g.contains(videoCol)) || grids[0] || element;

  // Column 1: heading, body, CTA
  const textCell = [];
  const headingEl = textCol.querySelector('h1, h2, h3, h4');
  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.textContent = headingEl.textContent.trim();
    textCell.push(h2);
  }
  textCol.querySelectorAll('.text .author-rte-styling > p').forEach((p) => {
    if (p.textContent.trim()) textCell.push(p);
  });
  textCol.querySelectorAll('.cta a[href]').forEach((a) => {
    a.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    const strong = document.createElement('strong');
    strong.append(link);
    const p = document.createElement('p');
    p.append(strong);
    textCell.push(p);
  });

  // Column 2: optional poster + Wistia embed link
  const videoCell = [];
  const videoRoot = videoCol || element;
  const poster = getPoster(document, videoRoot);
  if (poster) {
    const p = document.createElement('p');
    p.append(poster);
    videoCell.push(p);
  }
  const wistiaId = getWistiaId(videoRoot);
  if (wistiaId) {
    const url = `https://fast.wistia.net/embed/iframe/${wistiaId}`;
    const link = document.createElement('a');
    link.href = url;
    link.textContent = url;
    const p = document.createElement('p');
    p.append(link);
    videoCell.push(p);
  }

  if (!textCell.length && !videoCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell, videoCell.length ? videoCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-video', cells });
  element.replaceWith(block);
}
