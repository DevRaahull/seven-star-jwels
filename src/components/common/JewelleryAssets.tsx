import React from 'react';

/**
 * High-End Luxury Jewellery Vector Graphics
 * Meticulously crafted vector SVG illustrations designed for Midnight Ledger luxury aesthetic.
 */

// 1. Solitaire Diamond Ring (for Sales Card)
export const SolitaireDiamondRing: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-[0_4px_12px_rgba(214,179,106,0.35)] ${className}`}
    >
      <defs>
        <linearGradient id="ringGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2D6" />
          <stop offset="35%" stopColor="#E6CA85" />
          <stop offset="70%" stopColor="#D6B36A" />
          <stop offset="100%" stopColor="#8C6E2D" />
        </linearGradient>
        <linearGradient id="ringGoldInner" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#4A3B18" />
          <stop offset="50%" stopColor="#7A5E26" />
          <stop offset="100%" stopColor="#D6B36A" />
        </linearGradient>
        <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F0F8FF" />
          <stop offset="80%" stopColor="#D9ECFA" />
          <stop offset="100%" stopColor="#BCE0F5" />
        </linearGradient>
        <filter id="diamondGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ring Band - Outer Circle tilted in 3D */}
      <ellipse
        cx="50"
        cy="58"
        rx="34"
        ry="24"
        stroke="url(#ringGoldGrad)"
        strokeWidth="6.5"
        fill="none"
        transform="rotate(-15 50 58)"
      />

      {/* Ring Band - Inner Shadow Depth */}
      <ellipse
        cx="50"
        cy="58"
        rx="30"
        ry="20"
        stroke="url(#ringGoldInner)"
        strokeWidth="2"
        fill="none"
        transform="rotate(-15 50 58)"
      />

      {/* Pavé Small Accent Diamonds along the band shoulders */}
      <circle cx="34" cy="40" r="1.5" fill="#FFFFFF" />
      <circle cx="38" cy="38" r="1.5" fill="#FFFFFF" />
      <circle cx="42" cy="36" r="1.5" fill="#FFFFFF" />
      <circle cx="58" cy="36" r="1.5" fill="#FFFFFF" />
      <circle cx="62" cy="38" r="1.5" fill="#FFFFFF" />
      <circle cx="66" cy="41" r="1.5" fill="#FFFFFF" />

      {/* Prongs (6-Prong Crown Setting) */}
      <path d="M 44 32 L 42 22 L 45 22 Z" fill="url(#ringGoldGrad)" />
      <path d="M 56 32 L 58 22 L 55 22 Z" fill="url(#ringGoldGrad)" />
      <path d="M 49 34 L 49 21 L 51 21 L 51 34 Z" fill="url(#ringGoldGrad)" />

      {/* Main Solitaire Diamond Crown (Brilliant Facets) */}
      <g filter="url(#diamondGlow)">
        {/* Table Facet */}
        <polygon points="46,18 54,18 57,23 50,30 43,23" fill="url(#diamondGrad)" />
        {/* Top Triangular Facets */}
        <polygon points="46,18 50,14 54,18" fill="#FFFFFF" opacity="0.95" />
        <polygon points="43,23 46,18 50,14 41,20" fill="#E8F4FA" opacity="0.9" />
        <polygon points="57,23 54,18 50,14 59,20" fill="#CFE6F7" opacity="0.9" />
        {/* Lower Pavilion Facets */}
        <polygon points="43,23 50,30 41,20" fill="#B0D5F0" opacity="0.85" />
        <polygon points="57,23 50,30 59,20" fill="#A1C9EA" opacity="0.85" />
        <polygon points="46,18 50,23 54,18" fill="#FFFFFF" opacity="0.9" />
        <polygon points="46,18 50,23 43,23" fill="#E0EFFB" opacity="0.8" />
        <polygon points="54,18 50,23 57,23" fill="#D0E5F8" opacity="0.8" />
        <polygon points="43,23 50,23 50,30" fill="#BBE0FB" opacity="0.9" />
        <polygon points="57,23 50,23 50,30" fill="#99C5EE" opacity="0.9" />
      </g>

      {/* Diamond Sparkle Star */}
      <g transform="translate(50, 16)">
        <path d="M 0,-7 Q 0,0 7,0 Q 0,0 0,7 Q 0,0 -7,0 Q 0,0 0,-7 Z" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="1.5" fill="#FFF2D6" />
      </g>
    </svg>
  );
};

// 2. Gold Bullion Bars (for Purchases Card)
export const GoldBullionBars: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-[0_4px_12px_rgba(214,179,106,0.35)] ${className}`}
    >
      <defs>
        <linearGradient id="goldBarTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF4D4" />
          <stop offset="40%" stopColor="#F0D38E" />
          <stop offset="80%" stopColor="#D6B36A" />
          <stop offset="100%" stopColor="#B08E46" />
        </linearGradient>
        <linearGradient id="goldBarFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D6B36A" />
          <stop offset="60%" stopColor="#9C772F" />
          <stop offset="100%" stopColor="#634B19" />
        </linearGradient>
        <linearGradient id="goldBarSide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BA9544" />
          <stop offset="100%" stopColor="#543E13" />
        </linearGradient>
      </defs>

      {/* Bottom Bar (Left) */}
      <g transform="translate(5, 42)">
        {/* Top Face */}
        <polygon points="12,8 48,0 66,10 26,18" fill="url(#goldBarTop)" />
        {/* Front Face */}
        <polygon points="26,18 66,10 60,24 20,32" fill="url(#goldBarFront)" />
        {/* Left Side Face */}
        <polygon points="12,8 26,18 20,32 6,22" fill="url(#goldBarSide)" />
        {/* Stamped Text */}
        <text
          x="38"
          y="11"
          transform="rotate(12 38 11)"
          fill="#8A6822"
          fontSize="3.5"
          fontWeight="bold"
          fontFamily="serif"
          letterSpacing="0.5"
        >
          999.9
        </text>
      </g>

      {/* Bottom Bar (Right) */}
      <g transform="translate(32, 48)">
        {/* Top Face */}
        <polygon points="12,8 48,0 66,10 26,18" fill="url(#goldBarTop)" />
        {/* Front Face */}
        <polygon points="26,18 66,10 60,24 20,32" fill="url(#goldBarFront)" />
        {/* Left Side Face */}
        <polygon points="12,8 26,18 20,32 6,22" fill="url(#goldBarSide)" />
        {/* Stamped Text */}
        <text
          x="38"
          y="11"
          transform="rotate(12 38 11)"
          fill="#8A6822"
          fontSize="3.5"
          fontWeight="bold"
          fontFamily="serif"
          letterSpacing="0.5"
        >
          FINE GOLD
        </text>
      </g>

      {/* Top Stacked Bar (Center) */}
      <g transform="translate(18, 22)">
        {/* Top Face */}
        <polygon points="14,8 52,0 70,10 28,18" fill="url(#goldBarTop)" />
        {/* Front Face */}
        <polygon points="28,18 70,10 64,24 22,32" fill="url(#goldBarFront)" />
        {/* Left Side Face */}
        <polygon points="14,8 28,18 22,32 8,22" fill="url(#goldBarSide)" />
        {/* Stamped Seal */}
        <circle cx="34" cy="10" r="3" stroke="#8A6822" strokeWidth="0.6" fill="none" />
        <text
          x="42"
          y="11"
          transform="rotate(12 42 11)"
          fill="#8A6822"
          fontSize="4"
          fontWeight="bold"
          fontFamily="serif"
          letterSpacing="1"
        >
          SEVEN STAR
        </text>
      </g>

      {/* Shimmer Light Reflection on Top Ingot */}
      <line x1="38" y1="28" x2="68" y2="34" stroke="#FFF7E0" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
    </svg>
  );
};

