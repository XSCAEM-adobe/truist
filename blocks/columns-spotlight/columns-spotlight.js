/*
 * Columns Spotlight
 * 1 row, 2 columns: [photo | logo lockup image, heading, body, CTA]
 * A picture-only paragraph at the top of the text column is treated as a logo lockup.
 */

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  block.classList.add(`columns-spotlight-${firstRow.children.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pictures = col.querySelectorAll('picture');
      const onlyPicture = pictures.length === 1 && !col.textContent.trim();
      if (onlyPicture) {
        col.classList.add('columns-spotlight-img-col');
        return;
      }
      col.classList.add('columns-spotlight-text-col');
      const first = col.firstElementChild;
      if (first && first.querySelector('picture') && !first.textContent.trim()) {
        first.classList.add('columns-spotlight-logo');
      }
    });
  });
}
