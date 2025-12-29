/**
 * DocSearch - Client-side documentation search using Fuse.js
 *
 * Features:
 * - Lazy index building (on first search)
 * - Fuzzy matching (tolerates typos)
 * - Weighted search (title > headings > content)
 * - Result highlighting
 *
 * Usage:
 *   const search = new DocSearch('/docs/', ['INDEX.md', 'SECURITY.md', ...]);
 *   await search.buildIndex();  // Called automatically on first search
 *   const results = search.search('architcture');  // Fuzzy match!
 */

import { log } from '../common/ApiHelpers.js';
import { BASE_PATH } from '../common/BasePath.js';

class DocSearch {
  /**
   * @param {string} basePath - Base path for documents (e.g., '/docs/')
   * @param {string[]} fileList - List of markdown files to index
   * @param {Object} options - Optional Fuse.js options override
   */
  constructor(basePath, fileList, options = {}) {
    this.basePath = basePath;
    this.fileList = fileList;
    this.documents = [];
    this.fuse = null;
    this.indexBuilt = false;
    this.indexBuilding = false;

    // Default Fuse.js options - optimized for documentation
    this.fuseOptions = {
      keys: [
        { name: 'title', weight: 3 },      // Title matches are most important
        { name: 'headings', weight: 2 },   // Headings are secondary
        { name: 'content', weight: 1 }     // Full content search
      ],
      threshold: 0.3,           // 0 = exact, 1 = match anything
      distance: 100,            // How far to search within the field
      includeMatches: true,     // Return match positions for highlighting
      includeScore: true,       // Return relevance score
      minMatchCharLength: 2,    // Minimum chars to match
      ignoreLocation: true,     // Search entire content, not just beginning
      ...options
    };
  }

