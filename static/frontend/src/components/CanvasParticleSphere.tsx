/**
 * @file CanvasParticleSphere.tsx
 * @description HTML5 Canvas 3D rotating particle constellation sphere for Meely AI Agent cards.
 * Implements a Fibonacci point-cloud with dynamic inter-particle constellation lines and radial glow.
 */

import React, { useEffect, useRef } from 'react';
import { AgentStatus } from '../types/hybrid-spec';

interface CanvasParticleSphereProps {
  status: AgentStatus;
  size?: number; // width/height in px
  isPaused?: boolean;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export const CanvasParticleSphere: React.FC<CanvasParticleSphereProps> = ({
  status,
  size = 130,
  isPaused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotRef = useRef<{ rx: number; ry: number; speedX: number; speedY: number }>({
    rx: 0.2,
    ry: 0.3,
    speedX: 0.004,
    speedY: 0.006,
  });

  const getColor = () => {
    switch (status) {
      case 'RUNNING':
        return {
          primary: '#3B82F6',
          rgb: '59, 130, 246',
          halo: 'rgba(59, 130, 246, 0.25)',
        };
      case 'IDLED':
        return {
          primary: '#9CA3AF',
          rgb: '156, 163, 175',
          halo: 'rgba(156, 163, 175, 0.15)',
        };
      case 'FAILED':
        return {
          primary: '#EF4444',
          rgb: '239, 68, 68',
          halo: 'rgba(239, 68, 68, 0.25)',
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Generate Fibonacci sphere points
    const numPoints = 85;
    const radius = (size / 2) * 0.72;
    const points: Point3D[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
      });
    }

    const color = getColor();

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;

      // Background soft radial aura
      const radialGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.25);
      radialGradient.addColorStop(0, color.halo);
      radialGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Update rotation
      if (!isPaused) {
        rotRef.current.rx += rotRef.current.speedX;
        rotRef.current.ry += rotRef.current.speedY;
      }

      const cosX = Math.cos(rotRef.current.rx);
      const sinX = Math.sin(rotRef.current.rx);
      const cosY = Math.cos(rotRef.current.ry);
      const sinY = Math.sin(rotRef.current.ry);

      // Rotate and project points
      const projected: Array<{ x: number; y: number; z: number; scale: number; alpha: number }> = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Rotate Y
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective projection
        const fov = 200;
        const scale = fov / (fov + z2);
        const projX = cx + x1 * scale;
        const projY = cy + y2 * scale;
        const alpha = Math.max(0.15, Math.min(1, (z2 + radius) / (2 * radius)));

        projected.push({ x: projX, y: projY, z: z2, scale, alpha });
      }

      // Draw constellation connective lines between neighboring particles
      const maxDistance = radius * 0.58;
      ctx.lineWidth = 0.8;

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.28 * Math.min(projected[i].alpha, projected[j].alpha);
            ctx.strokeStyle = `rgba(${color.rgb}, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        const dotRadius = Math.max(1, 2.2 * pt.scale);

        ctx.fillStyle = `rgba(${color.rgb}, ${pt.alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight front-most particles with bright core
        if (pt.z > radius * 0.3) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotRadius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, size, isPaused]);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size, display: 'block' }}
      />
    </div>
  );
};

