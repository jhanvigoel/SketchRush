import { Clock, Settings } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import RoomSettings from './RoomSettings'
import { useGroupContext } from '../context/GroupContext'

const RoomNavbar = ({RoomName}) => {

    const [showSettings, setShowSettings] = useState(false);
    const {state} = useGroupContext();
    const {turnsEndAt} = state;
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
      if (turnsEndAt <= 0) {
        setTimeLeft(0);
        return;
      }

      const update = () => {
        const remaining = Math.max(0, turnsEndAt - Date.now());
        setTimeLeft(Math.ceil(remaining / 1000));
      };

      update();
      
      const interval = setInterval(() => {
        update();
      }, 1000);

      return () => clearInterval(interval);
    }, [turnsEndAt]);

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

  return (
    <div>

        <div className = "flex items-center justify-between">

            <div className = "flex items-center gap-3">

                <div className = "flex h-10 w-10 items-center justify-center rounded-lg">
                     <Clock className = "h-5 w-5"/>
                </div>

                <div>
                    <div className = "text-xs font-semibold text-slate-500">TIME</div>
                    <div className = "text-lg font-bold text-slate-900">{timeLeft > 0 ? formatTime(timeLeft) : "0:00"}</div>
                </div>

            </div>

            <div className = "text-left ml-20 text-5xl font-extrabold ">Room Name : {RoomName}</div>

            <div className="relative">
            <button type="button" onClick={() => setShowSettings((prev) => !prev)}>
                <Settings className = "h-4 w-4"/>
            </button>

            {showSettings && (
                <div className="absolute right-0 top-full mt-2 z-50 max-h-[70vh] overflow-y-auto">
                <RoomSettings />
                </div>
            )}
            </div>

        </div>
    </div>
  )
}

export default RoomNavbar