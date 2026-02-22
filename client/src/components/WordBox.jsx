import React from 'react'
import { useGroupContext } from '../context/GroupContext'

const WordBox = () => {

  const {state} = useGroupContext();
  const {currentWord} = state;

  return (
    <div>
        <div className = "rounded-2xl bg-indigo-600 px-6 py-5 text-center text-white shadow-lg">
            
            <div className = "text-xs font-semibold tracking">CURRENT WORD</div>
            <div className = "mt-2 text-4xl font-black">{currentWord}</div>
            <div className = "mt-2 text-sm text-indigo-100">Hint</div>
        </div>
    </div>
  )
}

export default WordBox