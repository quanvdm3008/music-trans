import { useEffect, useRef, useMemo } from 'react';
import { useThemeStore } from '../../core/stores/theme.store';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
  life: number;
  maxLife: number;
}

/** Floating music-dust particles that drift across the studio background. */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mode = useThemeStore((s) => s.mode);

  const particles = useRef<Particle[]>([]);
  const animId = useRef(0);

  const hueRange = useMemo(() => {
    switch (mode) {
      case 'cute': return { min: 280, max: 340 }; // pink-purple
      case 'pro': return { min: 220, max: 280 };   // blue-purple
      default: return { min: 250, max: 330 };       // purple-pink-cyan
    }
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const count = 50;
    particles.current = Array.from({ length: count }, () => createParticle(canvas, hueRange));

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.current[i] = createParticle(canvas, hueRange);
          continue;
        }

        p.x += p.speedX * dt;
        p.y += p.speedY * dt;

        const progress = p.life / p.maxLife;
        const alpha = p.opacity * Math.sin(progress * Math.PI);

        // Glow circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha * 0.15})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 80%, ${alpha * 0.6})`;
        ctx.fill();

        // Sparkle for some
        if (p.size > 2.5 && Math.random() < 0.02) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 80%, 90%, ${alpha * 0.2})`;
          ctx.fill();
        }
      }

      animId.current = requestAnimationFrame(animate);
    };

    animId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId.current);
      window.removeEventListener('resize', resize);
    };
  }, [hueRange]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

function createParticle(
  canvas: HTMLCanvasElement,
  hueRange: { min: number; max: number },
): Particle {
  const maxLife = 4 + Math.random() * 8;
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 1 + Math.random() * 3.5,
    speedX: (Math.random() - 0.5) * 15,
    speedY: -8 - Math.random() * 20, // float upward
    opacity: 0.3 + Math.random() * 0.5,
    hue: hueRange.min + Math.random() * (hueRange.max - hueRange.min),
    life: maxLife,
    maxLife,
  };
}
