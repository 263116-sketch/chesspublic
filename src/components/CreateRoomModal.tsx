import React, { useState } from 'react';
import { GameMode, FirstAttackerChoice } from '../types/chess';
import { Swords, Shuffle, Clock, X, ChevronRight, Sparkles } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (options: {
    title: string;
    gameMode: GameMode;
    firstAttackerChoice: FirstAttackerChoice;
    timeControlMinutes: number;
    creatorName: string;
  }) => void;
  defaultPlayerName: string;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  defaultPlayerName,
}) => {
  const [title, setTitle] = useState(`${defaultPlayerName}의 친선전`);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [firstAttackerChoice, setFirstAttackerChoice] = useState<FirstAttackerChoice>('creator');
  const [timeControlMinutes, setTimeControlMinutes] = useState<number>(10);
  const [creatorName, setCreatorName] = useState(defaultPlayerName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      title: title.trim() || `${creatorName}의 체스 방`,
      gameMode,
      firstAttackerChoice,
      timeControlMinutes,
      creatorName: creatorName.trim() || defaultPlayerName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">새 게임 방 만들기</h3>
              <p className="text-xs text-slate-400">파티 코드를 생성해 상대방을 초대하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {/* Creator Nickname */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">내 닉네임</label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              maxLength={20}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Game Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              게임 모드 선택 <span className="text-amber-400 font-normal">(핵심 룰)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Classic */}
              <div
                onClick={() => setGameMode('classic')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  gameMode === 'classic'
                    ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 text-amber-400 mb-1">
                  <Shuffle className="w-4 h-4" />
                  <span className="font-bold text-sm">클래식 모드</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  게임 시작 시 흑과 백이 <span className="text-slate-200 font-semibold">50% 확률로 무작위 배정</span>됩니다.
                </p>
              </div>

              {/* Option 2: First Attacker Choice */}
              <div
                onClick={() => setGameMode('first_attacker')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  gameMode === 'first_attacker'
                    ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 text-amber-400 mb-1">
                  <Swords className="w-4 h-4" />
                  <span className="font-bold text-sm">선공 선택 모드</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  먼저 공격을 시작하는 <span className="text-amber-300 font-semibold">선공(백)</span>을 직접 지정하여 시작합니다.
                </p>
              </div>
            </div>
          </div>

          {/* First Attacker Details (If first_attacker mode) */}
          {gameMode === 'first_attacker' && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2 animate-in fade-in">
              <label className="block text-xs font-semibold text-amber-300">
                누가 먼저 공격(선공/백)할까요?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'creator', label: '내가 선공(백)', desc: '방장 선공' },
                  { id: 'joiner', label: '상대방 선공(백)', desc: '게스트 선공' },
                  { id: 'lobby_select', label: '로비에서 결정', desc: '자리 교환 가능' },
                ].map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setFirstAttackerChoice(choice.id as FirstAttackerChoice)}
                    className={`py-2 px-2.5 rounded-xl text-center border transition ${
                      firstAttackerChoice === choice.id
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs">{choice.label}</div>
                    <div className="text-[10px] opacity-75">{choice.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Controls */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>제한 시간 설정</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { min: 3, label: '3분 (블리츠)' },
                { min: 5, label: '5분 (속기)' },
                { min: 10, label: '10분 (표준)' },
                { min: 0, label: '무제한' },
              ].map((opt) => (
                <button
                  key={opt.min}
                  type="button"
                  onClick={() => setTimeControlMinutes(opt.min)}
                  className={`py-2 px-2 rounded-xl text-center border transition text-xs ${
                    timeControlMinutes === opt.min
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition transform active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>파티 코드 생성 및 방 개설하기</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};
