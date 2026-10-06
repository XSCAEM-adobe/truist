/**
 * Callout box: a tinted, padded container around authored default content
 * (heading + list / paragraphs). Every cell of every row is merged into one body.
 * The 'mist' option is purely visual and handled in CSS.
 * @param {Element} block
 */
export default function decorate(block) {
  const body = document.createElement('div');
  body.className = 'callout-box-body';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      while (cell.firstChild) body.append(cell.firstChild);
    });
  });
  block.replaceChildren(body);
}
