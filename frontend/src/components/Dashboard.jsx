import React, { useState, useEffect } from 'react';
import { Trophy, History, Play, User, Award, Percent, ChevronRight } from 'lucide-react';

export default function Dashboard({ onStartGame }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [perfData, setPerfData] = useState(null);
  const [error, setError] = useState('');

  // Auto-load stats when user finishes typing a valid username or clicks a button
  const fetchPerformance = async (searchName) => {
    if (!searchName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(searchName.trim())}/performance`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      if (data.user_exists) {
        setPerfData(data);
      } else {
        setPerfData({ user_exists: false, sessions: [], stats: null });
      }
    } catch (err) {
      console.error(err);
      setError('Could not load user performance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username to play!');
      return;
    }
    onStartGame(username.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm mb-4">
          Guess the Brand
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Test your business acumen! Unravel puzzle riddles, real-world controversies, and founder clues to guess the world's top brands.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Username form */}
        <div className="md:col-span-5 bg-brand-card/75 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Player Profile
          </h2>
          
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-2">
                Enter Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. BrandMaster99"
                  className="w-full pl-4 pr-12 py-3 bg-brand-dark/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
                <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchPerformance(username)}
                disabled={!username.trim() || loading}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold rounded-xl text-sm border border-slate-700 transition-all cursor-pointer"
              >
                {loading ? 'Checking...' : 'Check History'}
              </button>
              
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Play Game
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <p className="text-rose-400 text-xs font-semibold bg-rose-950/20 border border-rose-900/30 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Game Guidelines</h4>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Four progressive hints per brand (revealed one-by-one).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Type and submit your guess anytime. Correct guess = <b>+10 pts</b>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Unlimited guesses allowed. Surrender = <b>0 pts</b>.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Performance Summary / Welcome */}
        <div className="md:col-span-7 space-y-6">
          {perfData && perfData.user_exists ? (
            <div className="bg-brand-card/40 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-6 shadow-xl animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Welcome Back, {perfData.sessions[0]?.username || username}!</h3>
                  <p className="text-slate-400 text-sm">Here is your legacy performance dashboard</p>
                </div>
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-2 rounded-xl">
                  <Trophy className="w-6 h-6 text-indigo-400" />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl text-center">
                  <History className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
                  <div className="text-2xl font-extrabold text-slate-100">{perfData.stats.total_sessions}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sessions</div>
                </div>
                <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl text-center">
                  <Award className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                  <div className="text-2xl font-extrabold text-slate-100">{perfData.stats.avg_score}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Avg Score</div>
                </div>
                <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl text-center">
                  <Percent className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <div className="text-2xl font-extrabold text-slate-100">{perfData.stats.guess_accuracy_pct}%</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Accuracy</div>
                </div>
                <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl text-center">
                  <Trophy className="w-5 h-5 text-violet-400 mx-auto mb-1.5" />
                  <div className="text-2xl font-extrabold text-slate-100">{perfData.stats.cumulative_score}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Pts</div>
                </div>
              </div>

              {/* Past Sessions List */}
              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-400" />
                  Recent Sessions
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-dark/60 border-b border-slate-800 text-slate-400 font-bold">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4 text-center">Score</th>
                        <th className="py-2.5 px-4 text-center">Correct</th>
                        <th className="py-2.5 px-4 text-center">Surrenders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {perfData.sessions.slice(0, 5).map((sess) => (
                        <tr key={sess.id} className="hover:bg-brand-dark/30 transition-colors">
                          <td className="py-2.5 px-4 text-slate-400">
                            {new Date(sess.started_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2.5 px-4 text-center font-extrabold text-amber-400">{sess.total_score}</td>
                          <td className="py-2.5 px-4 text-center font-semibold text-emerald-400">{sess.correct_count}</td>
                          <td className="py-2.5 px-4 text-center text-slate-500">{sess.surrender_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : perfData && !perfData.user_exists ? (
            <div className="bg-slate-850 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-400 animate-slide-up">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-200 mb-1">New Competitor Alert!</h3>
              <p className="text-sm max-w-sm mx-auto text-slate-400">
                The username <span className="text-indigo-400 font-semibold">"{username}"</span> is ready for registration. No passwords needed—just press <b>Play Game</b> to start seeding your legend!
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-8 text-center text-slate-400 min-h-[300px] flex flex-col items-center justify-center">
              <Play className="w-12 h-12 text-indigo-500/20 mb-3 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-300 mb-1">Unleash the Brands</h3>
              <p className="text-sm max-w-sm mx-auto text-slate-500">
                Enter your competitor handle on the left to start checking history or launching a brand-new run.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
