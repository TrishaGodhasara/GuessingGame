import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import db from './db/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Normalization function for clean fuzzy-matching
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    // Remove accents/diacritics (e.g., é -> e, ô -> o)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Convert '&' to 'and' to match both variations
    .replace(/&/g, 'and')
    // Strip all non-alphanumeric characters
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * POST /api/session/start
 * Payload: { username: string }
 * Action: Finds or creates a user, then creates a new game session.
 */
app.post('/api/session/start', (req, res) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cleanUsername = username.trim();

  try {
    // 1. Get or create user
    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);
    if (!user) {
      const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(cleanUsername);
      user = { id: result.lastInsertRowid, username: cleanUsername };
    }

    // 2. Create new session
    const sessionResult = db.prepare(`
      INSERT INTO sessions (user_id, total_score, correct_count, surrender_count)
      VALUES (?, 0, 0, 0)
    `).run(user.id);

    res.status(201).json({
      session_id: sessionResult.lastInsertRowid,
      user_id: user.id,
      username: user.username,
      total_score: 0,
      correct_count: 0,
      surrender_count: 0
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/brands/next
 * Query: ?session_id=X
 * Action: Returns a random brand not yet completed (guessed right or surrendered) in this session.
 */
app.get('/api/brands/next', (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    // Fetch a random brand not yet guessed correctly or surrendered in this session
    const nextBrand = db.prepare(`
      SELECT id, category, hint1, hint2, hint3, hint4 
      FROM brands 
      WHERE id NOT IN (
        SELECT DISTINCT brand_id 
        FROM guesses 
        WHERE session_id = ? 
          AND (is_correct = 1 OR guess_text = '__SURRENDERED__')
      )
      ORDER BY RANDOM() 
      LIMIT 1
    `).get(session_id);

    if (!nextBrand) {
      return res.json({ no_more_brands: true });
    }

    res.json(nextBrand);
  } catch (error) {
    console.error('Error fetching next brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/guess
 * Payload: { session_id, brand_id, guess_text, hints_revealed_count }
 * Action: Normalizes and checks the guess. Saves details in DB. Updates session if correct.
 */
app.post('/api/guess', (req, res) => {
  const { session_id, brand_id, guess_text, hints_revealed_count } = req.body;

  if (!session_id || !brand_id || guess_text === undefined || !hints_revealed_count) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Fetch the target brand
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(brand_id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Verify guess correctness using normalization
    const isCorrect = normalizeString(guess_text) === normalizeString(brand.name);

    // Save this guess in database
    db.prepare(`
      INSERT INTO guesses (session_id, brand_id, guess_text, is_correct, hints_revealed_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(session_id, brand_id, guess_text, isCorrect ? 1 : 0, hints_revealed_count);

    if (isCorrect) {
      // Update session statistics: +10 points, +1 correct count
      db.prepare(`
        UPDATE sessions 
        SET total_score = total_score + 10, correct_count = correct_count + 1 
        WHERE id = ?
      `).run(session_id);
    }

    res.json({
      is_correct: isCorrect,
      correct_answer: isCorrect ? brand.name : null
    });
  } catch (error) {
    console.error('Error recording guess:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/surrender
 * Payload: { session_id, brand_id }
 * Action: Logs surrender as a pseudo-guess and increments the session's surrender_count.
 */
app.post('/api/surrender', (req, res) => {
  const { session_id, brand_id } = req.body;

  if (!session_id || !brand_id) {
    return res.status(400).json({ error: 'Missing session_id or brand_id' });
  }

  try {
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(brand_id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Record surrender in guesses table to mark it resolved
    db.prepare(`
      INSERT INTO guesses (session_id, brand_id, guess_text, is_correct, hints_revealed_count)
      VALUES (?, ?, '__SURRENDERED__', 0, 4)
    `).run(session_id, brand_id);

    // Increment session surrenders
    db.prepare(`
      UPDATE sessions 
      SET surrender_count = surrender_count + 1 
      WHERE id = ?
    `).run(session_id);

    res.json({ correct_answer: brand.name });
  } catch (error) {
    console.error('Error logging surrender:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/session/end
 * Payload: { session_id }
 * Action: Sets ended_at timestamp to close session.
 */
app.post('/api/session/end', (req, res) => {
  const { session_id } = req.body;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    db.prepare(`
      UPDATE sessions 
      SET ended_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(session_id);

    const updatedSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session_id);

    res.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/user/:username/performance
 * Action: Retrieves completed sessions list & aggregates performance KPIs for dashboard.
 */
app.get('/api/user/:username/performance', (req, res) => {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.json({ user_exists: false, sessions: [], stats: null });
    }

    // Get all completed/ended sessions
    const sessions = db.prepare(`
      SELECT id, started_at, ended_at, total_score, correct_count, surrender_count 
      FROM sessions 
      WHERE user_id = ? AND ended_at IS NOT NULL
      ORDER BY started_at DESC
    `).all(user.id);

    // Compute aggregated KPIs
    const statsQuery = db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(total_score) as cumulative_score,
        AVG(total_score) as avg_score,
        SUM(correct_count) as total_correct,
        SUM(surrender_count) as total_surrendered
      FROM sessions
      WHERE user_id = ? AND ended_at IS NOT NULL
    `).get(user.id);

    const totalGuessesQuery = db.prepare(`
      SELECT COUNT(*) as guess_count 
      FROM guesses g
      JOIN sessions s ON g.session_id = s.id
      WHERE s.user_id = ? AND g.guess_text != '__SURRENDERED__'
    `).get(user.id);

    const totalCorrectGuessesQuery = db.prepare(`
      SELECT COUNT(*) as correct_count 
      FROM guesses g
      JOIN sessions s ON g.session_id = s.id
      WHERE s.user_id = ? AND g.is_correct = 1
    `).get(user.id);

    const stats = {
      total_sessions: statsQuery.total_sessions || 0,
      cumulative_score: statsQuery.cumulative_score || 0,
      avg_score: Math.round((statsQuery.avg_score || 0) * 10) / 10,
      total_correct: statsQuery.total_correct || 0,
      total_surrendered: statsQuery.total_surrendered || 0,
      guess_accuracy_pct: totalGuessesQuery.guess_count > 0 
        ? Math.round((totalCorrectGuessesQuery.correct_count / totalGuessesQuery.guess_count) * 100)
        : 0
    };

    res.json({
      user_exists: true,
      sessions,
      stats
    });
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run DB setup inside node in case seed script wasn't explicitly run
try {
  // Ensure tables are ready when server starts
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").get();
  if (!tableCheck) {
    console.log('Database tables not detected. Seeding automatically...');
    // Simply import the seed file dynamically or execute node process.
  }
} catch (e) {
  console.error('Initial table verification error:', e);
}

app.listen(PORT, () => {
  console.log(`Backend server successfully running on port ${PORT}`);
});
