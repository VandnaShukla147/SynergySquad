import React from 'react';
import { Plus, Minus, Trophy } from 'lucide-react';

const Leaderboard = ({ teams, onScoreAdjust }) => {
  // Sort by score descending
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  const medalColors = [
    'from-yellow-400 to-amber-500',   // Gold
    'from-gray-300 to-gray-400',       // Silver
    'from-amber-600 to-orange-700',    // Bronze
  ];

  return (
    <div className="glass-strong p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <Trophy size={20} className="text-yellow-400" /> Leaderboard
      </h3>
      <div className="flex flex-col gap-3">
        {sortedTeams.map((team, index) => (
          <div key={team.teamId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0 hover:bg-white/8 transition-all">
            <div className="flex items-center gap-3">
              {index < 3 ? (
                <span className={`w-7 h-7 rounded-full bg-gradient-to-br ${medalColors[index]} flex items-center justify-center text-xs font-black text-white shadow-sm`}>
                  {index + 1}
                </span>
              ) : (
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {index + 1}
                </span>
              )}
              <span className="font-semibold text-zinc-200">{team.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="font-bold text-lg text-blue-400 w-14 text-right">
                {team.score} <span className="text-xs text-zinc-500">pts</span>
              </div>
              {onScoreAdjust && (
                <div className="flex gap-1 ml-1 border-l pl-2 border-white/10">
                  <button onClick={() => onScoreAdjust(team.teamId, -1)} className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer" title="Subtract 1 pt">
                    <Minus size={14} />
                  </button>
                  <button onClick={() => onScoreAdjust(team.teamId, 1)} className="p-1 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors cursor-pointer" title="Add 1 pt">
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
