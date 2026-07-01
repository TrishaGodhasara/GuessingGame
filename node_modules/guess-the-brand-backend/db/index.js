import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.db.json');

// Initialize local JSON store if empty or not existing
const initData = {
  users: [],
  sessions: [],
  guesses: [],
  brands: []
};

const loadDatabase = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initData, null, 2), 'utf8');
    return initData;
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse database.db.json, resetting', e);
    fs.writeFileSync(dbPath, JSON.stringify(initData, null, 2), 'utf8');
    return initData;
  }
};

const saveDatabase = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// Database state
const state = loadDatabase();

class FakeStatement {
  constructor(sqlQuery) {
    this.sql = sqlQuery.trim().replace(/\s+/g, ' ');
  }

  run(...params) {
    // Reload state to ensure concurrency safety
    const data = loadDatabase();
    const sql = this.sql;

    // 1. Create table (noop)
    if (sql.startsWith('CREATE TABLE')) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    // 2. Insert into brands
    if (sql.includes('INSERT INTO brands')) {
      // Binding parameters can be passed as named objects (e.g. {name, category...})
      const brand = params[0];
      const newId = data.brands.length > 0 ? Math.max(...data.brands.map(b => b.id)) + 1 : 1;
      const newBrand = { id: newId, ...brand };
      data.brands.push(newBrand);
      saveDatabase(data);
      return { changes: 1, lastInsertRowid: newId };
    }

    // 3. Insert into users
    if (sql.includes('INSERT INTO users')) {
      const username = params[0];
      const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
      const newUser = { id: newId, username, created_at: new Date().toISOString() };
      data.users.push(newUser);
      saveDatabase(data);
      return { changes: 1, lastInsertRowid: newId };
    }

    // 4. Insert into sessions
    if (sql.includes('INSERT INTO sessions')) {
      const userId = params[0];
      const newId = data.sessions.length > 0 ? Math.max(...data.sessions.map(s => s.id)) + 1 : 1;
      const newSession = {
        id: newId,
        user_id: userId,
        started_at: new Date().toISOString(),
        ended_at: null,
        total_score: 0,
        correct_count: 0,
        surrender_count: 0
      };
      data.sessions.push(newSession);
      saveDatabase(data);
      return { changes: 1, lastInsertRowid: newId };
    }

    // 5. Insert into guesses
    if (sql.includes('INSERT INTO guesses')) {
      const [session_id, brand_id, guess_text, is_correct, hints_revealed_count] = params;
      const newId = data.guesses.length > 0 ? Math.max(...data.guesses.map(g => g.id)) + 1 : 1;
      const newGuess = {
        id: newId,
        session_id,
        brand_id,
        guess_text,
        is_correct: !!is_correct,
        hints_revealed_count,
        guessed_at: new Date().toISOString()
      };
      data.guesses.push(newGuess);
      saveDatabase(data);
      return { changes: 1, lastInsertRowid: newId };
    }

    // 6. Update session points (+10, +1 correct)
    if (sql.includes('UPDATE sessions SET total_score = total_score + 10')) {
      const sessionId = params[0];
      const session = data.sessions.find(s => s.id === sessionId);
      if (session) {
        session.total_score += 10;
        session.correct_count += 1;
        saveDatabase(data);
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // 7. Update session surrender (+1 surrender)
    if (sql.includes('UPDATE sessions SET surrender_count = surrender_count + 1')) {
      const sessionId = params[0];
      const session = data.sessions.find(s => s.id === sessionId);
      if (session) {
        session.surrender_count += 1;
        saveDatabase(data);
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // 8. End session (set ended_at)
    if (sql.includes('UPDATE sessions SET ended_at = CURRENT_TIMESTAMP')) {
      const sessionId = params[0];
      const session = data.sessions.find(s => s.id === sessionId);
      if (session) {
        session.ended_at = new Date().toISOString();
        saveDatabase(data);
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    console.warn('Unhandled FakeStatement.run query:', sql);
    return { changes: 0, lastInsertRowid: 0 };
  }

  get(...params) {
    const data = loadDatabase();
    const sql = this.sql;

    // 1. SELECT COUNT(*) AS count FROM brands
    if (sql.includes('SELECT COUNT(*) AS count FROM brands')) {
      return { count: data.brands.length };
    }

    // 2. SELECT * FROM users WHERE username = ?
    if (sql.includes('SELECT * FROM users WHERE username = ?')) {
      const username = params[0];
      return data.users.find(u => u.username === username);
    }

    // 3. SELECT * FROM brands WHERE id = ?
    if (sql.includes('SELECT * FROM brands WHERE id = ?')) {
      const brandId = params[0];
      return data.brands.find(b => b.id === brandId);
    }

    // 4. SELECT * FROM sessions WHERE id = ?
    if (sql.includes('SELECT * FROM sessions WHERE id = ?')) {
      const sessionId = params[0];
      return data.sessions.find(s => s.id === sessionId);
    }

    // 5. GET NEXT RANDOM UNSEEN BRAND
    // "SELECT id, category, hint1, hint2, hint3, hint4 FROM brands WHERE id NOT IN ( SELECT DISTINCT brand_id FROM guesses WHERE session_id = ? AND (is_correct = 1 OR guess_text = '__SURRENDERED__') ) ORDER BY RANDOM() LIMIT 1"
    if (sql.includes('FROM brands WHERE id NOT IN') && sql.includes('guesses')) {
      const sessionId = params[0];
      
      // Get all brand IDs that have been solved or surrendered in this session
      const resolvedBrandIds = data.guesses
        .filter(g => g.session_id === sessionId && (g.is_correct === true || g.guess_text === '__SURRENDERED__'))
        .map(g => g.brand_id);

      // Find brands not in this list
      const unseenBrands = data.brands.filter(b => !resolvedBrandIds.includes(b.id));

      if (unseenBrands.length === 0) {
        return null; // No more brands
      }

      // Pick random brand
      const randomIndex = Math.floor(Math.random() * unseenBrands.length);
      const chosen = unseenBrands[randomIndex];
      return {
        id: chosen.id,
        category: chosen.category,
        hint1: chosen.hint1,
        hint2: chosen.hint2,
        hint3: chosen.hint3,
        hint4: chosen.hint4
      };
    }

    // 6. Aggregate KPIs for username
    // "SELECT COUNT(*) as total_sessions, SUM(total_score) as cumulative_score, AVG(total_score) as avg_score, SUM(correct_count) as total_correct, SUM(surrender_count) as total_surrendered FROM sessions WHERE user_id = ? AND ended_at IS NOT NULL"
    if (sql.includes('SUM(total_score)') && sql.includes('sessions')) {
      const userId = params[0];
      const completedSessions = data.sessions.filter(s => s.user_id === userId && s.ended_at !== null);
      
      if (completedSessions.length === 0) {
        return {
          total_sessions: 0,
          cumulative_score: 0,
          avg_score: 0,
          total_correct: 0,
          total_surrendered: 0
        };
      }

      const total_sessions = completedSessions.length;
      const cumulative_score = completedSessions.reduce((acc, s) => acc + s.total_score, 0);
      const total_correct = completedSessions.reduce((acc, s) => acc + s.correct_count, 0);
      const total_surrendered = completedSessions.reduce((acc, s) => acc + s.surrender_count, 0);
      const avg_score = cumulative_score / total_sessions;

      return {
        total_sessions,
        cumulative_score,
        avg_score,
        total_correct,
        total_surrendered
      };
    }

    // 7. Count guess_count for user
    // "SELECT COUNT(*) as guess_count FROM guesses g JOIN sessions s ON g.session_id = s.id WHERE s.user_id = ? AND g.guess_text != '__SURRENDERED__'"
    if (sql.includes('guess_count') && sql.includes('guesses')) {
      const userId = params[0];
      const userSessionIds = data.sessions.filter(s => s.user_id === userId).map(s => s.id);
      const guessCount = data.guesses.filter(g => userSessionIds.includes(g.session_id) && g.guess_text !== '__SURRENDERED__').length;
      return { guess_count: guessCount };
    }

    // 8. Count correct_count for user
    // "SELECT COUNT(*) as correct_count FROM guesses g JOIN sessions s ON g.session_id = s.id WHERE s.user_id = ? AND g.is_correct = 1"
    if (sql.includes('correct_count') && sql.includes('guesses')) {
      const userId = params[0];
      const userSessionIds = data.sessions.filter(s => s.user_id === userId).map(s => s.id);
      const correctCount = data.guesses.filter(g => userSessionIds.includes(g.session_id) && g.is_correct === true).length;
      return { correct_count: correctCount };
    }

    // 9. Check table existence check
    if (sql.includes('sqlite_master')) {
      // Just simulate that "brands" table exists
      return { name: 'brands' };
    }

    console.warn('Unhandled FakeStatement.get query:', sql);
    return null;
  }

  all(...params) {
    const data = loadDatabase();
    const sql = this.sql;

    // 1. SELECT id, started_at, ended_at, total_score, correct_count, surrender_count FROM sessions WHERE user_id = ? AND ended_at IS NOT NULL ORDER BY started_at DESC
    if (sql.includes('FROM sessions WHERE user_id = ?')) {
      const userId = params[0];
      const user = data.users.find(u => u.id === userId);
      return data.sessions
        .filter(s => s.user_id === userId && s.ended_at !== null)
        .map(s => ({ ...s, username: user?.username || '' }))
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
    }

    console.warn('Unhandled FakeStatement.all query:', sql);
    return [];
  }
}

const db = {
  pragma: (statement) => {
    return null;
  },
  prepare: (sqlQuery) => {
    return new FakeStatement(sqlQuery);
  },
  transaction: (fn) => {
    return (...args) => {
      // Just run in normal JS thread since it's single-threaded, atomic
      return fn(...args);
    };
  }
};

export default db;
