#!/usr/bin/env node
/**
 * validate-docs-list.js
 *
 * Validates that all .md files in /public/docs/ are listed in
 * TechDocsModal.js DOCS_FILE_LIST (and vice versa).
 *
 * Usage: npm run validate:docs
 *
 * Exit codes:
 *   0 = All files match
 *   1 = Mismatch found
 */

const fs = require('fs');
const path = require('path');

// Paths relative to server/
const DOCS_DIR = path.join(__dirname, '../../public/docs');
const MODAL_FILE = path.join(__dirname, '../../public/help/TechDocsModal.js');

// Files to exclude from validation (not user documentation)
const EXCLUDED_FILES = [
  'aide'  // Subdirectory, not a file
];

/**
 * Extract DOCS_FILE_LIST from TechDocsModal.js
 */
function extractDocsFileList() {
  const content = fs.readFileSync(MODAL_FILE, 'utf-8');

  // Match the array definition
  const match = content.match(/const DOCS_FILE_LIST\s*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not find DOCS_FILE_LIST in TechDocsModal.js');
  }

  // Extract file names from the array
  const arrayContent = match[1];
  const files = [];
  const regex = /'([^']+\.md)'/g;
  let m;
  while ((m = regex.exec(arrayContent)) !== null) {
    files.push(m[1]);
  }

  return files;
}

/**
 * Get all .md files in docs directory
 */
function getActualDocsFiles() {
  const files = fs.readdirSync(DOCS_DIR);
  return files
    .filter(f => f.endsWith('.md'))
    .filter(f => !EXCLUDED_FILES.includes(f.replace('.md', '')))
    .sort();
}

/**
 * Main validation
 */
function validate() {
  console.log('Validating DOCS_FILE_LIST...\n');

  const listedFiles = extractDocsFileList().sort();
  const actualFiles = getActualDocsFiles();

  const missingFromList = actualFiles.filter(f => !listedFiles.includes(f));
  const extraInList = listedFiles.filter(f => !actualFiles.includes(f));

  let hasErrors = false;

  if (missingFromList.length > 0) {
    console.log('❌ Files in /public/docs/ but NOT in DOCS_FILE_LIST:');
    missingFromList.forEach(f => console.log(`   - ${f}`));
    console.log('');
    console.log('   → Add to: public/help/TechDocsModal.js');
    console.log('');
    hasErrors = true;
  }

  if (extraInList.length > 0) {
    console.log('❌ Files in DOCS_FILE_LIST but NOT in /public/docs/:');
    extraInList.forEach(f => console.log(`   - ${f}`));
    console.log('');
    console.log('   → Remove from: public/help/TechDocsModal.js');
    console.log('');
    hasErrors = true;
  }

  if (!hasErrors) {
    console.log(`✅ All ${actualFiles.length} documentation files are properly listed.`);
    return 0;
  }

  return 1;
}

// Run and exit with appropriate code
process.exit(validate());
