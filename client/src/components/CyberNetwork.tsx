import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
}

interface Pulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
}

export default function CyberNetwork({
  className = "",
  nodeCount = 65,
  accentColor = "rgba(52, 211, 153, 1)",
  secondaryColor = "rgba(16, 185, 129, 0.8)",
}: {
  className?: string;
  nodeCount?: number;
  accentColor?: string;
  secondaryColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animId = 0;

    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let mouse = { x: -1000, y: -1000, radius: 160 };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initNodes();
    };

    const initNodes = () => {
      nodes = [];
      pulses = [];
      const count = Math.max(30, Math.min(nodeCount, Math.floor((width * height) / 12000)));

      for (let i = 0; i < count; i++) {
        const layer = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2;
        const speedMultiplier = layer === 0 ? 0.2 : layer === 1 ? 0.45 : 0.7;

        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speedMultiplier,
          vy: (Math.random() - 0.5) * speedMultiplier,
          radius: layer === 0 ? 1.2 : layer === 1 ? 2.0 : 2.8,
          baseAlpha: layer === 0 ? 0.25 : layer === 1 ? 0.55 : 0.85,
          layer,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", resize);
    resize();

    // Spawn pulses occasionally
    const pulseTimer = setInterval(() => {
      if (nodes.length < 2) return;
      const from = Math.floor(Math.random() * nodes.length);
      // find a neighbor
      for (let j = 0; j < nodes.length; j++) {
        if (j === from) continue;
        const dx = nodes[from].x - nodes[j].x;
        const dy = nodes[from].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          pulses.push({
            fromNode: from,
            toNode: j,
            progress: 0,
            speed: 0.02 + Math.random() * 0.025,
          });
          break;
        }
      }
      if (pulses.length > 12) pulses.shift();
    }, 450);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.4,
        height * 0.45,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, "rgba(10, 24, 18, 0.45)");
      bgGrad.addColorStop(0.4, "rgba(5, 14, 10, 0.25)");
      bgGrad.addColorStop(1, "rgba(2, 4, 3, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Secondary subtle ambient top glow
      const topGrad = ctx.createRadialGradient(
        width * 0.8,
        height * 0.1,
        0,
        width * 0.8,
        height * 0.1,
        width * 0.6
      );
      topGrad.addColorStop(0, "rgba(16, 185, 129, 0.12)");
      topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, height);

      // Update positions
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Bounce on borders
        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        else if (n.x > width) { n.x = width; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        else if (n.y > height) { n.y = height; n.vy *= -1; }

        // Mouse interaction
        const mdx = n.x - mouse.x;
        const mdy = n.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < mouse.radius && mDist > 0) {
          const force = (1 - mDist / mouse.radius) * 0.8;
          n.x += (mdx / mDist) * force * 1.5;
          n.y += (mdy / mDist) * force * 1.5;
        }
      }

      // Draw connections
      const maxDist = 135;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * Math.min(a.baseAlpha, b.baseAlpha) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
            ctx.lineWidth = a.layer === 2 || b.layer === 2 ? 1.0 : 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw traveling pulses
      for (let pIdx = pulses.length - 1; pIdx >= 0; pIdx--) {
        const p = pulses[pIdx];
        p.progress += p.speed;

        if (p.progress >= 1) {
          pulses.splice(pIdx, 1);
          continue;
        }

        const a = nodes[p.fromNode];
        const b = nodes[p.toNode];
        if (!a || !b) continue;

        const px = a.x + (b.x - a.x) * p.progress;
        const py = a.y + (b.y - a.y) * p.progress;
        const pulseAlpha = Math.sin(p.progress * Math.PI) * 0.9;

        // Glow behind pulse
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(110, 231, 183, ${pulseAlpha * 0.4})`;
        ctx.fill();

        // Core pulse
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
        ctx.fill();
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Outer halo
        if (n.layer === 2) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${n.baseAlpha * 0.12})`;
          ctx.fill();
        }

        // Inner node
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.layer === 2
          ? `rgba(255, 255, 255, ${n.baseAlpha})`
          : `rgba(52, 211, 153, ${n.baseAlpha})`;
        ctx.fill();
      }

      // Mouse halo
      if (mouse.x > 0 && mouse.y > 0) {
        const mGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        mGrad.addColorStop(0, "rgba(52, 211, 153, 0.15)");
        mGrad.addColorStop(0.5, "rgba(16, 185, 129, 0.05)");
        mGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(pulseTimer);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, [nodeCount, accentColor, secondaryColor]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: "#020403" }}
    >
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
}
