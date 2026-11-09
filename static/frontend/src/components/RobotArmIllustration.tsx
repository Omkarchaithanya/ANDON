import React from 'react';

interface RobotArmProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const RobotArmIllustration: React.FC<RobotArmProps> = ({
  className = '',
  width = '100%',
  height = 140,
}) => {
  return (
    <div className={`robot-arm-illustration-wrap ${className}`} style={{ width, height }}>
      <svg
        viewBox="0 0 320 180"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <linearGradient id="metalArmGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="metalJointGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="accentOrange" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Floor pedestal / base platform */}
        <rect x="180" y="148" width="110" height="18" rx="4" fill="url(#metalArmGrad1)" stroke="#334155" strokeWidth="1.2" />
        <rect x="195" y="140" width="80" height="9" rx="2" fill="url(#metalJointGrad)" />
        <circle cx="235" cy="140" r="16" fill="url(#metalArmGrad1)" stroke="#475569" strokeWidth="1.5" />

        {/* Lower robotic arm beam */}
        <path
          d="M 230 135 L 180 75 L 196 64 L 244 125 Z"
          fill="url(#metalArmGrad1)"
          stroke="#334155"
          strokeWidth="1.2"
        />
        {/* Accent stripe on lower arm */}
        <path d="M 226 122 L 195 80" stroke="url(#accentOrange)" strokeWidth="3" strokeLinecap="round" />

        {/* Elbow Joint */}
        <circle cx="188" cy="70" r="14" fill="url(#metalJointGrad)" stroke="#1E293B" strokeWidth="2" />
        <circle cx="188" cy="70" r="6" fill="#0F172A" />

        {/* Upper robotic arm beam */}
        <path
          d="M 188 70 L 260 40 L 265 52 L 194 82 Z"
          fill="url(#metalArmGrad1)"
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* Wrist Joint */}
        <circle cx="262" cy="46" r="10" fill="url(#metalJointGrad)" stroke="#1E293B" strokeWidth="1.5" />
        <circle cx="262" cy="46" r="4" fill="url(#accentOrange)" />

        {/* Tool flange & end effector (pneumatic gripper) */}
        <path d="M 268 44 L 288 38 L 290 54 L 270 48 Z" fill="#475569" />
        {/* Gripper claws */}
        <path d="M 288 38 L 302 32 L 304 36 L 290 41" fill="url(#accentOrange)" />
        <path d="M 290 50 L 304 55 L 302 59 L 288 53" fill="url(#accentOrange)" />

        {/* Subtle grid floor perspective lines */}
        <line x1="30" y1="166" x2="310" y2="166" stroke="#E2E8F0" strokeWidth="1.2" />
        <line x1="120" y1="166" x2="160" y2="148" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" />
        <line x1="80" y1="166" x2="130" y2="148" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" />
        <line x1="280" y1="166" x2="310" y2="154" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" />
      </svg>
    </div>
  );
};

