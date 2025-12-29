# 📝 Quiz Editor - User Manual

Complete guide for creating and managing quizzes.

---

## 🎯 What is the Quiz Editor?

The Quiz Editor is a professional web application for teachers to create, edit, and manage interactive quizzes. It offers an intuitive user interface with extensive features.

**Access:** `http://localhost:37373/editor/`

---

## 🚀 Getting Started

### 1. Login

Open the editor and enter the teacher password (default: `ingo`).

### 2. Create New Quiz

1. Select **"➕ Create New Quiz"** from dropdown
2. Enter title (e.g., "Our Earth")
3. Click **"➕ Create"**
4. Quiz is now saved in the database

### 3. Add First Question

1. Click the **"+"** button
2. Enter question text
3. Add answers
4. Mark at least one answer as correct ✓
5. Click **"💾 Save"**

---

## 🎨 Main Functions

### Quiz Management

#### Open Quiz
- Dropdown menu shows all existing quizzes
- Click on quiz name to load it in the editor

#### Create Quiz
1. Select "Create New Quiz" from dropdown
2. Enter title
3. Click "Create" → Quiz is immediately saved to DB

**Important:** The quiz title is automatically converted to an "imagePath":
- "Our Earth!" → `Our_Earth`
- "Math Quiz 2024" → `Math_Quiz_2024`

#### Rename Quiz
Currently not directly possible - use JSON mode or create a new quiz.

---

## ✍️ Creating Questions

### Add Question

Click the **"+"** button in the question navigation.

**Note:** The "+" button only appears after the quiz has been created!

### Edit Question

Each question has the following fields:

#### **Keyword** (Short Name)
- Appears in question navigation
- Optional - if empty, question ID is used
- Example: "Shape", "Surface"

#### **Question Text**
- Full question for students
- Supports **Markdown** (more below)
- Can contain images, videos

#### **Explanation** (optional)
- Displayed after session ends
- Explains the correct answer
- Also Markdown-capable

### Add Answers

1. Click **"Add Answer"**
2. Enter answer text
3. Activate checkbox for correct answer(s)
4. Optional: Explanation for individual answer

**Important:** At least one answer MUST be marked as correct, otherwise:
- ❌ Saving is blocked
- ❌ Question switching is blocked
- ❌ JSON mode is blocked

### Multiple-Choice vs. Single-Choice

- **Single-Choice:** Only one checkbox activated
- **Multiple-Choice:** Multiple checkboxes activated

The quiz app detects this automatically!

---

## 🖼️ Markdown Support

Questions and explanations support full Markdown:

### Text Formatting
```markdown
**Bold**
_Italic_
`Code`
```

### Lists
```markdown
- Item 1
- Item 2
  - Subitem
```

### Images
```markdown
![Alternative text](imagename.jpg)
```

**Tip:** Use the Media Manager (see below) and copy the Markdown code!

### Links
```markdown
[Link text](https://example.com)
```

### Preview

Click **"👁️"** next to a text field to see the Markdown preview.

---

## 📁 Media Manager

The Media Manager enables easy uploading and managing of media.

### Open Media Manager

Click **"📁 Media"** button in the toolbar.

### Upload Files

**Three methods:**

#### 1. Drag & Drop (recommended)
- Drag files from Explorer/Finder into the **large gray zone**
- Instant upload

#### 2. Drag Image URL
- Drag image from browser (e.g., Google Images) into drop zone
- Automatically downloaded

#### 3. Manual Selection
- Click **"📂 Select Files"**
- Choose files → automatic upload

#### 4. Load from URL
- Enter URL in text field
- Click **"🌐 Load from URL"**

**Supported Formats:**
- Images: PNG, JPG, JPEG, GIF, SVG, WebP
- Videos: MP4, WebM
- Audio: MP3, WAV, OGG

### Use Media

After upload, each file appears with three buttons:

- **📋** Copy Markdown - Copies `![](filename.jpg)` to clipboard
- **✏️** Rename - Changes the filename (important for `download.jpg`!)
- **🗑️** Delete - Removes the file (with confirmation)

**Workflow:**
1. Upload image
2. Click ✏️ → Rename to "globe.png"
3. Click 📋 → Markdown copied
4. Click "↶ Back to Quiz"
5. Paste into question text (Ctrl+V)

---

## 🔄 UI Mode vs. JSON Mode

### UI Mode (Default)

User-friendly graphical interface:
- Forms for questions
- Drag & drop for answers
- Preview functions

### JSON Mode

Professional code editor with:
- **Syntax Highlighting** (Dracula Theme)
- **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- **Line Numbers**
- **Bracket Matching**
- **Code Folding**

**Switch:** Click **"JSON Mode"** button

