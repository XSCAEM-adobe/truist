/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table. Base: table.
 * Source: https://www.truist.com/money-mindset/principles/outsmarting-debt/how-when-to-consolidate-debt
 * Also validated on: https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans
 * Selectors validated against migration-work/block-context/table/source.html
 *
 * Output (per blocks/table/README.md + table.js):
 *   One block row per table row, one cell per column; row 1 = column headers
 *   (an empty top-left header cell is kept as an empty cell).
 * Options (block-name variants):
 *   striped      - always (source tables are .table-striped)
 *   row-headers  - when body rows start with th[scope=row]
 *   caption      - when <caption> has text; the caption text is emitted as a paragraph
 *                  immediately BEFORE the block (table.js moves the preceding paragraph
 *                  into <caption>). Empty captions are ignored.
 * Cell content keeps bold / links / inline markup; inline styles and classes are dropped.
 */
function cellContent(document, cell) {
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('.sr-only, .visually-hidden, style, script').forEach((n) => n.remove());
  clone.querySelectorAll('[style], [class]').forEach((n) => {
    n.removeAttribute('style');
    n.removeAttribute('class');
  });
  const html = clone.innerHTML.replace(/&nbsp;/g, ' ').trim();
  if (!html || (!clone.textContent.trim() && !clone.querySelector('img'))) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return [...div.childNodes];
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Rows in document order: thead, then tbody(s), then tfoot (skip nested tables)
  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr')];
  if (!rows.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const colCount = Math.max(...rows.map((r) => [...r.children]
    .filter((c) => /^T[HD]$/.test(c.tagName))
    .reduce((n, c) => n + (parseInt(c.getAttribute('colspan'), 10) || 1), 0)));

  const cells = rows.map((tr) => {
    const row = [];
    [...tr.children].filter((c) => /^T[HD]$/.test(c.tagName)).forEach((c) => {
      row.push(cellContent(document, c));
      const span = parseInt(c.getAttribute('colspan'), 10) || 1;
      for (let i = 1; i < span; i += 1) row.push('');
    });
    while (row.length < colCount) row.push('');
    return row;
  });

  const bodyRows = rows.filter((tr) => !tr.closest('thead'));
  const rowHeaders = bodyRows.length > 0 && bodyRows.every((tr) => {
    const first = tr.querySelector(':scope > th, :scope > td');
    return first && first.tagName === 'TH' && (first.getAttribute('scope') || 'row') === 'row';
  });

  const captionEl = table.querySelector(':scope > caption');
  const captionText = captionEl ? captionEl.textContent.replace(/\s+/g, ' ').trim() : '';

  const variants = ['striped'];
  if (rowHeaders) variants.push('row-headers');
  if (captionText) {
    variants.push('caption');
    const p = document.createElement('p');
    p.innerHTML = captionEl.innerHTML.trim();
    p.querySelectorAll('[style], [class]').forEach((n) => {
      n.removeAttribute('style');
      n.removeAttribute('class');
    });
    element.before(p);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table', variants, cells });
  element.replaceWith(block);
}
