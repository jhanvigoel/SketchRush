import React, { useEffect, useRef, useState } from 'react'
import { useSocket } from '../context/SocketContext'
import { useGroupContext } from '../context/GroupContext'
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
} from '../services/Socket'

const Canvas = () => {

    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef({x: 0,y: 0});
  const dprRef = useRef(1);

    const [color,setColor] = useState('#ffffff');
    const [size,setSize] = useState(4);
  const { state: socketState } = useSocket();
  const { roomCode, groupIndex } = socketState;
  const { state: groupState } = useGroupContext();
  const myTeamIdx = groupIndex !== '' ? Number(groupIndex) : -1;
  const canDraw = myTeamIdx >= 0 && groupState.groups?.[myTeamIdx]?.[1] === 'Drawing';

  useEffect(() => {
    if (!canDraw) {
      isDrawingRef.current = false;
    }
  }, [canDraw]);

    useEffect(() => {

      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      const dpr = Math.max(1,window.devicePixelRatio || 1);

      const clearCanvas = () => {
        const ctx = ctxRef.current;
        const c = canvasRef.current;
        if (!ctx || !c) return;
        const width = c.width / dprRef.current;
        const height = c.height / dprRef.current;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
      };

      const resize = () => {

        const displayWidth = parent?.clientWidth || 800;
        const displayHeight = parent?.clientHeight || 600;

        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.width = Math.floor(displayWidth * dpr);
        canvas.height = Math.floor(displayHeight * dpr);
        dprRef.current = dpr;

        const ctx = canvas.getContext('2d');
        ctxRef.current = ctx;

        ctx.setTransform(dpr,0,0,dpr,0,0);
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

        return {x : xAxis, y : yAxis};

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

        if (!canDraw) {
          return;
        }

        canvas.setPointerCapture?.(e.pointerId);
        isDrawingRef.current = true;
        lastPointRef.current = getPos(e);

        if (roomCode) {
          const p = toNormalized(lastPointRef.current);
          emitCanvasDrawStart({ roomCode, x: p.x, y: p.y, color, size });
        }

      }

      const move = (e) => {

        if (!isDrawingRef.current){
          return;
        }

        const {x,y} = getPos(e);
        const {x : lx, y: ly} = lastPointRef.current;

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

        lastPointRef.current = {x,y};

      }

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

    },[color,size,roomCode,canDraw]);

    const handleClear = () => {
      if (!canDraw) return;
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      const width = canvas.width / dprRef.current;
      const height = canvas.height / dprRef.current;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      if (roomCode) {
        emitCanvasClear({ roomCode });
      }
    };

  return (
    
    <div className = "w-full">
    <div className = "w-full h-[360px]">
      <canvas
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none', border: '1px solid #444', cursor: canDraw ? 'crosshair' : 'not-allowed' }}
        className = "w-full h-full"
      />

      <div style={{ marginBottom: 8 }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={!canDraw} />
        <input
          type="range"
          min={1}
          max={20}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          disabled={!canDraw}
          style={{ marginLeft: 8 }}
        />
        <span style={{ marginLeft: 8, color: '#fff' }}>Size: {size}</span>
        <button type="button" onClick={handleClear} disabled={!canDraw} style={{ marginLeft: 8, padding: '4px 10px' }}>
          Clear
        </button>
      </div>
    </div>
    </div>
  )
}

export default Canvas