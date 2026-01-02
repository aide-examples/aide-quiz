/**
 * E2E API Test: Complete Quiz Workflow
 *
 * Tests the full lifecycle:
 * 1. Delete existing test quiz (if exists) - initial cleanup
 * 2. Create new quiz as teacher
 * 3. Add questions with answers
 * 4. Create a session
 * 5. Simulate 4 participants with different answers
 * 6. Verify statistics
 * 7. Fetch result for one user
 * 8. Delete test data (unless --keep is specified)
 *
 * Usage:
 *   cd server
 *   node tests/e2e-quiz-workflow.js          # Run with cleanup
 *   node tests/e2e-quiz-workflow.js --keep   # Keep test data in DB
 *
 * Requirements:
 *   - Server must be running on localhost:37373
 *   - Node.js 18+ (for native fetch)
 *
 * On error: Script aborts immediately, test data remains in DB for inspection.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:37373';
// Use TEACHER_PASS env var, default matches .env.sample
const TEACHER_PASSWORD = process.env.TEACHER_PASS || 'test';
const TEST_QUIZ_TITLE = 'E2E-Test-Quiz';
const TEST_QUIZ_PATH = 'e2e-test-quiz';

// Parse command line arguments
const KEEP_DATA = process.argv.includes('--keep');

// Cookie jar for session management
let sessionCookie = null;

/**
 * Make HTTP request with session cookie
 */
async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (sessionCookie) {
    options.headers['Cookie'] = sessionCookie;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  // Store session cookie from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data, ok: response.ok };
}

/**
 * Test assertions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\n    Expected: ${expected}\n    Actual: ${actual}`);
  }
  console.log(`  ✓ ${message}`);
}

/**
 * Test Steps
 */

async function step1_login() {
  console.log('\n📋 Step 1: Login as teacher');

  const res = await request('POST', '/api/teacher/login', { password: TEACHER_PASSWORD });
  assert(res.ok, `Login successful (status ${res.status})`);
  assert(res.data.ok === true, 'Response contains ok: true');
}

async function step2_deleteExistingQuiz() {
  console.log('\n📋 Step 2: Check and delete existing test quiz');

  // Get all quizzes
  const res = await request('GET', '/api/teacher/quizzes');
  assert(res.ok, 'Fetched quiz list');

  // Find test quiz
  const testQuiz = res.data.find(q => q.title === TEST_QUIZ_TITLE);

  if (testQuiz) {
    console.log(`  Found existing quiz: ${testQuiz.id}`);
    const delRes = await request('DELETE', `/api/teacher/quiz/${testQuiz.id}`);
    assert(delRes.ok, `Deleted existing quiz (status ${delRes.status})`);
  } else {
    console.log('  ✓ No existing test quiz found');
  }
}

async function step3_createQuiz() {
  console.log('\n📋 Step 3: Create new quiz');

  const res = await request('POST', '/api/teacher/createQuiz', {
    title: TEST_QUIZ_TITLE,
    imagePath: TEST_QUIZ_PATH,
    language: 'de'
  });

  assert(res.ok, `Quiz created (status ${res.status})`);
  assert(res.data.quizId, 'Quiz ID returned');

  console.log(`  Quiz ID: ${res.data.quizId}`);
  return res.data.quizId;
}

