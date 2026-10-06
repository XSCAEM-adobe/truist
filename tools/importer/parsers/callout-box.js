/* eslint-disable */
/* global WebImporter */
/**
 * Parser for callout-box. Base: callout (custom).
 * Source: https://www.truist.com/money-mindset/principles/outsmarting-debt/how-when-to-consolidate-debt
 * Also validated on: https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans
 * Selectors validated against migration-work/block-context/callout-box/source.html and the live gap page.
 *
 * Output (per blocks/callout-box/README.md): 1 row, 1 cell of default content
 *   (heading H2/H3 + list or paragraphs). Inline links + <sup><a href="#discN">N</a></sup> kept.
 * Variant (option class):
 *   .grid__bg-color--light-gray (grey)                      -> "Callout Box"
 *   .bg-mist / .grid__bg-color--light-purple (lavender)     -> "Callout Box (mist)"
 * Gap page: the "The highlights" H2 sits in the sibling div.text directly before the
 * mist box; it is pulled into the block (and removed from the page).
 */
const CONTENT_TAGS = 'h1, h2, h3, h4, h5, h6, p, ul, ol, table, blockquote';

function cleanFootnoteLinks(scope) {
  scope.querySelectorAll('sup a[href^="#disc"], a[name="disclaimer-sup"]').forEach((a) => {
    a.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
    const marker = a.textContent.replace(/\s+/g, ' ').trim();
    const href = a.getAttribute('href');
    [...a.attributes].forEach((attr) => a.removeAttribute(attr.name));
    a.setAttribute('href', href);
    a.textContent = marker;
  });
  scope.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
  scope.querySelectorAll('[class]').forEach((n) => n.removeAttribute('class'));
}

function collectContent(scope) {
  // Rich-text containers hold the authored content; take their direct block children.
  const rtes = [...scope.querySelectorAll('.author-rte-styling')];
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

/** A preceding sibling div.text that only holds a heading (gap-page "The highlights"). */
function precedingHeading(element) {
  const prev = element.previousElementSibling;
  if (!prev || !prev.matches('.text')) return null;
  const rte = prev.querySelector('.author-rte-styling') || prev;
  const kids = [...rte.children].filter((c) => c.textContent.trim());
  if (kids.length !== 1 || !/^H[1-6]$/.test(kids[0].tagName)) return null;
  return { wrapper: prev, heading: kids[0] };
}

export default function parse(element, { document }) {
  const isMist = element.matches('.grid__bg-color--light-purple, .bg-mist')
    || !!element.querySelector(':scope > .bg-mist, .grid__bg-color--light-purple');

  const content = collectContent(element);
  if (!content.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Pull in a detached heading that introduces the box
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
    name: 'callout-box',
    variants: isMist ? ['mist'] : [],
    cells,
  });
  element.replaceWith(block);
}
