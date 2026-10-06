/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 *
 * Options (all combinable):
 *   no-header   - first row is data, not a header (boilerplate)
 *   striped     - alternate row shading
 *   bordered    - cell borders (boilerplate)
 *   row-headers - first cell of each body row is a row header (th scope="row")
 *   caption     - the paragraph authored immediately before the block becomes the <caption>
 */

const OPTION_CLASSES = ['no-header', 'striped', 'bordered', 'row-headers', 'caption'];

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

/**
 * Moves the paragraph authored directly before the block into a <caption>.
 * Removes the default-content wrapper if it becomes empty.
 * @param {Element} block
 * @param {HTMLTableElement} table
 */
function moveCaption(block, table) {
  const wrapper = block.parentElement;
  const prev = wrapper?.previousElementSibling;
  if (!prev || !prev.classList.contains('default-content-wrapper')) return;
  const p = prev.lastElementChild;
  if (!p || p.tagName !== 'P' || !p.textContent.trim()) return;
  const caption = document.createElement('caption');
  while (p.firstChild) caption.append(p.firstChild);
  table.prepend(caption);
  p.remove();
  if (!prev.children.length) prev.remove();
}

export default async function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !active.includes('no-header');
  const rowHeaders = active.includes('row-headers');
  if (header) table.append(thead);
  table.append(tbody);

  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    const isHeaderRow = header && i === 0;
    if (isHeaderRow) thead.append(row);
    else tbody.append(row);
    [...child.children].forEach((col, j) => {
      let cell = buildCell(header ? i : i + 1);
      if (rowHeaders && !isHeaderRow && j === 0) {
        cell = document.createElement('th');
        cell.setAttribute('scope', 'row');
      } else if (isHeaderRow && !col.textContent.trim() && !col.querySelector('img')) {
        // an empty top-left header cell (common with row headers) is not a header
        cell = document.createElement('td');
      }
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });
  block.innerHTML = '';
  block.append(table);

  if (active.includes('caption')) moveCaption(block, table);
}
