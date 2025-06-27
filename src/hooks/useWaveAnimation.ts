import { useEffect, useRef } from 'react';

interface WaveAnimationOptions {
    color?: string;
    speed?: number;
    amplitude?: number;
    frequency?: number;
}

export function useWaveAnimation(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    {
        color = '#00E5FF',
        speed = 0.02,
        amplitude = 20,
        frequency = 0.02
    }: WaveAnimationOptions = {}
) {
    const animationFrameRef = useRef<number>();
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        const animate = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);

            for (let x = 0; x < canvas.width; x++) {
                const y = canvas.height / 2 + 
                    Math.sin(x * frequency + timeRef.current) * amplitude;
                ctx.lineTo(x, y);
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            timeRef.current += speed;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        resizeCanvas();
        animate();

        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [canvasRef, color, speed, amplitude, frequency]);
} 