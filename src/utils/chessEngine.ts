import { Chess, Square } from 'chess.js';

// Piece values
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional bonuses (pawn structure, center control)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let totalEvaluation = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let value = PIECE_VALUES[piece.type] || 0;
        const squareIdx = r * 8 + c;

        if (piece.type === 'p') {
          value += (piece.color === 'w' ? PAWN_TABLE[squareIdx] : PAWN_TABLE[63 - squareIdx]);
        } else if (piece.type === 'n') {
          value += (piece.color === 'w' ? KNIGHT_TABLE[squareIdx] : KNIGHT_TABLE[63 - squareIdx]);
        }

        totalEvaluation += piece.color === 'w' ? value : -value;
      }
    }
  }

  return totalEvaluation;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(
  fen: string,
  difficulty: 'easy' | 'medium' | 'hard'
): { from: Square; to: Square; promotion?: string } | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    // 70% random, 30% best capture
    const captureMoves = moves.filter((m) => m.captured);
    if (captureMoves.length > 0 && Math.random() < 0.5) {
      const choice = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      return { from: choice.from, to: choice.to, promotion: choice.promotion };
    }
    const choice = moves[Math.floor(Math.random() * moves.length)];
    return { from: choice.from, to: choice.to, promotion: choice.promotion };
  }

  const depth = difficulty === 'medium' ? 2 : 3;
  const isWhite = chess.turn() === 'w';
  let bestMove = moves[0];
  let bestValue = isWhite ? -Infinity : Infinity;

  // Shuffle moves slightly to avoid deterministic repetitive openings
  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  for (const move of shuffled) {
    chess.move(move);
    const value = minimax(chess, depth - 1, -Infinity, Infinity, !isWhite);
    chess.undo();

    if (isWhite) {
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    } else {
      if (value < bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
  }

  return { from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion || 'q' };
}
