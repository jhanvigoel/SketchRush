import React, { useState, useEffect } from 'react';
import { useGroupContext } from '../context/GroupContext';
import { useSocket } from '../context/SocketContext';
import { emitGuessSubmit, offGuessResult, onGuessResult } from '../services/Socket';
import { Pencil, Send } from 'lucide-react';

const GuessPanel = () => {
  const { state: groupState } = useGroupContext();
  const { groups, currentWordVisible } = groupState;

  const { state: socketState } = useSocket();
  const { groupIndex, roomCode } = socketState;

  const [currGuess, setGuess] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const handleGuessResult = ({ correct }) => {
      setStatus(correct ? '🎉 Correct guess!' : '❌ Wrong guess');
    };

    onGuessResult(handleGuessResult);

    return () => {
      offGuessResult(handleGuessResult);
    };
  }, []);

  const getTeamStatus = (team) => {
    if (!team) return '';
    if (typeof team.status === 'string') return team.status;
    if (Array.isArray(team) && team[1]) return team[1];
    return '';
  };

  const myTeamIdx = Number(groupIndex);

  const handleGuess = () => {
    const guess = currGuess.trim().toLowerCase();
    if (!guess) return;

    if (!roomCode || !Number.isInteger(myTeamIdx) || myTeamIdx < 0) {
      setStatus('Join a team first');
      return;
    }

    const teamStatus = getTeamStatus(groups?.[myTeamIdx]);
    const isDrawing =
      currentWordVisible || teamStatus === 'Drawing' || groupState.currentTeamIndex === myTeamIdx;

    if (isDrawing) {
      setStatus('Only guessing team can submit now');
      return;
    }

    emitGuessSubmit({ roomCode, guess, groupIndex: myTeamIdx });
    setGuess('');
  };

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      {/* Header: Pencil + Role Title */}
      <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
        <Pencil className="h-4 w-4 text-[#7C3AED]" />
        <span>{currentWordVisible ? 'You are drawing' : 'Submit your guess'}</span>
      </div>

      {/* Role State Action / Notice Box */}
      {currentWordVisible ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-500 leading-relaxed">
          Wait for the guessing team to submit their answer.
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100"
            placeholder="Type your guess here..."
            value={currGuess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGuess();
              }
            }}
          />
          <button
            type="button"
            className="flex items-center justify-center rounded-2xl bg-[#7C3AED] px-4 text-xs font-extrabold text-white shadow-md shadow-purple-500/20 transition hover:bg-[#6D28D9] active:scale-95"
            onClick={handleGuess}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Guesses Section */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          GUESSES
        </div>
        <div className="min-h-[40px] rounded-2xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-semibold text-slate-700 flex items-center">
          {status || <span className="text-slate-400 font-normal">Type a guess...</span>}
        </div>
      </div>
    </div>
  );
};

export default GuessPanel;