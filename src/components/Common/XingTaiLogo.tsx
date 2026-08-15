/**
 * ============================================================================
 * [MODULE: BRAND IDENTITY & VECTOR LOGO]
 * File: /src/components/Common/XingTaiLogo.tsx
 * Description: High-precision SVG Vector Brandmark of Xing Tai Trading (Thailand) Co., Ltd.
 *              featuring the signature navy ladder arch, rope spiral, and central crimson orb.
 * 
 * [คุณสมบัติ]:
 * - รองรับหลายขนาด (sm, md, lg, xl)
 * - เลือกรุปแบบ (full พร้อมชื่อบริษัท 3 ภาษา, icon เดี่ยว, badge)
 * - ปรับโทนสีข้อความ (light สำหรับ Dark mode, dark สำหรับ A4 Print)
 * ============================================================================
 */

import React from 'react';

interface XingTaiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showText?: boolean;
  textColor?: 'dark' | 'light' | 'white';
  variant?: 'full' | 'icon' | 'badge';
  customHeight?: number;
}

export const XingTaiLogo: React.FC<XingTaiLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'light',
  variant = 'full',
}) => {
  // Dimensions based on size
  const iconDimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 44, height: 44 },
    lg: { width: 64, height: 64 },
    xl: { width: 90, height: 90 },
    custom: { width: 48, height: 48 },
  }[size];

  const primaryNavy = '#252B6A';
  const accentRed = '#D32F2F';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* SVG Icon of the Xing Tai Logo (Stylized A ladder with rope spiral & red central orb) */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-sm select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background subtle glow / container if badge variant */}
          {variant === 'badge' && (
            <rect width="120" height="120" rx="24" fill="white" />
          )}

          {/* Spiral Rope Swirl Effect behind and around the A */}
          <g stroke="#1F2438" strokeWidth="3" strokeDasharray="5 3" strokeLinecap="round">
            {/* Left curved spiral arc */}
            <path d="M 28 85 C 10 70, 15 45, 38 35 C 55 27, 75 22, 90 28 C 108 35, 108 60, 92 78" />
            <path d="M 32 82 C 16 68, 20 48, 40 38" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M 88 32 C 102 40, 102 58, 90 74" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>

          {/* Stylized "A" Ladder - Navy Blue Ribbed Horizontal Bars */}
          <g fill={primaryNavy}>
            {/* Top apex */}
            <path d="M 52 18 L 68 18 L 71 25 L 49 25 Z" rx="1.5" />
            {/* Tier 2 */}
            <path d="M 47 28 L 73 28 L 76 34 L 44 34 Z" rx="1.5" />
            {/* Tier 3 */}
            <path d="M 43 37 L 77 37 L 80 43 L 40 43 Z" rx="1.5" />
            {/* Tier 4 */}
            <path d="M 39 46 L 81 46 L 84 52 L 36 52 Z" rx="1.5" />
            {/* Tier 5 */}
            <path d="M 35 55 L 85 55 L 88 61 L 32 61 Z" rx="1.5" />
            {/* Tier 6 (Split for center orb) */}
            <path d="M 31 64 L 46 64 L 45 70 L 28 70 Z" rx="1.5" />
            <path d="M 74 64 L 89 64 L 92 70 L 75 70 Z" rx="1.5" />
            {/* Tier 7 (Split) */}
            <path d="M 27 73 L 44 73 L 43 79 L 24 79 Z" rx="1.5" />
            <path d="M 76 73 L 93 73 L 96 79 L 77 79 Z" rx="1.5" />
            {/* Tier 8 Bottom base legs */}
            <path d="M 23 82 L 41 82 L 39 88 L 20 88 Z" rx="1.5" />
            <path d="M 79 82 L 97 82 L 100 88 L 81 88 Z" rx="1.5" />
          </g>

          {/* Central Red Circular Orb / Core Sphere */}
          <circle cx="60" cy="70" r="10" fill={accentRed} />
          {/* Subtle 3D highlight on sphere */}
          <circle cx="57" cy="67" r="3.5" fill="#FFA4A4" opacity="0.8" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col select-none">
          {/* Chinese Characters: 兴泰贸易 */}
          <div
            className={`font-serif tracking-widest font-black ${
              size === 'sm'
                ? 'text-sm leading-tight'
                : size === 'lg' || size === 'xl'
                ? 'text-2xl leading-tight'
                : 'text-base leading-tight'
            }`}
            style={{
              color: textColor === 'dark' ? primaryNavy : textColor === 'white' ? '#FFFFFF' : '#60A5FA',
              letterSpacing: '0.18em',
            }}
          >
            兴泰贸易
          </div>

          {/* English Brand Text: XING TAI TRADING */}
          <div
            className={`font-sans uppercase font-extrabold tracking-wider ${
              size === 'sm'
                ? 'text-[8.5px] leading-tight'
                : size === 'lg' || size === 'xl'
                ? 'text-xs tracking-widest leading-tight'
                : 'text-[9.5px] leading-tight'
            }`}
            style={{
              color: accentRed,
              letterSpacing: '0.12em',
            }}
          >
            XING TAI TRADING
          </div>
        </div>
      )}
    </div>
  );
};
