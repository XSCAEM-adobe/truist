/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-transcript. Base: accordion. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/accordion-transcript/source.html
 *
 * Output (per blocks/accordion-transcript/README.md): one row per item, 2 columns:
 *   [label (e.g. "Transcript") | transcript paragraphs (<strong>speaker</strong> line)]
 *
 * Only the item content is extracted, so the stray AEM debug text node
 * ("Component ID : ... Model : disclaimer ... Position : left") is dropped.
 * Iterates the .border-container item wrappers (block-level), not the toggle buttons.
 */
const DEBUG_RE = /Component ID\s*:|Model\s*:\s*"?disclaimer|Position\s*:\s*"?left/i;

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.border-container')];
  if (!items.length) {
    items = [...element.querySelectorAll('.accordion-card-header')].map((h) => h.parentElement);
  }

  const cells = [];
  items.forEach((item) => {
    const labelEl = item.querySelector('.accordion-text, .accordion-card-header button, .accordion-card-header');
    const label = labelEl ? labelEl.textContent.replace(/\s+/g, ' ').trim() : 'Transcript';

    const body = item.querySelector('.collapse .card-body, .collapse, .card-body');
    const content = [];
    if (body) {
      body.querySelectorAll('.sr-only, .visually-hidden, script, style').forEach((n) => n.remove());
      const blocks = [...body.querySelectorAll('p, ul, ol, h2, h3, h4, h5, h6, table')]
        .filter((n) => !n.parentElement.closest('p, ul, ol, table'));
      blocks.forEach((n) => {
        const text = n.textContent.trim();
        if (!text || DEBUG_RE.test(text)) return;
        content.push(n);
      });
      if (!content.length && body.textContent.trim() && !DEBUG_RE.test(body.textContent)) {
        const p = document.createElement('p');
        p.textContent = body.textContent.replace(/\s+/g, ' ').trim();
        content.push(p);
      }
    }
    if (!label && !content.length) return;
    cells.push([label || 'Transcript', content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-transcript', cells });
  element.replaceWith(block);
}
