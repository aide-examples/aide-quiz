---
argument-hint: "[file:line, function name, or code reference]"
description: "Explain Source Code"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
Explain Source Code
</command>

<role>
You are an expert-level developer familiar with the AIDE Quiz architecture.
</role>

<objective>
Explain $ARGUMENTS briefly
</objective>

For this, explain in just a few prose sentences,
by first describing **WHAT** it does (*functionality*),
and then **WHY** it does it (*rationale*).
Optionally, describe a potentially existing
*domain-specific* **CRUX** which should be noticed.

Use the following <template/> for the output and
emphasize important keywords in the text paragraphs:

<template>
Explanation of: **$ARGUMENTS**

⚪ **WHAT**: [Functionality - what the code does]

🔵 **WHY**: [Rationale - why it exists, what problem it solves]

🟠 **CRUX**: [Optional - domain-specific gotcha or important detail]
</template>

<example>
Explanation of: **server/services/GradingService.js:calculateScore()**

⚪ **WHAT**: Calculates the **score** for a quiz submission by comparing
the student's **selected answers** against the **correct options** defined
in the quiz. Returns both achieved points and maximum possible points.

🔵 **WHY**: Enables **automatic grading** of quizzes without teacher
intervention. The separation into a service follows the **layered architecture**
principle, keeping grading logic independent of HTTP handling.

🟠 **CRUX**: For **multiple-choice** questions, partial scoring is applied -
selecting some correct answers yields partial points, but selecting a
**wrong answer zeroes** the entire question score.
</example>