async function step4_saveQuizContent(quizId) {
  console.log('\n📋 Step 4: Save quiz with 2 questions');

  const quiz = {
    id: quizId,
    title: TEST_QUIZ_TITLE,
    imagePath: TEST_QUIZ_PATH,
    language: 'de',
    questions: [
      {
        id: 'q1',
        keyword: 'Frage1',
        text: 'Was ist die Hauptstadt von Deutschland?',
        type: 'single',
        options: [
          { id: 'A', text: 'München', correct: false },
          { id: 'B', text: 'Hamburg', correct: false },
          { id: 'C', text: 'Berlin', correct: true }
        ],
        reason: 'Berlin ist seit 1990 die Hauptstadt.'
      },
      {
        id: 'q2',
        keyword: 'Frage2',
        text: 'Welche Farben hat die deutsche Flagge?',
        type: 'multiple',
        multiple: true,
        options: [
          { id: 'A', text: 'Schwarz', correct: true },
          { id: 'B', text: 'Rot', correct: true },
          { id: 'C', text: 'Blau', correct: false },
          { id: 'D', text: 'Gold', correct: true }
        ],
        reason: 'Schwarz-Rot-Gold sind die Nationalfarben.'
      }
    ]
  };

  const res = await request('POST', '/api/teacher/saveQuiz', {
    quizId,
    quiz
  });

  assert(res.ok, `Quiz saved (status ${res.status})`);
  return quiz;
}

async function step5_createSession(quizId) {
  console.log('\n📋 Step 5: Create session (no time limit - results immediately visible)');

  // No open_until means results are visible immediately after submission
  const res = await request('POST', '/api/teacher/createSession', {
    quizId
  });

  assert(res.ok, `Session created (status ${res.status})`);
  assert(res.data.sessionName, 'Session name returned');

  console.log(`  Session: ${res.data.sessionName}`);
  return res.data.sessionName;
}

async function step6_simulateParticipants(sessionName) {
  console.log('\n📋 Step 6: Simulate 4 participants');

  // Clear session cookie to act as anonymous student
  const savedCookie = sessionCookie;
  sessionCookie = null;

  const participants = [
    {
      userCode: 'teilnehmer1',
      // Q1: C (correct), Q2: A,B,D (correct) → 2/2 points
      answers: [
        { questionId: 'q1', chosen: ['C'] },
        { questionId: 'q2', chosen: ['A', 'B', 'D'] }
      ],
      expectedScore: 2,
      expectedMax: 2
    },
    {
      userCode: 'teilnehmer2',
      // Q1: A (wrong), Q2: A,B,D (correct) → 1/2 points
      answers: [
        { questionId: 'q1', chosen: ['A'] },
        { questionId: 'q2', chosen: ['A', 'B', 'D'] }
      ],
      expectedScore: 1,
      expectedMax: 2
    },
    {
      userCode: 'teilnehmer3',
      // Q1: C (correct), Q2: A,B (partial - missing D) → 1/2 or less
      answers: [
        { questionId: 'q1', chosen: ['C'] },
        { questionId: 'q2', chosen: ['A', 'B'] }
      ],
      expectedScore: 1, // Partial credit may vary
      expectedMax: 2
    },
    {
      userCode: 'teilnehmer4',
      // Q1: B (wrong), Q2: A,C (wrong - includes wrong answer) → 0/2 points
      answers: [
        { questionId: 'q1', chosen: ['B'] },
        { questionId: 'q2', chosen: ['A', 'C'] }
      ],
      expectedScore: 0,
      expectedMax: 2
    }
  ];

  const resultLinks = [];

  for (const p of participants) {
    const res = await request('POST', `/api/session/${sessionName}/submit`, {
      userCode: p.userCode,
      answers: p.answers
    });

    assert(res.ok, `${p.userCode}: Submission accepted`);
    console.log(`  ${p.userCode}: Score ${res.data.score}/${res.data.maxScore}`);

    // Store result link
    resultLinks.push({
      userCode: p.userCode,
      resultLink: res.data.resultLink,
      score: res.data.score,
      maxScore: res.data.maxScore
    });
  }

  // Restore teacher session
  sessionCookie = savedCookie;

  return resultLinks;
}

