import { Clock, Settings } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import RoomSettings from './RoomSettings';
import { useGroupContext } from '../context/GroupContext';

const RoomNavbar = ({ RoomName }) => {
  const [showSettings, setShowSettings] = useState(false);
  const { state } = useGroupContext();
  const { turnsEndAt } = state;
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
    <div className="w-full">
      <div className="flex items-center justify-between">
        {/* Left: Time Pill */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TIME</div>
            <div className="text-base font-extrabold text-slate-900 leading-none mt-0.5">
              {timeLeft > 0 ? formatTime(timeLeft) : '0:00'}
            </div>
          </div>
        </div>

        {/* Center: SKETCHRUSH brand + Room Name */}
        <div className="text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#7C3AED]">
            SKETCHRUSH
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-0.5">
            Room Name : <span className="text-[#7C3AED]">{RoomName}</span>
          </h1>
        </div>

        {/* Right: Settings Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            title="Room Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl">
              <RoomSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomNavbar;