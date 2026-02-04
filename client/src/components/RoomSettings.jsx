import { Clock1, Lightbulb, Undo2, WholeWord } from 'lucide-react';
import React, { useState } from 'react'

const RoomSettings = () => {

    const [time,setTime] = useState(3);
    const [round,setRound] = useState(3);
    const [hints,setHints] = useState(1);
    const [words,setWords] = useState([""]);

    const handleSave = () => {

        e.prevDefault();
        
    }

  return (
    <div className = "absolute right-0 mt-2 w-auto rounded-md border border-black shadow-lg">
        <div className = "p-3"> 
          <div className = "text-2xl font-bold"> Settings </div>

          <div className = "flex flex-col justify-between">

            <div className="text-lg flex items-center gap-2">
              <Clock1 />
              <span>Draw Time</span>
            </div>
            <input type="text" value={time} placeholder="Write time in mins" onChange={(e) => setTime(e.target.value)} />

             <div className="text-lg flex items-center gap-2">
               <Undo2 />
               <span>Rounds</span>
             </div>
             <input type="text" value={round} placeholder="Write no of rounds" onChange={(e) => setRound(e.target.value)} />

             <div className="text-lg flex items-center gap-2">
               <Lightbulb />
               <span>Hints</span>
             </div>
             <input type="text" value={hints} placeholder="Write no of hints" onChange={(e) => setHints(e.target.value)} />

             <div className = "text-lg flex items-center gap-2">
                <WholeWord />
                <span>Custom Words</span>
             </div>
             <input type="text" placeholder="Write no of hints" onChange={(e) => setWords(e.target.value)} />

            </div>

            <div className = "text-xl font-bold">After Saving the changes the game will begin from the start</div>

            <button type = "submit">Save</button>
        </div>
    </div>
  )
}

export default RoomSettings