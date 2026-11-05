import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPieceIcon, QueenPiece, RookPiece, BishopPiece, KnightPiece } from '../utils/chessPieces';
import { PlayerColor } from '../types/chess';

interface ChessBoardProps {
  fen: string;
  orientation: PlayerColor;
  lastMove: { from: string; to: string } | null;
  isCheck: boolean;
  turn: PlayerColor;
  myColor: PlayerColor | null;
  interactive: boolean;
  theme?: 'wood' | 'emerald' | 'midnight';
  onMove: (from: Square, to: Square, promotion?: string) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  orientation,
  lastMove,
  isCheck,
  turn,
  myColor,
  interactive,
  theme = 'emerald',
  onMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<Square | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

  const chess = new Chess(fen);
  const board = chess.board();

  // Find king position if check
  let checkKingSquare: string | null = null;
  if (isCheck) {
    const currentTurn = chess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === currentTurn) {
          checkKingSquare = p.square;
          break;
        }
      }
    }
  }

  // Calculate legal moves for selected square
  const legalDestinations = selectedSquare
    ? chess
        .moves({ square: selectedSquare, verbose: true })
        .map((m) => m.to as Square)
    : [];

  const canPlay = interactive && (myColor === null || myColor === turn);

  const handleSquareClick = (square: Square) => {
    if (!canPlay) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Check if moving to this square is a legal move
      const moves = chess.moves({ square: selectedSquare, verbose: true });
      const targetMove = moves.find((m) => m.to === square);

      if (targetMove) {
        // Check if pawn promotion
        if (targetMove.promotion) {
          setPromotionPending({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          return;
        }

        onMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }

      // If clicked on another piece of own color, select it instead
      const pieceOnSquare = chess.get(square);
      if (pieceOnSquare && pieceOnSquare.color === turn && (myColor === null || myColor === pieceOnSquare.color)) {
        setSelectedSquare(square);
        return;
      }

      setSelectedSquare(null);
    } else {
      const pieceOnSquare = chess.get(square);
      if (pieceOnSquare && pieceOnSquare.color === turn && (myColor === null || myColor === pieceOnSquare.color)) {
        setSelectedSquare(square);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!canPlay) {
      e.preventDefault();
      return;
    }
    const piece = chess.get(square);
    if (!piece || piece.color !== turn || (myColor !== null && myColor !== piece.color)) {
      e.preventDefault();
      return;
    }

    setDraggedSquare(square);
    setSelectedSquare(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, square: Square) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSquare !== square) {
      setDragOverSquare(square);
    }
  };

  const handleDragLeave = () => {
    setDragOverSquare(null);
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    setDragOverSquare(null);
    const sourceSquare = draggedSquare || (e.dataTransfer.getData('text/plain') as Square);
    setDraggedSquare(null);

    if (!sourceSquare || sourceSquare === targetSquare) return;

    const moves = chess.moves({ square: sourceSquare, verbose: true });
    const targetMove = moves.find((m) => m.to === targetSquare);

    if (targetMove) {
      if (targetMove.promotion) {
        setPromotionPending({ from: sourceSquare, to: targetSquare });
        setSelectedSquare(null);
        return;
      }
      onMove(sourceSquare, targetSquare);
      setSelectedSquare(null);
    }
  };

  const executePromotion = (pieceType: string) => {
    if (promotionPending) {
      onMove(promotionPending.from, promotionPending.to, pieceType);
      setPromotionPending(null);
    }
  };

  // Orientation ordering
  const displayRanks = orientation === 'b' ? [...RANKS].reverse() : RANKS;
  const displayFiles = orientation === 'b' ? [...FILES].reverse() : FILES;

  // Board themes
  const themeStyles = {
    emerald: {
      light: 'bg-[#eaedd0] text-[#779954]',
      dark: 'bg-[#779954] text-[#eaedd0]',
      border: 'border-[#486333]',
      selected: 'bg-[#baca44]/70',
      lastMove: 'bg-[#f7f769]/50',
    },
    wood: {
      light: 'bg-[#eedbc5] text-[#b58863]',
      dark: 'bg-[#b58863] text-[#eedbc5]',
      border: 'border-[#755238]',
      selected: 'bg-[#dbc168]/70',
      lastMove: 'bg-[#ebd389]/55',
    },
    midnight: {
      light: 'bg-[#3b4758] text-[#94a3b8]',
      dark: 'bg-[#1e293b] text-[#64748b]',
      border: 'border-[#0f172a]',
      selected: 'bg-[#38bdf8]/40',
      lastMove: 'bg-[#0284c7]/40',
    },
  }[theme];

  return (
    <div className="relative select-none flex flex-col items-center justify-center">
      {/* Promotion Choice Modal Overlay */}
      {promotionPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs rounded-xl p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col items-center max-w-xs w-full text-center animate-in fade-in zoom-in-95">
            <h4 className="text-amber-400 font-bold text-lg mb-1">폰 승급 (Promotion)</h4>
            <p className="text-slate-300 text-xs mb-4">변신할 체스 기물을 선택해주세요.</p>
            <div className="grid grid-cols-4 gap-3 w-full">
              {[
                { type: 'q', label: '퀸 (Queen)', icon: <QueenPiece color={turn} className="w-10 h-10" /> },
                { type: 'r', label: '룩 (Rook)', icon: <RookPiece color={turn} className="w-10 h-10" /> },
                { type: 'b', label: '비숍 (Bishop)', icon: <BishopPiece color={turn} className="w-10 h-10" /> },
                { type: 'n', label: '나이트 (Knight)', icon: <KnightPiece color={turn} className="w-10 h-10" /> },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => executePromotion(item.type)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 transition transform hover:scale-105 active:scale-95"
                >
                  {item.icon}
                  <span className="text-[11px] font-semibold text-slate-200 mt-1">{item.type.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPromotionPending(null)}
              className="mt-4 text-xs text-slate-400 hover:text-slate-200 underline"
            >
              취소하기
            </button>
          </div>
        </div>
      )}

      {/* Main Board Frame */}
      <div
        className={`w-full max-w-[540px] aspect-square rounded-2xl shadow-2xl overflow-hidden border-4 ${themeStyles.border} bg-slate-950 p-1.5`}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden relative">
          {displayRanks.map((rank, rankIdx) =>
            displayFiles.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const isDark = (fileIdx + rankIdx) % 2 === 1;
              const piece = chess.get(square);
              const isSelected = selectedSquare === square;
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isTargetSquare = legalDestinations.includes(square);
              const isDragOver = dragOverSquare === square;
              const isKingInCheck = checkKingSquare === square;

              const showFileCoord = rankIdx === 7;
              const showRankCoord = fileIdx === 0;

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={(e) => handleDragOver(e, square)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, square)}
                  className={`relative flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                    isDark ? themeStyles.dark : themeStyles.light
                  } ${isSelected ? themeStyles.selected : ''} ${isLastMove && !isSelected ? themeStyles.lastMove : ''} ${
                    isDragOver ? 'ring-4 ring-amber-400/80 inset-0 z-10' : ''
                  }`}
                >
                  {/* Coordinates */}
                  {showRankCoord && (
                    <span className="absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none opacity-70">
                      {rank}
                    </span>
                  )}
                  {showFileCoord && (
                    <span className="absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none opacity-70">
                      {file}
                    </span>
                  )}

                  {/* King Check Red Pulse Glow */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 bg-red-600/50 animate-pulse rounded-sm pointer-events-none z-10" />
                  )}

                  {/* Piece */}
                  {piece && (
                    <div
                      draggable={canPlay && piece.color === turn && (myColor === null || myColor === piece.color)}
                      onDragStart={(e) => handleDragStart(e, square)}
                      className={`w-[85%] h-[85%] flex items-center justify-center z-20 transition-transform ${
                        canPlay && piece.color === turn && (myColor === null || myColor === piece.color)
                          ? 'cursor-grab active:cursor-grabbing hover:scale-105'
                          : 'cursor-default'
                      } ${isSelected ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''}`}
                    >
                      <ChessPieceIcon type={piece.type} color={piece.color} />
                    </div>
                  )}

                  {/* Legal Move Indicators */}
                  {isTargetSquare && (
                    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                      {piece ? (
                        // Capturable enemy piece: outer ring
                        <div className="w-[84%] h-[84%] rounded-full border-4 border-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                      ) : (
                        // Empty square: central dot
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-900/40 shadow-xs ring-2 ring-white/50" />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
