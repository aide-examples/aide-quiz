#!/usr/bin/env node
/**
 * generate-metrics.js
 *
 * Generates PROJECT_METRICS.md with current codebase statistics.
 * Counts lines of code, files, and identifies largest components.
 *
 * Usage: npm run metrics
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const SERVER_DIR = path.join(ROOT, 'server');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_FILE = path.join(ROOT, 'public/docs/PROJECT_METRICS.md');

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'vendor', 'cache', 'logs', '.git'];

/**
 * Count lines in a file
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * Recursively find all files with extension
 */
function findFiles(dir, ext, results = []) {
  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (EXCLUDE_DIRS.includes(item)) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findFiles(fullPath, ext, results);
    } else if (item.endsWith(ext)) {
      results.push({
        path: fullPath,
        relativePath: path.relative(ROOT, fullPath),
        name: item,
        lines: countLines(fullPath)
      });
    }
  }
  return results;
}

/**
 * Group files by directory
 */
function groupByDirectory(files, baseDir) {
  const groups = {};
  for (const file of files) {
    const relPath = path.relative(baseDir, file.path);
    const dir = path.dirname(relPath).split(path.sep)[0] || 'root';
    if (!groups[dir]) groups[dir] = { files: [], lines: 0 };
    groups[dir].files.push(file);
    groups[dir].lines += file.lines;
  }
  return groups;
}

/**
 * Format number with thousands separator
 */
function fmt(n) {
  return n.toLocaleString('en-US');
}

/**
 * Generate markdown table row
 */
function row(...cells) {
  return '| ' + cells.join(' | ') + ' |';
}

/**
 * Main generation
 */
function generate() {
  const now = new Date().toISOString().split('T')[0];

  // Collect all JS files
  const serverJS = findFiles(SERVER_DIR, '.js');
  const publicJS = findFiles(PUBLIC_DIR, '.js');
  const serverCSS = findFiles(SERVER_DIR, '.css');
  const publicCSS = findFiles(PUBLIC_DIR, '.css');

  // Calculate totals
  const serverLOC = serverJS.reduce((sum, f) => sum + f.lines, 0);
  const publicJSLOC = publicJS.reduce((sum, f) => sum + f.lines, 0);
  const publicCSSLOC = publicCSS.reduce((sum, f) => sum + f.lines, 0);
  const publicLOC = publicJSLOC + publicCSSLOC;
  const totalLOC = serverLOC + publicLOC;
  const totalFiles = serverJS.length + publicJS.length + publicCSS.length;

  // Group by layer/area
  const serverGroups = groupByDirectory(serverJS, SERVER_DIR);
  const publicGroups = groupByDirectory(publicJS, PUBLIC_DIR);

  // Top 10 files
  const allFiles = [...serverJS, ...publicJS, ...publicCSS];
  const top10 = allFiles.sort((a, b) => b.lines - a.lines).slice(0, 10);

  // Generate markdown
  let md = `# Project Metrics

Auto-generated codebase statistics.

*Generated: ${now}*

---

## Overview

| Area | Lines | Files | Share |
|------|------:|------:|------:|
${row('**Server** (Backend)', fmt(serverLOC), serverJS.length, (serverLOC/totalLOC*100).toFixed(1) + '%')}
${row('**Public** (Frontend JS)', fmt(publicJSLOC), publicJS.length, (publicJSLOC/totalLOC*100).toFixed(1) + '%')}
${row('**Public** (Frontend CSS)', fmt(publicCSSLOC), publicCSS.length, (publicCSSLOC/totalLOC*100).toFixed(1) + '%')}
${row('**Total**', '**' + fmt(totalLOC) + '**', '**' + totalFiles + '**', '100%')}

**Average file size:** ${Math.round(totalLOC / totalFiles)} lines

---

## Server Breakdown

| Layer | Lines | Files | Avg |
|-------|------:|------:|----:|
`;

  const serverOrder = ['services', 'routers', 'repositories', 'middleware', 'errors', 'config', 'utils', 'scripts'];
  for (const layer of serverOrder) {
    if (serverGroups[layer]) {
      const g = serverGroups[layer];
      md += row(layer, fmt(g.lines), g.files.length, Math.round(g.lines / g.files.length)) + '\n';
    }
  }
  // Add remaining
  for (const [layer, g] of Object.entries(serverGroups)) {
    if (!serverOrder.includes(layer)) {
      md += row(layer, fmt(g.lines), g.files.length, Math.round(g.lines / g.files.length)) + '\n';
    }
  }

  md += `
---

## Frontend Breakdown

| Area | Lines | Files | Avg |
|------|------:|------:|----:|
`;

  const publicOrder = ['editor', 'common', 'help', 'stats', 'quiz', 'result', 'docs'];
  for (const area of publicOrder) {
    if (publicGroups[area]) {
      const g = publicGroups[area];
      md += row(area, fmt(g.lines), g.files.length, Math.round(g.lines / g.files.length)) + '\n';
    }
  }
  // Add remaining
  for (const [area, g] of Object.entries(publicGroups)) {
    if (!publicOrder.includes(area)) {
      md += row(area, fmt(g.lines), g.files.length, Math.round(g.lines / g.files.length)) + '\n';
    }
  }

  md += `
---

## Top 10 Largest Files

| Rank | File | Lines | Location |
|-----:|------|------:|----------|
`;

  top10.forEach((f, i) => {
    const location = f.relativePath.split(path.sep).slice(0, -1).join('/');
    md += row(i + 1, f.name, fmt(f.lines), location) + '\n';
  });

  md += `
---

## File Size Distribution

| Size Range | Count | Percentage |
|------------|------:|-----------:|
`;

  const ranges = [
    { label: '< 50 lines', min: 0, max: 50 },
    { label: '50-100 lines', min: 50, max: 100 },
    { label: '100-200 lines', min: 100, max: 200 },
    { label: '200-500 lines', min: 200, max: 500 },
    { label: '> 500 lines', min: 500, max: Infinity }
  ];

  for (const range of ranges) {
    const count = allFiles.filter(f => f.lines >= range.min && f.lines < range.max).length;
    md += row(range.label, count, (count/allFiles.length*100).toFixed(1) + '%') + '\n';
  }

  md += `
---

## Generation

This file is auto-generated by:

\`\`\`bash
cd server
npm run metrics
\`\`\`

**Script:** \`server/scripts/generate-metrics.js\`

For architectural assessments and quality scores, see [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md).

---

*See [TOOLS](TOOLS.md) for all development tools*
`;

  // Write output
  fs.writeFileSync(OUTPUT_FILE, md);
  console.log(`✅ Generated ${OUTPUT_FILE}`);
  console.log(`   ${fmt(totalLOC)} lines in ${totalFiles} files`);
}

generate();
