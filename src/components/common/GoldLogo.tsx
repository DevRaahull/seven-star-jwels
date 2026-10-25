import React from 'react';

interface GoldLogoProps {
  size?: number;
  className?: string;
}

export const GoldLogo: React.FC<GoldLogoProps> = ({ size = 44, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="goldPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2D6" />
          <stop offset="35%" stopColor="#E6CA85" />
          <stop offset="70%" stopColor="#D6B36A" />
          <stop offset="100%" stopColor="#9E7C35" />
        </linearGradient>
      </defs>
      <g transform="translate(50,50)">
        {/* 4 Cardinal Petals */}
        <path
          d="M 0,-42 C 4,-20 12,-12 32,-32 C 12,-12 20,-4 42,0 C 20,4 12,12 32,32 C 12,12 4,20 0,42 C -4,20 -12,12 -32,32 C -12,12 -20,4 -42,0 C -20,-4 -12,-12 -32,-32 C -12,-12 -4,-20 0,-42 Z"
          fill="url(#goldPetalGrad)"
        />
        {/* 4 Diagonal Petals */}
        <g transform="rotate(45)">
          <path
            d="M 0,-30 C 3,-15 9,-9 24,-24 C 9,-9 15,-3 30,0 C 15,3 9,9 24,24 C 9,9 3,15 0,30 C -3,15 -9,9 -24,24 C -9,9 -15,3 -30,0 C -15,-3 -9,-9 -24,-24 C -9,-9 -3,-15 0,-30 Z"
            fill="url(#goldPetalGrad)"
            opacity="0.8"
          />
        </g>
        {/* Center Jewel Core */}
        <circle cx="0" cy="0" r="7" fill="#0B1220" stroke="url(#goldPetalGrad)" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="3" fill="url(#goldPetalGrad)" />
      </g>
    </svg>
  );
};
