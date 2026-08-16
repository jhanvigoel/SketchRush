import React, { useState } from 'react'
import { useGroupContext } from '../context/GroupContext'
import { useSocket } from '../context/SocketContext';
import { emitGuessSubmit, offGuessResult, onGuessResult } from '../services/Socket';

const GuessPanel = () => {

  const {state} = useGroupContext();
  const {groups, currentWordVisible} = state;

  const { state: socketState} = useSocket();
  const { groupIndex, roomCode } = socketState;

  const [currGuess,setGuess] = useState("");
  const [status, setStatus] = useState("");

  React.useEffect(() => {
    const handleGuessResult = ({ correct }) => {
      setStatus(correct ? "Correct guess!" : "Wrong guess");
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

  const handleGuess = () => {

      const guess = currGuess.trim().toLowerCase();
      if (!guess) return;

      const myTeamIdx = Number(groupIndex);
      if (!roomCode || !Number.isInteger(myTeamIdx) || myTeamIdx < 0) {
        setStatus("Join a team first");
        return;
      }

      const teamStatus = getTeamStatus(groups?.[myTeamIdx]);
      const isDrawing = currentWordVisible || teamStatus === "Drawing" || state.currentTeamIndex === myTeamIdx;

      if (isDrawing) {
        setStatus("Only guessing team can submit now");
        return;
      }

      emitGuessSubmit({ roomCode, guess, groupIndex: myTeamIdx });

      setGuess("");
    
  }

  
  return (
    <div>
        <div className = "rounded-2xl bg-white p-5 shadow-lg">
        <div className="text-sm font-bold text-slate-900">
          {currentWordVisible ? "YOU ARE DRAWING" : "SUBMIT ANSWER"}
        </div>

            {currentWordVisible ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                Wait for the guessing team to submit their answer.
              </div>
            ) : (
              <div className="mt-3 flex gap-3">
                  <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Type guess and press Enter..."
                  value = {currGuess}
                  onChange = {(e) => setGuess(e.target.value)}
                  onKeyDown = {(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGuess();
                    }
                  }}
                  />
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={handleGuess}>
                  Send
                  </button>
              </div>
            )}

            <div className="mt-4 text-xs font-semibold text-slate-500">GUESSES</div>
            <div className="mt-2 h-8 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700">{status}</div>
        </div>
    </div>
  )
}

export default GuessPanel