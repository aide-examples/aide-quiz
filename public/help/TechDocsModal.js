/**
 * TechDocsModal - Technical documentation modal
 * Loads and renders tech docs from docs/ with navigation between documents
 * Features:
 * - Link interception (internal Markdown links stay in modal)
 * - Breadcrumb navigation
 * - Buttons: ← App, ? Help
 * - Mermaid support for UML diagrams
 */

import { ModalUtils } from './modal-utils.js';
import { DocSearch } from './DocSearch.js';
import { log } from '../common/ApiHelpers.js';
import { BASE_PATH } from '../common/BasePath.js';

// List of all documentation files to index
const DOCS_FILE_LIST = [
  'INDEX.md',
  'ACCESSIBILITY.md',
  'AI_COMMANDS.md',
  'AI_WORKFLOW.md',
  'API_REFERENCE.md',
  'ARCHITECTURE_REVIEW.md',
  'DATA.md',
  'DEPLOYMENT.md',
  'DEVELOPMENT_GUIDELINES.md',
  'ERROR_HANDLING.md',
  'EXERCISES.md',
  'EXTERNAL_LIBS.md',
  'FUNCTIONS.md',
  'INTERNATIONALIZATION.md',
  'LOCAL_SETUP.md',
  'LOGGING.md',
  'PROJECT_METRICS.md',
  'QUICK_REFERENCE.md',
  'RATIONALE.md',
  'REQUESTS.md',
  'SECURITY.md',
  'STUDENT_GUIDE.md',
  'TESTING.md',
  'TOOLS.md',
  'UI_GUIDELINES.md'
];

class TechDocsModal {
  /**
   * @param {string} startPage - Initial page (default: 'INDEX.md')
   * @param {Object} helpModal - Reference to HelpModal for switching
   */
  constructor(startPage = 'INDEX.md', helpModal = null) {
    this.basePath = BASE_PATH + '/docs/';
    this.startPage = startPage;
    this.currentPage = startPage;
    this.helpModal = helpModal;
    this.modal = null;
    this.button = null;
    this.isOpen = false;

    // Search
    this.docSearch = new DocSearch(this.basePath, DOCS_FILE_LIST);
    this.searchResults = [];
    this.selectedResultIndex = -1;
    this.searchDebounceTimer = null;
    this.currentSearchQuery = '';        // Current search query (preserved for multiple clicks)
    this.pendingSearchHighlight = null;  // Query to highlight after page load

    this.init();
  }

  /**
   * Initialization: Create button and modal
   */
  init() {
    this.createButton();
    this.createModal();
    this.attachEventListeners();
  }

  /**
   * Creates the architecture button in header (if container exists)
   */
  createButton() {
    const headerContainer = document.getElementById('arch-button-container');

    if (headerContainer) {
      this.button = document.createElement('button');
      this.button.className = 'arch-btn';
      this.button.innerHTML = '🏛️';
      this.button.title = 'Technical documentation';
      this.button.setAttribute('aria-label', 'Open tech docs');
      headerContainer.appendChild(this.button);
    }
    // No fallback - buttons only appear in header
  }

