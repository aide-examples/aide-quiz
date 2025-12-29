# 📊 Statistics Evaluation - Guide for Teachers

Detailed analysis of quiz sessions with participant statistics and answer distributions.

---

## 🎯 Overview

The statistics page shows you:
- 📈 Session overview
- 👥 Number of participants
- 📊 Answer distribution per question
- ✅ Success rates
- 💾 CSV export capability

**Access:**
```
http://localhost:37373/stats?session=[session-name]
```

---

## 📈 What does the statistics page show?

### Header Area

**Session Information:**
```
Quiz: Our Earth
Session: 2024-12-14-10-30
Participants: 25
```

**Buttons:**
- **📥 CSV Export** - Downloads detailed results
- **🔄 Refresh** - Reloads statistics (during active session)

---

## 📊 Question Statistics

For each question you'll see:

### Question Header

```
Question 1: Shape of the Earth
Participants: 25 | Correct: 18 (72%)
```

**Meaning:**
- **Participants:** How many answered this question
- **Correct:** How many answered completely correctly
- **Percent:** Success rate

### Answer Distribution

Each answer option shows:

**Example:**
```
✓ It is slightly flattened at the poles
  ████████████░░░░░░░░ 15 (60%)
```

**Meaning:**
- **✓** = Correct answer (marked green)
- **Bar** = Visual representation of frequency
- **Number** = Absolute count of voters
- **Percent** = Percentage of participants

**Color coding:**
- **🟢 Green** - Correct answer
- **⚪ Gray** - Incorrect answer

---

## 🔍 Interpreting Statistics

### Success Rate per Question

**High (>70%)** 🌟
```
Correct: 20 (80%)
```
- ✅ Question was clearly formulated
- ✅ Material well taught
- ✅ Appropriate difficulty level

**Medium (40-70%)** ⚠️
```
Correct: 15 (60%)
```
- 📝 Question might be more difficult than expected
- 📚 Maybe review material again
- 🔍 Check answers for clarity

**Low (<40%)** 🔴
```
Correct: 8 (32%)
```
- ⚠️ Question too difficult or unclear?
- ⚠️ Material not taught well enough?
- ⚠️ Incorrect answers?

### Recognizing Answer Patterns

**Equal distribution in single-choice:**
```
A: 25% | B: 25% | C: 25% | D: 25%
```
- 🎲 **Guessing** - Students didn't know
- 💡 Review material!

**Polarization:**
```
✓ A: 60% | B: 5% | C: 30% | D: 5%
```
- ❓ Two plausible answers?
- 🔍 Check phrasing

**Clear separation:**
```
✓ A: 85% | B: 5% | C: 5% | D: 5%
```
- ✅ Good question!
- ✅ Clear answers
- ✅ Material understood

**Wrong answer popular:**
```
A: 15% | ✓ B: 20% | C: 60% | D: 5%
```
- ⚠️ **Misconception** about C
- 💡 Investigate cause and clarify
- 📚 Review this topic again

---

## 💾 Using CSV Export

### Starting Export

1. Click **"📥 CSV Export"** button
2. File downloads: `[session-name]_results.csv`

### CSV Format

The file contains per line:
```csv
userCode;questionId;keyword;correct;chosen;points;maxPoints
```

**Columns:**
- **userCode:** Student identifier
- **questionId:** Question ID
- **keyword:** Question short name
- **correct:** Correct answers (IDs)
- **chosen:** Chosen answers (IDs)
- **points:** Points earned
- **maxPoints:** Possible points

### Opening CSV in Excel/Numbers

**Excel (Windows/Mac):**
1. Open CSV file
2. On import: Choose **delimiter = semicolon (;)**
3. Format data as table

**LibreOffice/OpenOffice:**
1. Open file
2. Field separator: **Semicolon**
3. Text delimiter: **"**

### Further Processing

**Create pivot table:**
- Success rate per student
- Identify most difficult questions
- Calculate average score

**Create charts:**
- Score distribution (histogram)
- Success rate per question (bar chart)
- Student comparison

---

## 🎓 Pedagogical Use

### After the Session

**1. Quick Analysis (5 min)**
- Check overall success rate
- Identify problematic questions

**2. Detailed Analysis (15 min)**
- Review each question individually
- Recognize patterns in answers
- Mark problematic questions

**3. Prepare Follow-Up**
- Identify difficult topics
- Plan review session
- Prepare additional materials

### In the Next Lecture

**Discuss results:**
```
"Only 30% got question 5 right -
 let's go through this again..."
```

**Clarify common mistakes:**
```
"60% chose C, but B is correct.
 The difference is..."
```

