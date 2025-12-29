/**
 * MediaManager.js - Handles media upload, management, and insertion
 */

import { fetchWithErrorHandling, toast } from '../../common/ApiHelpers.js';
import { i18n } from '../../common/i18n.js';

export class MediaManager {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.mediaFiles = [];
  }

  /**
   * Open media manager modal
   */
  async open() {
    if (!this.editor.currentQuizId) {
      this.editor.sessionManager.showMessage(i18n.t('editor_media_load_quiz_first'), true);
      return;
    }

    this.isOpen = true;
    await this.loadMediaList();
    this.render();

    // Hide UI/JSON mode, show media mode (like JSON mode toggle)
    document.getElementById('uiMode').style.display = 'none';
    document.getElementById('jsonMode').style.display = 'none';
    document.getElementById('mediaMode').style.display = 'flex';
    document.getElementById('modeToggleText').textContent = i18n.t('editor_mode_ui');
  }

  /**
   * Close media manager modal
   */
  close() {
    this.isOpen = false;

    // Return to UI mode
    document.getElementById('mediaMode').style.display = 'none';
    document.getElementById('uiMode').style.display = 'block';
    document.getElementById('modeToggleText').textContent = i18n.t('editor_mode_json');
  }

  /**
   * Load list of media files from server
   */
  async loadMediaList() {
    if (!this.editor.currentQuizId) {
      this.mediaFiles = [];
      return;
    }
    
    try {
      const data = await fetchWithErrorHandling(`/api/teacher/media/${this.editor.currentQuizId}`);
      this.mediaFiles = data.files || [];
    } catch (err) {
      // Error already shown to user
      console.error('Error loading media:', err);
      this.mediaFiles = [];
    }
  }

  /**
   * Render media manager UI
   */
  render() {
    const container = document.getElementById('mediaGrid');
    
    if (this.mediaFiles.length === 0) {
      container.innerHTML = `<div class="no-media">${i18n.t('editor_media_empty_state')}</div>`;
      return;
    }

    container.innerHTML = this.mediaFiles.map(file => {
      const isImage = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file.name);
      const isVideo = /\.(mp4|webm|mov)$/i.test(file.name);
      const isAudio = /\.(mp3|wav|ogg)$/i.test(file.name);
      
      let preview = '';
      if (isImage) {
        preview = `<img src="${file.url}" alt="${file.name}">`;
      } else if (isVideo) {
        preview = `<div class="media-icon">🎬</div>`;
      } else if (isAudio) {
        preview = `<div class="media-icon">🎵</div>`;
      } else {
        preview = `<div class="media-icon">📄</div>`;
      }

      return `
        <div class="media-item"
             data-filename="${file.name}"
             ${isImage ? 'draggable="true"' : ''}
             ${isImage ? `title="${i18n.t('editor_media_drag_hint')}"` : ''}>
          <div class="media-preview">
            ${preview}
          </div>
          <div class="media-info">
            <div class="media-name" title="${file.name}">${file.name}</div>
            <div class="media-size">${this.formatFileSize(file.size)}</div>
          </div>
          <div class="media-actions">
            <button class="btn-icon copy-btn" onclick="window.quizEditor.mediaManager.copyMarkdown('${file.name}')" title="copy markdown">
              📋
            </button>
            <button class="btn-icon rename-btn" onclick="window.quizEditor.mediaManager.renameMedia('${file.name}')" title="rename">
              ✏️
            </button>
            <button class="btn-icon delete-btn" onclick="window.quizEditor.mediaManager.deleteMedia('${file.name}')" title="delete">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // Setup drag handlers for images
    this.setupImageDragHandlers();
  }

  /**
   * Setup drag handlers for draggable images
   */
  setupImageDragHandlers() {
    const draggableItems = document.querySelectorAll('.media-item[draggable="true"]');
    
    draggableItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const filename = item.dataset.filename;
        e.dataTransfer.effectAllowed = 'copy';
        // Set special marker to identify quiz media images
        e.dataTransfer.setData('application/x-quiz-image', filename);
        e.dataTransfer.setData('text/plain', filename);
        item.classList.add('dragging');
      });
      
      item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
      });
    });
  }

  /**
   * Handle file upload (local files)
   */
  async uploadFiles(files) {
    if (!this.editor.currentQuizId) {
      toast.error(i18n.t('editor_media_create_quiz_first'));
      return;
    }

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`/api/teacher/uploadMedia/${this.editor.currentQuizId}`, {
          method: 'POST',
          body: formData
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          const errorMsg = data.error || 'Upload failed';
          this.editor.sessionManager.showMessage(i18n.t('editor_media_upload_error', { filename: file.name, error: errorMsg }), true);
          toast.error(`${file.name}: ${errorMsg}`);
          continue;
        }

        this.editor.sessionManager.showMessage(i18n.t('editor_media_uploaded', { filename: file.name }), false);
        toast.success(i18n.t('editor_media_uploaded', { filename: file.name }), 3000);
      } catch (err) {
        console.error('Upload error:', err);
        this.editor.sessionManager.showMessage(i18n.t('editor_media_upload_error', { filename: file.name, error: 'Connection error' }), true);
        toast.error(i18n.t('editor_media_connection_error', { filename: file.name }));
      }
    }

    await this.loadMediaList();
    this.render();
  }

  /**
   * Download media from URL
   */
  async downloadFromUrl(url) {
    try {
      await fetchWithErrorHandling(`/api/teacher/downloadMedia/${this.editor.currentQuizId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      this.editor.sessionManager.showMessage(i18n.t('editor_media_url_downloaded'), false);
      await this.loadMediaList();
      this.render();
    } catch (err) {
      // Error already shown as toast by fetchWithErrorHandling
      console.error('URL download error:', err);
    }
  }

  /**
   * Delete media file
   */
  async deleteMedia(filename) {
    if (!confirm(i18n.t('editor_media_delete_confirm', { filename }))) {
      return;
    }

    try {
      await fetchWithErrorHandling(`/api/teacher/media/${this.editor.currentQuizId}/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      this.editor.sessionManager.showMessage(i18n.t('editor_media_deleted', { filename }), false);
      await this.loadMediaList();
      this.render();
    } catch (err) {
      // Error already shown as toast by fetchWithErrorHandling
      console.error('Delete error:', err);
    }
  }

  /**
   * Rename media file
   */
  async renameMedia(filename) {
    const newName = prompt(i18n.t('editor_media_rename_prompt', { filename }), filename);

    if (!newName || newName === filename) {
      return; // Cancelled or no change
    }

    try {
      const data = await fetchWithErrorHandling(`/api/teacher/media/${this.editor.currentQuizId}/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
      });

      this.editor.sessionManager.showMessage(i18n.t('editor_media_renamed', { newName: data.newName }), false);
      await this.loadMediaList();
      this.render();
    } catch (err) {
      // Error already shown as toast by fetchWithErrorHandling
      console.error('Rename error:', err);
    }
  }

  /**
   * Copy markdown syntax to clipboard
   */
  copyMarkdown(filename) {
    const markdown = `![](${filename})`;
    navigator.clipboard.writeText(markdown).then(() => {
      this.editor.sessionManager.showMessage(i18n.t('editor_media_markdown_copied'), false);
    }).catch(err => {
      console.error('Copy failed:', err);
      this.editor.sessionManager.showMessage(i18n.t('editor_media_copy_failed'), true);
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Handle file input change
   */
  handleFileInput() {
    const input = document.getElementById('mediaFileInput');
    if (input.files.length > 0) {
      this.uploadFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  /**
   * Handle URL input
   */
  handleUrlInput() {
    const input = document.getElementById('mediaUrlInput');
    const url = input.value.trim();

    if (!url) {
      this.editor.sessionManager.showMessage(i18n.t('editor_media_enter_url'), true);
      return;
    }

    if (!url.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      this.editor.sessionManager.showMessage(i18n.t('editor_media_invalid_url'), true);
      return;
    }

    this.downloadFromUrl(url);
    input.value = ''; // Reset input
  }

  /**
   * Setup drag and drop
   */
  setupDragAndDrop() {
    const dropZone = document.getElementById('mediaDropZone');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    // Highlight drop zone when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
      }, false);
    });

    // Handle dropped files or URLs
    dropZone.addEventListener('drop', async (e) => {
      const dt = e.dataTransfer;

      // Check if it's a URL drop (e.g., from browser)
      const url = dt.getData('text/uri-list') || dt.getData('text/plain');
      
      if (url && url.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        // It's an image URL
        await this.downloadFromUrl(url);
      } else if (dt.files.length > 0) {
        // It's local files
        await this.uploadFiles(Array.from(dt.files));
      }
    }, false);
  }
}