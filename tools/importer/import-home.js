/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroLoginParser from './parsers/hero-login.js';
import cardsShortcutsParser from './parsers/cards-shortcuts.js';
import cardsPromoMosaicParser from './parsers/cards-promo-mosaic.js';
import cardsOfferParser from './parsers/cards-offer.js';
import columnsAppPromoParser from './parsers/columns-app-promo.js';
import columnsVideoParser from './parsers/columns-video.js';
import accordionTranscriptParser from './parsers/accordion-transcript.js';
import columnsSpotlightParser from './parsers/columns-spotlight.js';
import columnsIntroListParser from './parsers/columns-intro-list.js';
import disclosuresFootnotesParser from './parsers/disclosures-footnotes.js';

// TRANSFORMER IMPORTS
import truistCleanupTransformer from './transformers/truist-cleanup.js';
import truistSectionsTransformer from './transformers/truist-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-login': heroLoginParser,
  'cards-shortcuts': cardsShortcutsParser,
  'cards-promo-mosaic': cardsPromoMosaicParser,
  'cards-offer': cardsOfferParser,
  'columns-app-promo': columnsAppPromoParser,
  'columns-video': columnsVideoParser,
  'accordion-transcript': accordionTranscriptParser,
  'columns-spotlight': columnsSpotlightParser,
  'columns-intro-list': columnsIntroListParser,
  'disclosures-footnotes': disclosuresFootnotesParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.truist.com/"
  ],
  "representativeUrl": "https://www.truist.com/",
  "description": "To be named in naming step",
  "blocks": [
    {
      "name": "hero-login",
      "instances": [
        ".custom-herobanner .hero-login-component"
      ]
    },
    {
      "name": "cards-shortcuts",
      "instances": [
        ".cro-personalization-slider-desktop .itemslider"
      ]
    },
    {
      "name": "cards-promo-mosaic",
      "instances": [
        ".merch-two-col .merch-section"
      ]
    },
    {
      "name": "cards-offer",
      "instances": [
        ".policy_static-cardv2-four-col-border-preset"
      ]
    },
    {
      "name": "columns-app-promo",
      "instances": [
        ".policy_container_mobile-banking-feature-v2 .gridlayout-flex-height"
      ]
    },
    {
      "name": "columns-video",
      "instances": [
        ".radius-40.bg-sky-blue-ltr .grid__border-radius-all-40"
      ]
    },
    {
      "name": "accordion-transcript",
      "instances": [
        ".radius-40.bg-sky-blue-ltr .aem-Grid > .accordion"
      ]
    },
    {
      "name": "columns-spotlight",
      "instances": [
        ".radius-40.bg-mist > .aem-Grid"
      ]
    },
    {
      "name": "columns-intro-list",
      "instances": [
        ".special-ankle > .aem-Grid > .gridlayoutcontainer"
      ]
    },
    {
      "name": "disclosures-footnotes",
      "instances": [
        ".footer-local-disclosure-top-orientation-change"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Hero with sign-in panel",
      "selector": [
        ".custom-herobanner"
      ],
      "style": null,
      "blocks": [
        "hero-login"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Product shortcuts",
      "selector": [
        ".cro-personalization-slider-desktop"
      ],
      "style": null,
      "blocks": [
        "cards-shortcuts"
      ],
      "defaultContent": [
        ".cro-personalization-slider-desktop h2.tru-one-slider-heading",
        ".cro-personalization-slider-desktop .text__align--center"
      ]
    },
    {
      "id": "section-3",
      "name": "Featured promotions mosaic",
      "selector": [
        ".merch-two-col"
      ],
      "style": null,
      "blocks": [
        "cards-promo-mosaic"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
      "name": "Product offer cards row",
      "selector": [
        ".bg-ntrl-white:has(> .aem-Grid > .policy_static-cardv2-four-col-border-preset)",
        ".homepage-main-content > .aem-Grid > .tp__margin-bottom--lg"
      ],
      "style": null,
      "blocks": [
        "cards-offer"
      ],
      "defaultContent": []
    },
    {
      "id": "section-5",
      "name": "Mobile app promo",
      "selector": [
        ".policy_container_mobile-banking-feature-v2"
      ],
      "style": null,
      "blocks": [
        "columns-app-promo"
      ],
      "defaultContent": []
    },
    {
      "id": "section-6",
      "name": "Brand video",
      "selector": [
        ".radius-40.bg-sky-blue-ltr"
      ],
      "style": "teal",
      "blocks": [
        "columns-video",
        "accordion-transcript"
      ],
      "defaultContent": []
    },
    {
      "id": "section-7",
      "name": "Sponsorship feature (Miami Dolphins)",
      "selector": [
        ".radius-40.bg-mist"
      ],
      "style": null,
      "blocks": [
        "columns-spotlight"
      ],
      "defaultContent": []
    },
    {
      "id": "section-8",
      "name": "Fraud protection",
      "selector": [
        ".special-ankle",
        ".grid__type--section"
      ],
      "style": null,
      "blocks": [
        "columns-intro-list"
      ],
      "defaultContent": []
    },
    {
      "id": "section-9",
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
  ],
  "urlPattern": "/"
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by a prior parser)
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

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
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
