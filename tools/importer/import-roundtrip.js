/* eslint-disable */
/* global WebImporter */

/**
 * Round-trip import: re-imports an already-migrated EDS page (its .plain.html markup served
 * as a page) so approved content can be extended through the import pipeline without
 * re-fetching a personalized source page.
 *
 * Input DOM: <main> > section <div>s > default content + block <div class="name">s
 * (rows > cells), exactly as EDS serves .plain.html.
 * Output: sections separated by <hr>, each block rebuilt as a block table.
 *
 * Used for the homepage: truist.com rotates its hero via Adobe Target, so a fresh import
 * can return a different hero. The approved index content plus the page footnotes
 * (disclosures-footnotes, from import-home.js run on the archived snapshot) is imported here.
 */

function toBlockName(className) {
  const [name, ...variants] = className.trim().split(/\s+/);
  return variants.length ? `${name} (${variants.join(', ')})` : name;
}

const BLOCK_LEVEL = /^(P|UL|OL|DIV|H[1-6]|HR|PICTURE|TABLE|BLOCKQUOTE|PRE)$/;

// cell content as a node list (keeps <hr> separators); inline-only content becomes one <p>
function cellContent(document, cell) {
  const nodes = [...cell.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
  if (nodes.some((n) => n.nodeType === 1 && BLOCK_LEVEL.test(n.tagName))) return nodes;
  if (!nodes.length) return '';
  const p = document.createElement('p');
  p.append(...nodes);
  return [p];
}

// The importer strips source <hr>s before transform, so in-cell separators (columns-intro-list
// items) are served as <p>[[hr]]</p> and restored here.
const HR_PLACEHOLDER = '[[hr]]';

function restoreRules(document, root) {
  root.querySelectorAll('p').forEach((p) => {
    if (p.textContent.trim() === HR_PLACEHOLDER) p.replaceWith(document.createElement('hr'));
  });
}

function rebuildBlock(document, blockEl) {
  restoreRules(document, blockEl);
  const cells = [...blockEl.children].map((row) => [...row.children]
    .map((cell) => cellContent(document, cell)));
  const table = WebImporter.Blocks.createBlock(document, {
    name: toBlockName(blockEl.className),
    cells,
  });
  blockEl.replaceWith(table);
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const root = document.querySelector('main') || document.body;
    const main = document.createElement('div');

    const sections = [...root.children].filter((el) => el.tagName === 'DIV');
    sections.forEach((section, i) => {
      [...section.querySelectorAll(':scope > div[class]')].forEach((b) => rebuildBlock(document, b));
      if (i > 0) main.append(document.createElement('hr'));
      main.append(...section.childNodes);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: 'roundtrip' },
    }];
  },
};
