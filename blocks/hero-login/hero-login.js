import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Hero Login
 * Row 1: background image
 * Row 2: eyebrow, heading, body, CTAs
 * Row 3 (optional): sign-in panel helper links. Recognised by text:
 *   "Forgot user ID?"  -> placed beside "Save user ID"
 *   "Reset password"   -> placed under the password field
 *   "Sign in" (exact)  -> used as the destination of the Sign in button
 *   anything else      -> rendered (as authored) in the panel footer
 * The sign-in form itself is generated here; it is not authored content.
 */

let uid = 0;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === true) node.setAttribute(k, '');
    else if (v !== false && v !== undefined && v !== null) node.setAttribute(k, v);
  });
  node.append(...children);
  return node;
}

function takeLink(container, pattern) {
  if (!container) return null;
  const link = [...container.querySelectorAll('a')].find((a) => pattern.test(a.textContent.trim()));
  if (!link) return null;
  const parent = link.closest('p, li') || link.parentElement;
  link.remove();
  link.classList.remove('button', 'primary', 'secondary');
  if (parent && parent !== container && !parent.textContent.trim() && !parent.querySelector('img, a')) {
    const wrap = parent.closest('.button-container') || parent;
    wrap.remove();
  }
  return link;
}

function buildField(id, label, type, autocomplete) {
  // blank placeholder lets CSS float the label once a value is entered
  const input = el('input', {
    id, name: id, type, autocomplete, required: true, class: 'hero-login-input', placeholder: ' ',
  });
  return el(
    'div',
    { class: 'hero-login-field' },
    el('label', { for: id }, label),
    input,
  );
}

/**
 * Builds the sign-in panel (generated form + helper links). Shared with the
 * header's mobile sign-in overlay.
 * @param {Element|null} linksCell container of helper-link paragraphs
 * @returns {Element}
 */
export function buildSignInPanel(linksCell) {
  uid += 1;
  const prefix = `hero-login-${uid}`;
  const forgotId = takeLink(linksCell, /forgot\s+user/i);
  const resetPw = takeLink(linksCell, /reset\s+password|forgot\s+password/i);
  const signInLink = takeLink(linksCell, /^sign\s*in$/i);

  const form = el('form', { class: 'hero-login-form', novalidate: true, 'aria-label': 'Sign in to online banking' });

  const userField = buildField(`${prefix}-user`, 'User ID', 'text', 'username');
  const saveRow = el(
    'div',
    { class: 'hero-login-row' },
    el(
      'label',
      { class: 'hero-login-check' },
      el('input', { type: 'checkbox', name: 'saveUserId' }),
      el('span', {}, 'Save user ID'),
    ),
  );
  if (forgotId) saveRow.append(forgotId);

  const pwField = buildField(`${prefix}-pw`, 'Password', 'password', 'current-password');
  const pwInput = pwField.querySelector('input');
  const toggle = el('button', {
    type: 'button', class: 'hero-login-toggle', 'aria-pressed': 'false', 'aria-controls': pwInput.id,
  }, 'Show');
  toggle.addEventListener('click', () => {
    const show = pwInput.type === 'password';
    pwInput.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(show));
  });
  pwField.append(toggle);

  const resetRow = el('div', { class: 'hero-login-row hero-login-row-end' });
  if (resetPw) resetRow.append(resetPw);

  const submit = el('button', { type: 'submit', class: 'button hero-login-submit' }, 'Sign in');

  form.append(userField, saveRow, pwField);
  if (resetPw) form.append(resetRow);
  form.append(submit);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Credentials are never posted from this page; route to the bank's sign-in experience.
    if (signInLink) window.location.href = signInLink.href;
  });

  const panel = el('div', { class: 'hero-login-signin' }, form);

  if (linksCell && linksCell.textContent.trim()) {
    const footer = el('div', { class: 'hero-login-signin-links' });
    footer.append(...linksCell.childNodes);
    // strip default button decoration so footer links render as links
    footer.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    footer.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));
    // lead-in text before a link (e.g. "Need a user ID?") renders as a bold label
    footer.querySelectorAll('p').forEach((p) => {
      const lead = p.firstChild;
      if (lead?.nodeType === Node.TEXT_NODE && lead.textContent.trim() && p.querySelector('a')) {
        const span = el('span', { class: 'hero-login-signin-lead' }, lead.textContent.trim());
        lead.replaceWith(span, ' ');
      }
    });
    panel.append(footer);
  }
  return panel;
}

export default function decorate(block) {
  const rows = [...block.children];
  let mediaRow = null;
  let contentRow = null;
  let linksRow = null;

  // be tolerant: the media row is the one whose only content is a picture
  rows.forEach((row) => {
    const onlyPicture = row.querySelector('picture') && !row.textContent.trim();
    if (!mediaRow && onlyPicture) mediaRow = row;
    else if (!contentRow) contentRow = row;
    else if (!linksRow) linksRow = row;
  });

  const media = el('div', { class: 'hero-login-media' });
  const pic = mediaRow?.querySelector('picture');
  if (pic) {
    const img = pic.querySelector('img');
    const optimized = createOptimizedPicture(img.src, img.alt || '', true, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]);
    optimized.querySelector('img').setAttribute('fetchpriority', 'high');
    media.append(optimized);
  }

  const content = el('div', { class: 'hero-login-content' });
  if (contentRow) {
    const cells = [...contentRow.children];
    cells.forEach((cell) => content.append(...cell.childNodes));
  }
  const firstP = content.firstElementChild;
  if (firstP && firstP.tagName === 'P' && firstP.nextElementSibling?.matches('h1, h2, h3')) {
    firstP.classList.add('hero-login-eyebrow');
  }
  const ctas = [...content.querySelectorAll(':scope > .button-container, :scope > p')]
    .filter((p) => p.querySelector('a.button'));
  if (ctas.length) {
    const actions = el('div', { class: 'hero-login-actions' });
    ctas[0].before(actions);
    actions.append(...ctas);
  }

  const linksCell = linksRow ? linksRow.lastElementChild || linksRow : null;
  const panel = buildSignInPanel(linksCell);

  const stage = el('div', { class: 'hero-login-stage' }, media, content);
  block.replaceChildren(stage, panel);
  if (!pic) block.classList.add('hero-login-no-image');
}
