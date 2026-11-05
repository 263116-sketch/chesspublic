import React from 'react';

interface PieceProps {
  color: 'w' | 'b';
  className?: string;
}

export const PawnPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#f8fafc' : '#1e293b';
  const stroke = isWhite ? '#334155' : '#0f172a';
  const highlight = isWhite ? '#ffffff' : '#475569';

  return (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`pawn-grad-${color}`} cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
        <filter id={`pawn-shadow-${color}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity={isWhite ? 0.35 : 0.6} />
        </filter>
      </defs>
      <g filter={`url(#pawn-shadow-${color})`}>
        {/* Sphere head */}
        <path
          d="M 22.5,9 C 19.8,9 17.6,11.2 17.6,13.9 C 17.6,15.6 18.5,17.1 19.8,18 C 17.5,19.3 16,21.7 16,24.5 C 16,26.6 16.9,28.4 18.3,29.7 C 15.5,31.2 13.5,34.3 13.5,38 L 31.5,38 C 31.5,34.3 29.5,31.2 26.7,29.7 C 28.1,28.4 29,26.6 29,24.5 C 29,21.7 27.5,19.3 25.2,18 C 26.5,17.1 27.4,15.6 27.4,13.9 C 27.4,11.2 25.2,9 22.5,9 Z"
          fill={`url(#pawn-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle highlight dot on head */}
        <circle cx="21" cy="12.5" r="1.5" fill={isWhite ? '#ffffff' : '#64748b'} opacity="0.6" />
        {/* Base line */}
        <path d="M 12,38 L 33,38" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 14.5,34 C 18,33 27,33 30.5,34" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </g>
    </svg>
  );
};

export const KnightPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#f8fafc' : '#1e293b';
  const stroke = isWhite ? '#334155' : '#0f172a';
  const highlight = isWhite ? '#ffffff' : '#475569';

  return (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`knight-grad-${color}`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
        <filter id={`knight-shadow-${color}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity={isWhite ? 0.35 : 0.6} />
        </filter>
      </defs>
      <g filter={`url(#knight-shadow-${color})`}>
        {/* Main Staunton Knight Body */}
        <path
          d="M 22,10 C 32.5,11 38.5,18 38,38 L 11,38 C 11,34 13,31 16,30 C 13,29 12,27 11.5,25.5 C 10.5,26 9,25.5 8.5,24 C 8,22 10,21 11.5,21 C 11,18 12.5,15 15,13.5 C 14.5,11.5 16,9.5 18,9 C 19.5,8.5 21,9.2 22,10 Z"
          fill={`url(#knight-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Head and muzzle detail */}
        <path
          d="M 22,10 C 23.5,10.5 24.5,12 24.5,14 C 24.5,17 21,19 17,21 C 14,22.5 13,25 12,28 C 10.5,27.5 9.5,26.5 9.5,24.5 C 9.5,22.5 12.5,17 14,14 C 14,14 15.5,12.5 16,10.5 C 17.5,10 19.5,9.5 22,10 Z"
          fill={`url(#knight-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Eye */}
        <circle cx="16" cy="15" r="1.4" fill={stroke} />
        {/* Nostril */}
        <circle cx="10.8" cy="23.5" r="0.9" fill={stroke} />
        {/* Mane details */}
        <path
          d="M 24,14 C 27,16 30,20 30.5,27"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M 27,19 C 31,22 33,26 33.5,31"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Base */}
        <path d="M 9.5,38 L 39.5,38" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const QueenPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#f8fafc' : '#1e293b';
  const stroke = isWhite ? '#334155' : '#0f172a';
  const highlight = isWhite ? '#ffffff' : '#475569';

  return (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`queen-grad-${color}`} cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
        <filter id={`queen-shadow-${color}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity={isWhite ? 0.35 : 0.6} />
        </filter>
      </defs>
      <g filter={`url(#queen-shadow-${color})`}>
        {/* Crown 5 Jewels (spheres atop the tines) */}
        <circle cx="7" cy="14" r="1.8" fill={`url(#queen-grad-${color})`} stroke={stroke} strokeWidth="1.3" />
        <circle cx="14" cy="10.5" r="1.8" fill={`url(#queen-grad-${color})`} stroke={stroke} strokeWidth="1.3" />
        <circle cx="22.5" cy="8.5" r="2" fill={`url(#queen-grad-${color})`} stroke={stroke} strokeWidth="1.3" />
        <circle cx="31" cy="10.5" r="1.8" fill={`url(#queen-grad-${color})`} stroke={stroke} strokeWidth="1.3" />
        <circle cx="38" cy="14" r="1.8" fill={`url(#queen-grad-${color})`} stroke={stroke} strokeWidth="1.3" />

        {/* Crown Upper Spikes / Tines */}
        <path
          d="M 9,26 L 7,15.5 L 14,23 L 14,12.2 L 20,22 L 22.5,10.2 L 25,22 L 31,12.2 L 31,23 L 38,15.5 L 36,26 Z"
          fill={`url(#queen-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Robe and Waist Lower Body */}
        <path
          d="M 9,26 C 9,28.5 11,29.5 12,31 C 13,32.5 13,33.5 12.5,35 C 11.5,36 11,37 11,38.5 L 34,38.5 C 34,37 33.5,36 32.5,35 C 32,33.5 32,32.5 33,31 C 34,29.5 36,28.5 36,26 Z"
          fill={`url(#queen-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Waist Ribbon & Base Details */}
        <circle cx="22.5" cy="27.5" r="2.2" fill={isWhite ? '#ffffff' : '#475569'} opacity="0.6" />
        <path d="M 12,31.5 C 16,30.5 29,30.5 33,31.5" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 11.5,35 C 16,34 29,34 33.5,35" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M 9,38.5 L 36,38.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const BishopPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#f8fafc' : '#1e293b';
  const stroke = isWhite ? '#334155' : '#0f172a';
  const highlight = isWhite ? '#ffffff' : '#475569';

  return (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`bishop-grad-${color}`} cx="38%" cy="30%" r="60%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
        <filter id={`bishop-shadow-${color}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity={isWhite ? 0.35 : 0.6} />
        </filter>
      </defs>
      <g filter={`url(#bishop-shadow-${color})`}>
        {/* Finial Ball */}
        <circle cx="22.5" cy="8.5" r="2" fill={`url(#bishop-grad-${color})`} stroke={stroke} strokeWidth="1.3" />
        {/* Mitre (Head) */}
        <path
          d="M 16,27 C 14.5,25 14,22 14,18 C 14,13 17.5,9.5 22.5,9.5 C 27.5,9.5 31,13 31,18 C 31,22 30.5,25 29,27 Z"
          fill={`url(#bishop-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Slash in mitre */}
        <path d="M 19,16 L 26,23" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 25,17 L 22.5,19.5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        {/* Lower body */}
        <path
          d="M 16,27 C 14,29 13,32 13,38.5 L 32,38.5 C 32,32 31,29 29,27 Z"
          fill={`url(#bishop-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="27" r="2" fill={stroke} />
        <path d="M 10.5,38.5 L 34.5,38.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const RookPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#f8fafc' : '#1e293b';
  const stroke = isWhite ? '#334155' : '#0f172a';
  const highlight = isWhite ? '#ffffff' : '#475569';

  return (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`rook-grad-${color}`} cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
        <filter id={`rook-shadow-${color}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity={isWhite ? 0.35 : 0.6} />
        </filter>
      </defs>
      <g filter={`url(#rook-shadow-${color})`}>
        {/* Rook Tower with 3 crenels */}
        <path
          d="M 12,38.5 L 33,38.5 L 33,34 L 30,34 L 29,19 L 32,19 L 33,12 L 29,12 L 29,15 L 24.5,15 L 24.5,12 L 20.5,12 L 20.5,15 L 16,15 L 16,12 L 12,12 L 13,19 L 16,19 L 15,34 L 12,34 Z"
          fill={`url(#rook-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Parapet and wall accent grooves */}
        <path d="M 13.5,19 L 31.5,19" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
        <path d="M 15,34 L 30,34" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
        <path d="M 10,38.5 L 35,38.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const KingPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#f8fafc' : '#1e293b';
  const stroke = isWhite ? '#334155' : '#0f172a';
  const highlight = isWhite ? '#ffffff' : '#475569';

  return (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`king-grad-${color}`} cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
        <filter id={`king-shadow-${color}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity={isWhite ? 0.35 : 0.6} />
        </filter>
      </defs>
      <g filter={`url(#king-shadow-${color})`}>
        {/* Crown Cross */}
        <path d="M 22.5,5 L 22.5,11" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 19.5,7.5 L 25.5,7.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />

        {/* Crown Arch Head & Robe Body */}
        <path
          d="M 11.5,38.5 L 33.5,38.5 C 33.5,35 32.5,32 31.5,30 C 33.5,28 34.5,24.5 34.5,20 C 34.5,15.5 32,13 29,12.5 C 27.5,12.2 26,13 24.5,14.5 C 23.5,13.5 22.5,13 22.5,13 C 22.5,13 21.5,13.5 20.5,14.5 C 19,13 17.5,12.2 16,12.5 C 13,13 10.5,15.5 10.5,20 C 10.5,24.5 11.5,28 13.5,30 C 12.5,32 11.5,35 11.5,38.5 Z"
          fill={`url(#king-grad-${color})`}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Jewel and Belt Accents */}
        <circle cx="22.5" cy="21" r="2.5" fill={isWhite ? '#f59e0b' : '#38bdf8'} opacity="0.8" />
        <path d="M 13.5,30 C 18,29 27,29 31.5,30" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <path d="M 12.5,34 C 18,33 27,33 32.5,34" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M 9.5,38.5 L 35.5,38.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const ChessPieceIcon: React.FC<{
  type: string;
  color: 'w' | 'b';
  className?: string;
}> = ({ type, color, className = 'w-full h-full' }) => {
  const t = type.toLowerCase();
  switch (t) {
    case 'p':
      return <PawnPiece color={color} className={className} />;
    case 'n':
      return <KnightPiece color={color} className={className} />;
    case 'b':
      return <BishopPiece color={color} className={className} />;
    case 'r':
      return <RookPiece color={color} className={className} />;
    case 'q':
      return <QueenPiece color={color} className={className} />;
    case 'k':
      return <KingPiece color={color} className={className} />;
    default:
      return null;
  }
};