async function step7_verifyStatistics(sessionName) {
  console.log('\n📋 Step 7: Verify statistics');

  const res = await request('GET', `/api/session/${sessionName}/stats`);
  assert(res.ok, `Statistics fetched (status ${res.status})`);

  const stats = res.data;

  // Verify participant count
  assertEqual(stats.participants, 4, 'Participant count is 4');

  // Verify question stats exist
  assert(stats.questionStats && stats.questionStats.length === 2, 'Has 2 question stats');

  // Q1: teilnehmer1 and teilnehmer3 got it right → 2/4 = 50%
  const q1Stats = stats.questionStats.find(q => q.keyword === 'Frage1');
  assert(q1Stats, 'Q1 stats found');
  assertEqual(q1Stats.total, 4, 'Q1: 4 total answers');
  assertEqual(q1Stats.correctCount, 2, 'Q1: 2 correct answers');
  console.log(`  Q1: ${q1Stats.correctCount}/${q1Stats.total} correct (${Math.round(q1Stats.correctCount/q1Stats.total*100)}%)`);

  // Q2: teilnehmer1 and teilnehmer2 got all correct
  const q2Stats = stats.questionStats.find(q => q.keyword === 'Frage2');
  assert(q2Stats, 'Q2 stats found');
  assertEqual(q2Stats.total, 4, 'Q2: 4 total answers');
  console.log(`  Q2: ${q2Stats.correctCount}/${q2Stats.total} correct (${Math.round(q2Stats.correctCount/q2Stats.total*100)}%)`);

  return stats;
}

async function step8_fetchResult(resultLinks) {
  console.log('\n📋 Step 8: Fetch result for teilnehmer1');

  // Result endpoint is public, no auth needed
  const savedCookie = sessionCookie;
  sessionCookie = null;

  const link = resultLinks.find(r => r.userCode === 'teilnehmer1');
  assert(link, 'Found result link for teilnehmer1');

  // Extract result ID from link (format: /result?id=xxx)
  const resultId = link.resultLink.split('id=')[1];
  assert(resultId, 'Extracted result ID');

  const res = await request('GET', `/api/result/${resultId}`);
  assert(res.ok, `Result fetched (status ${res.status})`);

  const result = res.data;

  // Verify result data
  const userCode = result.userCode;
  assertEqual(userCode, 'teilnehmer1', 'User code matches');
  assertEqual(result.score, link.score, 'Score matches submission');
  assert(result.details && result.details.length === 2, 'Has 2 question details');

  console.log(`  Result: ${result.score}/${result.maxScore} points`);

  sessionCookie = savedCookie;
  return result;
}

async function step9_cleanup(quizId) {
  console.log('\n📋 Step 9: Cleanup (delete test quiz)');

  const res = await request('DELETE', `/api/teacher/quiz/${quizId}`);
  assert(res.ok, `Test quiz deleted (status ${res.status})`);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  E2E API Test: Complete Quiz Workflow');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Server: ${BASE_URL}`);
  console.log(`  Test Quiz: ${TEST_QUIZ_TITLE}`);
  if (KEEP_DATA) {
    console.log('  Mode: --keep (test data will remain in DB)');
  }

  try {
    await step1_login();
    await step2_deleteExistingQuiz();
    const quizId = await step3_createQuiz();
    await step4_saveQuizContent(quizId);
    const sessionName = await step5_createSession(quizId);
    const resultLinks = await step6_simulateParticipants(sessionName);
    await step7_verifyStatistics(sessionName);
    await step8_fetchResult(resultLinks);

    if (KEEP_DATA) {
      console.log('\n📋 Step 9: Skipped cleanup (--keep flag)');
      console.log(`  Quiz "${TEST_QUIZ_TITLE}" remains in database`);
    } else {
      await step9_cleanup(quizId);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ ALL TESTS PASSED');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);

  } catch (error) {
    // On error: abort immediately, keep data for inspection
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('  ❌ TEST FAILED - ABORTING');
    console.error('═══════════════════════════════════════════════════════');
    console.error(`  ${error.message}`);
    console.error('');
    console.error('  Test data remains in DB for inspection.');
    console.error('  Re-run the test to clean up automatically.');
    console.error('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run if executed directly
runTests();
