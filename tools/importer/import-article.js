/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroArticleParser from './parsers/hero-article.js';
import calloutBoxParser from './parsers/callout-box.js';
import columnsSidebarParser from './parsers/columns-sidebar.js';
import tableParser from './parsers/table.js';
import cardsArticleParser from './parsers/cards-article.js';
import disclosuresFootnotesParser from './parsers/disclosures-footnotes.js';

// TRANSFORMER IMPORTS
import truistCleanupTransformer from './transformers/truist-cleanup.js';
import truistSectionsTransformer from './transformers/truist-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-article': heroArticleParser,
  'callout-box': calloutBoxParser,
  'columns-sidebar': columnsSidebarParser,
  'table': tableParser,
  'cards-article': cardsArticleParser,
  'disclosures-footnotes': disclosuresFootnotesParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "article",
  "urls": [
    "https://www.truist.com/money-mindset/principles/outsmarting-debt/how-when-to-consolidate-debt",
    "https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans"
  ],
  "description": "Money and Mindset article: title + date line, intro, highlights callout, rich body (headings, lists, tables), Q&A / next-steps callouts, related resources, closing CTA",
  "blocks": [
    {
      "name": "hero-article",
      "instances": [
        ".tmp__article--header"
      ]
    },
    {
      "name": "callout-box",
      "instances": [
        ".tmp__article--body .grid__bg-color--light-gray",
        ".tmp__article--body .grid__bg-color--light-purple",
        ".tmp__article--body .gridlayoutcontainer:has(> .bg-mist)"
      ]
    },
    {
      "name": "columns-sidebar",
      "instances": [
        ".tmp__article--body > .aem-Grid > .responsivegrid > .aem-Grid > .gridlayoutcontainer:has(.grid__bg-color--midnight-purple)"
      ]
    },
    {
      "name": "table",
      "instances": [
        ".tmp__article--body table"
      ]
    },
    {
      "name": "cards-article",
      "instances": [
        ".tmp__article--related-resources .cmp-articlecards-list"
      ]
    },
    {
      "name": "disclosures-footnotes",
      "instances": [
        "footer .footer-local-disclosure-top-orientation-change",
        ".footer-local-disclosure-top-orientation-change"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Article header",
      "selector": [
        ".tmp__article--hero--container",
        ".tmp__article--header"
      ],
      "style": null,
      "blocks": [
        "hero-article"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Article body",
      "selector": [
        ".tmp__article--body"
      ],
      "style": null,
      "blocks": [
        "callout-box",
        "columns-sidebar",
        "table"
      ],
      "defaultContent": [
        ".tmp__article--body > .aem-Grid > .responsivegrid > .aem-Grid > .text"
      ]
    },
    {
      "id": "section-3",
      "name": "Related resources",
      "selector": [
        ".tmp__article--related-resources"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-article"
      ],
      "defaultContent": [
        ".tmp__article--related-resources .text h2"
      ]
    },
    {
      "id": "section-4",
      "name": "Page-specific disclosures (footnotes)",
      "selector": [
        "footer .footer-local-disclosure-top-orientation-change",
        ".footer-local-disclosure-top-orientation-change"
      ],
      "style": null,
      "blocks": [
        "disclosures-footnotes"
      ],
      "defaultContent": []
    }
  ]
};

// TRANSFORMER REGISTRY - cleanup first, sections after (needs 2+ sections)
const transformers = [
  truistCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [truistSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/**
 * Article metadata read from the source before parsing (the date line is consumed by the
 * hero-article parser). Keys are lowercase so they resolve the same locally and in DA.
 * @param {Document} document
 */
function readArticleMeta(document) {
  const eyebrow = document.querySelector('.tmp__article--title-eyebrow')?.textContent.replace(/\s+/g, ' ').trim() || '';
  const [category, date] = eyebrow.split('|').map((s) => s.trim());
  const topic = document.querySelector('.cmp-breadcrumb__item--active, .tmp__article--title-eyebrow + * .topic')?.textContent.trim();
  return {
    template: PAGE_TEMPLATE.name,
    ...(category ? { category } : {}),
    ...(date ? { 'publication-date': date } : {}),
    ...(topic ? { topic } : {}),
  };
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Article metadata (before parsers consume the header)
    const articleMeta = readArticleMeta(document);

    // 3. Find and parse blocks (skip elements already replaced by a prior parser)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. Page metadata: built-in title/description/image plus article fields
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    Object.assign(meta, articleMeta);
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
