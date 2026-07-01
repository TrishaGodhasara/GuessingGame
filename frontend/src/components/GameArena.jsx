import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, ChevronRight, CheckCircle2, XCircle, Flag, LogOut, Award, Sparkles } from 'lucide-react';

const categoryColors = {
  beauty: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  automobile: 'bg-red-500/10 text-red-400 border-red-500/30',
  plastics: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  leather: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  cosmetics: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  clothing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  accessories: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  jewelry: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  electronics: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  software: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export default function GameArena({ session, onEndGame }) {
  const [currentBrand, setCurrentBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hintsUnlocked, setHintsUnlocked] = useState(1);
  const [guessText, setGuessText] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
  const [resolvedState, setResolvedState] = useState(null); // 'correct' | 'surrendered'
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [sessionScore, setSessionScore] = useState(session.total_score);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [surrenderCount, setSurrenderCount] = useState(0);
  const [guessHistory, setGuessHistory] = useState([]); // guesses for CURRENT brand
  const [shaking, setShaking] = useState(false);

  const inputRef = useRef(null);

  // Load first brand on mount
  useEffect(() => {
    fetchNextBrand();
  }, []);

  const fetchNextBrand = async () => {
    setLoading(true);
    setResolvedState(null);
    setCorrectAnswer('');
    setFeedback(null);
    setGuessText('');
    setHintsUnlocked(1);
    setGuessHistory([]);
    try {
      const response = await fetch(`/api/brands/next?session_id=${session.session_id}`);
      if (!response.ok) throw new Error('Failed to load brand');
      const data = await response.json();
      
      if (data.no_more_brands) {
        // Automatically end game when no brands are left
        handleEndGame();
      } else {
        setCurrentBrand(data);
        setAttemptedCount(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGuessSubmit = async (e) => {
    e.preventDefault();
    if (!guessText.trim() || resolvedState) return;

    try {
      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          brand_id: currentBrand.id,
          guess_text: guessText.trim(),
          hints_revealed_count: hintsUnlocked
        })
      });

      if (!response.ok) throw new Error('Guess failed');
      const data = await response.json();

      if (data.is_correct) {
        setFeedback('correct');
        setResolvedState('correct');
        setCorrectAnswer(data.correct_answer);
        setSessionScore(prev => prev + 10);
        setCorrectCount(prev => prev + 1);
        
        // Success animation trigger
        if (inputRef.current) inputRef.current.blur();
      } else {
        setFeedback('incorrect');
        setShaking(true);
        setGuessHistory(prev => [guessText.trim(), ...prev]);
        setTimeout(() => setShaking(false), 500);

        // Clear feedback after 1.5s
        setTimeout(() => setFeedback(null), 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSurrender = async () => {
    if (resolvedState) return;

    try {
      const response = await fetch('/api/surrender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          brand_id: currentBrand.id
        })
      });

      if (!response.ok) throw new Error('Surrender failed');
      const data = await response.json();

      setResolvedState('surrendered');
      setCorrectAnswer(data.correct_answer);
      setSurrenderCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndGame = async () => {
    try {
      const response = await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id })
      });
      
      if (!response.ok) throw new Error('Failed to end session');
      const data = await response.json();
      
      onEndGame({
        ...session,
        ended_at: data.session.ended_at,
        total_score: sessionScore,
        correct_count: correctCount,
        surrender_count: surrenderCount,
        attempted_count: attemptedCount
      });
    } catch (err) {
      console.error(err);
    }
  };

  const showNextHint = () => {
    if (hintsUnlocked < 4) {
      setHintsUnlocked(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-32 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 text-sm">Decoding brand hints...</p>
      </div>
    );
  }

  if (!currentBrand) return null;

  const hintCards = [
    { title: 'Hint 1: Category', content: `This is a famous brand operating in the ${currentBrand.category} category.`, icon: HelpCircle },
    { title: 'Hint 2: USP / Riddle', content: currentBrand.hint2, icon: Sparkles },
    { title: 'Hint 3: News / Controversy', content: currentBrand.hint3, icon: Sparkles },
    { title: 'Hint 4: Leadership', content: currentBrand.hint4, icon: Sparkles }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fade-in flex flex-col min-h-[85vh]">
      
      {/* Ticker Header */}
      <header className="flex justify-between items-center bg-brand-card/60 border border-slate-800 rounded-2xl px-6 py-4 mb-6 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Player</span>
            <span className="text-slate-200 font-extrabold text-sm">{session.username}</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Brand Count</span>
            <span className="text-slate-200 font-extrabold text-sm">{attemptedCount} attempted</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-amber-600/10 border border-amber-500/20 px-4 py-1.5 rounded-xl flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold tracking-widest text-amber-500 leading-none">Score</span>
              <span className="text-lg font-extrabold text-slate-100 leading-none">{sessionScore}</span>
            </div>
          </div>
          
          <button
            onClick={handleEndGame}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 text-rose-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            End Game
          </button>
        </div>
      </header>

      {/* Main Arena Grid */}
      <div className="grid md:grid-cols-12 gap-8 items-start flex-1">
        
        {/* Left Hand: Hint progressive card slider */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${categoryColors[currentBrand.category] || 'bg-slate-800 text-slate-400'}`}>
              {currentBrand.category}
            </span>
            <span className="text-xs font-bold text-slate-500">
              Hint {hintsUnlocked} of 4 unlocked
            </span>
          </div>

          {/* Progressive Hint List */}
          <div className="space-y-4">
            {hintCards.map((hint, idx) => {
              const isUnlocked = idx < hintsUnlocked;
              
              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-5 transition-all duration-300 shadow-md ${
                    isUnlocked 
                      ? 'bg-brand-card border-slate-800 opacity-100 transform translate-y-0 scale-100' 
                      : 'bg-brand-dark/30 border-slate-800/40 opacity-40 cursor-not-allowed select-none'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-indigo-600/10 text-indigo-400' : 'bg-slate-800/50 text-slate-600'}`}>
                      <hint.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isUnlocked ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {hint.title}
                      </h4>
                      {isUnlocked ? (
                        <p className="text-slate-200 text-sm leading-relaxed font-medium">
                          {hint.content}
                        </p>
                      ) : (
                        <p className="text-slate-600 text-xs italic">
                          This clue is currently locked. Reveal another hint to unlock.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reveal hint buttons */}
          {!resolvedState && (
            <button
              onClick={showNextHint}
              disabled={hintsUnlocked >= 4}
              className="w-full py-3.5 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Reveal Next Clue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Hand: Action & Guess Workspace */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Action Area */}
          <div className="bg-brand-card/75 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            
            {resolvedState ? (
              /* RESOLVED CARD STATE */
              <div className="text-center space-y-5 animate-slide-up">
                <div className="flex justify-center">
                  {resolvedState === 'correct' ? (
                    <div className="bg-emerald-600/10 p-3 rounded-full border border-emerald-500/20 text-emerald-400 animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  ) : (
                    <div className="bg-amber-600/10 p-3 rounded-full border border-amber-500/20 text-amber-400">
                      <Flag className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-1">
                    {resolvedState === 'correct' ? 'Brilliant Guess! +10 Pts' : 'Answer Revealed'}
                  </h3>
                  <div className="text-3xl font-extrabold text-slate-100">
                    {correctAnswer}
                  </div>
                </div>

                <button
                  onClick={fetchNextBrand}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Next Brand
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              /* LIVE GUESS INPUT WORKSPACE */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400">Lock in your Guess</h3>
                
                <form onSubmit={handleGuessSubmit} className={`space-y-3 ${shaking ? 'animate-shake' : ''}`}>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={guessText}
                      onChange={(e) => setGuessText(e.target.value)}
                      placeholder="Type brand name..."
                      className={`w-full px-4 py-3.5 bg-brand-dark/80 border rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all text-sm font-semibold tracking-wide ${
                        feedback === 'correct' 
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500' 
                          : feedback === 'incorrect'
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                    />
                    {feedback === 'correct' && (
                      <CheckCircle2 className="absolute right-4 top-3.5 w-5 h-5 text-emerald-400" />
                    )}
                    {feedback === 'incorrect' && (
                      <XCircle className="absolute right-4 top-3.5 w-5 h-5 text-rose-400" />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSurrender}
                      className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-400 hover:text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Give Up
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!guessText.trim()}
                      className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Submit Guess
                    </button>
                  </div>
                </form>

                {/* Incorrect History Ticker */}
                {guessHistory.length > 0 && (
                  <div className="border-t border-slate-800/80 pt-3.5 mt-2">
                    <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Previous attempts on this brand</h5>
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
                      {guessHistory.map((g, i) => (
                        <span key={i} className="px-2 py-1 bg-rose-950/20 border border-rose-900/30 text-rose-400 font-semibold rounded-md text-[10px]">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
          
        </div>
      </div>
    </div>
  );
}
