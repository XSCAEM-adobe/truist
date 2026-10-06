/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-article. Base: hero.
 * Source: https://www.truist.com/money-mindset/principles/outsmarting-debt/how-when-to-consolidate-debt
 * Also validated on: https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans
 * Selectors validated against migration-work/block-context/hero-article/source.html
 *
 * Output (per blocks/hero-article/README.md): 2 rows, 1 column
 *   Row 1: hero image (read from the separate .tmp__article--hero--container, which is then removed)
 *   Row 2: <h1> title, date-line <p><strong>Money and Mindset | May 2025</strong></p>, intro <p>(s)
 * The share rail (.tmp__article--header--page-share) and the empty author slot are ignored.
 */
function absoluteUrl(src) {
  if (!src) return '';
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `https://www.truist.com${src}`;
  return src;
}

function heroImage(document, container) {
  if (!container) return null;
  const srcImg = container.querySelector('img.orion-hero-carousel-background-img, picture img, img');
  let src = '';
  if (srcImg) {
    const lazy = srcImg.getAttribute('data-src');
    const raw = srcImg.getAttribute('src') || '';
    src = (lazy && (!raw || raw.startsWith('data:'))) ? lazy : raw;
  }
  if (!src) {
    // fallback: desktop <source srcset> (root-relative on the live page)
    const source = container.querySelector('source[srcset]');
    if (source) src = source.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
  }
  if (!src || src.startsWith('data:')) return null;
  const img = document.createElement('img');
  img.src = absoluteUrl(src);
  img.alt = (srcImg && srcImg.getAttribute('alt')) || '';
  return img;
}

function richParagraphs(document, scope) {
  if (!scope) return [];
  return [...scope.querySelectorAll('p')].filter((p) => p.textContent.trim()).map((p) => {
    const out = document.createElement('p');
    out.innerHTML = p.innerHTML.trim();
    return out;
  });
}

export default function parse(element, { document }) {
  // Hero image lives in a sibling/preceding container outside the header
  const heroContainer = element.querySelector('.tmp__article--hero--container')
    || (element.ownerDocument || document).querySelector('.tmp__article--hero--container');
  const img = heroImage(document, heroContainer);

  const titleSrc = element.querySelector('.tmp__article--title-text h1')
    || element.querySelector('h1, .tmp__article--title-text h2');
  const dateLines = richParagraphs(document, element.querySelector('.tmp__article--title-eyebrow'));
  const intro = richParagraphs(document, element.querySelector('.tmp__article--subhead'));

  if (!titleSrc && !intro.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const content = [];
  if (titleSrc) {
    const h1 = document.createElement('h1');
    h1.innerHTML = titleSrc.innerHTML.trim();
    content.push(h1);
  }
  content.push(...dateLines, ...intro);

  const cells = [];
  if (img) cells.push([img]);
  cells.push([content]);

  if (heroContainer) heroContainer.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-article', cells });
  element.replaceWith(block);
}
