import React, { useState, useEffect } from 'react';
import { LogIn, KeyRound, X, RefreshCw, Users, Clock, Swords } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (code: string, playerName: string) => void;
  defaultPlayerName: string;
}

interface PublicRoom {
  code: string;
  title: string;
  gameMode: string;
  timeControlMinutes: number;
  creator: string;
  hasOpponent: boolean;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  defaultPlayerName,
}) => {
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPublicRooms();
    }
  }, [isOpen]);

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoadingRooms(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    onJoinRoom(cleanCode, playerName.trim() || defaultPlayerName);
  };

  const handleJoinDirect = (targetCode: string) => {
    onJoinRoom(targetCode, playerName.trim() || defaultPlayerName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">파티 코드로 참가하기</h3>
              <p className="text-xs text-slate-400">공유받은 6자리 코드를 입력하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Player Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">내 닉네임</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">6자리 파티 코드</label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: CH789A"
                maxLength={8}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold tracking-widest text-amber-400 uppercase placeholder-slate-600 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition transform active:scale-98 disabled:opacity-40 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>방 입장하기</span>
          </button>
        </form>

        {/* Public Rooms List */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>현재 대기 중인 오픈 방</span>
            </span>
            <button
              onClick={fetchPublicRooms}
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center space-x-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loadingRooms ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 text-xs">
            {publicRooms.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
                현재 대기 중인 공개 방이 없습니다. 새 방을 개설해보세요!
              </div>
            ) : (
              publicRooms.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-200 truncate">{r.title}</div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-amber-400 font-bold">{r.code}</span>
                      <span>·</span>
                      <span>방장: {r.creator}</span>
                      <span>·</span>
                      <span className="flex items-center space-x-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{r.timeControlMinutes > 0 ? `${r.timeControlMinutes}분` : '무제한'}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinDirect(r.code)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-semibold rounded-lg text-xs transition shrink-0"
                  >
                    입장
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
