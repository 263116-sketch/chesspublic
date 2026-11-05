import React, { useState } from 'react';
import { GameRecord, UserStats } from '../types/chess';
import { clearGameRecords } from '../utils/records';
import { ChessBoard } from './ChessBoard';
import { Trophy, History, X, ChevronLeft, ChevronRight, Trash2, Award, Calendar } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: GameRecord[];
  stats: UserStats;
  onClearRecords: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  records,
  stats,
  onClearRecords,
}) => {
  const [selectedReplayGame, setSelectedReplayGame] = useState<GameRecord | null>(null);
  const [replayStep, setReplayStep] = useState<number>(0);

  if (!isOpen) return null;

  const handleStartReplay = (game: GameRecord) => {
    setSelectedReplayGame(game);
    setReplayStep(game.history.length); // Start at final position
  };

  const currentReplayMove =
    selectedReplayGame && replayStep > 0 ? selectedReplayGame.history[replayStep - 1] : null;

  const currentReplayFen =
    selectedReplayGame && replayStep > 0
      ? selectedReplayGame.history[replayStep - 1].fen
      : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">내 체스 전적 & 기록</h3>
              <p className="text-xs text-slate-400">플레이한 대전 통계 및 지난 경기 복기</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedReplayGame(null);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Replay View if a game is selected */}
          {selectedReplayGame ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setSelectedReplayGame(null)}
                  className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>전적 목록으로 돌아가기</span>
                </button>
                <span className="text-xs text-slate-400">
                  vs {selectedReplayGame.opponentName} ({selectedReplayGame.date})
                </span>
              </div>

              {/* Replay Board */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[340px]">
                  <ChessBoard
                    fen={currentReplayFen}
                    orientation={selectedReplayGame.playerColor}
                    lastMove={currentReplayMove ? { from: currentReplayMove.from, to: currentReplayMove.to } : null}
                    isCheck={false}
                    turn={currentReplayMove ? (currentReplayMove.color === 'w' ? 'b' : 'w') : 'w'}
                    myColor={selectedReplayGame.playerColor}
                    interactive={false}
                    onMove={() => {}}
                  />
                </div>

                {/* Step Navigation Controls */}
                <div className="flex items-center justify-center space-x-3 mt-4">
                  <button
                    onClick={() => setReplayStep(0)}
                    disabled={replayStep === 0}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 disabled:opacity-40"
                  >
                    처음으로
                  </button>
                  <button
                    onClick={() => setReplayStep((s) => Math.max(0, s - 1))}
                    disabled={replayStep === 0}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs font-bold text-slate-300 px-2">
                    {replayStep} / {selectedReplayGame.history.length} 수
                    {currentReplayMove && ` (${currentReplayMove.san})`}
                  </span>
                  <button
                    onClick={() => setReplayStep((s) => Math.min(selectedReplayGame.history.length, s + 1))}
                    disabled={replayStep === selectedReplayGame.history.length}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setReplayStep(selectedReplayGame.history.length)}
                    disabled={replayStep === selectedReplayGame.history.length}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 disabled:opacity-40"
                  >
                    마지막 수
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-amber-400">{stats.totalGames}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">총 경기 수</div>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-400">{stats.wins}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">승리</div>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-rose-400">{stats.losses}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">패배</div>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-amber-300">{stats.winRate}%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">승률</div>
                </div>
              </div>

              {/* Side Breakdown */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between px-2">
                  <span className="text-slate-400">백(White)으로 승리</span>
                  <span className="font-bold text-slate-100">{stats.whiteWins} 회</span>
                </div>
                <div className="flex items-center justify-between px-2 border-l border-slate-800">
                  <span className="text-slate-400">흑(Black)으로 승리</span>
                  <span className="font-bold text-slate-100">{stats.blackWins} 회</span>
                </div>
              </div>

              {/* History Records List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-300 flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>최근 대전 기록 ({records.length}건)</span>
                  </span>
                  {records.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('모든 전적 기록을 초기화하시겠습니까?')) {
                          clearGameRecords();
                          onClearRecords();
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>기록 지우기</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
                  {records.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-slate-500">
                      아직 완료된 경기 기록이 없습니다. 대전을 진행하면 자동으로 기록됩니다!
                    </div>
                  ) : (
                    records.map((rec) => {
                      const isWin = rec.result === 'win';
                      const isLoss = rec.result === 'loss';

                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {/* Result pill */}
                            <span
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 ${
                                isWin
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isLoss
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {isWin ? '승리' : isLoss ? '패배' : '무승부'}
                            </span>

                            <div className="min-w-0">
                              <div className="font-semibold text-slate-200 truncate">
                                vs {rec.opponentName}
                                <span className="text-[11px] font-normal text-slate-400 ml-2">
                                  ({rec.playerColor === 'w' ? '백' : '흑'})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                <span>{rec.date}</span>
                                <span>·</span>
                                <span>{rec.totalMoves}수 진행</span>
                                <span>·</span>
                                <span>{rec.reason}</span>
                              </div>
                            </div>
                          </div>

                          {rec.history && rec.history.length > 0 && (
                            <button
                              onClick={() => handleStartReplay(rec)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold text-xs transition shrink-0 ml-2"
                            >
                              복기
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