**Positive feedback:**
```
"85% got question 2 right -
 very good, you mastered this topic!"
```

---

## 🔬 Advanced Analysis Methods

### Calculate Item Difficulty

```
Difficulty = (Correct Answers / Participants) × 100
```

**Classification:**
- **Very easy:** >80%
- **Easy:** 60-80%
- **Medium:** 40-60%
- **Hard:** 20-40%
- **Very hard:** <20%

**Ideal distribution:**
- 20% easy questions (introduction, motivation)
- 60% medium questions (core material)
- 20% hard questions (differentiation)

### Analyze Discrimination

**Good question:**
- Strong students: >70% correct
- Weak students: <30% correct

**Poor question:**
- All perform equally well/poorly
- No difference between strong/weak

**How to determine?**
1. Export CSV
2. Identify top 25% students (by total score)
3. Identify bottom 25% students
4. Compare success rate per question

### Check Distractor Function

**Good distractors (wrong answers):**
- Chosen by 10-30%
- Plausible but clearly wrong
- Test understanding

**Poor distractors:**
- **Too obvious:** <5% choose them
- **Too plausible:** >40% choose them
- → Revise question!

---

## 📋 Best Practices

### During the Session

**Live monitoring:**
1. Keep statistics page open
2. Refresh regularly (🔄 button)
3. React quickly to problems

**Notes:**
- Refresh only shows submitted answers
- Not everyone finishes simultaneously
- Wait 5-10 min after session end for final statistics

### After the Session

**Immediately:**
1. ✅ Export and save CSV
2. ✅ Note anomalies
3. ✅ Screenshots of interesting statistics

**Within 24h:**
1. 📊 Perform detailed analysis
2. 📝 Prepare feedback for students
3. 🔧 Revise problematic questions

**Long-term:**
1. 📈 Compare statistics from multiple sessions
2. 🎯 Continuously improve quiz
3. 📚 Adapt teaching methods

---

## 🛠️ Troubleshooting

### No participants displayed

**Problem:** Session has no submissions yet.

**Solution:**
- Wait for students to participate
- Check if session link was distributed correctly
- Refresh the page (🔄)

---

### Statistics seem incomplete

**Problem:** Not all participants are visible.

**Solutions:**
1. Refresh page (🔄 button)
2. Check session time window (still open?)
3. Wait 5 minutes after session end
4. Clear browser cache and reload

---

### CSV export not working

**Problem:** Download doesn't start.

**Solutions:**
1. Disable popup blocker
2. Update browser
3. Try another browser
4. Check download folder (maybe already there?)

---

### Percentages don't add up to 100%

**Problem:** Normal for multiple-choice!

**Explanation:**
- Students can choose multiple answers
- Therefore: Sum can be >100%
- Example: 60% choose A AND 40% choose B = 100% total

---

## 💡 Tips for Better Quizzes

### Based on Statistics

**If question too easy (>90%):**
- ✏️ Add more difficult distractor
- ✏️ Ask more detailed question
- ✏️ Target higher thinking level

**If question too hard (<30%):**
- ✏️ Clearer phrasing
- ✏️ Fewer distractors
- ✏️ Maybe teach material better

**If answers unevenly distributed:**
- ✏️ Make all distractors plausible
- ✏️ Remove obvious answers
- ✏️ Randomize order (upcoming feature)

### Quiz Design Principles

**Good quiz:**
- 📊 Varied difficulty levels
- 🎯 Clear, unambiguous questions
- 💡 Plausible distractors
- 📝 Explanations for hard questions
- ⏱️ Appropriate time frame

**Poor quiz:**
- ❌ All questions equally difficult
- ❌ Ambiguous phrasing
- ❌ Obvious answers
- ❌ No explanations
- ❌ Too short/long

---

## 📚 Further Resources

### Pedagogy

- **Item Response Theory** - Professional question analysis
- **Bloom's Taxonomy** - Thinking levels in questions
- **Constructive Alignment** - Learning objectives with assessment

### Statistics Software

**For deeper analysis:**
- SPSS, R, Python
- Import CSV data
- Correlations, cluster analyses

---

## 🎯 Summary

**The statistics page helps you:**
1. ✅ Evaluate sessions
2. ✅ Measure teaching quality
3. ✅ Identify weaknesses
4. ✅ Improve quizzes
5. ✅ Help students

**Use it regularly for:**
- 📈 Continuous improvement
- 🎓 Better teaching
- 📊 Data-driven decisions

---

## 🆘 Support

**For questions:**
- 📖 This documentation
- 💻 Technical support
- 📧 [Support contact]

---

**Good luck with your teaching!** 🎓✨

---

**Last updated:** December 2025
