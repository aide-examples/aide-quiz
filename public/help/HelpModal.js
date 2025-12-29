/**
 * HelpModal - Reusable help component
 * Loads and renders Markdown help files in a modal
 */

import { ModalUtils } from './modal-utils.js';
import { DocSearch } from './DocSearch.js';
import { log } from '../common/ApiHelpers.js';
import { BASE_PATH } from '../common/BasePath.js';

// List of all app help files to index
const HELP_FILE_LIST = [
  { file: 'README.md', basePath: '/editor/', label: 'Quiz Editor' },
  { file: 'README.md', basePath: '/quiz/', label: 'Quiz Participation' },
  { file: 'README.md', basePath: '/stats/', label: 'Statistics' },
  { file: 'README.md', basePath: '/result/', label: 'Results' }
];

class HelpModal {
  /**
   * @param {string} readmePath - Path to README.md file (relative)
   * @param {string} buttonText - Text for help button (optional)
   * @param {Object} techDocsModal - Reference to TechDocsModal for switching (optional)
   */
  constructor(readmePath, buttonText = '?', techDocsModal = null) {
    this.readmePath = readmePath;
    this.buttonText = buttonText;
    this.techDocsModal = techDocsModal;
    this.modal = null;
    this.button = null;
    this.isOpen = false;

    // Search - uses a combined index of all app help files
    this.helpSearchIndex = null;
    this.searchResults = [];
    this.selectedResultIndex = -1;
    this.searchDebounceTimer = null;

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
   * Creates the help button in header (if container exists)
   */
  createButton() {
    const headerContainer = document.getElementById('help-button-container');

    if (headerContainer) {
      this.button = document.createElement('button');
      this.button.className = 'help-btn';
      this.button.innerHTML = this.buttonText;
      this.button.title = 'Show help';
      this.button.setAttribute('aria-label', 'Open help');
      headerContainer.appendChild(this.button);
    }
    // No fallback - buttons only appear in header
  }

  /**
   * Creates the modal element
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'help-modal';
    this.modal.innerHTML = `
      <div class="help-modal-overlay"></div>
      <div class="help-modal-content">
        <div class="help-modal-header">
          <div class="help-breadcrumb">
            <span class="breadcrumb-icon">📚</span>
            <span class="breadcrumb-text">Help</span>
          </div>
          <div class="help-modal-actions">
            <div class="modal-search">
              <input type="text"
                     class="modal-search-input"
                     placeholder="Search help..."
                     aria-label="Search help">
              <span class="modal-search-icon">🔍</span>
              <button class="modal-search-clear" aria-label="Clear search">&times;</button>
              <div class="modal-search-results" role="listbox" aria-label="Search results"></div>
            </div>
            <button class="modal-icon-btn" id="helpBackToApp" title="Back to AIDE Quiz">
              <span>🎯</span>
            </button>
            <button class="modal-icon-btn" id="helpOpenArch" title="Technical documentation">
              <span>🏛️</span>
            </button>
          </div>
        </div>
        <div class="help-modal-body">
          <div class="help-modal-loading">
            <div class="spinner"></div>
            <p>Opening help...</p>
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
    // Help button opens modal (if button exists)
    if (this.button) {
      this.button.addEventListener('click', () => this.open());
    }

    // Overlay click closes modal
    const overlay = this.modal.querySelector('.help-modal-overlay');
    overlay.addEventListener('click', () => this.close());

    // Back-to-App button (🎯 icon) - just close, no navigation
    const backBtn = this.modal.querySelector('#helpBackToApp');
    backBtn.addEventListener('click', () => this.close());

    // Open-Architecture button (🏛️ icon)
    const archBtn = this.modal.querySelector('#helpOpenArch');
    archBtn.addEventListener('click', () => {
      this.close();
      if (this.techDocsModal) {
        this.techDocsModal.open();
      }
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
   * Open modal and load help
   */
  async open() {
    ModalUtils.openModal(this.modal);
    this.isOpen = true;

    await this.loadHelp();
  }

  /**
   * Close modal
   */
  close() {
    ModalUtils.closeModal(this.modal);
    this.isOpen = false;
  }

  /**
   * Load and render help file
   */
  async loadHelp() {
    const bodyEl = this.modal.querySelector('.help-modal-body');
    let loadingEl = this.modal.querySelector('.help-modal-loading');
    let contentEl = this.modal.querySelector('.help-content');

    // Recreate loading element if not present
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = 'help-modal-loading';
      loadingEl.innerHTML = `
        <div class="spinner"></div>
        <p>Opening help...</p>
      `;
      bodyEl.insertBefore(loadingEl, bodyEl.firstChild);
    }

    // Create content element if not present
    if (!contentEl) {
      contentEl = document.createElement('div');
      contentEl.className = 'help-content modal-markdown';
      bodyEl.appendChild(contentEl);
    }

    // Show loading, hide content
    loadingEl.style.display = 'flex';
    contentEl.style.display = 'none';

    try {
      const response = await fetch(this.readmePath);

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

      // Handle links
      this.makeLinksExternal();

      // Add IDs to headings for anchor links
      ModalUtils.addHeadingIds('.help-content', this.modal);

      // Generate table of contents (if enough headings)
      ModalUtils.generateTOC('.help-content', this.modal, 4);

      // Render Mermaid diagrams (await important!)
      await ModalUtils.renderMermaid('.help-content', this.modal);

    } catch (error) {
      console.error('Error loading help:', error);
      loadingEl.style.display = 'none';
      contentEl.innerHTML = `
        <div class="help-error">
          <h3>⚠️ Help could not be loaded</h3>
          <p>The help file could not be found.</p>
          <p class="help-error-details">Path: ${this.readmePath}</p>
          <p>Please contact support.</p>
        </div>
      `;
      contentEl.style.display = 'block';
    }
  }

