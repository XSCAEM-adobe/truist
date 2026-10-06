import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Cards Offer
 * One row per card (single column): eyebrow, heading, body, outlined CTA, "Learn more" link.
 * Action paragraphs (link-only paragraphs at the end of the card) are grouped and
 * pinned to the card bottom so CTAs align across a row.
 */

function isLinkOnly(p) {
  if (p.tagName !== 'P') return false;
  const links = [...p.querySelectorAll('a')];
  if (!links.length) return false;
  return p.textContent.trim() === links.map((a) => a.textContent).join('').trim();
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-offer-card';
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture') && !cell.textContent.trim()) {
        cell.className = 'cards-offer-card-image';
      } else {
        cell.className = 'cards-offer-card-body';
      }
      if (cell.children.length || cell.textContent.trim()) li.append(cell);
    });

    const body = li.querySelector('.cards-offer-card-body');
    if (body) {
      const first = body.firstElementChild;
      if (first && first.tagName === 'P' && first.nextElementSibling?.matches('h2, h3, h4, h5')) {
        first.classList.add('cards-offer-eyebrow');
      }
      // trailing link-only paragraphs form the actions group
      let trailing = [];
      let node = body.lastElementChild;
      while (node && isLinkOnly(node)) {
        trailing.unshift(node);
        node = node.previousElementSibling;
      }
      // plain links before the first emphasized (button) link stay inline body links
      const firstCta = trailing.findIndex((p) => p.querySelector('strong a, em a'));
      if (firstCta > 0) {
        trailing.slice(0, firstCta).forEach((p) => {
          p.classList.remove('button-container');
          p.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
        });
        trailing = trailing.slice(firstCta);
      }
      if (trailing.length) {
        const actions = document.createElement('div');
        actions.className = 'cards-offer-actions';
        trailing[0].before(actions);
        actions.append(...trailing);
      }
    }
    if (li.children.length) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
