import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Cards Promo Mosaic
 * One row per promo: [optional image | eyebrow, heading, body, CTAs]
 * Cards without an image stack in the first column; a card with an image
 * occupies the second column and spans the stacked cards (desktop).
 */

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-promo-mosaic-card';

    [...row.children].forEach((cell) => {
      const isImage = cell.querySelector('picture') && !cell.textContent.trim();
      if (isImage) {
        cell.className = 'cards-promo-mosaic-card-image';
        li.append(cell);
      } else if (cell.textContent.trim() || cell.querySelector('a, picture')) {
        cell.className = 'cards-promo-mosaic-card-body';
        li.append(cell);
      }
      // empty cells (e.g. an empty image column) are dropped
    });

    const body = li.querySelector('.cards-promo-mosaic-card-body');
    if (body) {
      const first = body.firstElementChild;
      if (first && first.tagName === 'P' && first.nextElementSibling?.matches('h1, h2, h3, h4')) {
        first.classList.add('cards-promo-mosaic-eyebrow');
      }
      const ctas = [...body.children].filter((p) => p.tagName === 'P' && p.querySelector('a')
        && p.textContent.trim() === [...p.querySelectorAll('a')].map((a) => a.textContent).join('').trim());
      if (ctas.length) {
        const actions = document.createElement('div');
        actions.className = 'cards-promo-mosaic-actions';
        ctas[0].before(actions);
        actions.append(...ctas);
      }
    }

    if (li.querySelector('.cards-promo-mosaic-card-image')) li.classList.add('cards-promo-mosaic-card-has-image');
    if (li.children.length) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
  });

  block.replaceChildren(ul);
}
