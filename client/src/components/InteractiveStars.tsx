import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedY: number;
}

const DOT_COUNT = 35;

export default function InteractiveStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots();
    };

    const initDots = () => {
      dotsRef.current = Array.from({ length: DOT_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.8 + Math.random() * 1.2,
        opacity: 0.03 + Math.random() * 0.08,
        speedY: 0.1 + Math.random() * 0.2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dotsRef.current) {
        dot.y += dot.speedY;
        if (dot.y > canvas.height) dot.y = 0;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${dot.opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.08) 0%, transparent 45%),
            radial-gradient(ellipse at 80% 10%, rgba(139,92,246,0.06) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.05) 0%, transparent 50%),
            #050507
          `,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          display: "block",
          opacity: 0.6,
        }}
      />
    </>
  );
}
