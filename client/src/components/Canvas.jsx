import React, { useEffect, useRef, useState } from 'react'

const Canvas = () => {

    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef({x: 0,y: 0});

    const [color,setColor] = useState('#ffffff');
    const [size,setSize] = useState(4);

    const getPos = (e) => {

      const rect = canvasRef.current.getBoundingClientRect();

      return {x : e.clientX - rect.left , y : eClient.Y - rect.top};

    }

    useEffect(() => {

      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      const dpr = Math.max(1,window.devicePixelRatio || 1);

      const resize = () => {

        const displayWidth = parent?.clientWidth || 800;
        const displayHeight = parent?.clientHeight || 600;

        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.width = Math.floor(displayWidth * dpr);
        canvas.height = Math.floor(displayHeight * dpr);

        const ctx = canvas.getContext('2d');
        ctxRef.current = ctx;

        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,displayWidth,displayHeight);
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

      const down = (e) => {

        canvas.setPointerCapture?.(e.pointerId);
        isDrawingRef.current = true;
        lastPointRef.current = getPos(e);

      }

      const move = (e) => {

        if (!isDrawingRef.current){
          return;
        }

        const ctx = ctxRef.current;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;

        const {x,y} = getPos(e);
        const {x : lx, y: ly} = lastPointRef.current;

        ctx.beginPath();

        ctx.moveTo(lx,ly);
        ctx.lineTo(x,y);

        ctx.stroke();

        lastPointRef.current = {x,y};

      }

      const endDraw = (e) => {

        isDrawingRef.current = false;
        canvas.releasePointerCapture?.(e.pointerId);

      };
      
      resize();
      window.addEventListener('resize', resize);
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', endDraw);
      canvas.addEventListener('pointerleave', endDraw);
      canvas.addEventListener('pointercancel', endDraw);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', endDraw);
      canvas.removeEventListener('pointerleave', endDraw);
      canvas.removeEventListener('pointercancel', endDraw);
    };

    },[color,size]);

  return (
    
    <div className = "px-20 py-20">
    <div className = "mx-auto" style={{ width: '800px', height: '600px' }}>
      <div style={{ marginBottom: 8 }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input
          type="range"
          min={1}
          max={20}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          style={{ marginLeft: 8 }}
        />
        <span style={{ marginLeft: 8, color: '#fff' }}>Size: {size}</span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none', border: '1px solid #444' }}
      />
    </div>
    </div>
  )
}

export default Canvas