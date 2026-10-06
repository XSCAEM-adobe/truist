/*
 * Columns App Promo
 * 1 row, 2 columns:
 *   [phone image | eyebrow, heading, body, CTA, QR image, QR caption, (optional) store badges]
 * The QR image paragraph and the caption paragraph that follows it are grouped into a QR card.
 * Paragraphs made only of image links (app store badges) are grouped as a badge row.
 */

function isPictureOnly(el) {
  return el && el.tagName === 'P' && el.querySelector('picture') && !el.textContent.trim()
    && !el.querySelector('a');
}

function isBadgeRow(el) {
  if (!el || el.tagName !== 'P') return false;
  const links = [...el.querySelectorAll('a')];
  return links.length > 0 && links.every((a) => a.querySelector('picture, img')) && !el.textContent.trim();
}

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  const cols = [...firstRow.children];
  block.classList.add(`columns-app-promo-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const onlyPicture = col.querySelector('picture') && !col.textContent.trim()
        && col.querySelectorAll('picture').length === 1;
      if (onlyPicture) {
        col.classList.add('columns-app-promo-img-col');
        return;
      }
      col.classList.add('columns-app-promo-text-col');

      const first = col.firstElementChild;
      if (first && first.tagName === 'P' && first.nextElementSibling?.matches('h1, h2, h3')) {
        first.classList.add('columns-app-promo-eyebrow');
      }

      // group QR image + caption
      [...col.children].forEach((child) => {
        if (!child.isConnected || !isPictureOnly(child)) return;
        const qr = document.createElement('div');
        qr.className = 'columns-app-promo-qr';
        child.before(qr);
        child.classList.add('columns-app-promo-qr-image');
        qr.append(child);
        const caption = qr.nextElementSibling;
        if (caption && caption.tagName === 'P' && caption.textContent.trim() && !caption.querySelector('picture')) {
          caption.classList.add('columns-app-promo-qr-text');
          qr.append(caption);
        }
      });

      // group store badges
      const badges = [...col.children].filter(isBadgeRow);
      if (badges.length) {
        const wrap = document.createElement('div');
        wrap.className = 'columns-app-promo-badges';
        badges[0].before(wrap);
        wrap.append(...badges);
        block.classList.add('columns-app-promo-has-badges');
      }
    });
  });
}
