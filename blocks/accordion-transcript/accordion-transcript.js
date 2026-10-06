/*
 * Accordion Transcript
 * One row per collapsible item: [label (e.g. "Transcript") | transcript paragraphs]
 * Typically a single item placed directly after a video. Collapsed by default.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, body] = [...row.children];
    const details = document.createElement('details');
    details.className = 'accordion-transcript-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-transcript-item-label';
    const labelText = label && label.textContent.trim();
    if (label && labelText) summary.append(...label.childNodes);
    else summary.textContent = 'Transcript';

    const content = body || document.createElement('div');
    content.className = 'accordion-transcript-item-body';

    // speaker lines: "<strong>Speaker:</strong> line"
    content.querySelectorAll(':scope > p').forEach((p) => {
      const first = p.firstElementChild;
      if (first && first.tagName === 'STRONG' && p.firstChild === first) {
        p.classList.add('accordion-transcript-line');
        first.classList.add('accordion-transcript-speaker');
      }
    });

    details.append(summary, content);
    row.replaceWith(details);
  });
}
