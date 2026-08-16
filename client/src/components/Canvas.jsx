import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGroupContext } from '../context/GroupContext';
import {
  emitCanvasClear,
  emitCanvasDrawEnd,
  emitCanvasDrawLine,
  emitCanvasDrawStart,
  offCanvasClear,
  offCanvasDrawEnd,
  offCanvasDrawLine,
  offCanvasDrawStart,
  onCanvasClear,
  onCanvasDrawEnd,
  onCanvasDrawLine,
  onCanvasDrawStart,
} from '../services/Socket';
import { Trash2, Sparkles } from 'lucide-react';
import GameResultModal from './GameResultModal';

const Canvas = ({ onStartGame, onRematch }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const dprRef = useRef(1);

  const [color, setColor] = useState('#7C3AED');
  const [size, setSize] = useState(4);
  const { state: socketState } = useSocket();
  const { roomCode, groupIndex } = socketState;
  const { state: groupState } = useGroupContext();
  const myTeamIdx = groupIndex !== '' ? Number(groupIndex) : -1;

  const gameStarted = groupState.turnsEndAt > Date.now();
  const gameFinished = groupState.phase === 'finished' || Boolean(groupState.winner);

  const getTeamStatus = (team) => {
    if (!team) return '';
    if (typeof team.status === 'string') return team.status;
    if (Array.isArray(team) && team[1]) return team[1];
    return '';
  };

  const isMyTeamDrawing = myTeamIdx >= 0 && (
    getTeamStatus(groupState.groups?.[myTeamIdx]) === 'Drawing' ||
    groupState.currentTeamIndex === myTeamIdx
  );

  const isGameActive = groupState.phase === 'playing' || gameStarted;
  const canDraw = Boolean(
    !gameFinished &&
    (groupState.currentWordVisible || (isGameActive && isMyTeamDrawing))
  );

  useEffect(() => {
    if (!canDraw) {
      isDrawingRef.current = false;
    }
  }, [canDraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const clearCanvas = () => {
      const ctx = ctxRef.current;
      const c = canvasRef.current;
      if (!ctx || !c) return;
      const width = c.width / dprRef.current;
      const height = c.height / dprRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    };

    const resize = () => {
      const displayWidth = parent?.clientWidth || 700;
      const displayHeight = parent?.clientHeight || 420;

      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
      dprRef.current = dpr;

      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clearCanvas();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    };

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const xAxis = e.clientX - rect.left;
      const yAxis = e.clientY - rect.top;
      return { x: xAxis, y: yAxis };
    };

    const toNormalized = ({ x, y }) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.width ? x / rect.width : 0,
        y: rect.height ? y / rect.height : 0,
      };
    };

    const fromNormalized = ({ x, y }) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: x * rect.width,
        y: y * rect.height,
      };
    };

    const drawSegment = (x1, y1, x2, y2, strokeColor, strokeSize) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    const down = (e) => {
      if (!canDraw) return;

      canvas.setPointerCapture?.(e.pointerId);
      isDrawingRef.current = true;
      lastPointRef.current = getPos(e);

      if (roomCode) {
        const p = toNormalized(lastPointRef.current);
        emitCanvasDrawStart({ roomCode, x: p.x, y: p.y, color, size });
      }
    };

    const move = (e) => {
      if (!isDrawingRef.current) return;

      const { x, y } = getPos(e);
      const { x: lx, y: ly } = lastPointRef.current;

      drawSegment(lx, ly, x, y, color, size);

      if (roomCode) {
        const p1 = toNormalized({ x: lx, y: ly });
        const p2 = toNormalized({ x, y });
        emitCanvasDrawLine({
          roomCode,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          color,
          size,
        });
      }

      lastPointRef.current = { x, y };
    };

    const endDraw = (e) => {
      if (isDrawingRef.current && roomCode) {
        emitCanvasDrawEnd({ roomCode });
      }

      isDrawingRef.current = false;
      canvas.releasePointerCapture?.(e.pointerId);
    };

    const handleRemoteStart = ({ x, y }) => {
      const p = fromNormalized({ x, y });
      lastPointRef.current = p;
    };

    const handleRemoteLine = ({ x1, y1, x2, y2, color: remoteColor, size: remoteSize }) => {
      const p1 = fromNormalized({ x: x1, y: y1 });
      const p2 = fromNormalized({ x: x2, y: y2 });
      drawSegment(p1.x, p1.y, p2.x, p2.y, remoteColor, remoteSize);
    };

    const handleRemoteEnd = () => {};

    const handleRemoteClear = () => {
      clearCanvas();
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointerleave', endDraw);
    canvas.addEventListener('pointercancel', endDraw);
    onCanvasDrawStart(handleRemoteStart);
    onCanvasDrawLine(handleRemoteLine);
    onCanvasDrawEnd(handleRemoteEnd);
    onCanvasClear(handleRemoteClear);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', endDraw);
      canvas.removeEventListener('pointerleave', endDraw);
      canvas.removeEventListener('pointercancel', endDraw);
      offCanvasDrawStart(handleRemoteStart);
      offCanvasDrawLine(handleRemoteLine);
      offCanvasDrawEnd(handleRemoteEnd);
      offCanvasClear(handleRemoteClear);
    };
  }, [color, size, roomCode, canDraw]);

  const handleClear = () => {
    if (!canDraw) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const width = canvas.width / dprRef.current;
    const height = canvas.height / dprRef.current;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    if (roomCode) {
      emitCanvasClear({ roomCode });
    }
  };

  return (
    <div className="w-full rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-sm">
      {/* Canvas Area with Overlay */}
      <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            touchAction: 'none',
            cursor: canDraw ? 'crosshair' : 'not-allowed',
          }}
          className="h-full w-full bg-white"
        />

        {/* Game Finished Modal */}
        {gameFinished && (
          <GameResultModal winner={groupState.winner} onRematch={onRematch} />
        )}

        {/* Ready to Play Lobby Overlay */}
        {!gameStarted && !gameFinished && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#5B21B6] p-8 text-center text-white">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner">
              <Sparkles className="h-6 w-6 text-purple-200" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">Ready to play?</div>
            <p className="mt-1 text-xs sm:text-sm font-medium text-purple-200 mb-6">
              Click below to kick off the first round.
            </p>
            <button
              type="button"
              onClick={onStartGame}
              className="rounded-2xl bg-white px-8 py-3 text-sm font-extrabold text-[#5B21B6] shadow-xl transition-all hover:bg-purple-50 active:scale-95"
            >
              Start game
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls matching mockup */}
      <div className="mt-3.5 flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={!canDraw}
              className="h-7 w-7 cursor-pointer rounded-lg border border-slate-200 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Brush Size Slider */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-700">Size</span>
            <input
              type="range"
              min={1}
              max={24}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              disabled={!canDraw}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={!canDraw}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 transition hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};

export default Canvas;