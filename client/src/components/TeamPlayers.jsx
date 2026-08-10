import React from 'react'

const TeamPlayers = ({team, index}) => {

    const teamIdx = Number(index);
    const score = team?.score ?? 0;
    const status = team?.status || 'Waiting';
    const players = team?.users || team?.players || [];
    const teamName = team?.name || `Team ${teamIdx + 1}`;
    const isDrawing = status === 'Drawing';
    const isReady = status === 'Ready';

    const cardClassName = isDrawing
        ? 'rounded-2xl border-2 border-indigo-500 bg-indigo-50 shadow-lg'
        : isReady
            ? 'rounded-2xl border-2 border-emerald-500 bg-emerald-50 shadow-lg'
            : 'rounded-2xl border-2 border-slate-300 bg-white shadow-lg';

    const badgeClassName = isDrawing
        ? 'bg-indigo-600 text-white'
        : isReady
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-200 text-slate-700';

  return (
    <div>

        <div className = {cardClassName}>

            <div className = "flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className = "text-2xl font-extrabold text-slate-900">Team : {teamName}</div>
                <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${badgeClassName}`}>
                    {status}
                </div>
            </div>

            <div className="px-4 py-4">
              <ul className = "space-y-2">

                  {players && players.length > 0 ? (

                      players.map((player) => (
                          <li key = {player.id || player.sessionId || player.name} className = "rounded-lg bg-white px-3 py-2 text-lg font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
                            {player.name}
                          </li>
                      ))
                  ) : (
                      <li className = "rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-lg font-semibold text-slate-500">Waiting ..</li>
                  )}
              </ul>

              <div className = "mt-4 text-lg font-bold text-slate-900">Score : {score}</div>
            </div>
        </div>
    </div>
  )
}

export default TeamPlayers