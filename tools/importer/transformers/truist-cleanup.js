/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Truist site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (https://www.truist.com/).
 *
 * Encoding note: cleaned.html is valid UTF-8 (e.g. "Zelle\xC2\xAE" = "Zelle®", 7 real
 * em dashes, zero "â€"/"Â®" byte sequences). The mojibake seen when viewing it is a
 * viewer/decoding artifact, not present in the live DOM, so no text repair is applied.
 *
 * Footnote superscript links (sup > a[href^="#disc"]) are intentionally kept in body.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // OneTrust cookie consent: <div id="onetrust-consent-sdk">
      '#onetrust-consent-sdk',
      // Floating chat/help widget: <div id="tru-floating--bottom-right"> (contains #idLpMessagingHelp)
      '#tru-floating--bottom-right',
      // Hidden personalized home-equity offer: <div id="cro-heloc-personalization">
      '#cro-heloc-personalization',
      // Hidden mobile-only duplicate product slider: <div class="... cro-personalization-slider-mobile">
      '.cro-personalization-slider-mobile',
      // Visually hidden source H1 wrapper: <div id="gridLayout-h1-sr-only"> > h1.sr-only
      '#gridLayout-h1-sr-only',
      // Empty subpage-navigation container: <div id="gridLayout-subpage-navigation">
      '#gridLayout-subpage-navigation',
      // Eligibility modal popup (not page content): <div class="global-popup"> > #popup-component-*
      '.global-popup',
      // JS loading spinners ("Loading" + dots) in login widget and item slider
      '.loading-container-login',
      '.loading-container',
    ]);

    // ---- Homepage only: page-specific footnotes (guarded on .homepage-main-content) ----
    // Verified in runs/home/cleaned.html: footer .footer-local-disclosure-top-orientation-change
    // holds the default-offer notes (#t1-checking-default > #disc01-content, and
    // #text-1997475013 > #disc1..3-content) plus Adobe Target alternatives wrapped in
    // <div class="author-rte-styling unique-target"> ($500 offer, duplicate ††, small business **).
    // Only the default experience is migrated, so the alternatives are dropped and the
    // panel is moved to the end of <main> for the disclosures-footnotes parser.
    if (element.querySelector('.homepage-main-content')) {
      const homeDisc = element.querySelector('footer .footer-local-disclosure-top-orientation-change');
      const homeMain = element.querySelector('main#main') || element.querySelector('main');
      if (homeDisc && homeMain) {
        homeDisc.querySelectorAll('.unique-target').forEach((el) => el.remove());
        if (homeDisc.textContent.trim()) homeMain.append(homeDisc);
      }
    }

    // ---- Article template only (guarded; no effect on home or other templates) ----
    // Verified in article cleaned.html: <div id="main-grid-article" class="... tmp__article ...">
    if (element.querySelector('.tmp__article')) {
      // 1. Page-specific disclosures/footnotes live inside footer.global-footer
      //    (<div id="footer-local-disclosure-top" class="footer-local-disclosure-top-orientation-change">
      //    with <p id="discN-content" class="disc-anchor">). The global footer is removed in
      //    afterTransform, so move this panel to the end of <main id="main"> (after the
      //    related-resources container) so the disclosures-footnotes parser and the
      //    section-4 break can still find it. Only moved when it has content.
      const localDisc = element.querySelector('footer .footer-local-disclosure-top-orientation-change');
      const main = element.querySelector('main#main') || element.querySelector('main');
      if (localDisc && main && localDisc.textContent.trim()) {
        main.append(localDisc);
      }

      WebImporter.DOMUtils.remove(element, [
        // 2. Social share rail (rendered by an EDS auto-block):
        //    <div class="page-sharing"> > <div id="pagesharing-*" class="cmp-pagesharing ...">
        '.cmp-pagesharing',
        '.tmp__article--header--page-share .page-sharing',
        // 3. Hidden "No card error message" in related-resources cards:
        //    <div class="ArticleView-noResults hidden">
        '.ArticleView-noResults',
      ]);

      // 3. Inline <style> elements inside content (e.g. div.htmlcontainer around tables)
      element.querySelectorAll('main style').forEach((el) => el.remove());

      // Screen-reader-only words inside footnote markers in body copy
      // (<sup><a href="#disc1"><span class="sr-only">footnote</span>...1</a></sup>)
      element.querySelectorAll('sup .sr-only').forEach((el) => el.remove());

      // 4. Hero image (.tmp__article--hero--container) is intentionally NOT removed here:
      //    it is read (and consumed) by the hero-article parser.
    }
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Global header (migrated separately): <div class="headertag"> > header.global-header
      'div.headertag',
      'header.global-header',
      // Global footer incl. disclosures panel (migrated separately): <div class="footertag"> > footer.global-footer
      'div.footertag',
      'footer.global-footer',
      // Empty skip-content shell: <div class="maincontent"> > .author-maincontent-styling
      'div.maincontent',
      // Tracking / third-party leftovers
      'wistia-tag-manager',
      '[id^="batBeacon"]',
      'iframe',
      'noscript',
      'link',
    ]);

    // Ad / analytics tracking pixels (e.g. idxgm.rtactivate.com) imported as 1x1 images
    element.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const tiny = img.getAttribute('width') === '1' || img.getAttribute('height') === '1';
      if (tiny || /rtactivate|doubleclick|bat\.bing|facebook\.com\/tr/.test(src)) {
        (img.closest('picture') || img).remove();
      }
    });

    // Empty AEM html containers (div.htmlcontainer with no content)
    element.querySelectorAll('div.htmlcontainer').forEach((el) => {
      if (!el.children.length && !el.textContent.trim()) el.remove();
    });
  }
}