// 3. Sparkling Cut Diamonds (for Current Stock Summary Card)
export const SparklingDiamonds: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-[0_4px_12px_rgba(200,230,255,0.4)] ${className}`}
    >
      <defs>
        <linearGradient id="diamondWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#EAF5FD" />
          <stop offset="70%" stopColor="#CCE6F8" />
          <stop offset="100%" stopColor="#A5D2F2" />
        </linearGradient>
      </defs>

      {/* Large Center Diamond */}
      <g transform="translate(35, 30)">
        {/* Outer Facets */}
        <polygon points="15,0 35,0 45,12 25,32 5,12" fill="url(#diamondWhiteGrad)" stroke="#BCE0F5" strokeWidth="0.6" />
        {/* Table & Star Facets */}
        <polygon points="19,5 31,5 37,12 25,12 13,12" fill="#FFFFFF" opacity="0.95" />
        <polygon points="25,12 37,12 25,32" fill="#B5DCF7" opacity="0.85" />
        <polygon points="25,12 13,12 25,32" fill="#8EC5EE" opacity="0.85" />
        <polygon points="19,5 25,0 31,5 25,12" fill="#FFFFFF" />
        <polygon points="15,0 19,5 13,12 5,12" fill="#D6ECFB" />
        <polygon points="35,0 31,5 37,12 45,12" fill="#C2E2F8" />
      </g>

      {/* Small Left Diamond */}
      <g transform="translate(8, 48) scale(0.65)">
        <polygon points="15,0 35,0 45,12 25,32 5,12" fill="url(#diamondWhiteGrad)" stroke="#BCE0F5" strokeWidth="0.8" />
        <polygon points="19,5 31,5 37,12 25,12 13,12" fill="#FFFFFF" opacity="0.95" />
        <polygon points="25,12 37,12 25,32" fill="#B5DCF7" opacity="0.85" />
        <polygon points="25,12 13,12 25,32" fill="#8EC5EE" opacity="0.85" />
      </g>

      {/* Small Right Diamond */}
      <g transform="translate(62, 45) scale(0.7) rotate(15)">
        <polygon points="15,0 35,0 45,12 25,32 5,12" fill="url(#diamondWhiteGrad)" stroke="#BCE0F5" strokeWidth="0.8" />
        <polygon points="19,5 31,5 37,12 25,12 13,12" fill="#FFFFFF" opacity="0.95" />
        <polygon points="25,12 37,12 25,32" fill="#B5DCF7" opacity="0.85" />
        <polygon points="25,12 13,12 25,32" fill="#8EC5EE" opacity="0.85" />
      </g>

      {/* Brilliant Sparkle Crosses */}
      <g transform="translate(48, 25)">
        <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="1.5" fill="#E6F4FF" />
      </g>
      <g transform="translate(78, 40) scale(0.6)">
        <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#FFFFFF" />
      </g>
      <g transform="translate(20, 65) scale(0.5)">
        <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

// 4. Ornate Gold Bridal Necklace Motif (for Top Right Decorative Accent)
export const RoyalBridalNecklaceDrape: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 280 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <linearGradient id="necklaceGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF0C7" />
          <stop offset="30%" stopColor="#E6CA85" />
          <stop offset="70%" stopColor="#D6B36A" />
          <stop offset="100%" stopColor="#8C6E2D" />
        </linearGradient>
        <radialGradient id="rubyGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FF6B8B" />
          <stop offset="40%" stopColor="#D91E48" />
          <stop offset="85%" stopColor="#7A001E" />
          <stop offset="100%" stopColor="#3B000D" />
        </radialGradient>
        <radialGradient id="pearlGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F5EFE6" />
          <stop offset="100%" stopColor="#D8CFBF" />
        </radialGradient>
      </defs>

      {/* Main Curving Gold String / Chain */}
      <path
        d="M 270,-20 Q 240,120 180,200 T 80,320"
        stroke="url(#necklaceGold)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 285,-10 Q 255,130 195,210 T 95,330"
        stroke="url(#necklaceGold)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />

      {/* Intricate Kundan Necklace Units along the curve */}
      {[
        { x: 260, y: 30, r: 7, ruby: false },
        { x: 242, y: 70, r: 9, ruby: true },
        { x: 220, y: 112, r: 8, ruby: false },
        { x: 195, y: 154, r: 11, ruby: true },
        { x: 168, y: 196, r: 9, ruby: false },
        { x: 138, y: 238, r: 12, ruby: true },
        { x: 106, y: 280, r: 10, ruby: false },
        { x: 74, y: 320, r: 14, ruby: true },
      ].map((unit, idx) => (
        <g key={idx} transform={`translate(${unit.x}, ${unit.y})`}>
          {/* Gold Filigree Floret Setting */}
          <circle cx="0" cy="0" r={unit.r + 3.5} fill="#0B1220" stroke="url(#necklaceGold)" strokeWidth="1.5" />
          {/* Gemstone / Ruby Core */}
          {unit.ruby ? (
            <ellipse cx="0" cy="0" rx={unit.r} ry={unit.r * 1.15} fill="url(#rubyGrad)" />
          ) : (
            <circle cx="0" cy="0" r={unit.r} fill="url(#necklaceGold)" />
          )}
          {/* Diamond Prongs */}
          <circle cx={-unit.r * 0.7} cy={-unit.r * 0.7} r="1.5" fill="#FFFFFF" />
          <circle cx={unit.r * 0.7} cy={-unit.r * 0.7} r="1.5" fill="#FFFFFF" />
          <circle cx={-unit.r * 0.7} cy={unit.r * 0.7} r="1.5" fill="#FFFFFF" />
          <circle cx={unit.r * 0.7} cy={unit.r * 0.7} r="1.5" fill="#FFFFFF" />
          {/* Hanging South Sea Pearl Drop */}
          <line x1="0" y1={unit.r + 3.5} x2="0" y2={unit.r + 9} stroke="url(#necklaceGold)" strokeWidth="1.2" />
          <ellipse cx="0" cy={unit.r + 14} rx="4" ry="5.5" fill="url(#pearlGrad)" stroke="#B5A895" strokeWidth="0.5" />
        </g>
      ))}

      {/* Sparkling Glow Stars */}
      <g transform="translate(195, 154)">
        <path d="M 0,-12 Q 0,0 12,0 Q 0,0 0,12 Q 0,0 -12,0 Q 0,0 0,-12 Z" fill="#FFF8E7" opacity="0.9" />
      </g>
      <g transform="translate(74, 320)">
        <path d="M 0,-14 Q 0,0 14,0 Q 0,0 0,14 Q 0,0 -14,0 Q 0,0 0,-14 Z" fill="#FFF8E7" opacity="0.95" />
      </g>
    </svg>
  );
};

// 5. Intertwined Gold & Diamond Wedding Bands on Marble (for Bottom Right Accent)
export const IntertwinedWeddingBands: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <linearGradient id="bandGold1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2D6" />
          <stop offset="40%" stopColor="#E6CA85" />
          <stop offset="80%" stopColor="#D6B36A" />
          <stop offset="100%" stopColor="#8C6E2D" />
        </linearGradient>
        <linearGradient id="bandGold2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF4D4" />
          <stop offset="45%" stopColor="#D6B36A" />
          <stop offset="100%" stopColor="#6E521E" />
        </linearGradient>
      </defs>

      {/* Dark Marble Platform with Gold Veins */}
      <ellipse cx="120" cy="85" rx="105" ry="24" fill="#070C16" stroke="#1E2B45" strokeWidth="1" />
      <path d="M 40,85 Q 90,80 140,88 T 200,82" stroke="#D6B36A" strokeWidth="0.8" opacity="0.3" fill="none" />
      <path d="M 60,92 Q 110,88 160,94" stroke="#D6B36A" strokeWidth="0.5" opacity="0.2" fill="none" />

      {/* Ring 1 (Left - Diamond Eternity Band) */}
      <ellipse
        cx="95"
        cy="65"
        rx="38"
        ry="22"
        stroke="url(#bandGold1)"
        strokeWidth="7"
        fill="none"
        transform="rotate(-18 95 65)"
      />
      {/* Pavé Diamonds on Ring 1 */}
      {[
        { cx: 70, cy: 52 },
        { cx: 78, cy: 50 },
        { cx: 86, cy: 49 },
        { cx: 94, cy: 49 },
        { cx: 102, cy: 50 },
        { cx: 110, cy: 52 },
        { cx: 118, cy: 55 },
      ].map((pt, i) => (
        <circle key={i} cx={pt.cx} cy={pt.cy} r="2.2" fill="#FFFFFF" stroke="#DCE8F5" strokeWidth="0.4" />
      ))}

      {/* Ring 2 (Right - Classic Comfort-Fit Band intertwined) */}
      <ellipse
        cx="145"
        cy="70"
        rx="36"
        ry="20"
        stroke="url(#bandGold2)"
        strokeWidth="6.5"
        fill="none"
        transform="rotate(22 145 70)"
      />

      {/* Sparkle Highlights */}
      <g transform="translate(94, 49)">
        <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#FFFFFF" />
      </g>
      <g transform="translate(130, 60) scale(0.6)">
        <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

// 6. Traditional Indian Paisley (Kalka) Gold Filigree Watermark (for Bottom Left Accent)
export const PaisleyGoldWatermark: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 140
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none opacity-20 hover:opacity-30 transition-opacity ${className}`}
    >
      <defs>
        <linearGradient id="paisleyGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF0C7" />
          <stop offset="50%" stopColor="#D6B36A" />
          <stop offset="100%" stopColor="#8C6E2D" />
        </linearGradient>
      </defs>

      {/* Outer Kalka Paisley Outline */}
      <path
        d="M 50,90 C 25,90 10,72 10,50 C 10,28 30,15 48,10 C 66,5 82,16 82,32 C 82,45 72,55 60,55 C 50,55 45,46 48,38 C 50,32 55,28 52,24 C 49,20 40,24 35,32 C 28,42 28,62 38,74 C 44,82 52,82 58,80 C 64,78 72,70 75,60"
        stroke="url(#paisleyGoldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Inner Intricate Floral Jaali */}
      <path
        d="M 32,58 C 30,48 35,38 45,34 C 52,31 58,35 58,40 C 58,45 52,48 46,48 C 42,48 38,52 38,56"
        stroke="url(#paisleyGoldGrad)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle cx="45" cy="62" r="3" stroke="url(#paisleyGoldGrad)" strokeWidth="1" />
      <circle cx="45" cy="62" r="1" fill="url(#paisleyGoldGrad)" />

      {/* Delicate Florets */}
      <circle cx="22" cy="65" r="1.5" fill="url(#paisleyGoldGrad)" />
      <circle cx="26" cy="45" r="1.5" fill="url(#paisleyGoldGrad)" />
      <circle cx="38" cy="28" r="1.5" fill="url(#paisleyGoldGrad)" />
      <circle cx="58" cy="18" r="1.5" fill="url(#paisleyGoldGrad)" />
      <circle cx="74" cy="26" r="1.5" fill="url(#paisleyGoldGrad)" />
    </svg>
  );
};
