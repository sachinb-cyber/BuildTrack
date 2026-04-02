'use client';

export default function Logo({ size = 40, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* SVG Logo Mark */}
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1"/>
            <stop offset="100%" stopColor="#A855F7"/>
          </linearGradient>
          <linearGradient id="logoGrad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8"/>
            <stop offset="100%" stopColor="#C084FC"/>
          </linearGradient>
        </defs>
        {/* Background rounded square */}
        <rect width="40" height="40" rx="10" fill="url(#logoGrad1)"/>
        {/* Building / construction icon */}
        {/* Base platform */}
        <rect x="6" y="30" width="28" height="3" rx="1.5" fill="white" opacity="0.9"/>
        {/* Left tower */}
        <rect x="8" y="16" width="8" height="14" rx="1" fill="white" opacity="0.95"/>
        {/* Right tower */}
        <rect x="24" y="20" width="8" height="10" rx="1" fill="white" opacity="0.75"/>
        {/* Center tall tower */}
        <rect x="16" y="10" width="8" height="20" rx="1" fill="white"/>
        {/* Windows left tower */}
        <rect x="10" y="19" width="2" height="2" rx="0.5" fill="url(#logoGrad1)" opacity="0.8"/>
        <rect x="13" y="19" width="2" height="2" rx="0.5" fill="url(#logoGrad1)" opacity="0.8"/>
        <rect x="10" y="23" width="2" height="2" rx="0.5" fill="url(#logoGrad1)" opacity="0.8"/>
        <rect x="13" y="23" width="2" height="2" rx="0.5" fill="url(#logoGrad1)" opacity="0.8"/>
        {/* Windows center */}
        <rect x="18" y="13" width="2" height="2" rx="0.5" fill="url(#logoGrad1)" opacity="0.8"/>
        <rect x="18" y="17" width="2" height="2" rx="0.5" fill="url(#logoGrad1)" opacity="0.8"/>
        <rect x="18" y="21" width="2" height="2" rx="0.5" fill="url(#logoGrad1)" opacity="0.8"/>
        {/* Crane arm */}
        <line x1="20" y1="10" x2="20" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <line x1="14" y1="6" x2="28" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <line x1="26" y1="6" x2="26" y2="10" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" strokeDasharray="1 1"/>
      </svg>

      {showText && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2 }}>
            Samarth
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            Developers
          </div>
        </div>
      )}
    </div>
  );
}
