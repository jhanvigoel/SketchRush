import React from 'react';

const GameResultModal = ({ winner, onRematch }) => {
  if (!winner) return null;

  const isTie = winner.teamIndex === -1 || winner.teamName === "It's a tie";
  const title = isTie ? "It’s a tie!" : `${winner.teamName} wins!`;
  const badge = isTie ? "Final score" : "Champion";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-slate-950/65 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-indigo-200/60 bg-gradient-to-br from-white via-indigo-50 to-violet-50 p-6 text-center shadow-[0_25px_80px_rgba(79,70,229,0.30)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl shadow-lg shadow-indigo-500/30">
          {isTie ? '🤝' : '🏆'}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-500">{badge}</p>
        <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h3>

        <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/80 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Final score</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {winner.score || 0}
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          {isTie
            ? 'Both teams finished the match on equal points. Another round will decide the winner.'
            : 'The room has a clear winner. Ready for a fresh rematch?'}
        </p>

        <button
          type="button"
          onClick={onRematch}
          className="mt-7 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0"
        >
          Rematch
        </button>
      </div>
    </div>
  );
};

export default GameResultModal;
