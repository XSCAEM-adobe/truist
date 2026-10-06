/*
 * Columns Intro List
 * 1 row, 2 columns:
 *   [icon, heading, body | eyebrow, heading, body, link, <hr>, eyebrow, heading, body, link, ...]
 * The first column is a centred intro. The second column is split on <hr> into stacked items.
 */

function markEyebrows(container) {
  container.querySelectorAll(':scope > p + h2, :scope > p + h3, :scope > p + h4').forEach((h) => {
    const p = h.previousElementSibling;
    if (p && !p.querySelector('picture, a')) p.classList.add('columns-intro-list-eyebrow');
  });
}

function splitItems(col) {
  const items = [];
  let current = document.createElement('div');
  [...col.childNodes].forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'HR') {
      if (current.childNodes.length) items.push(current);
      current = document.createElement('div');
      return;
    }
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
    current.append(node);
  });
  if (current.childNodes.length) items.push(current);
  items.forEach((item) => {
    item.className = 'columns-intro-list-item';
    markEyebrows(item);
  });
  col.replaceChildren(...items);
}

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  block.classList.add(`columns-intro-list-${firstRow.children.length}-cols`);

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    cols.forEach((col, i) => {
      if (i === 0) {
        col.classList.add('columns-intro-list-intro');
        const first = col.firstElementChild;
        if (first && first.querySelector('picture') && !first.textContent.trim()) {
          first.classList.add('columns-intro-list-icon');
        }
        markEyebrows(col);
      } else {
        col.classList.add('columns-intro-list-list');
        splitItems(col);
      }
    });
  });
}
