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
  color: string;
  twinkleOffset: number;
  twinkleSpeed: number;
}

const STAR_COUNT = 220;
const REPULSION_RADIUS = 120;
const REPULSION_STRENGTH = 180;
const RETURN_SPEED = 0.06;
const FRICTION = 0.88;

const STAR_COLORS = [
  "255,255,255",
  "220,190,255",
  "200,160,255",
  "180,140,255",
  "240,220,255",
  "255,255,220",
];

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
        const baseOpacity = 0.3 + Math.random() * 0.7;
        return {
          x,
          y,
          originX: x,
          originY: y,
          size: Math.random() < 0.15 ? 2 + Math.random() * 1.2 : 0.8 + Math.random() * 1.2,
          opacity: baseOpacity,
          baseOpacity,
          vx: 0,
          vy: 0,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.3 + Math.random() * 1.2,
        };
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const star of starsRef.current) {
        // Repulsion from mouse
        const dx = star.x - mx;
        const dy = star.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSION_RADIUS && dist > 0) {
          const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
          star.vx += (dx / dist) * force * 0.08;
          star.vy += (dy / dist) * force * 0.08;
        }

        // Spring back to origin
        star.vx += (star.originX - star.x) * RETURN_SPEED;
        star.vy += (star.originY - star.y) * RETURN_SPEED;

        // Friction
        star.vx *= FRICTION;
        star.vy *= FRICTION;

        star.x += star.vx;
        star.y += star.vy;

        // Twinkle
        const twinkle = Math.sin(frame * 0.01 * star.twinkleSpeed + star.twinkleOffset);
        star.opacity = star.baseOpacity * (0.7 + 0.3 * twinkle);

        // Glow when near mouse
        const nearDist = Math.sqrt((star.x - mx) ** 2 + (star.y - my) ** 2);
        const glowFactor = nearDist < REPULSION_RADIUS
          ? 1 + (1 - nearDist / REPULSION_RADIUS) * 1.8
          : 1;

        // Draw star
        const finalOpacity = Math.min(1, star.opacity * glowFactor);
        const finalSize = star.size * (nearDist < REPULSION_RADIUS ? 1 + (1 - nearDist / REPULSION_RADIUS) * 0.8 : 1);

        // Glow halo for nearby stars
        if (nearDist < REPULSION_RADIUS) {
          const glowRadius = finalSize * 4;
          const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);
          grd.addColorStop(0, `rgba(${star.color},${finalOpacity * 0.6})`);
          grd.addColorStop(1, `rgba(${star.color},0)`);
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(star.x, star.y, finalSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color},${finalOpacity})`;
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
