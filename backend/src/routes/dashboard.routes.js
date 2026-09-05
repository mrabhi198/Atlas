import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. Dashboard Summary Data
router.get('/summary', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const db = getDb();

    // User & Profile stats
    const userRow = await db.get('SELECT username, role, xp, level, code_quality FROM users WHERE id = ?', [userId]);
    const profileRow = await db.get('SELECT full_name, avatar, career_goal, learning_track FROM profiles WHERE user_id = ?', [userId]);

    // Goals
    const goalsList = await db.all('SELECT goal_type, target_value, current_value FROM user_goals WHERE user_id = ?', [userId]);
    const dailyGoals = goalsList.filter(g => g.goal_type.startsWith('daily_'));
    const weeklyGoals = goalsList.filter(g => g.goal_type.startsWith('weekly_'));

    // Notifications
    const notifications = await db.all('SELECT id, title, message, category, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    // Plan & Preferences
    let prefRow = await db.get('SELECT pinned_actions, today_plan FROM dashboard_preferences WHERE user_id = ?', [userId]);
    if (!prefRow) {
      const defaultPlan = [
        { id: 'item_1', type: 'lesson', title: 'Character Trie Structs & Memory Layout', duration: '15m', completed: 0 },
        { id: 'item_2', type: 'logic', title: 'String Prefix Parsing Benchmark', duration: '10m', completed: 0 },
        { id: 'item_3', type: 'mission', title: 'Scale Instagram Followers Search', duration: '35m', completed: 0 },
        { id: 'item_4', type: 'reflection', title: 'Write Code-Quality Review Log', duration: '10m', completed: 0 }
      ];
      const pinned = ['ide', 'passport', 'settings'];
      await db.run(
        'INSERT INTO dashboard_preferences (user_id, pinned_actions, today_plan) VALUES (?, ?, ?)',
        [userId, JSON.stringify(pinned), JSON.stringify(defaultPlan)]
      );
      prefRow = { pinned_actions: JSON.stringify(pinned), today_plan: JSON.stringify(defaultPlan) };
    }

    const pinnedActions = JSON.parse(prefRow.pinned_actions);
    const todayPlan = JSON.parse(prefRow.today_plan || '[]');

    // Calculate progress
    const completedCount = todayPlan.filter(item => item.completed === 1).length;
    const todayProgress = todayPlan.length > 0 ? Math.round((completedCount / todayPlan.length) * 100) : 0;

    // Recommendations
    const recommendations = await db.all('SELECT id, type, title, estimated_time, difficulty FROM learning_recommendations WHERE user_id = ?', [userId]);

    // Recent Activity
    const recentActivity = await db.all('SELECT activity_type, description, timestamp FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10', [userId]);

    // Calendar Heatmap Events
    const calendarEvents = await db.all('SELECT event_date, event_type, title, details FROM calendar_events WHERE user_id = ?', [userId]);

    // Continue Coding Session
    const continueCoding = await db.get('SELECT activity_type, activity_id, editor_state, time_spent, last_active FROM learning_sessions WHERE user_id = ? AND activity_type = "mission"', [userId]);

    // Mock Analytics Data
    const analytics = {
      weeklyHours: [2.5, 3.8, 1.2, 4.5, 3.2, 2.0, 5.5],
      monthlyXp: [800, 1200, 1500, 1800, 2400, 2800],
      topicMastery: [
        { topic: 'Kotlin Syntax', score: 90 },
        { topic: 'Trie Trees', score: 85 },
        { topic: 'Big-O Analysis', score: 75 },
        { topic: 'Memory Profiling', score: 60 }
      ]
    };

    res.json({
      user: userRow,
      profile: profileRow,
      streak: 5,
      todayProgress,
      dailyGoals,
      weeklyGoals,
      notifications,
      pinnedActions,
      todayPlan,
      recommendations,
      recentActivity,
      calendarEvents,
      continueCoding,
      analytics
    });
  } catch (err) {
    console.error('Summary API error:', err);
    res.status(500).json({ error: 'Failed to construct dashboard data summary.' });
  }
});

