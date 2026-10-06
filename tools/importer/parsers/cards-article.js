/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://www.truist.com/money-mindset/principles/outsmarting-debt/how-when-to-consolidate-debt
 * Also validated on: https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans
 * Selectors validated against migration-work/block-context/cards-article/source.html
 *
 * Output (per blocks/cards-article/README.md): one row per card, 1 cell
 *   Article card: <p>eyebrow</p><h3><a href>title</a></h3><p>description</p><p>Article | MM/DD/YYYY</p>
 *   CTA card (div.card.ret2Movmnt): <h3>heading</h3><p><a href>link</a></p>
 * Iteration is keyed on the inner .card-body wrappers (not the sibling a.card anchors, which
 * html2md preprocessing can merge); the href is read back from the enclosing anchor.
 * The hidden .ArticleView-noResults message is skipped. The "Related resources" H2 stays
 * default content (outside this element).
 */
function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function para(document, value) {
  const p = document.createElement('p');
  p.textContent = value;
  return p;
}

function articleCard(document, body, card) {
  const out = [];
  const heading = body.querySelector('h1, h2, h3, h4, h5, h6, .card-title');
  const eyebrowEl = (heading && heading.querySelector('.eyebrow')) || body.querySelector('.eyebrow');
  const eyebrow = text(eyebrowEl);
  if (eyebrow) out.push(para(document, eyebrow));

  let title = '';
  if (heading) {
    const clone = heading.cloneNode(true);
    clone.querySelectorAll('.eyebrow, .sr-only, .visually-hidden').forEach((n) => n.remove());
    title = text(clone);
  }
  const anchor = body.closest('a[href]') || (card && card.matches('a[href]') ? card : null)
    || (card && card.querySelector('a[href]'));
  if (title) {
    const h3 = document.createElement('h3');
    if (anchor) {
      const a = document.createElement('a');
      a.href = anchor.getAttribute('href');
      a.textContent = title;
      h3.append(a);
    } else {
      h3.textContent = title;
    }
    out.push(h3);
  }

  // Description paragraph(s) (.card-text p)
  body.querySelectorAll('p').forEach((p) => {
    if (p.closest('.ArticleView-noResults')) return;
    const value = text(p);
    if (value) out.push(para(document, value));
  });

  // Footer meta: "Article | 03/10/2024"
  const footer = (card && card.querySelector('.card-footer'))
    || (body.nextElementSibling && body.nextElementSibling.matches('.card-footer') ? body.nextElementSibling : null);
  if (footer) {
    const type = text(footer.querySelector('.article-type, .article-footer'));
    const date = text(footer.querySelector('.article-pubTime'));
    const meta = [type, date].filter(Boolean).join(' | ');
    if (meta) out.push(para(document, meta));
  }
  return out;
}

function ctaCard(document, card) {
  const out = [];
  const heading = card.querySelector('.custom-card-title, h1, h2, h3, h4');
  if (text(heading)) {
    const h3 = document.createElement('h3');
    h3.textContent = text(heading);
    out.push(h3);
  }
  card.querySelectorAll('a[href]').forEach((link) => {
    if (!text(link)) return;
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = text(link);
    const p = document.createElement('p');
    p.append(a);
    out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  const cells = [];
  let bodies = [...element.querySelectorAll('.card-body')]
    .filter((b) => !b.closest('.ArticleView-noResults'));
  if (!bodies.length) {
    // Fallback: card wrappers without an inner body wrapper
    bodies = [...element.querySelectorAll('.card')];
  }

  bodies.forEach((body) => {
    const card = body.closest('.card') || body.parentElement;
    const isCta = (card && card.matches('.ret2Movmnt')) || !!body.querySelector('.customCardContent, .card-cta');
    const content = isCta ? ctaCard(document, body) : articleCard(document, body, card);
    if (content.length) cells.push([content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
