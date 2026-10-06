/**
 * cards-article: related-article teaser cards + an optional closing CTA tile.
 *
 * Per card (one row, any number of cells - merged):
 *   eyebrow paragraph (topic)       -> paragraphs before the heading
 *   heading (H2-H4) linked          -> title, link stretched over the whole card
 *   description paragraph(s)
 *   meta paragraph "Article | 03/10/2024" -> last short paragraph containing "|"
 * A card with no eyebrow and no meta is rendered as the CTA tile
 * (heading + button).
 */

const HEADING_SELECTOR = 'h2, h3, h4';

function isMetaLine(el) {
  if (!el || el.tagName !== 'P' || el.querySelector('a')) return false;
  const text = el.textContent.trim();
  return text.length > 0 && text.length <= 60 && text.includes('|');
}

function buildMeta(p) {
  const meta = document.createElement('p');
  meta.className = 'cards-article-meta';
  p.textContent.split('|').map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const span = document.createElement('span');
    span.textContent = part;
    meta.append(span);
  });
  return meta;
}

function decorateCard(li) {
  const heading = li.querySelector(HEADING_SELECTOR);
  const elements = [...li.children];
  const headingIndex = heading ? elements.indexOf(heading) : -1;

  const eyebrows = headingIndex > 0 ? elements.slice(0, headingIndex) : [];
  const after = headingIndex >= 0 ? elements.slice(headingIndex + 1) : elements;
  const metaSource = isMetaLine(after[after.length - 1]) ? after.pop() : null;

  if (!eyebrows.length && !metaSource) {
    li.classList.add('cards-article-cta');
    const body = document.createElement('div');
    body.className = 'cards-article-body';
    body.append(...elements);
    li.replaceChildren(body);
    return;
  }

  const body = document.createElement('div');
  body.className = 'cards-article-body';
  eyebrows.forEach((el) => {
    el.classList.add('cards-article-eyebrow');
    body.append(el);
  });
  if (heading) {
    heading.classList.add('cards-article-title');
    body.append(heading);
    const link = heading.querySelector('a');
    if (link) {
      link.classList.add('cards-article-link');
      li.classList.add('cards-article-linked');
    }
  }
  after.forEach((el) => {
    if (el.tagName === 'P') el.classList.add('cards-article-description');
    body.append(el);
  });

  const children = [body];
  if (metaSource) children.push(buildMeta(metaSource));
  li.replaceChildren(...children);
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-article-card';
    [...row.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          li.append(node);
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          const p = document.createElement('p');
          p.textContent = node.textContent.trim();
          li.append(p);
        }
      });
    });
    if (!li.children.length) return;
    decorateCard(li);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
