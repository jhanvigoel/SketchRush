import React, { useEffect, useRef } from 'react'

const Canvas = () => {

    const canvasRef = useRef(null);

    useEffect(() => {
        
        const currCanvas = canvasRef.current;
        const ctx = currCanvas.getContext('2d');

        currCanvas.width = 800;
        currCanvas.height = 600;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, currCanvas.width, currCanvas.height);

    },[]);

  return (
    <div>
        <canvas ref = {canvasRef}></canvas>
    </div>
  )
}

export default Canvas