// 2. Regenerate Learning Plan
router.post('/regenerate-plan', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const db = getDb();
    const prefRow = await db.get('SELECT today_plan FROM dashboard_preferences WHERE user_id = ?', [userId]);
    if (!prefRow) return res.status(404).json({ error: 'Preferences not initialized.' });

    const currentPlan = JSON.parse(prefRow.today_plan || '[]');

    const lessonPool = [
      'Kotlin Collections vs Java Streams Complexity',
      'Asymptotic Complexity Bounds & Big-O Notation',
      'Memory Footprints of Nested Pointers',
      'Kotlin Sequences and Laziness Evaluators',
      'Autocompletion Caching Architectures'
    ];
    const logicPool = [
      'Optimize Follower List Filtering Loop',
      'Dynamic Array Expansion Benchmarks',
      'Implement Local LFU Cache Expiry Policy',
      'Compare String Regex Matching Performance',
      'Binary Search Bounds Verification'
    ];
    const missionPool = [
      'Design High-Throughput Autocomplete Cache Node',
      'Scale Database Connection Pooling Gateway',
      'Optimize Compiler Sandbox Executions Cache',
      'Establish Sandbox Secure Memory Jail',
      'Refactor Trie Node Array Allocation Size'
    ];
    const reflectionPool = [
      'Document Autocomplete Algorithmic Slowness',
      'Analyze Cache Miss SLAs Under 5ms',
      'Reflect on Keypad PIN Passcode Security',
      'Review Sandbox CPU Exhaustion Benchmarks'
    ];

    const pickNew = (pool, currentTitles) => {
      const unused = pool.filter(t => !currentTitles.includes(t));
      return unused.length > 0 ? unused[Math.floor(Math.random() * unused.length)] : pool[Math.floor(Math.random() * pool.length)];
    };

    const currentTitles = currentPlan.map(item => item.title);

    const newPlan = currentPlan.map(item => {
      if (item.completed === 1) return item;

      let newTitle = item.title;
      if (item.type === 'lesson') newTitle = pickNew(lessonPool, currentTitles);
      if (item.type === 'logic') newTitle = pickNew(logicPool, currentTitles);
      if (item.type === 'mission') newTitle = pickNew(missionPool, currentTitles);
      if (item.type === 'reflection') newTitle = pickNew(reflectionPool, currentTitles);

      return {
        ...item,
        title: newTitle
      };
    });

    await db.run(
      'UPDATE dashboard_preferences SET today_plan = ? WHERE user_id = ?',
      [JSON.stringify(newPlan), userId]
    );

    res.json({ todayPlan: newPlan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate today\'s plan.' });
  }
});

// 3. Toggle Learning Plan Item
router.post('/plan/toggle', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { itemId, completed } = req.body;

  try {
    const db = getDb();
    const prefRow = await db.get('SELECT today_plan FROM dashboard_preferences WHERE user_id = ?', [userId]);
    if (!prefRow) return res.status(404).json({ error: 'Preferences not initialized.' });

    let plan = JSON.parse(prefRow.today_plan || '[]');
    let itemMatched = null;

    plan = plan.map(item => {
      if (item.id === itemId) {
        itemMatched = item;
        return { ...item, completed: completed ? 1 : 0 };
      }
      return item;
    });

    if (!itemMatched) {
      return res.status(404).json({ error: 'Plan item not found.' });
    }

    await db.run(
      'UPDATE dashboard_preferences SET today_plan = ? WHERE user_id = ?',
      [JSON.stringify(plan), userId]
    );

    if (completed) {
      const userRow = await db.get('SELECT xp, level FROM users WHERE id = ?', [userId]);
      const newXp = (userRow.xp || 0) + 100;
      const newLevel = Math.floor(newXp / 1000) + 1;
      await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, newLevel, userId]);

      await db.run(
        'INSERT INTO activity_logs (user_id, activity_type, description, timestamp) VALUES (?, ?, ?, ?)',
        [userId, 'plan_item', `Completed plan task: "${itemMatched.title}" (+100 XP)`, new Date().toISOString()]
      );

      let goalType = '';
      if (itemMatched.type === 'lesson') goalType = 'daily_lessons';
      if (itemMatched.type === 'logic') goalType = 'daily_logic';
      if (itemMatched.type === 'mission') goalType = 'daily_missions';

      if (goalType) {
        await db.run(
          'UPDATE user_goals SET current_value = current_value + 1, updated_at = ? WHERE user_id = ? AND goal_type = ?',
          [new Date().toISOString(), userId, goalType]
        );
      }
    }

    res.json({ todayPlan: plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan item.' });
  }
});

// 4. Notifications API
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const list = await db.all('SELECT id, title, message, category, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read.' });
  }
});

router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alert.' });
  }
});

// 5. Pinned Actions Preferences
router.post('/preferences', authenticateToken, async (req, res) => {
  const { pinnedActions } = req.body;
  if (!Array.isArray(pinnedActions)) return res.status(400).json({ error: 'Invalid payload.' });

  try {
    const db = getDb();
    await db.run(
      'UPDATE dashboard_preferences SET pinned_actions = ? WHERE user_id = ?',
      [JSON.stringify(pinnedActions), req.user.id]
    );
    res.json({ pinnedActions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update dashboard preferences.' });
  }
});

// 6. Active heartbeat
router.post('/heartbeat', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const db = getDb();
    await db.run(
      'UPDATE user_goals SET current_value = current_value + 30, updated_at = ? WHERE user_id = ? AND goal_type = "daily_time"',
      [new Date().toISOString(), userId]
    );

    await db.run(
      'UPDATE learning_sessions SET time_spent = time_spent + 30, last_active = ? WHERE user_id = ? AND activity_type = "mission"',
      [new Date().toISOString(), userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Heartbeat log failed.' });
  }
});

export default router;