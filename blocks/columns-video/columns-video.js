import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Columns Video
 * 1 row, 2 columns: [heading, body, CTA | optional poster image, Wistia link]
 * The Wistia link (e.g. https://fast.wistia.net/embed/iframe/1196j4aayy) is turned into
 * a responsive iframe. With a poster image the iframe loads on click; without one it
 * loads lazily when the block nears the viewport.
 */

const WISTIA_PATTERNS = [
  /fast\.wistia\.(?:net|com)\/embed\/(?:iframe|medias)\/([a-z0-9]+)/i,
  /wistia\.(?:com|net)\/medias\/([a-z0-9]+)/i,
  /wi\.st\/medias\/([a-z0-9]+)/i,
];

function getWistiaId(url) {
  const match = WISTIA_PATTERNS.map((re) => url.match(re)).find(Boolean);
  return match ? match[1] : null;
}

function buildIframe(id, title, autoplay) {
  const iframe = document.createElement('iframe');
  const params = new URLSearchParams({ videoFoam: 'true' });
  if (autoplay) params.set('autoPlay', 'true');
  iframe.src = `https://fast.wistia.net/embed/iframe/${id}?${params}`;
  iframe.title = title || 'Video';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.setAttribute('allowfullscreen', '');
  iframe.loading = 'lazy';
  iframe.className = 'columns-video-iframe';
  return iframe;
}

/**
 * Wistia's "swatch" is a tiny blurred preview; swap in the full thumbnail from oEmbed.
 * @param {HTMLImageElement} img poster image
 * @param {string} id Wistia media id
 */
async function upgradeWistiaPoster(img, id) {
  try {
    const resp = await fetch(`https://fast.wistia.com/oembed?url=${encodeURIComponent(`https://home.wistia.com/medias/${id}`)}`);
    if (!resp.ok) return;
    const { thumbnail_url: thumb } = await resp.json();
    if (!thumb) return;
    const url = new URL(thumb);
    url.searchParams.set('image_crop_resized', '1280x720');
    img.closest('picture')?.querySelectorAll('source').forEach((s) => s.remove());
    img.src = url.href;
  } catch {
    // keep the authored poster
  }
}

function decorateVideoCell(col, link, id) {
  const pic = col.querySelector('picture');
  const isUrl = (s) => /^https?:/.test(s.trim());
  const title = (!isUrl(link.title) && link.title)
    || (isUrl(link.textContent) ? '' : link.textContent.trim())
    || col.closest('.columns-video')?.querySelector('h1, h2, h3')?.textContent.trim() || 'Video';

  const frame = document.createElement('div');
  frame.className = 'columns-video-frame';

  if (pic) {
    const img = pic.querySelector('img');
    // only same-origin (media bus) images can be resized; external posters stay as authored
    const sameOrigin = new URL(img.src, window.location.href).origin === window.location.origin;
    const poster = sameOrigin
      ? createOptimizedPicture(img.src, img.alt || '', false, [{ width: '900' }])
      : pic;
    const posterImg = poster.querySelector('img');
    posterImg.loading = 'lazy';
    if (/wistia\.(com|net)\/embed\/medias\/[^/]+\/swatch/.test(posterImg.src)) {
      upgradeWistiaPoster(posterImg, id);
    }
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'columns-video-play';
    play.setAttribute('aria-label', `Play video: ${title}`);
    const posterWrap = document.createElement('div');
    posterWrap.className = 'columns-video-poster';
    posterWrap.append(poster, play);
    posterWrap.addEventListener('click', () => {
      frame.replaceChildren(buildIframe(id, title, true));
    }, { once: true });
    frame.append(posterWrap);
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        frame.append(buildIframe(id, title, false));
      }
    }, { rootMargin: '200px' });
    observer.observe(frame);
  }

  // drop the paragraphs that only held the poster / link
  [...col.children].forEach((child) => {
    const emptied = !child.textContent.trim() && !child.querySelector('img, picture, iframe');
    if (child.contains(link) || (pic && child.contains(pic)) || emptied) child.remove();
  });
  if (pic && pic.isConnected) pic.remove();
  link.remove();
  col.prepend(frame);
}

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  block.classList.add(`columns-video-${firstRow.children.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const link = [...col.querySelectorAll('a[href]')].find((a) => getWistiaId(a.href));
      if (link) {
        col.classList.add('columns-video-media-col');
        decorateVideoCell(col, link, getWistiaId(link.href));
        return;
      }
      const onlyPicture = col.querySelector('picture') && !col.textContent.trim();
      col.classList.add(onlyPicture ? 'columns-video-img-col' : 'columns-video-text-col');
    });
  });
}
