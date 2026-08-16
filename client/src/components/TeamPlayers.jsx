import React from 'react';
import { Check } from 'lucide-react';

const TeamPlayers = ({ team, index }) => {
  const teamIdx = Number(index);
  const score = team?.score ?? 0;
  const status = team?.status || 'Waiting';
  const players = team?.users || team?.players || [];
  const teamName = team?.name || `Team ${teamIdx + 1}`;

  const isDrawing = status === 'Drawing';
  const isReady = status === 'Ready';

  const badgeClassName = isDrawing
    ? 'bg-[#7C3AED] text-white'
    : isReady
    ? 'bg-emerald-500 text-white'
    : 'bg-slate-100 text-slate-500';

  const avatarBgColors = [
    'bg-[#7C3AED]',
    'bg-[#06B6D4]',
    'bg-[#EC4899]',
    'bg-[#F59E0B]',
    'bg-[#10B981]'
  ];

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header: TEAM + Team Name + Status Pill */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TEAM</div>
            <h2 className="text-xl font-black text-slate-900 leading-tight mt-0.5">{teamName}</h2>
          </div>
          <div className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badgeClassName}`}>
            {status}
          </div>
        </div>

        {/* Players List */}
        <div className="mt-4 space-y-2">
          {players && players.length > 0 ? (
            players.map((player, pIdx) => {
              const name = player.name || 'Player';
              const initial = name.charAt(0).toUpperCase();
              const avatarColor = avatarBgColors[pIdx % avatarBgColors.length];

              return (
                <div
                  key={player.id || player.sessionId || `${player.name}-${pIdx}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white shadow-sm ${avatarColor}`}
                    >
                      {initial}
                    </div>
                    <span className="text-sm font-bold text-slate-800">{name}</span>
                  </div>

                  <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-3 py-6 text-center text-xs font-medium text-slate-400">
              Waiting for players...
            </div>
          )}
        </div>
      </div>

      {/* Footer: Score */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-900">
        <span>Score</span>
        <span className="text-base font-extrabold">{score}</span>
      </div>
    </div>
  );
};

export default TeamPlayers;