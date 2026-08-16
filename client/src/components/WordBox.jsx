import React from 'react';
import { useGroupContext } from '../context/GroupContext';

const WordBox = () => {
  const { state } = useGroupContext();
  const { currentWord, currentWordVisible } = state;
  const title = currentWordVisible ? 'YOUR WORD' : 'WAITING FOR DRAWER';
  const displayWord = currentWordVisible ? (currentWord || 'Hidden') : 'Hint';

  return (
    <div className="w-full">
      <div className="rounded-[28px] bg-[#5B21B6] px-8 py-6 text-center text-white shadow-xl shadow-purple-900/20">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200">
          {title}
        </div>
        <div className="mt-1.5 text-3xl sm:text-4xl font-black tracking-wide text-white">
          {displayWord}
        </div>
        <div className="mt-1 text-xs font-medium text-purple-200/90">
          Draw clearly. Guess quickly.
        </div>
      </div>
    </div>
  );
};

export default WordBox;