import React, { useEffect, useRef } from 'react';

interface Orb3D {
  baseX: number;
  baseY: number;
  baseZ: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  glowColor: string;
  speed: number;
  phase: number;
}

export const Live3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with smoothing
    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX / width;
      mouse.targetY = e.clientY / height;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX / width;
        mouse.targetY = e.touches[0].clientY / height;
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Generate 3D floating liquid orbs
    const orbPalette = [
      { color: 'rgba(16, 185, 129, 0.55)', glow: 'rgba(5, 150, 105, 0.25)' }, // Emerald
      { color: 'rgba(20, 184, 166, 0.5)', glow: 'rgba(13, 148, 136, 0.22)' }, // Teal
      { color: 'rgba(56, 189, 248, 0.45)', glow: 'rgba(14, 165, 233, 0.2)' }, // Sky
      { color: 'rgba(99, 102, 241, 0.4)', glow: 'rgba(79, 70, 229, 0.18)' }, // Indigo
      { color: 'rgba(52, 211, 153, 0.5)', glow: 'rgba(16, 185, 129, 0.22)' }, // Mint
    ];

    const orbs: Orb3D[] = [];
    const orbCount = 18;
    for (let i = 0; i < orbCount; i++) {
      const palette = orbPalette[i % orbPalette.length];
      orbs.push({
        baseX: (Math.random() - 0.5) * 1600,
        baseY: (Math.random() - 0.5) * 1100,
        baseZ: Math.random() * 800 - 400,
        x: 0,
        y: 0,
        z: 0,
        radius: Math.random() * 45 + 25,
        color: palette.color,
        glowColor: palette.glow,
        speed: Math.random() * 0.0012 + 0.0006,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 3D Grid Wave Points
    const gridCols = 16;
    const gridRows = 10;
    const gridSpacing = 90;

    let time = 0;

    const render = () => {
      time += 0.016;

      // Smooth camera mouse tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      const camAngleX = (mouse.y - 0.5) * 0.35;
      const camAngleY = (mouse.x - 0.5) * 0.45;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient Background Liquid Glow
      const glowGrad1 = ctx.createRadialGradient(
        width * 0.3 + Math.sin(time * 0.5) * 80,
        height * 0.35 + Math.cos(time * 0.4) * 60,
        10,
        width * 0.3,
        height * 0.35,
        width * 0.6
      );
      glowGrad1.addColorStop(0, 'rgba(16, 185, 129, 0.09)');
      glowGrad1.addColorStop(0.5, 'rgba(14, 165, 233, 0.05)');
      glowGrad1.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = glowGrad1;
      ctx.fillRect(0, 0, width, height);

      const glowGrad2 = ctx.createRadialGradient(
        width * 0.75 + Math.cos(time * 0.4) * 90,
        height * 0.65 + Math.sin(time * 0.6) * 70,
        10,
        width * 0.75,
        height * 0.65,
        width * 0.55
      );
      glowGrad2.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
      glowGrad2.addColorStop(0.5, 'rgba(20, 184, 166, 0.04)');
      glowGrad2.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(0, 0, width, height);

      // Camera 3D Perspective Projection
      const fov = 700;
      const centerX = width / 2;
      const centerY = height / 2;

      // Cos and Sin for 3D rotation
      const cosY = Math.cos(camAngleY);
      const sinY = Math.sin(camAngleY);
      const cosX = Math.cos(camAngleX);
      const sinX = Math.sin(camAngleX);

      const project3D = (x: number, y: number, z: number) => {
        // Rotate Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const depth = z2 + 800; // shift forward
        if (depth <= 10) return null;

        const scale = fov / depth;
        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          scale,
          depth,
        };
      };

      // 2. Render 3D Perspective Undulating Wave Plane
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 1;

      const gridPoints: ({ px: number; py: number } | null)[][] = [];

      for (let r = 0; r < gridRows; r++) {
        gridPoints[r] = [];
        for (let c = 0; c < gridCols; c++) {
          const gx = (c - gridCols / 2) * gridSpacing;
          const gz = (r - gridRows / 2) * gridSpacing + 200;
          const wave = Math.sin(time * 1.2 + c * 0.4 + r * 0.5) * 35;
          const gy = 320 + wave;

          gridPoints[r][c] = project3D(gx, gy, gz);
        }
      }

      // Draw horizontal wave lines
      for (let r = 0; r < gridRows; r++) {
        ctx.beginPath();
        let started = false;
        for (let c = 0; c < gridCols; c++) {
          const pt = gridPoints[r][c];
          if (pt) {
            if (!started) {
              ctx.moveTo(pt.px, pt.py);
              started = true;
            } else {
              ctx.lineTo(pt.px, pt.py);
            }
          }
        }
        ctx.stroke();
      }

      // Draw vertical wave lines
      for (let c = 0; c < gridCols; c++) {
        ctx.beginPath();
        let started = false;
        for (let r = 0; r < gridRows; r++) {
          const pt = gridPoints[r][c];
          if (pt) {
            if (!started) {
              ctx.moveTo(pt.px, pt.py);
              started = true;
            } else {
              ctx.lineTo(pt.px, pt.py);
            }
          }
        }
        ctx.stroke();
      }

      // 3. Render 3D Floating Liquid Orbs (sorted by depth back-to-front)
      const projectedOrbs = orbs
        .map((orb) => {
          // Autonomous 3D floating movement
          const animTime = time * orb.speed * 1000 + orb.phase;
          const ox = orb.baseX + Math.sin(animTime) * 60;
          const oy = orb.baseY + Math.cos(animTime * 0.8) * 50;
          const oz = orb.baseZ + Math.sin(animTime * 0.6) * 70;

          const proj = project3D(ox, oy, oz);
          return {
            ...orb,
            proj,
          };
        })
        .filter((o) => o.proj !== null)
        .sort((a, b) => (b.proj?.depth || 0) - (a.proj?.depth || 0));

      for (const orb of projectedOrbs) {
        if (!orb.proj) continue;
        const { px, py, scale } = orb.proj;
        const rad = Math.max(8, orb.radius * scale);

        // Outer glow
        const glowRad = rad * 2.2;
        const gGrad = ctx.createRadialGradient(px, py, rad * 0.2, px, py, glowRad);
        gGrad.addColorStop(0, orb.glowColor);
        gGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(px, py, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // 3D Liquid Sphere with Specular Reflection
        const sGrad = ctx.createRadialGradient(
          px - rad * 0.35,
          py - rad * 0.35,
          rad * 0.08,
          px,
          py,
          rad
        );
        sGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        sGrad.addColorStop(0.3, orb.color);
        sGrad.addColorStop(0.85, 'rgba(15, 23, 42, 0.4)');
        sGrad.addColorStop(1, 'rgba(15, 23, 42, 0.1)');

        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();

        // High gloss rim light
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = Math.max(0.8, 1.2 * scale);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.88 }}
    />
  );
};