  /**
   * Creates the modal element
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'tech-docs-modal';
    this.modal.innerHTML = `
      <div class="tech-docs-modal-overlay"></div>
      <div class="tech-docs-modal-content">
        <div class="tech-docs-modal-header">
          <div class="tech-docs-breadcrumb">
            <span class="breadcrumb-icon">🏛️</span>
            <span class="breadcrumb-text breadcrumb-home" title="Back to index">Tech Docs</span>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">INDEX.md</span>
          </div>
          <div class="tech-docs-modal-actions">
            <div class="modal-search">
              <input type="text"
                     class="modal-search-input"
                     placeholder="Search docs..."
                     aria-label="Search documentation">
              <span class="modal-search-icon">🔍</span>
              <button class="modal-search-clear" aria-label="Clear search">&times;</button>
              <div class="modal-search-results" role="listbox" aria-label="Search results"></div>
            </div>
            <button class="modal-icon-btn" id="backToApp" title="Back to AIDE Quiz">
              <span>🎯</span>
            </button>
            <button class="modal-icon-btn" id="openHelp" title="User help">
              <span>?</span>
            </button>
          </div>
        </div>
        <div class="tech-docs-modal-body">
          <div class="tech-docs-modal-loading">
            <div class="spinner"></div>
            <p>Opening documentation...</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);
  }

  /**
   * Add event listeners
   */
  attachEventListeners() {
    // Architecture button opens modal (if button exists)
    if (this.button) {
      this.button.addEventListener('click', () => this.open());
    }

    // Overlay click closes modal
    const overlay = this.modal.querySelector('.tech-docs-modal-overlay');
    overlay.addEventListener('click', () => this.close());

    // Back-to-App button (🎯 icon) - just close, no navigation
    const backBtn = this.modal.querySelector('#backToApp');
    backBtn.addEventListener('click', () => this.close());

    // Open-Help button (? icon)
    const helpBtn = this.modal.querySelector('#openHelp');
    helpBtn.addEventListener('click', () => {
      this.close();
      if (this.helpModal) {
        this.helpModal.open();
      }
    });

    // Breadcrumb Home - back to INDEX.md
    const breadcrumbHome = this.modal.querySelector('.breadcrumb-home');
    breadcrumbHome.addEventListener('click', () => {
      this.loadPage('INDEX.md');
    });

    // ESC key closes modal or search
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        const searchResults = this.modal.querySelector('.modal-search-results');
        if (searchResults.classList.contains('active')) {
          this.hideSearchResults();
        } else {
          this.close();
        }
      }
    });

    // Search input
    const searchInput = this.modal.querySelector('.modal-search-input');
    const searchClear = this.modal.querySelector('.modal-search-clear');

    searchInput.addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      this.handleSearchKeydown(e);
    });

    searchInput.addEventListener('focus', () => {
      if (this.searchResults.length > 0) {
        this.showSearchResults();
      }
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      this.hideSearchResults();
      searchInput.focus();
    });

    // Close search when clicking outside
    this.modal.addEventListener('click', (e) => {
      const searchContainer = this.modal.querySelector('.modal-search');
      if (!searchContainer.contains(e.target)) {
        this.hideSearchResults();
      }
    });
  }

  /**
   * Open modal and load start page
   */
  async open(page = null) {
    ModalUtils.openModal(this.modal);
    this.isOpen = true;

    const targetPage = page || this.startPage;
    await this.loadPage(targetPage);
  }

  /**
   * Close modal
   */
  close() {
    ModalUtils.closeModal(this.modal);
    this.isOpen = false;
  }

  /**
   * Load and render page
   */
  async loadPage(page) {
    this.currentPage = page;
    this.updateBreadcrumb(page);

    const bodyEl = this.modal.querySelector('.tech-docs-modal-body');
    let loadingEl = this.modal.querySelector('.tech-docs-modal-loading');
    let contentEl = this.modal.querySelector('.tech-docs-content');

    // Recreate loading element if not present
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = 'tech-docs-modal-loading';
      loadingEl.innerHTML = `
        <div class="spinner"></div>
        <p>Opening documentation...</p>
      `;
      bodyEl.insertBefore(loadingEl, bodyEl.firstChild);
    }

    // Create content element if not present
    if (!contentEl) {
      contentEl = document.createElement('div');
      contentEl.className = 'tech-docs-content modal-markdown';
      bodyEl.appendChild(contentEl);
    }

    // Show loading, hide content
    loadingEl.style.display = 'flex';
    contentEl.style.display = 'none';

    try {
      // URL-encode for filenames with special characters (spaces, etc.)
      const encodedPage = encodeURIComponent(page).replace(/%2F/g, '/');
      const url = this.basePath + encodedPage;

      log('TechDocs loading:', page, '→', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const markdown = await response.text();

      // Convert Markdown to HTML
      const html = ModalUtils.renderMarkdown(markdown);

      // Hide loading, show content
      loadingEl.style.display = 'none';
      contentEl.innerHTML = html;
      contentEl.style.display = 'block';

      // Scroll to top
      bodyEl.scrollTop = 0;

      // Intercept links (for internal navigation)
      this.interceptLinks();

      // Add IDs to headings for anchor links
      ModalUtils.addHeadingIds('.tech-docs-content', this.modal);

      // Generate table of contents (if enough headings)
      ModalUtils.generateTOC('.tech-docs-content', this.modal, 4);

      // Render Mermaid diagrams
      await ModalUtils.renderMermaid('.tech-docs-content', this.modal);

      // Highlight search terms and scroll to first match (if coming from search)
      if (this.pendingSearchHighlight) {
        this.highlightAndScrollToMatch(contentEl, bodyEl);
      }

    } catch (error) {
      console.error('Error loading tech docs:', error);
      loadingEl.style.display = 'none';
      contentEl.innerHTML = `
        <div class="tech-docs-error">
          <h3>⚠️ Document not found</h3>
          <p>The file could not be loaded.</p>
          <p class="tech-docs-error-details">Path: ${this.basePath + page}</p>
          <button class="btn btn-primary" onclick="window.techDocsModal.loadPage('INDEX.md')">
            back to index
          </button>
        </div>
      `;
      contentEl.style.display = 'block';
    }
  }

  /**
   * Update breadcrumb
   */
  updateBreadcrumb(page) {
    const breadcrumbEl = this.modal.querySelector('.breadcrumb-current');
    const displayName = page.replace('.md', '').replace(/%20/g, ' ');
    breadcrumbEl.textContent = displayName;
  }

  /**
   * Convert Markdown to HTML
   */
  /**
   * Intercept links for internal navigation
   */
  interceptLinks() {
    const links = this.modal.querySelectorAll('.tech-docs-content a');

    links.forEach(link => {
      const href = link.getAttribute('href');

      if (!href) return;

      // External links (http/https) - new tab
      if (href.startsWith('http://') || href.startsWith('https://')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        return;
      }

      // Anchor links (within document) - browser default
      if (href.startsWith('#')) {
        return;
      }

      // All other links (including .md) - load in modal
      // This intercepts: "FILE.md", "FILE%20WITH%20SPACE.md", etc.
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Decode URL-encoded characters (%20 -> space)
        const decodedHref = decodeURIComponent(href);

        log('TechDocs Link clicked:', decodedHref);
        this.loadPage(decodedHref);
      });
    });
  }

  // ============================================================================
  // Search Methods
  // ============================================================================

  /**
   * Handle search input with debounce
   */
  handleSearchInput(query) {
    clearTimeout(this.searchDebounceTimer);

    if (!query || query.length < 2) {
      this.hideSearchResults();
      this.currentSearchQuery = '';
      return;
    }

    // Store current query for use in selectSearchResult
    this.currentSearchQuery = query;

    // Show loading state
    this.showSearchLoading();

    // Debounce search
    this.searchDebounceTimer = setTimeout(async () => {
      try {
        this.searchResults = await this.docSearch.search(query, 8);
        this.selectedResultIndex = -1;
        this.renderSearchResults(query);
      } catch (error) {
        console.error('Search error:', error);
        this.hideSearchResults();
      }
    }, 200);
  }

  /**
   * Handle keyboard navigation in search
   */
  handleSearchKeydown(e) {
    const resultsContainer = this.modal.querySelector('.modal-search-results');
    if (!resultsContainer.classList.contains('active')) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedResultIndex = Math.min(
          this.selectedResultIndex + 1,
          this.searchResults.length - 1
        );
        this.updateSelectedResult();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedResultIndex = Math.max(this.selectedResultIndex - 1, -1);
        this.updateSelectedResult();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.selectedResultIndex >= 0 && this.selectedResultIndex < this.searchResults.length) {
          this.selectSearchResult(this.searchResults[this.selectedResultIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.hideSearchResults();
        break;
    }
  }

  /**
   * Show loading state in search results
   */
  showSearchLoading() {
    const resultsContainer = this.modal.querySelector('.modal-search-results');
    resultsContainer.innerHTML = `
      <div class="modal-search-loading">
        <div class="modal-search-loading-spinner"></div>
        <p>Searching...</p>
      </div>
    `;
    resultsContainer.classList.add('active');
  }

  /**
   * Render search results
   */
  renderSearchResults(query) {
    const resultsContainer = this.modal.querySelector('.modal-search-results');

    if (this.searchResults.length === 0) {
      resultsContainer.innerHTML = `
        <div class="modal-search-no-results">
          <div class="modal-search-no-results-icon">🔍</div>
          <p class="modal-search-no-results-text">No results for "${query}"</p>
        </div>
      `;
      resultsContainer.classList.add('active');
      return;
    }

    const resultsHtml = this.searchResults.map((result, index) => {
      const preview = this.docSearch.highlight(result.preview, query);
      const sectionHtml = result.section
        ? `<span class="modal-search-result-section">${result.section}</span>`
        : '';

      return `
        <div class="modal-search-result" data-index="${index}" role="option">
          <div class="modal-search-result-title">
            <span class="modal-search-result-icon">📄</span>
            <span class="modal-search-result-file">${result.title}</span>
          </div>
          <div class="modal-search-result-preview">${preview}</div>
          ${sectionHtml}
        </div>
      `;
    }).join('');

    resultsContainer.innerHTML = `
      <div class="modal-search-results-header">
        ${this.searchResults.length} result${this.searchResults.length !== 1 ? 's' : ''}
      </div>
      ${resultsHtml}
      <div class="modal-search-hints">
        <span class="modal-search-hint"><kbd>↑↓</kbd> navigate</span>
        <span class="modal-search-hint"><kbd>Enter</kbd> select</span>
        <span class="modal-search-hint"><kbd>Esc</kbd> close</span>
      </div>
    `;

    // Add click handlers
    resultsContainer.querySelectorAll('.modal-search-result').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index, 10);
        this.selectSearchResult(this.searchResults[index]);
      });
    });

    resultsContainer.classList.add('active');
  }

  /**
   * Update visual selection of results
   */
  updateSelectedResult() {
    const resultsContainer = this.modal.querySelector('.modal-search-results');
    const items = resultsContainer.querySelectorAll('.modal-search-result');

    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedResultIndex);
      if (index === this.selectedResultIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  /**
   * Select a search result and navigate to it
   */
  selectSearchResult(result) {
    // Use stored query (not input value - it may be empty after first click!)
    this.pendingSearchHighlight = this.currentSearchQuery;

    this.hideSearchResults();

    // Clear input
    const searchInput = this.modal.querySelector('.modal-search-input');
    searchInput.value = '';

    // Load the document (highlighting happens in loadPage)
    this.loadPage(result.file);
  }

  /**
   * Show search results dropdown
   */
  showSearchResults() {
    const resultsContainer = this.modal.querySelector('.modal-search-results');
    resultsContainer.classList.add('active');
  }

  /**
   * Hide search results dropdown
   */
  hideSearchResults() {
    const resultsContainer = this.modal.querySelector('.modal-search-results');
    resultsContainer.classList.remove('active');
    this.selectedResultIndex = -1;
  }

  /**
   * Highlight search terms in content and scroll to first match
   */
  highlightAndScrollToMatch(contentEl, scrollContainer) {
    const query = this.pendingSearchHighlight;
    this.pendingSearchHighlight = null;

    if (!query || query.length < 2) {
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Collect all text nodes that contain the query
    const walker = document.createTreeWalker(
      contentEl,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.toLowerCase().includes(lowerQuery)) {
        nodesToProcess.push(node);
      }
    }

    if (nodesToProcess.length === 0) return;

    // Process each node - use simple string operations instead of regex
    let firstMark = null;

    nodesToProcess.forEach((textNode, nodeIndex) => {
      const text = textNode.textContent;
      const fragment = document.createDocumentFragment();

      let remaining = text;
      let lowerRemaining = remaining.toLowerCase();
      let matchCount = 0;
      let idx;

      // Find all occurrences in this text node
      while ((idx = lowerRemaining.indexOf(lowerQuery)) !== -1) {
        // Text before match
        if (idx > 0) {
          fragment.appendChild(document.createTextNode(remaining.slice(0, idx)));
        }

        // The match (preserving original case)
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = remaining.slice(idx, idx + query.length);
        fragment.appendChild(mark);

        if (!firstMark) firstMark = mark;
        matchCount++;

        // Continue with remaining text
        remaining = remaining.slice(idx + query.length);
        lowerRemaining = remaining.toLowerCase();
      }

      // Add any remaining text after last match
      if (remaining) {
        fragment.appendChild(document.createTextNode(remaining));
      }

      // Replace original node with fragment
      if (matchCount > 0 && textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });

    // Scroll to first match
    if (firstMark) {
      setTimeout(() => {
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }

  /**
   * Completely remove modal (cleanup)
   */
  destroy() {
    if (this.button) {
      this.button.remove();
    }
    if (this.modal) {
      this.modal.remove();
    }
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}

// Export for ES6 modules
export { TechDocsModal };
