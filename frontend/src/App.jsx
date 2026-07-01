import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import GameArena from './components/GameArena';
import GameSummary from './components/GameSummary';
import { Sparkles, Trophy } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState('dashboard'); // 'dashboard' | 'arena' | 'summary'
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);

  // Starts a new game session on backend
  const handleStartGame = async (username) => {
    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) throw new Error('Failed to create session');
      const data = await response.json();

      setSession(data);
      setScreen('arena');
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const handleEndGame = (sessionSummary) => {
    setSummary(sessionSummary);
    setScreen('summary');
  };

  const handlePlayAgain = () => {
    if (session) {
      handleStartGame(session.username);
    } else {
      setScreen('dashboard');
    }
  };

  const handleBackHome = () => {
    setScreen('dashboard');
    setSession(null);
    setSummary(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-brand-dark bg-grid-overlay">
      {/* Decorative Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      {/* Brand Header */}
      <nav className="w-full border-b border-slate-900 bg-brand-dark/50 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackHome}>
          <div className="bg-indigo-600/20 border border-indigo-500/30 p-2 rounded-xl text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Guess the Brand
          </span>
        </div>
        
        {screen === 'dashboard' && (
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Competitive Arena
          </div>
        )}
      </nav>

      {/* Dynamic Screen Mounting */}
      <main className="flex-grow flex items-center justify-center py-6 z-10">
        {screen === 'dashboard' && (
          <Dashboard onStartGame={handleStartGame} />
        )}
        
        {screen === 'arena' && session && (
          <GameArena session={session} onEndGame={handleEndGame} />
        )}
        
        {screen === 'summary' && summary && (
          <GameSummary
            summary={summary}
            onPlayAgain={handlePlayAgain}
            onBackHome={handleBackHome}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 border-t border-slate-950/80 bg-brand-dark/60 text-slate-600 text-xs font-medium tracking-wide z-10">
        &copy; {new Date().getFullYear()} Guess the Brand. Driven by Antigravity AI. All rights reserved.
      </footer>
    </div>
  );
}