  /**
   * Build search index from all documents
   * Called automatically on first search, or manually for preloading
   */
  async buildIndex() {
    if (this.indexBuilt || this.indexBuilding) {
      return;
    }

    this.indexBuilding = true;
    log('DocSearch: Building index for', this.fileList.length, 'files...');

    try {
      // Fetch all documents in parallel
      const fetchPromises = this.fileList.map(file => this.fetchDocument(file));
      const documents = await Promise.all(fetchPromises);

      // Filter out failed fetches
      this.documents = documents.filter(doc => doc !== null);

      // Initialize Fuse.js with documents
      // Dynamically import Fuse if not already loaded
      if (typeof Fuse === 'undefined') {
        await this.loadFuse();
      }

      this.fuse = new Fuse(this.documents, this.fuseOptions);
      this.indexBuilt = true;

      log('DocSearch: Index built with', this.documents.length, 'documents');
    } catch (error) {
      console.error('DocSearch: Failed to build index', error);
    } finally {
      this.indexBuilding = false;
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
      script.src = BASE_PATH + '/vendor/fuse/fuse.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Fuse.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Fetch and parse a single markdown document
   * @param {string} file - Filename (e.g., 'SECURITY.md')
   * @returns {Object|null} Parsed document or null on error
   */
  async fetchDocument(file) {
    try {
      const url = this.basePath + encodeURIComponent(file).replace(/%2F/g, '/');
      const response = await fetch(url);

      if (!response.ok) {
        console.warn('DocSearch: Failed to fetch', file, response.status);
        return null;
      }

      const markdown = await response.text();
      return this.parseDocument(file, markdown);

    } catch (error) {
      console.warn('DocSearch: Error fetching', file, error);
      return null;
    }
  }

  /**
   * Parse markdown into searchable document structure
   * @param {string} file - Filename
   * @param {string} markdown - Raw markdown content
   * @returns {Object} Parsed document
   */
  parseDocument(file, markdown) {
    // Extract title from first H1
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');

    // Extract all headings (H1-H4)
    const headingMatches = markdown.matchAll(/^#{1,4}\s+(.+)$/gm);
    const headings = Array.from(headingMatches).map(m => m[1].trim());

    // Clean content: remove markdown syntax for better search
    const content = this.cleanMarkdown(markdown);

    return {
      file,
      title,
      headings: headings.join(' | '),  // Join for single-field search
      content,
      // Keep raw markdown for context extraction
      raw: markdown
    };
  }

  /**
   * Clean markdown syntax for better content search
   * @param {string} markdown - Raw markdown
   * @returns {string} Plain text content
   */
  cleanMarkdown(markdown) {
    return markdown
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      // Remove bold/italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove table formatting
      .replace(/\|/g, ' ')
      .replace(/[-:]+\s*\|/g, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Search documents
   * @param {string} query - Search query
   * @param {number} limit - Maximum results (default: 10)
   * @returns {Array} Search results with match info
   */
  async search(query, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    // Build index on first search
    if (!this.indexBuilt) {
      await this.buildIndex();
    }

    if (!this.fuse) {
      return [];
    }

    const results = this.fuse.search(query, { limit: limit * 2 });  // Fetch more, then filter

    // Filter to only include documents that actually contain the query
    const lowerQuery = query.toLowerCase();
    const filteredResults = results.filter(result => {
      const content = result.item.content.toLowerCase();
      const title = result.item.title.toLowerCase();
      const headings = result.item.headings.toLowerCase();
      return content.includes(lowerQuery) ||
             title.includes(lowerQuery) ||
             headings.includes(lowerQuery);
    });

    return filteredResults.slice(0, limit).map(result => ({
      file: result.item.file,
      title: result.item.title,
      score: result.score,
      preview: this.extractPreview(result.item.raw, query),
      section: this.findSection(result.item.raw, query),
      matches: result.matches
    }));
  }

  /**
   * Extract context preview around the first match
   * @param {string} markdown - Raw markdown content
   * @param {string} query - Search query
   * @returns {string} Preview text with ellipsis
   */
  extractPreview(markdown, query, maxLength = 150) {
    const content = this.cleanMarkdown(markdown);
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Find first occurrence of query
    const matchIndex = lowerContent.indexOf(lowerQuery);

    if (matchIndex === -1) {
      // No exact match, return beginning
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Calculate context window
    const contextStart = Math.max(0, matchIndex - 50);
    const contextEnd = Math.min(content.length, matchIndex + query.length + 100);

    let preview = '';
    if (contextStart > 0) preview += '...';
    preview += content.slice(contextStart, contextEnd);
    if (contextEnd < content.length) preview += '...';

    return preview;
  }

  /**
   * Find the section (heading) containing the first match
   * @param {string} markdown - Raw markdown content
   * @param {string} query - Search query
   * @returns {string|null} Section heading or null
   */
  findSection(markdown, query) {
    const lines = markdown.split('\n');
    const lowerQuery = query.toLowerCase();
    let currentSection = null;

    for (const line of lines) {
      // Track current section (H1-H4)
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        currentSection = headingMatch[2].trim();
      }

      // Check if line contains query
      if (line.toLowerCase().includes(lowerQuery)) {
        return currentSection;
      }
    }

    return null;
  }

  /**
   * Highlight search term in text
   * @param {string} text - Text to highlight
   * @param {string} query - Search term
   * @param {string} tag - HTML tag for highlighting (default: 'mark')
   * @returns {string} HTML with highlights
   */
  highlight(text, query, tag = 'mark') {
    if (!query || query.length < 2) {
      return text;
    }

    // Escape regex special chars
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');

    return text.replace(regex, `<${tag}>$1</${tag}>`);
  }

  /**
   * Get list of indexed documents
   * @returns {Array} Document metadata
   */
  getDocuments() {
    return this.documents.map(doc => ({
      file: doc.file,
      title: doc.title
    }));
  }

  /**
   * Check if index is ready
   * @returns {boolean}
   */
  isReady() {
    return this.indexBuilt;
  }
}

// Export for ES6 modules
export { DocSearch };
