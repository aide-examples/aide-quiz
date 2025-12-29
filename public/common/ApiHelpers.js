/**
 * ApiHelpers.js - API Communication and Error Handling
 *
 * Provides toast notifications, error handling, retry mechanism,
 * and fetch wrapper for API calls.
 */

import { BASE_PATH } from './BasePath.js';

// ============================================================================
// DEBUG LOGGING
// ============================================================================

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEBUG = isLocalhost && true;  // Set to false to disable even in dev
export const log = DEBUG ? console.log.bind(console) : () => {};

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

/**
 * Toast notifications for user feedback
 */
export class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
        return;
      }
    }

    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in ms (0 = permanent)
   */
  show(message, type = 'info', duration = 5000) {
    if (!this.container) {
      console.warn('ToastManager: Container not ready, initializing...');
      this.init();
      if (!this.container) {
        console.error('ToastManager: Failed to initialize container');
        return null;
      }
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '\u2713',
      error: '\u2717',
      warning: '\u26A0',
      info: '\u2139'
    };

    const formattedMessage = message.replace(/\n/g, '<br>');

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '\u2139'}</span>
      <span class="toast-message">${formattedMessage}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">\u00D7</button>
    `;

    this.container.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 0) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 5000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }
}

// Global toast instance
export const toast = new ToastManager();

// ============================================================================
// ERROR AGGREGATION
// ============================================================================

const errorTracker = {
  recentErrors: [],
  maxAge: 5000,

  findRecent(errorInfo) {
    const now = Date.now();
    this.recentErrors = this.recentErrors.filter(e => (now - e.timestamp) < this.maxAge);

    return this.recentErrors.find(e => {
      if (e.type === errorInfo.type && e.message === errorInfo.message) {
        return true;
      }
      if (e.correlationId && e.correlationId === errorInfo.correlationId) {
        return true;
      }
      return false;
    });
  },

  add(errorInfo) {
    this.recentErrors.push({
      ...errorInfo,
      timestamp: Date.now(),
      count: 1
    });
  },

  updateCount(existingError) {
    existingError.count++;
    existingError.timestamp = Date.now();
  }
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle API errors with user-friendly messages
 * @param {Error|Response} error - Error object or fetch Response
 * @param {object} data - Parsed response data (if available)
 * @returns {object} Normalized error object
 */
export async function handleApiError(error, data = null) {
  let errorInfo = {
    message: 'An error occurred',
    type: 'UnknownError',
    correlationId: null,
    details: null,
    statusCode: null
  };

  if (data && data.error) {
    if (typeof data.error === 'string') {
      errorInfo.message = data.error;
    }
    if (data.errorDetails) {
      errorInfo.type = data.errorDetails.type || 'UnknownError';
      errorInfo.correlationId = data.errorDetails.correlationId;
      errorInfo.details = data.errorDetails.details;
    }
  }

  if (error instanceof Response) {
    errorInfo.statusCode = error.status;
    if (!data) {
      try {
        data = await error.json();
        if (data.error) {
          errorInfo.message = typeof data.error === 'string' ? data.error : data.error.message;
        }
        if (data.errorDetails) {
          errorInfo.type = data.errorDetails.type;
          errorInfo.correlationId = data.errorDetails.correlationId;
          errorInfo.details = data.errorDetails.details;
        }
      } catch (e) {
        errorInfo.message = `HTTP ${error.status}: ${error.statusText}`;
      }
    }
  }

  if (error instanceof Error) {
    errorInfo.message = error.message;
    errorInfo.type = 'NetworkError';
  }

  console.error('API Error:', errorInfo);

  const existingError = errorTracker.findRecent(errorInfo);

  if (existingError) {
    errorTracker.updateCount(existingError);
    log(`Duplicate error suppressed (count: ${existingError.count})`);
    return errorInfo;
  }

  errorTracker.add(errorInfo);
  showErrorToUser(errorInfo);

  return errorInfo;
}

function showErrorToUser(errorInfo) {
  let userMessage = errorInfo.message;

  switch (errorInfo.type) {
    case 'AuthenticationError':
      userMessage = 'Please log in to continue.';
      toast.warning(userMessage);
      break;

    case 'ValidationError':
      if (errorInfo.details && Array.isArray(errorInfo.details)) {
        userMessage = 'Validation failed:';
        for (const det of errorInfo.details) userMessage += '\n' + det.message;
      }
      toast.warning(userMessage, 8000);
      break;

    case 'NotFoundError':
    case 'QuizNotFoundError':
    case 'SessionNotFoundError':
      toast.error(userMessage, 5000);
      break;

    case 'NetworkError':
      userMessage = 'Connection to server failed. Please check your internet connection.';
      toast.error(userMessage, 0);
      break;

    default:
      toast.error(userMessage, 0);
  }

  if (errorInfo.correlationId) {
    const correlationToast = document.createElement('div');
    correlationToast.className = 'toast toast-info';
    correlationToast.innerHTML = `
      <span class="toast-icon">\uD83D\uDD0D</span>
      <span class="toast-message">
        Internal error: <code>${errorInfo.correlationId}</code>
      </span>
      <button class="toast-close" onclick="this.parentElement.remove()">\u00D7</button>
    `;
    toast.container.appendChild(correlationToast);
    setTimeout(() => correlationToast.classList.add('toast-show'), 10);
  }
}

// ============================================================================
// RETRY MECHANISM
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(error, statusCode) {
  if (isOffline) return false;
  if (statusCode >= 400 && statusCode < 500) return false;

  if (error.message && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError')
  )) {
    return true;
  }

  if (statusCode >= 500) return true;
  if (error.name === 'AbortError' || error.message.includes('timeout')) return true;

  return false;
}

/**
 * Fetch with automatic retry
 * @param {string} url - API endpoint
 * @param {object} options - fetch options
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise} Response data or throws error
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }

      const result = await fetchWithErrorHandling(url, options);

      if (attempt > 0) {
        log(`Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      const statusCode = error.statusCode || (error.response && error.response.status);
      const canRetry = shouldRetry(error, statusCode);

      if (attempt >= maxRetries || !canRetry) {
        if (attempt > 0) {
          console.error(`Request failed after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
        }
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Fetch wrapper with automatic error handling
 * @param {string} url - API endpoint
 * @param {object} options - fetch options
 * @returns {Promise} Response data or throws error
 */
export async function fetchWithErrorHandling(url, options = {}) {
  try {
    const basePath = BASE_PATH;
    if (url.startsWith('/') && basePath) {
      url = basePath + url;
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok || data.error) {
      await handleApiError(response, data);
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.alreadyHandled = true;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.alreadyHandled && !(error instanceof Response)) {
      await handleApiError(error);
    }
    throw error;
  }
}

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

let isOffline = !navigator.onLine;
let offlineToast = null;

window.addEventListener('offline', () => {
  isOffline = true;
  console.warn('Connection lost - offline mode');
  offlineToast = toast.error('No internet connection', 0);
  offlineToast.classList.add('offline-toast');
});

window.addEventListener('online', () => {
  isOffline = false;
  log('Connection restored - online mode');
  if (offlineToast) {
    offlineToast.remove();
    offlineToast = null;
  }
  toast.success('Connection restored', 3000);
});

if (!navigator.onLine) {
  console.warn('Application started in offline mode');
  offlineToast = toast.warning('No internet connection', 0);
}

// ============================================================================
// TEST FUNCTIONS (for browser console)
// ============================================================================

window.testError = function(type = 'generic') {
  console.log(`Testing error type: ${type}`);

  const testErrors = {
    auth: {
      error: 'Teacher authentication required',
      errorDetails: {
        type: 'AuthenticationError',
        message: 'Teacher authentication required',
        correlationId: 'test-' + Math.random().toString(36).substr(2, 9)
      }
    },
    notfound: {
      error: 'Quiz with ID "test-123" not found',
      errorDetails: {
        type: 'QuizNotFoundError',
        message: 'Quiz with ID "test-123" not found',
        correlationId: 'test-' + Math.random().toString(36).substr(2, 9)
      }
    },
    validation: {
      error: 'Validation failed',
      errorDetails: {
        type: 'ValidationError',
        message: 'Validation failed',
        correlationId: 'test-' + Math.random().toString(36).substr(2, 9),
        details: [
          { message: 'Title must be between 1 and 200 characters long' },
          { message: 'imagePath may only contain a-z, 0-9, _ and -' }
        ]
      }
    },
    server: {
      error: 'An internal error occurred',
      errorDetails: {
        type: 'InternalServerError',
        message: 'An internal error occurred',
        correlationId: 'test-' + Math.random().toString(36).substr(2, 9)
      }
    },
    network: new Error('Failed to fetch'),
    generic: {
      error: 'An unknown error occurred'
    }
  };

  const testError = testErrors[type] || testErrors.generic;

  if (testError instanceof Error) {
    handleApiError(testError);
  } else {
    handleApiError(new Response(JSON.stringify(testError), { status: 400 }), testError);
  }
};

window.testToast = function(type = 'info', message = null) {
  const messages = {
    success: 'Operation successful!',
    error: 'An error occurred!',
    warning: 'Warning: Unsaved changes!',
    info: 'This is an info message.'
  };

  const msg = message || messages[type] || messages.info;
  toast[type](msg);
  console.log(`Toast shown: ${type} - ${msg}`);
};

window.testServerError = async function(type = 'divzero') {
  console.log(`Testing server error: ${type}`);

  const endpoints = {
    divzero: '/api/test/error/divzero',
    nullpointer: '/api/test/error/nullpointer',
    arrayindex: '/api/test/error/arrayindex',
    jsonparse: '/api/test/error/jsonparse',
    database: '/api/test/error/database',
    async: '/api/test/error/async',
    custom: '/api/test/error/custom'
  };

  const endpoint = endpoints[type] || endpoints.divzero;

  try {
    await fetchWithErrorHandling(endpoint);
  } catch (err) {
    console.log('Error was caught and handled properly');
  }
};

window.testServerSuccess = async function() {
  console.log('Testing successful API call');

  try {
    const result = await fetchWithErrorHandling('/api/test/success');
    console.log('Success response:', result);
    toast.success('Server test successful!');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

console.log('Test functions available: testError(), testToast(), testServerError(), testServerSuccess()');
