import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  vx: number;
  vy: number;
}

const STAR_COUNT = 180;
const REPULSION_RADIUS = 80;
const REPULSION_STRENGTH = 18;
const RETURN_SPEED = 0.04;
const FRICTION = 0.82;

export default function InteractiveStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      starsRef.current = Array.from({ length: STAR_COUNT }, () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const baseOpacity = 0.2 + Math.random() * 0.5;
        return {
          x,
          y,
          originX: x,
          originY: y,
          size: 0.4 + Math.random() * 0.8,
          opacity: baseOpacity,
          baseOpacity,
          vx: 0,
          vy: 0,
        };
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const star of starsRef.current) {
        const dx = star.x - mx;
        const dy = star.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSION_RADIUS && dist > 0) {
          const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
          star.vx += (dx / dist) * force * 0.05;
          star.vy += (dy / dist) * force * 0.05;
        }

        // Spring back to origin
        star.vx += (star.originX - star.x) * RETURN_SPEED;
        star.vy += (star.originY - star.y) * RETURN_SPEED;

        // Friction
        star.vx *= FRICTION;
        star.vy *= FRICTION;

        star.x += star.vx;
        star.y += star.vy;

        // Draw — plain white dot, no glow
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.baseOpacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
