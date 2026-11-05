import React from 'react';
import { RoomPlayer, PlayerColor } from '../types/chess';
import { ChessPieceIcon } from '../utils/chessPieces';
import { Clock, Shield, Award } from 'lucide-react';

interface GameInfoProps {
  player: RoomPlayer | null;
  color: PlayerColor;
  isTurn: boolean;
  isMe: boolean;
  capturedPieces: string[];
  materialAdvantage: number;
}

export const GamePlayerCard: React.FC<GameInfoProps> = ({
  player,
  color,
  isTurn,
  isMe,
  capturedPieces,
  materialAdvantage,
}) => {
  const isWhite = color === 'w';

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLowTime = player && player.timeLeft > 0 && player.timeLeft < 30000;

  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
        isTurn
          ? 'bg-slate-800/90 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
          : 'bg-slate-900/70 border-slate-800'
      }`}
    >
      {/* Player Identity & Pieces */}
      <div className="flex items-center space-x-3 overflow-hidden">
        {/* Color badge */}
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner shrink-0 ${
            isWhite
              ? 'bg-slate-100 text-slate-900 border border-slate-300'
              : 'bg-slate-950 text-slate-100 border border-slate-700'
          }`}
          title={isWhite ? '백 (White)' : '흑 (Black)'}
        >
          {isWhite ? 'W' : 'B'}
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-slate-100 truncate max-w-[120px] sm:max-w-[160px]">
              {player ? player.name : '대기 중...'}
            </span>
            {isMe && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/30">
                나
              </span>
            )}
            {player && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  player.isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'
                }`}
                title={player.isConnected ? '접속 중' : '연결 끊김'}
              />
            )}
          </div>

          {/* Captured Pieces Display */}
          <div className="flex items-center space-x-1 mt-0.5 h-4">
            {capturedPieces.map((p, i) => (
              <div key={i} className="w-3.5 h-3.5 shrink-0 opacity-80">
                <ChessPieceIcon type={p} color={isWhite ? 'b' : 'w'} />
              </div>
            ))}
            {materialAdvantage > 0 && (
              <span className="text-[11px] font-bold text-amber-400 ml-1">+{materialAdvantage}</span>
            )}
          </div>
        </div>
      </div>

      {/* Timer Clock */}
      <div className="flex items-center space-x-2 shrink-0">
        {isTurn && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono text-sm font-bold tracking-wider ${
            isLowTime
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500 animate-pulse'
              : isTurn
              ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5 opacity-70" />
          <span>{player ? formatTime(player.timeLeft) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
};