**Important:**
- Undo/Redo only works in JSON mode
- Use JSON mode for complex edits

---

## 🔍 Validation & Security

### Automatic Validation

The editor automatically checks:

#### Before Question Switch
When you want to switch to another question:
- ✅ Does the current question have at least one correct answer?
- ❌ No → Blocking + error message

#### Before JSON Mode
When you want to switch to JSON mode:
- ✅ Current question valid?
- ❌ No → Blocking

#### Before Save
When you want to save:
- ✅ ALL questions with answers have correct marking?
- ❌ No → Error message: "Questions: 1, 3, 5"

### Unsaved Changes

The editor automatically detects unsaved changes:

**Warning on:**
- Quiz switch
- Create new quiz
- Close browser tab

**Dialog:** "You have unsaved changes! Do you want to discard them?"

**Tip:** Save regularly with **"💾 Save"**!

---

## 🎮 Advanced Features

### Reorder Questions

**Drag & Drop** in question navigation:
1. Click and hold question in top bar
2. Drag to new position
3. Release → New order

### Reorder Answers

**Drag & Drop** for answers:
1. Click and hold answer card
2. Drag up/down
3. Release

### Delete Question

**Danger zone!**
1. Navigate to question
2. **"Delete Question"** button (red)
3. Confirm

### Explanations

**Two levels:**

#### Question Explanation
Applies to the entire question - displayed after session ends.

#### Answer Explanation
Applies only to a specific answer:
1. Click **"📝"** icon for answer
2. Explanation field appears
3. Enter text

---

## 🚀 Session Management

### Start Session

1. Create and save quiz
2. Click **"🚀 Start Session"**
3. Optional: Set time window
4. Session name is generated (e.g., `2024-12-13-20-30`)

### Session Link

After starting you'll receive:
```
http://localhost:37373/quiz?session=2024-12-13-20-30
```

Share this link with students!

### End Session

Sessions can be manually ended or expire automatically (based on time window).

---

## 📊 Best Practices

### Quiz Creation

✅ **Good Practice:**
- Short, concise questions
- 3-5 answers per question
- Clear explanations
- Meaningful keywords
- Images for illustration

❌ **Avoid:**
- Too long questions (>200 words)
- Too many answers (>8)
- Ambiguous phrasing
- Missing correct answers

### Media Management

✅ **Good Practice:**
- Meaningful filenames (`globe.png`, not `download.jpg`)
- Compressed images (~500KB max)
- Consistent image sizes

❌ **Avoid:**
- Very large files (>5MB)
- Special characters in filenames
- Too many media per question

### Workflow

**Recommended Process:**
1. Create quiz
2. Create all questions in UI mode
3. Upload media
4. Insert Markdown
5. Save
6. Start session
7. After session: Check statistics

---

## ⌨️ Keyboard Shortcuts

### UI Mode
- No special shortcuts (normal browser navigation)

### JSON Mode
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo (Windows/Linux)
- **Cmd+Z** - Undo (Mac)
- **Cmd+Shift+Z** - Redo (Mac)
- **Ctrl+F** - Search

---

## 🐛 Troubleshooting

### "Please mark at least one answer as correct!"

**Problem:** Question has no correct answer.

**Solution:** Activate checkbox for at least one answer.

---

### Media not displayed

**Problem:** Markdown syntax wrong or file not uploaded.

**Solution:**
1. Open Media Manager
2. Check if file exists
3. Click 📋 and re-insert Markdown

---

### Quiz disappears after adding question

**Problem:** Quiz was not created (old behavior).

**Solution:** Update to the latest version - problem has been fixed!

---

### "You have unsaved changes" even though I saved

**Problem:** Additional changes were made after saving.

**Solution:** Save again!

---

## 📱 Mobile Usage

The editor is **responsive** and works on tablets:

- ✅ iPad (Landscape) - Full functionality
- ✅ iPad (Portrait) - Limited but usable
- ⚠️ Smartphones - Not recommended (too small)

**Tip:** Use desktop browser for best experience!

---

## 🔐 Security

### Data Backup

**Important:** Create regular backups!

```bash
# Backup SQLite database
cp data.sqlite data.sqlite.backup

# Backup media folder
cp -r quizzes quizzes.backup
```

### Export Quiz

1. Load quiz
2. Open JSON mode
3. Select all (Ctrl+A)
4. Copy (Ctrl+C)
5. Paste into text file

---

## 🆘 Support & Feedback

For questions or problems:
1. Read this documentation
2. Check CHANGES.md for update details
3. Contact: [Your contact info]

---

## 📚 Further Documentation

**For Developers:**
- See source code comments
- CHANGES.md for version history
- server.js for API documentation

---

**Version:** 1.3 (December 2025)
**Last updated:** December 13, 2025
