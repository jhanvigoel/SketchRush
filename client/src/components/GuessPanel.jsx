import React, { useState } from 'react'
import { useGroupContext } from '../context/GroupContext'
import { useSocket } from '../context/SocketContext';

const GuessPanel = () => {

  const {state,dispatch} = useGroupContext();
  const {currentWord,groups} = state;

  const { state: socketState} = useSocket();
  const { groupIndex } = socketState;

  const [currGuess,setGuess] = useState("");

  const handleGuess = () => {

      const guess = currGuess.trim().toLowerCase();
      const word = (currentWord || '').trim().toLowerCase();

      if (!guess) return;

      if (guess === word) {

        const myTeamIdx = Number(groupIndex);

        if (groupIndex !== '' && groups[myTeamIdx]?.[1] === "Guessing") {

          const curr = groups[myTeamIdx][0];
          const scoreAction = myTeamIdx === 0 ? "SET_TEAM1_SCORE" : "SET_TEAM2_SCORE";
          const myStatus   = myTeamIdx === 0 ? "SET_TEAM1_STATUS" : "SET_TEAM2_STATUS";
          const otherStatus = myTeamIdx === 0 ? "SET_TEAM2_STATUS" : "SET_TEAM1_STATUS";

          dispatch({type: scoreAction,  payload: curr + 30});
          dispatch({type: myStatus,     payload: "Drawing"});
          dispatch({type: otherStatus,  payload: "Guessing"});
        }
      }

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
            <div className="mt-2 h-8 rounded-lg border border-slate-200" />
        </div>
    </div>
  )
}

export default GuessPanel