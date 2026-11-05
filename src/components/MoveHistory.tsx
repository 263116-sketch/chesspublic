import React, { useRef, useEffect } from 'react';
import { MoveRecord, PlayerColor } from '../types/chess';
import { RotateCcw, Volume2, VolumeX, Flag, Handshake, Copy, Check } from 'lucide-react';

interface MoveHistoryProps {
  history: MoveRecord[];
  isMuted: boolean;
  onToggleMute: () => void;
  onFlipBoard: () => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  canControlGame?: boolean;
  drawOfferedBy?: PlayerColor | null;
  myColor?: PlayerColor | null;
  onRespondDraw?: (accept: boolean) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  isMuted,
  onToggleMute,
  onFlipBoard,
  onResign,
  onOfferDraw,
  canControlGame = false,
  drawOfferedBy,
  myColor,
  onRespondDraw,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [history]);

  // Group moves into pairs [White, Black]
  const movePairs: Array<{ number: number; white: MoveRecord; black?: MoveRecord }> = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  const handleCopyPGN = () => {
    const pgnText = movePairs
      .map((p) => `${p.number}. ${p.white.san} ${p.black ? p.black.san : ''}`)
      .join(' ');
    navigator.clipboard.writeText(pgnText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDrawOfferedToMe = drawOfferedBy && myColor && drawOfferedBy !== myColor;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header with Quick Actions */}
      <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-xs text-slate-200">기보 (Moves)</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleMute}
            title={isMuted ? '음소거 해제' : '음소거'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onFlipBoard}
            title="체스판 회전"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopyPGN}
            disabled={history.length === 0}
            title="PGN 기보 복사"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Draw Offer Banner if opponent offered draw */}
      {isDrawOfferedToMe && onRespondDraw && (
        <div className="p-2.5 bg-amber-950/80 border-b border-amber-500/40 flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <span className="text-amber-300 font-semibold">상대방이 무승부를 제안했습니다!</span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onRespondDraw(true)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px]"
            >
              수락
            </button>
            <button
              onClick={() => onRespondDraw(false)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]"
            >
              거절
            </button>
          </div>
        </div>
      )}

      {/* Move Log Table */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 min-h-[140px] max-h-[220px] font-mono text-xs">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 py-6 text-center text-xs">
            게임이 시작되면 이동 기록이 표시됩니다.
          </div>
        ) : (
          <div className="space-y-1">
            {movePairs.map((pair) => (
              <div
                key={pair.number}
                className="grid grid-cols-7 py-1 px-2 rounded-md hover:bg-slate-800/60 transition items-center text-slate-300"
              >
                <span className="col-span-1 text-slate-500 text-[11px] font-semibold">{pair.number}.</span>
                <span className="col-span-3 font-medium text-slate-100 bg-slate-800/40 px-1.5 py-0.5 rounded-sm">
                  {pair.white.san}
                </span>
                <span className="col-span-3 font-medium text-slate-300 px-1.5 py-0.5">
                  {pair.black ? pair.black.san : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-game Match Actions (Resign, Draw) */}
      {canControlGame && (
        <div className="p-2 bg-slate-950/90 border-t border-slate-800 grid grid-cols-2 gap-2">
          {onOfferDraw && (
            <button
              onClick={onOfferDraw}
              disabled={!!drawOfferedBy}
              className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-40"
            >
              <Handshake className="w-3.5 h-3.5 text-amber-400" />
              <span>무승부 제안</span>
            </button>
          )}
          {onResign && (
            <button
              onClick={() => {
                if (window.confirm('정말 기권하시겠습니까?')) {
                  onResign();
                }
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/50 transition"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>기권하기</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
