/**
 * Modal Utilities
 * Shared utility functions for HelpModal and TechDocsModal
 */

export const ModalUtils = {
  /**
   * Render Markdown to HTML using marked.js
   */
  renderMarkdown(markdown) {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
      });

      return marked.parse(markdown);
    } else {
      console.warn('marked.js not available - using fallback');
      return `<pre>${this.escapeHtml(markdown)}</pre>`;
    }
  },

  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Generate table of contents from headings
   * @param {string} containerSelector - CSS selector for content container
   * @param {HTMLElement} modal - Modal element
   * @param {number} minHeadings - Minimum headings required to show TOC
   * @returns {HTMLElement|null} TOC element or null if not enough headings
   */
  generateTOC(containerSelector, modal, minHeadings = 4) {
    const container = modal.querySelector(containerSelector);
    if (!container) return null;

    const headings = container.querySelectorAll('h2, h3');
    if (headings.length < minHeadings) return null;

    // Build TOC structure
    const toc = document.createElement('details');
    toc.className = 'toc-container';
    toc.open = false; // Collapsed by default

    const summary = document.createElement('summary');
    summary.className = 'toc-header';
    summary.innerHTML = '📑 Contents';
    toc.appendChild(summary);

    const list = document.createElement('ul');
    list.className = 'toc-list';

    headings.forEach(heading => {
      // Ensure heading has an ID
      if (!heading.id) {
        heading.id = this.generateIdFromText(heading.textContent);
      }

      const li = document.createElement('li');
      li.className = heading.tagName.toLowerCase() === 'h3' ? 'toc-item toc-level-3' : 'toc-item';

      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      li.appendChild(link);
      list.appendChild(li);
    });

    toc.appendChild(list);

    // Insert at beginning of container
    container.insertBefore(toc, container.firstChild);

    return toc;
  },

  /**
   * Add IDs to all headings for anchor links
   * @param {string} containerSelector - CSS selector for content container
   * @param {HTMLElement} modal - Modal element
   */
  addHeadingIds(containerSelector, modal) {
    const headings = modal.querySelectorAll(
      `${containerSelector} h1, ${containerSelector} h2, ${containerSelector} h3,
       ${containerSelector} h4, ${containerSelector} h5, ${containerSelector} h6`
    );

    headings.forEach(heading => {
      if (!heading.id) {
        heading.id = this.generateIdFromText(heading.textContent);
      }
    });
  },

  /**
   * Generate ID from text (for headings)
   */
  generateIdFromText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  },

  /**
   * Render Mermaid diagrams
   * @param {string} containerSelector - CSS selector for content container
   * @param {HTMLElement} modal - Modal element
   */
  async renderMermaid(containerSelector, modal) {
    if (typeof mermaid === 'undefined') {
      console.warn('Mermaid.js not available');
      return;
    }

    // Find all code blocks with class="language-mermaid"
    const mermaidBlocks = modal.querySelectorAll(
      `${containerSelector} pre code.language-mermaid`
    );

    if (mermaidBlocks.length === 0) {
      return; // No Mermaid blocks found
    }

    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    });

    // Convert code blocks to Mermaid containers
    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i];
      const pre = block.parentElement;
      const mermaidCode = block.textContent;

      // Create Mermaid container
      const container = document.createElement('div');
      container.className = 'mermaid';
      container.textContent = mermaidCode;

      // Replace <pre><code> with <div class="mermaid">
      pre.replaceWith(container);
    }

    // Render Mermaid (all .mermaid elements in container)
    try {
      await mermaid.run({
        querySelector: `${containerSelector} .mermaid`
      });
    } catch (error) {
      console.error('Error rendering Mermaid diagrams:', error);
    }
  },

  /**
   * Close modal (common logic)
   */
  closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    this.showAppHeader(); // Show header again
  },

  /**
   * Open modal (common logic)
   */
  openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    this.hideAppHeader(); // Hide header while modal is open
  },

  /**
   * Hide the app header (when modal opens)
   */
  hideAppHeader() {
    const header = document.querySelector('.app-header');
    if (header) {
      header.style.display = 'none';
    }
  },

  /**
   * Show the app header (when modal closes)
   */
  showAppHeader() {
    const header = document.querySelector('.app-header');
    if (header) {
      header.style.display = '';
    }
  }
};
