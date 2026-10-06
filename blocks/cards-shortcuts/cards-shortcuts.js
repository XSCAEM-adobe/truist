import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Cards Shortcuts
 * One row per tile: [icon image | <p><a href>Label</a></p>]
 * Renders a horizontally scrolling track of linked icon tiles with prev/next controls.
 */

function updateControls(track, prev, next) {
  const max = track.scrollWidth - track.clientWidth - 1;
  prev.disabled = track.scrollLeft <= 0;
  next.disabled = track.scrollLeft >= max;
  const hidden = max <= 0;
  prev.hidden = hidden;
  next.hidden = hidden;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-shortcuts-track';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-shortcuts-item';
    const cells = [...row.children];
    const iconCell = cells.find((c) => c.querySelector('picture') && !c.textContent.trim());
    const pic = iconCell?.querySelector('picture') || row.querySelector('picture');
    const link = row.querySelector('a');
    const labelText = (cells.find((c) => c !== iconCell)?.textContent || row.textContent).trim();

    const tile = document.createElement(link ? 'a' : 'div');
    tile.className = 'cards-shortcuts-tile';
    if (link) {
      tile.href = link.href;
      if (link.title) tile.title = link.title;
      if (link.target) tile.target = link.target;
    }

    const icon = document.createElement('span');
    icon.className = 'cards-shortcuts-icon';
    if (pic) {
      const img = pic.querySelector('img');
      icon.append(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '120' }]));
    }
    const label = document.createElement('span');
    label.className = 'cards-shortcuts-label';
    label.textContent = link ? link.textContent.trim() : labelText;

    tile.append(icon, label);
    li.append(tile);
    ul.append(li);
  });

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'cards-shortcuts-nav cards-shortcuts-prev';
  prev.setAttribute('aria-label', 'Previous');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'cards-shortcuts-nav cards-shortcuts-next';
  next.setAttribute('aria-label', 'Next');

  const scrollByPage = (dir) => {
    const item = ul.querySelector('li');
    const step = item ? item.getBoundingClientRect().width : ul.clientWidth / 2;
    const perPage = Math.max(1, Math.floor(ul.clientWidth / step));
    ul.scrollBy({ left: dir * step * perPage, behavior: 'smooth' });
  };
  prev.addEventListener('click', () => scrollByPage(-1));
  next.addEventListener('click', () => scrollByPage(1));
  ul.addEventListener('scroll', () => updateControls(ul, prev, next), { passive: true });

  const viewport = document.createElement('div');
  viewport.className = 'cards-shortcuts-viewport';
  viewport.append(prev, ul, next);
  block.replaceChildren(viewport);

  const refresh = () => updateControls(ul, prev, next);
  if (window.ResizeObserver) new ResizeObserver(refresh).observe(ul);
  requestAnimationFrame(refresh);
}
