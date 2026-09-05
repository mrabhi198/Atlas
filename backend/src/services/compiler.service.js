import { getDb } from '../db/index.js';

// PROTO TYPE SIMULATOR — not a real compiler.
//
// This service emulates the "Scale Instagram Followers Search" mission
// benchmark by matching keywords in the submitted code instead of
// compiling and executing it. It exists to power the current prototype
// UX and must be replaced by a real sandboxed execution engine before
// production. See architecture.md (Compiler / Execution Platform) for
// the target architecture.

export async function executeMissionSimulation(userId, code) {
  const db = getDb();
  const userRow = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!userRow) {
    const error = new Error('User node not found.');
    error.status = 404;
    throw error;
  }

  const isOptimized = code.includes('TrieNode') || code.includes('buildIndex') || code.includes('Trie');

  const terminalLogs = [
    'Building Kotlin JVM module...',
    'Executing task: :compileKotlin',
    'Compilation Successful.',
    'Executing task: :test --tests "com.atlas.mission.SearchBenchmarks"',
    'Running performance suite for 50,000 followers...'
  ];

  let success = false;
  let latency = 0;
  let memory = 0;

  if (isOptimized) {
    success = true;
    latency = parseFloat((0.8 + Math.random() * 0.9).toFixed(2));
    memory = parseFloat((4.2 + Math.random() * 0.8).toFixed(2));
    terminalLogs.push(
      '[BENCHMARK] Dataset Size: 50,000 follower records',
      '[BENCHMARK] Query Pattern: Prefix query "follower_49"',
      `[BENCHMARK] Latency: ${latency} ms (Budget constraint: < 5.00 ms) - PASS`,
      `[BENCHMARK] Memory Overhead: ${memory} MB (Budget constraint: < 10.00 MB) - PASS`,
      '[BENCHMARK] Accuracy Index: 100% Correct Match - PASS',
      ' ',
      '✔ ALL TESTS PASSED SUCCESSFULLY',
      'XP Awarded: +800 XP',
      'Passport status updated: Scale Instagram Followers Search [VERIFIED]',
      'BUILD SUCCESSFUL'
    );

    const newXp = userRow.xp + 800;
    const newLevel = Math.floor(newXp / 1000) + 1;
    await db.run('UPDATE users SET xp = ?, level = ?, code_quality = 94 WHERE id = ?', [newXp, newLevel, userId]);
    await db.run(
      'INSERT OR REPLACE INTO missions (id, user_id, title, status, completed_at, source_code, latency, memory) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['instagram_search', userId, 'Scale Instagram Followers Search', 'VERIFIED', new Date().toISOString(), code, latency, memory]
    );
  } else {
    success = false;
    latency = parseFloat((260 + Math.random() * 50).toFixed(2));
    memory = parseFloat((1.1 + Math.random() * 0.1).toFixed(2));
    terminalLogs.push(
      '[BENCHMARK] Dataset Size: 50,000 follower records',
      '[BENCHMARK] Query Pattern: Prefix query "follower_49"',
      `[BENCHMARK] Latency: ${latency} ms (Budget constraint: < 5.00 ms) - FAILED`,
      `[BENCHMARK] Memory Overhead: ${memory} MB (Budget constraint: < 10.00 MB) - PASS`,
      '[BENCHMARK] Error: Latency budget exceeded! Linear O(N) complexity is too high for this dataset.',
      ' ',
      '❌ BENCHMARK FAILED (1/2 Assertions Passed)',
      'Hint: Analyze the search loop. A list filter checks every elements linearly. Index your elements!',
      'BUILD FAILED'
    );
  }

  const updatedUser = await db.get('SELECT id, email, username, role, xp, level, code_quality FROM users WHERE id = ?', [userId]);
  return { success, logs: terminalLogs, user: updatedUser };
}