/**
 * columns-sidebar: body copy beside a dark purple aside box.
 * Each row: cell 1 = main text, cell 2 = aside (label paragraph + list).
 * Extra cells are folded into the aside; a single-cell row renders as main text only.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-sidebar-row');
    const [main, aside, ...rest] = [...row.children];
    if (main) main.classList.add('columns-sidebar-main');
    if (!aside) {
      row.classList.add('columns-sidebar-single');
      return;
    }
    rest.forEach((cell) => {
      while (cell.firstChild) aside.append(cell.firstChild);
      cell.remove();
    });

    const box = document.createElement('aside');
    box.className = 'columns-sidebar-aside';
    while (aside.firstChild) box.append(aside.firstChild);
    aside.replaceWith(box);

    // an optional leading icon (image-only paragraph) is decorative
    let first = box.firstElementChild;
    if (first?.tagName === 'P' && first.querySelector('picture, img') && !first.textContent.trim()) {
      first.classList.add('columns-sidebar-icon');
      first = first.nextElementSibling;
    }

    // first paragraph directly followed by a list is the box label
    if (first && first.tagName === 'P' && first.nextElementSibling?.matches('ul, ol')) {
      first.classList.add('columns-sidebar-label');
      const labelId = `columns-sidebar-label-${Math.random().toString(36).slice(2, 8)}`;
      first.id = labelId;
      box.setAttribute('aria-labelledby', labelId);
    }
  });
}
