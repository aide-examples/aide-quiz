/**
 * BasePath.js - Base Path Detection for Reverse Proxy Setup
 *
 * Automatically detects if app is running under a subpath (e.g., /quiz-app)
 * by analyzing the current URL path.
 */

// Known app directories that indicate we're inside the app
const APP_DIRS = ['/editor', '/quiz', '/stats', '/result', '/test'];

/**
 * Detect base path from current URL
 * @returns {string} Base path (e.g., '/quiz-app' or '')
 */
function detectBasePath() {
  const path = window.location.pathname;
  let basePath = '';

  // Strategy: Find app directory in path and extract everything before it
  for (const dir of APP_DIRS) {
    const pattern = new RegExp(`(.*?)(${dir}(/|$))`);
    const match = path.match(pattern);

    if (match && match[1]) {
      basePath = match[1].replace(/\/$/, '');
      break;
    } else if (path.startsWith(dir + '/') || path === dir) {
      basePath = '';
      break;
    }
  }

  // Fallback: If no app directory found, try to detect from URL structure
  if (!basePath && path !== '/' && !path.startsWith('/index.html')) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 0) {
      const firstPart = '/' + parts[0];
      if (!APP_DIRS.includes(firstPart)) {
        basePath = firstPart;
      }
    }
  }

  return basePath;
}

/**
 * Run self-tests in development mode
 */
function runTests() {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return;
  }

  const testCases = [
    ['/editor/', ''],
    ['/quiz/', ''],
    ['/quiz-app/editor/', '/quiz-app'],
    ['/quiz-app/quiz/', '/quiz-app'],
    ['/quiz-app/quiz', '/quiz-app'],
    ['/quiz-app/', '/quiz-app'],
    ['/my-app/stats/', '/my-app'],
  ];

  let allPassed = true;
  testCases.forEach(([testPath, expected]) => {
    let testBase = '';
    for (const dir of APP_DIRS) {
      const pattern = new RegExp(`(.*?)(${dir}(/|$))`);
      const match = testPath.match(pattern);
      if (match && match[1]) {
        testBase = match[1].replace(/\/$/, '');
        break;
      } else if (testPath.startsWith(dir + '/') || testPath === dir) {
        testBase = '';
        break;
      }
    }
    if (!testBase && testPath !== '/' && !testPath.startsWith('/index.html')) {
      const parts = testPath.split('/').filter(Boolean);
      if (parts.length > 0) {
        const firstPart = '/' + parts[0];
        if (!APP_DIRS.includes(firstPart)) {
          testBase = firstPart;
        }
      }
    }

    if (testBase !== expected) {
      console.error(`BASE_PATH test FAILED: ${testPath} → expected "${expected}", got "${testBase}"`);
      allPassed = false;
    }
  });

  if (allPassed) {
    console.log('[BasePath.js] All tests passed');
  }
}

// Detect and export
export const BASE_PATH = detectBasePath();

console.log('[BasePath.js] BASE_PATH:', BASE_PATH || '(root)');
runTests();
