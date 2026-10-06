import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

/**
 * A short paragraph containing a "|" separator (or fully bold) is the
 * "Category | Month YYYY" date line.
 * @param {Element} p
 * @returns {boolean}
 */
function isDateLine(p) {
  if (!p || p.tagName !== 'P' || p.querySelector('picture, a')) return false;
  const text = p.textContent.trim();
  if (!text || text.length > 80) return false;
  const strong = p.querySelector('strong, b');
  const fullyBold = strong && strong.textContent.trim() === text;
  return text.includes('|') || !!fullyBold;
}

/**
 * Builds the date line from page metadata when the author omitted it.
 * @returns {HTMLParagraphElement|null}
 */
function buildDateLineFromMetadata() {
  const parts = [getMetadata('category'), getMetadata('publication-date')].filter(Boolean);
  if (!parts.length) return null;
  const p = document.createElement('p');
  p.textContent = parts.join(' | ');
  return p;
}

export default function decorate(block) {
  const picture = block.querySelector('picture');
  const content = document.createElement('div');
  content.className = 'hero-article-content';

  // gather every non-image element from every cell, in authored order
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!node.textContent.trim()) return;
          const p = document.createElement('p');
          p.textContent = node.textContent.trim();
          content.append(p);
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.tagName === 'PICTURE' || (node.querySelector('picture') && node.textContent.trim() === '')) return;
        content.append(node);
      });
    });
  });

  // date line: the paragraph directly before or after the H1 that looks like "A | B"
  const heading = content.querySelector('h1, h2');
  let dateLine = null;
  if (heading) {
    const before = heading.previousElementSibling;
    const after = heading.nextElementSibling;
    if (isDateLine(before)) dateLine = before;
    else if (isDateLine(after)) dateLine = after;
  } else if (isDateLine(content.firstElementChild)) {
    dateLine = content.firstElementChild;
  }
  if (!dateLine) dateLine = buildDateLineFromMetadata();
  if (dateLine) {
    dateLine.classList.add('hero-article-eyebrow');
    if (heading) heading.before(dateLine);
    else content.prepend(dateLine);
  }

  // remaining paragraphs after the heading form the intro
  if (heading) {
    let next = heading.nextElementSibling;
    while (next) {
      if (next.tagName === 'P') next.classList.add('hero-article-intro');
      next = next.nextElementSibling;
    }
  }

  const children = [];
  if (picture) {
    const img = picture.querySelector('img');
    const media = document.createElement('div');
    media.className = 'hero-article-media';
    media.append(img
      ? createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }])
      : picture);
    children.push(media);
  } else {
    block.classList.add('hero-article-no-image');
  }
  children.push(content);
  block.replaceChildren(...children);

  // the social-share auto-block (inserted right after this block by scripts.js)
  // sits beside the title, so move its wrapper into the content column
  const nextWrapper = block.parentElement?.nextElementSibling;
  if (nextWrapper && nextWrapper.querySelector(':scope > .social-share')) {
    content.append(nextWrapper);
  }
}
