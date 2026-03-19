import React, { useState } from 'react'
import { useGroupContext } from '../context/GroupContext'
import { useSocket } from '../context/SocketContext';
import { emitGuessSubmit, offGuessResult, onGuessResult } from '../services/Socket';

const GuessPanel = () => {

  const {state} = useGroupContext();
  const {currentWord, groups} = state;

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

  const handleGuess = () => {

      const guess = currGuess.trim().toLowerCase();
      if (!guess) return;

      const myTeamIdx = Number(groupIndex);
      if (!roomCode || !Number.isInteger(myTeamIdx) || myTeamIdx < 0) {
        setStatus("Join a team first");
        return;
      }

      if (groups?.[myTeamIdx]?.[1] !== "Guessing") {
        setStatus("Only guessing team can submit now");
        return;
      }

      emitGuessSubmit({ roomCode, guess, groupIndex: myTeamIdx });

      setGuess("");
    
  }

  
  return (
    <div>
        <div className = "rounded-2xl bg-white p-5 shadow-lg">
        <div className="text-sm font-bold text-slate-900">SUBMIT ANSWER</div>
            <div className="mt-3 flex gap-3">
                <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Type guess..."
                value = {currGuess}
                onChange = {(e) => setGuess(e.target.value)}
                />
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={handleGuess}>
                Send
                </button>
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-500">GUESSES</div>
            <div className="mt-2 h-8 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700">{status}</div>
        </div>
    </div>
  )
}

export default GuessPanel