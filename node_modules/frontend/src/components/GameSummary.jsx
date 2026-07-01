import React from 'react';
import { Trophy, Award, RefreshCw, Home, CheckCircle2, Flag, Percent } from 'lucide-react';

export default function GameSummary({ summary, onPlayAgain, onBackHome }) {
  const { total_score, correct_count, surrender_count, attempted_count, username } = summary;
  
  // Custom rank classification based on scoring
  const getRank = (score) => {
    if (score >= 120) return { title: 'Elite Brand Master', desc: 'Your business acumen is legendary! You know corporate giants inside and out.', color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' };
    if (score >= 70) return { title: 'Corporate Consultant', desc: 'Outstanding job! You have a sharp market intelligence and recall speed.', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5' };
    return { title: 'Budding Entrepreneur', desc: 'Great effort! Keep practicing to sharpen your industry analysis skills.', color: 'text-slate-400 border-slate-800 bg-slate-800/10' };
  };

  const rank = getRank(total_score);
  const accuracy = attempted_count > 0 
    ? Math.round((correct_count / attempted_count) * 100) 
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-brand-card/75 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
        
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="bg-amber-600/10 p-5 rounded-full border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/5 animate-pulse-subtle">
            <Trophy className="w-16 h-16" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100">Session Completed!</h2>
          <p className="text-slate-400 text-sm mt-1">Excellent performance, {username}!</p>
        </div>

        {/* Rank Badge */}
        <div className={`max-w-md mx-auto border rounded-2xl p-4 ${rank.color} transition-all`}>
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Assigned Title</div>
          <h4 className="text-xl font-extrabold mb-1">{rank.title}</h4>
          <p className="text-xs opacity-80 leading-relaxed font-medium">{rank.desc}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mt-4">
          
          {/* Final Score */}
          <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl">
            <Award className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-100">{total_score}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Final Score</div>
          </div>

          {/* Accuracy */}
          <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl">
            <Percent className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-100">{accuracy}%</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Accuracy</div>
          </div>

          {/* Guessed Correct */}
          <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-100">{correct_count}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Correct</div>
          </div>

          {/* Surrendered */}
          <div className="bg-brand-dark/50 border border-slate-800 p-4 rounded-xl">
            <Flag className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-100">{surrender_count}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Surrenders</div>
          </div>

        </div>

        {/* Actions panel */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4 border-t border-slate-800/80">
          <button
            onClick={onBackHome}
            className="flex-1 py-3 px-4 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Performance Hub
          </button>
          
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Play Again
          </button>
        </div>

      </div>
    </div>
  );
}