  /**
   * Handle links - external links in new tab, internal navigation in modal
   */
  makeLinksExternal() {
    const links = this.modal.querySelectorAll('.help-content a');

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

      // Links to docs/*.md - open in TechDocsModal
      if (href.startsWith('docs/')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.close();
          if (this.techDocsModal) {
            const docName = href.replace('docs/', '');
            this.techDocsModal.open(docName);
          } else {
            console.warn('TechDocsModal not available for:', href);
          }
        });
        return;
      }

      // Other .md links - could be loaded in modal (if desired)
      // Currently: Rest remains standard
    });
  }

  // ============================================================================
  // Search Methods
  // ============================================================================

  /**
   * Build search index from all help files (lazy, on first search)
   */
  async buildHelpSearchIndex() {
    if (this.helpSearchIndex) {
      return;
    }

    log('HelpModal: Building help search index...');

    try {
      // Dynamically load Fuse.js if needed
      if (typeof Fuse === 'undefined') {
        await this.loadFuse();
      }

      const documents = [];

      // Fetch all help files in parallel
      const fetchPromises = HELP_FILE_LIST.map(async (entry) => {
        try {
          const url = (BASE_PATH || '') + entry.basePath + entry.file;
          const response = await fetch(url);
          if (!response.ok) return null;

          const markdown = await response.text();
          return this.parseHelpDocument(entry, markdown);
        } catch (error) {
          console.warn('Failed to fetch help:', entry.basePath, error);
          return null;
        }
      });

      const results = await Promise.all(fetchPromises);
      const validDocs = results.filter(doc => doc !== null);

      this.helpSearchIndex = new Fuse(validDocs, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'headings', weight: 2 },
          { name: 'content', weight: 1 }
        ],
        threshold: 0.3,
        includeMatches: true,
        includeScore: true,
        minMatchCharLength: 2,
        ignoreLocation: true
      });

      log('HelpModal: Index built with', validDocs.length, 'documents');

    } catch (error) {
      console.error('HelpModal: Failed to build index', error);
    }
  }

  /**
   * Load Fuse.js library dynamically
   */
  async loadFuse() {
    return new Promise((resolve, reject) => {
      if (typeof Fuse !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = (BASE_PATH || '') + '/vendor/fuse/fuse.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Fuse.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Parse help document for indexing
   */
  parseHelpDocument(entry, markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : entry.label;

    const headingMatches = markdown.matchAll(/^#{1,4}\s+(.+)$/gm);
    const headings = Array.from(headingMatches).map(m => m[1].trim());

    const content = this.cleanMarkdown(markdown);

    return {
      label: entry.label,
      basePath: entry.basePath,
      file: entry.file,
      title,
      headings: headings.join(' | '),
      content,
      raw: markdown
    };
  }

  /**
   * Clean markdown for search
   */
  cleanMarkdown(markdown) {
    return markdown
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\|/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Handle search input with debounce
   */
  handleSearchInput(query) {
    clearTimeout(this.searchDebounceTimer);

    if (!query || query.length < 2) {
      this.hideSearchResults();
      return;
    }

    this.showSearchLoading();

    this.searchDebounceTimer = setTimeout(async () => {
      try {
        await this.buildHelpSearchIndex();

        if (!this.helpSearchIndex) {
          this.hideSearchResults();
          return;
        }

        const results = this.helpSearchIndex.search(query, { limit: 8 });
        this.searchResults = results.map(r => ({
          label: r.item.label,
          basePath: r.item.basePath,
          file: r.item.file,
          title: r.item.title,
          score: r.score,
          preview: this.extractPreview(r.item.raw, query),
          section: this.findSection(r.item.raw, query)
        }));

        this.selectedResultIndex = -1;
        this.renderSearchResults(query);
      } catch (error) {
        console.error('Search error:', error);
        this.hideSearchResults();
      }
    }, 200);
  }

  /**
   * Handle keyboard navigation
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
        if (this.selectedResultIndex >= 0) {
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
   * Extract preview around match
   */
  extractPreview(markdown, query, maxLength = 150) {
    const content = this.cleanMarkdown(markdown);
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerContent.indexOf(lowerQuery);

    if (matchIndex === -1) {
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const contextStart = Math.max(0, matchIndex - 50);
    const contextEnd = Math.min(content.length, matchIndex + query.length + 100);

    let preview = '';
    if (contextStart > 0) preview += '...';
    preview += content.slice(contextStart, contextEnd);
    if (contextEnd < content.length) preview += '...';

    return preview;
  }

  /**
   * Find section heading containing match
   */
  findSection(markdown, query) {
    const lines = markdown.split('\n');
    const lowerQuery = query.toLowerCase();
    let currentSection = null;

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        currentSection = headingMatch[2].trim();
      }
      if (line.toLowerCase().includes(lowerQuery)) {
        return currentSection;
      }
    }
    return null;
  }

  /**
   * Highlight search term
   */
  highlight(text, query) {
    if (!query || query.length < 2) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  /**
   * Show loading state
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
      const preview = this.highlight(result.preview, query);
      const sectionHtml = result.section
        ? `<span class="modal-search-result-section">${result.section}</span>`
        : '';

      return `
        <div class="modal-search-result" data-index="${index}" role="option">
          <div class="modal-search-result-title">
            <span class="modal-search-result-icon">📖</span>
            <span class="modal-search-result-file">${result.label}</span>
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

    resultsContainer.querySelectorAll('.modal-search-result').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index, 10);
        this.selectSearchResult(this.searchResults[index]);
      });
    });

    resultsContainer.classList.add('active');
  }

  /**
   * Update visual selection
   */
  updateSelectedResult() {
    const items = this.modal.querySelectorAll('.modal-search-result');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedResultIndex);
      if (index === this.selectedResultIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  /**
   * Select search result and navigate
   */
  selectSearchResult(result) {
    this.hideSearchResults();

    const searchInput = this.modal.querySelector('.modal-search-input');
    searchInput.value = '';

    // Navigate to the app's help page
    const url = (BASE_PATH || '') + result.basePath;
    window.location.href = url;
  }

  /**
   * Show search results
   */
  showSearchResults() {
    const resultsContainer = this.modal.querySelector('.modal-search-results');
    resultsContainer.classList.add('active');
  }

  /**
   * Hide search results
   */
  hideSearchResults() {
    const resultsContainer = this.modal.querySelector('.modal-search-results');
    resultsContainer.classList.remove('active');
    this.selectedResultIndex = -1;
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
export { HelpModal };
