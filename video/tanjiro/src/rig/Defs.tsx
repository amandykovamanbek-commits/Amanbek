import React from "react";

// Shared SVG defs: fabric patterns and gradients used by characters and scenes.
export const Defs: React.FC = () => (
  <defs>
    {/* Tanjiro haori: green / black checks */}
    <pattern id="p_check" width="34" height="34" patternUnits="userSpaceOnUse">
      <rect width="34" height="34" fill="#15181b" />
      <rect width="17" height="17" fill="#2f9a62" />
      <rect x="17" y="17" width="17" height="17" fill="#2f9a62" />
      <rect width="17" height="3" fill="#6fd59a" opacity=".4" />
      <rect x="17" y="17" width="17" height="3" fill="#6fd59a" opacity=".4" />
    </pattern>
    {/* Zenitsu haori: yellow with white triangles */}
    <pattern id="p_tri" width="46" height="46" patternUnits="userSpaceOnUse">
      <rect width="46" height="46" fill="#f4b41a" />
      <path d="M8 30 L18 12 L28 30 Z" fill="#fffaf0" />
      <path d="M30 44 L38 32 L44 44 Z" fill="#fffaf0" opacity=".9" />
    </pattern>
    {/* Giyu: left half wine red, right half tortoise-shell */}
    <pattern id="p_kikko" width="40" height="46" patternUnits="userSpaceOnUse">
      <rect width="40" height="46" fill="#3f7a52" />
      <path d="M0 0 L20 0 L20 23 L0 23 Z" fill="#d9a441" />
      <path d="M20 23 L40 23 L40 46 L20 46 Z" fill="#d9a441" />
      <path d="M0 23 L20 0 M20 46 L40 23" stroke="#1b2a22" strokeWidth="2.5" />
      <path d="M0 0 H40 M0 23 H40 M20 0 V46" stroke="#1b2a22" strokeWidth="2" />
    </pattern>
    <pattern id="p_wine" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="#7e2230" />
      <path d="M0 40 L40 0" stroke="#962c3c" strokeWidth="3" opacity=".35" />
    </pattern>
    {/* Nezuko kimono: pink hemp-leaf lines */}
    <pattern id="p_asa" width="36" height="36" patternUnits="userSpaceOnUse">
      <rect width="36" height="36" fill="#f3a7bd" />
      <path d="M18 0 L18 36 M0 18 L36 18 M0 0 L36 36 M36 0 L0 36" stroke="#d9789a" strokeWidth="1.6" opacity=".8" />
    </pattern>
    {/* red/white checker obi */}
    <pattern id="p_obi" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#fff3ee" />
      <rect width="10" height="10" fill="#d23a54" />
      <rect x="10" y="10" width="10" height="10" fill="#d23a54" />
    </pattern>
    {/* Training kimono: blue with white clouds */}
    <pattern id="p_cloud" width="120" height="110" patternUnits="userSpaceOnUse">
      <rect width="120" height="110" fill="#3e9ccb" />
      <path d="M14 40 q8 -16 22 -8 q8 -14 22 -2 q14 -2 12 12 q8 10 -4 14 h-48 q-12 -6 -4 -16z" fill="#f4fbff" />
      <path d="M70 92 q6 -12 16 -6 q8 -10 18 0 q10 0 8 10 h-38 q-8 -2 -4 -4z" fill="#f4fbff" />
      <path d="M0 20 Q30 26 60 18 T120 20" stroke="#2f7fae" strokeWidth="1.5" fill="none" opacity=".6" />
    </pattern>
    {/* Rengoku haori: white with flame hem */}
    <linearGradient id="g_flamehem" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff8ec" />
      <stop offset=".55" stopColor="#fff8ec" />
      <stop offset=".72" stopColor="#f6b326" />
      <stop offset="1" stopColor="#e2401f" />
    </linearGradient>
    {/* Shinobu / Kanao: butterfly-wing gradient */}
    <linearGradient id="g_butterfly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f8f3ff" />
      <stop offset=".5" stopColor="#c7a6ec" />
      <stop offset=".8" stopColor="#4fb2a8" />
      <stop offset="1" stopColor="#1d2a3a" />
    </linearGradient>
    {/* Urokodaki: blue with clouds, Sabito: hexagon */}
    <pattern id="p_hexa" width="34" height="30" patternUnits="userSpaceOnUse">
      <rect width="34" height="30" fill="#e2dccb" />
      <path d="M8 0 L26 0 L34 15 L26 30 L8 30 L0 15 Z" fill="none" stroke="#7a8f6a" strokeWidth="2" />
    </pattern>
    <pattern id="p_flower" width="60" height="60" patternUnits="userSpaceOnUse">
      <rect width="60" height="60" fill="#8fc3d9" />
      <circle cx="15" cy="15" r="6" fill="#f6f0f8" /><circle cx="45" cy="42" r="7" fill="#f6f0f8" />
      <circle cx="15" cy="15" r="2.4" fill="#e7a2b8" /><circle cx="45" cy="42" r="2.8" fill="#e7a2b8" />
    </pattern>
    <pattern id="p_snakes" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="#2a2d3a" />
      <path d="M0 25 q12 -14 25 0 t25 0" stroke="#4a4f66" strokeWidth="4" fill="none" />
    </pattern>
    <radialGradient id="g_glowW" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#fff" stopOpacity=".9" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g_glowO" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#ffd27a" stopOpacity=".95" />
      <stop offset=".4" stopColor="#ff7a1a" stopOpacity=".5" />
      <stop offset="1" stopColor="#ff3d00" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g_glowP" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#ffd1ea" stopOpacity=".95" />
      <stop offset=".45" stopColor="#ff3d9a" stopOpacity=".55" />
      <stop offset="1" stopColor="#c2006b" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g_glowB" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#e6fbff" stopOpacity=".95" />
      <stop offset=".45" stopColor="#3cc6ff" stopOpacity=".5" />
      <stop offset="1" stopColor="#0060c0" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g_glowR" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#ff6a6a" stopOpacity=".95" />
      <stop offset=".45" stopColor="#d1001f" stopOpacity=".5" />
      <stop offset="1" stopColor="#5a0010" stopOpacity="0" />
    </radialGradient>
    <filter id="f_dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5" /></filter>
    <filter id="f_blur4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
    <filter id="f_blur10" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" /></filter>
    <filter id="f_blur24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24" /></filter>
    <filter id="f_ink" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" />
      <feDisplacementMap in="SourceGraphic" scale="14" />
    </filter>
  </defs>
);
