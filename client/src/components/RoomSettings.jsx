import { Blend, Clock1, Lightbulb, Undo2, WholeWord } from 'lucide-react';
import React, { useState } from 'react'
import RoomSettingContext, { useSettings } from '../context/RoomSettingContext';

const RoomSettings = () => {

    const {state,dispatch} = useSettings();
    const {time,rounds,hints,words,difficulty_level,EASY_WORDS,MEDIUM_WORDS,HARD_WORDS,FUNNY_WORDS,INDIAN_WORDS} = state;

    const [currTime,setTime] = useState(time);
    const [currRound,setRound] = useState(rounds); 
    const [currHints,setHints] = useState(hints);
    const [currlevel,setLevel] = useState(difficulty_level);
    const [currwords,setWords] = useState(words ?? "");
 
    const handleSave = (e) => {
      e.preventDefault();

        dispatch({type : "SET_TIME" , payload : currTime});
        dispatch({type : "SET_ROUNDS" , payload : currRound});
        dispatch({type : "SET_HINTS" , payload : currHints});
        dispatch({type : "SET_LEVEL" , payload : currlevel});
        dispatch({type : "SET_WORDS" , payload : currwords});

    }

  return (
    <div className="mt-2 w-80 rounded-md border border-black bg-white shadow-lg">
        <div className="p-3 space-y-3"> 
          <div className = "text-2xl font-bold"> Settings </div>

          <div className="flex flex-col gap-2">

            <div className="text-lg flex items-center gap-2">
              <Clock1 />
              <span>Draw Time</span>
            </div>
            <input className="w-full rounded border px-2 py-1 text-sm" type="text" value={currTime} placeholder="Write time in mins" onChange={(e) => setTime(e.target.value)} />

             <div className="text-lg flex items-center gap-2">
               <Undo2 />
               <span>Rounds</span>
             </div>
             <input className="w-full rounded border px-2 py-1 text-sm" type="text" value={currRound} placeholder="Write no of rounds" onChange={(e) => setRound(e.target.value)} />

             <div className="text-lg flex items-center gap-2">
               <Lightbulb />
               <span>Hints</span>
             </div>
             <input className="w-full rounded border px-2 py-1 text-sm" type="text" value={currHints} placeholder="Write no of hints" onChange={(e) => setHints(e.target.value)} />

             <div className="text-lg flex items-center gap-2">
               <Blend />
               <span>Mode</span>
             </div>
             <select className="w-full rounded border px-2 py-1 text-sm" value={currlevel} onChange={(e) => setLevel(e.target.value)}>
                <option value = "EASY_WORDS">Easy</option>
                <option value = "MEDIUM_WORDS">Medium</option>
                <option value = "HARD_WORDS">Hard</option>
                <option value = "FUNNY_WORDS">Funny</option>
                <option value = "INDIAN_WORDS">Indian</option>
                <option value = "CUSTOM">Custom</option>
             </select>

             <div className = "text-lg flex items-center gap-2">
                <WholeWord />
                <span>Custom Words</span>
             </div>
             <input className="w-full rounded border px-2 py-1 text-sm" value={currwords} type="text" placeholder="Write custom words" onChange={(e) => setWords(e.target.value)} />

            </div>

            <div className = "text-xl font-bold">After Saving the changes the game will begin from the start</div>

            <button type="button" onClick={handleSave}>Save</button>
        </div>
    </div>
  )
}

export default RoomSettings