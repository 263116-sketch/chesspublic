import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerColor } from '../types/chess';
import { Trophy, Award, Frown, RotateCcw, Home, Eye } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: PlayerColor | 'draw' | null;
  winReason: string | null;
  myColor: PlayerColor | null;
  onRematch?: () => void;
  onReturnToLobby: () => void;
  onReviewBoard: () => void;
  rematchRequestedByMe?: boolean;
  rematchRequestedByOpponent?: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  winReason,
  myColor,
  onRematch,
  onReturnToLobby,
  onReviewBoard,
  rematchRequestedByMe,
  rematchRequestedByOpponent,
}) => {
  const isDraw = winner === 'draw';
  const isWinner = myColor !== null && winner === myColor;
  const isLoser = myColor !== null && winner !== null && !isDraw && !isWinner;

  useEffect(() => {
    if (isOpen && isWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#3b82f6'],
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  let title = '게임 종료';
  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  let icon = <Trophy className="w-10 h-10 text-amber-400" />;

  if (isWinner) {
    title = '승리하였습니다! 🎉';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (isLoser) {
    title = '패배하였습니다';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    icon = <Frown className="w-10 h-10 text-rose-400" />;
  } else if (isDraw) {
    title = '무승부입니다 🤝';
    badgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
    icon = <Award className="w-10 h-10 text-slate-300" />;
  }

  const getReasonText = (reason: string | null) => {
    if (!reason) return '';
    switch (reason) {
      case 'checkmate':
        return '체크메이트에 의한 승리';
      case 'timeout':
        return '상대방 시간 초과로 인한 승리';
      case 'resignation':
        return '상대방 기권에 의한 승리';
      case 'agreement':
        return '상호 합의에 의한 무승부';
      case 'stalemate':
        return '스테일메이트 (더 이상 둘 수 있는 합법적인 수가 없음)';
      default:
        return reason;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
          {icon}
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-1">{title}</h3>
        <p className="text-xs text-slate-400 mb-3">{getReasonText(winReason)}</p>

        {/* Rematch status notification */}
        {rematchRequestedByOpponent && !rematchRequestedByMe && (
          <div className="mb-4 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
            상대방이 리매치(재대결)를 신청했습니다!
          </div>
        )}

        <div className="space-y-2 mt-4">
          {onRematch && (
            <button
              onClick={onRematch}
              disabled={rematchRequestedByMe}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {rematchRequestedByMe
                  ? '상대방의 리매치 수락 대기 중...'
                  : rematchRequestedByOpponent
                  ? '리매치 수락하고 다시 하기'
                  : '리매치 (재대결) 신청'}
              </span>
            </button>
          )}

          <button
            onClick={onReviewBoard}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition border border-slate-700"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>판 둘러보기 (복기)</span>
          </button>

          <button
            onClick={onReturnToLobby}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center space-x-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>로비로 돌아가기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
