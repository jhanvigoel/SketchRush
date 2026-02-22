import React from 'react'
import { useGroupContext } from '../context/GroupContext'

const GuessPanel = () => {

  const {state,dispatch} = useGroupContext();
  const {currentWord} = state;
  
  return (
    <div>
        <div className = "rounded-2xl bg-white p-5 shadow-lg">
        <div className="text-sm font-bold text-slate-900">SUBMIT ANSWER</div>
            <div className="mt-3 flex gap-3">
                <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Type guess..."
                />
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
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