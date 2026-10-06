/**
 * social-share: share rail built from the current page (no authored content).
 * Auto-inserted by scripts.js buildAutoBlocks on pages with Template = article.
 * Any authored content in the block is ignored.
 */

const ICONS = {
  twitter: '<path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.36 5.77L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z"/>',
  facebook: '<path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.46A21 21 0 0 0 14.27 4.3c-2.3 0-3.87 1.4-3.87 3.98v2.22H7.8v3h2.6V21h3.1Z"/>',
  linkedin: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.83v1.54h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13V21h-4v-4.98c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.92 1.3-1.92 2.63V21h-3.9V9.75Z"/>',
  link: '<path d="M10.59 13.41a1 1 0 0 1 0-1.41l3.3-3.3a1 1 0 1 1 1.42 1.42l-3.3 3.3a1 1 0 0 1-1.42 0Zm-1.77 5.65a4 4 0 0 1-5.66-5.66l2.83-2.82a1 1 0 0 1 1.41 1.41l-2.83 2.83a2 2 0 0 0 2.83 2.83l2.83-2.83a1 1 0 0 1 1.41 1.41l-2.82 2.83Zm9.9-5.66a1 1 0 0 1-1.41-1.41l2.83-2.83a2 2 0 0 0-2.83-2.83l-2.83 2.83a1 1 0 1 1-1.41-1.41l2.82-2.83a4 4 0 0 1 5.66 5.66l-2.83 2.82Z"/>',
};

function icon(name) {
  return `<svg class="social-share-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="currentColor">${ICONS[name]}</svg>`;
}

function pageUrl() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (canonical) return canonical;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`;
}

function pageTitle() {
  return document.querySelector('meta[property="og:title"]')?.content || document.title;
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

export default function decorate(block) {
  const url = encodeURIComponent(pageUrl());
  const title = encodeURIComponent(pageTitle());

  const networks = [
    { name: 'twitter', label: 'Share on Twitter', href: `https://twitter.com/intent/tweet?url=${url}&text=${title}` },
    { name: 'facebook', label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { name: 'linkedin', label: 'Share on LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}` },
  ];

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Share this page');
  const ul = document.createElement('ul');
  ul.className = 'social-share-list';

  networks.forEach(({ name, label, href }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = `social-share-link social-share-${name}`;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', label);
    a.title = label;
    a.innerHTML = icon(name);
    li.append(a);
    ul.append(li);
  });

  const copyLi = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'social-share-link social-share-copy';
  button.setAttribute('aria-label', 'Copy page link');
  button.title = 'Copy page link';
  button.innerHTML = icon('link');
  const status = document.createElement('span');
  status.className = 'social-share-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  let timer;
  button.addEventListener('click', async () => {
    try {
      await copyToClipboard(pageUrl());
      status.textContent = 'Link copied';
    } catch (e) {
      status.textContent = 'Unable to copy link';
    }
    clearTimeout(timer);
    timer = setTimeout(() => { status.textContent = ''; }, 3000);
  });
  copyLi.append(button, status);
  ul.append(copyLi);

  nav.append(ul);
  block.replaceChildren(nav);
}
