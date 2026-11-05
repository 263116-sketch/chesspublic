import React, { useState, useEffect } from 'react';
import { AdminOverview } from '../types/chess';
import {
  ShieldAlert,
  Users,
  Ban,
  Clock,
  VolumeX,
  DoorOpen,
  Megaphone,
  Radio,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminAuthenticated: boolean;
  isCodeInitialized: boolean;
  onAuthenticate: (passCode: string) => void;
  onSetupCode: (newPassCode: string) => void;
  onChangeCode: (oldPassCode: string, newPassCode: string) => void;
  overview: AdminOverview | null;
  onRefreshOverview: () => void;
  onTimeoutUser: (targetPlayerId: string, durationMinutes: number, reason: string) => void;
  onBanUser: (targetPlayerId: string, reason: string) => void;
  onUnbanUser: (targetId: string) => void;
  onKickUser: (targetPlayerId: string, reason: string) => void;
  onCloseRoom: (roomCode: string) => void;
  onBroadcastAnnouncement: (message: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  isAdminAuthenticated,
  isCodeInitialized,
  onAuthenticate,
  onSetupCode,
  onChangeCode,
  overview,
  onRefreshOverview,
  onTimeoutUser,
  onBanUser,
  onUnbanUser,
  onKickUser,
  onCloseRoom,
  onBroadcastAnnouncement,
}) => {
  // Auth inputs
  const [passCodeInput, setPassCodeInput] = useState('');
  const [setupCodeInput, setSetupCodeInput] = useState('');
  const [setupConfirmInput, setSetupConfirmInput] = useState('');

  // Change code inputs
  const [currentCodeInput, setCurrentCodeInput] = useState('');
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newCodeConfirmInput, setNewCodeConfirmInput] = useState('');
  const [codeChangeSuccess, setCodeChangeSuccess] = useState(false);

  // Visibility toggles
  const [showPassCode, setShowPassCode] = useState(false);
  const [showSetupCode, setShowSetupCode] = useState(false);
  const [showSetupConfirm, setShowSetupConfirm] = useState(false);
  const [showCurrentCode, setShowCurrentCode] = useState(false);
  const [showNewCode, setShowNewCode] = useState(false);
  const [showNewCodeConfirm, setShowNewCodeConfirm] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'banned' | 'rooms' | 'broadcast' | 'security'>('users');

  // Action dialog states
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(10);
  const [actionReason, setActionReason] = useState<string>('비매너 채팅 및 규정 위반');
  const [actionType, setActionType] = useState<'timeout' | 'ban' | 'kick' | null>(null);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassCodeInput('');
      setSetupCodeInput('');
      setSetupConfirmInput('');
      setCurrentCodeInput('');
      setNewCodeInput('');
      setNewCodeConfirmInput('');
      setCodeChangeSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passCodeInput.trim()) return;
    onAuthenticate(passCodeInput.trim());
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupCodeInput.trim()) return;
    if (setupCodeInput.trim().length < 4) {
      alert('특수 코드는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (setupCodeInput.trim() !== setupConfirmInput.trim()) {
      alert('입력한 두 특수 코드가 일치하지 않습니다.');
      return;
    }
    onSetupCode(setupCodeInput.trim());
  };

  const handleChangeCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCodeInput.trim() || !newCodeInput.trim()) return;
    if (newCodeInput.trim().length < 4) {
      alert('새 특수 코드는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newCodeInput.trim() !== newCodeConfirmInput.trim()) {
      alert('새 특수 코드와 확인 입력이 일치하지 않습니다.');
      return;
    }
    onChangeCode(currentCodeInput.trim(), newCodeInput.trim());
    setCurrentCodeInput('');
    setNewCodeInput('');
    setNewCodeConfirmInput('');
    setCodeChangeSuccess(true);
    setTimeout(() => setCodeChangeSuccess(false), 3000);
  };

  const handleExecuteAction = () => {
    if (!selectedUser) return;
    if (actionType === 'timeout') {
      onTimeoutUser(selectedUser, timeoutMinutes, actionReason);
    } else if (actionType === 'ban') {
      onBanUser(selectedUser, actionReason);
    } else if (actionType === 'kick') {
      onKickUser(selectedUser, actionReason);
    }
    setActionType(null);
    setSelectedUser(null);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onBroadcastAnnouncement(broadcastText.trim());
    setBroadcastText('');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const formatUptime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hours}시간 ${mins}분`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-100">관리자 통제 센터 (Admin Panel)</h3>
                {isAdminAuthenticated && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>인증됨</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">실시간 사용자 제재, 타임아웃, 영구 밴 및 방 관리</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Authenticated View */}
        {!isAdminAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <KeyRound className="w-7 h-7" />
            </div>

            {!isCodeInitialized ? (
              /* Case 1: Initial Setup of Admin Code */
              <div className="w-full space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-100">관리자 특수 코드 최초 설정</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    관리자 패널에 사용할 비밀 코드를 직접 지정해주세요 (최소 4자 이상).
                  </p>
                </div>

                <form onSubmit={handleSetupSubmit} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      사용할 특수 코드
                    </label>
                    <div className="relative">
                      <input
                        type={showSetupCode ? 'text' : 'password'}
                        value={setupCodeInput}
                        onChange={(e) => setSetupCodeInput(e.target.value)}
                        placeholder="특수 코드 입력"
                        required
                        minLength={4}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-sm font-mono tracking-wider text-amber-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupCode(!showSetupCode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
                        title={showSetupCode ? '특수 코드 가리기' : '입력한 특수 코드 보기'}
                      >
                        {showSetupCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      특수 코드 확인
                    </label>
                    <div className="relative">
                      <input
                        type={showSetupConfirm ? 'text' : 'password'}
                        value={setupConfirmInput}
                        onChange={(e) => setSetupConfirmInput(e.target.value)}
                        placeholder="특수 코드 재입력"
                        required
                        minLength={4}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-sm font-mono tracking-wider text-amber-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupConfirm(!showSetupConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
                        title={showSetupConfirm ? '특수 코드 가리기' : '입력한 특수 코드 보기'}
                      >
                        {showSetupConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    특수 코드 설정 및 관리자 로그인
                  </button>
                </form>
              </div>
            ) : (
              /* Case 2: Code is already set, enter code to login */
              <div className="w-full space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-100">관리자 특수 코드 입력</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    지정하신 관리자 특수 코드를 입력하여 패널에 접근하세요.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPassCode ? 'text' : 'password'}
                      value={passCodeInput}
                      onChange={(e) => setPassCodeInput(e.target.value)}
                      placeholder="특수 코드 입력"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-center text-sm font-mono tracking-wider text-amber-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassCode(!showPassCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
                      title={showPassCode ? '특수 코드 가리기' : '입력한 특수 코드 보기'}
                    >
                      {showPassCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    관리자 인증 및 패널 진입
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/40 border-b border-slate-800 shrink-0 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">접속 소켓:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {overview?.stats.totalSockets || 0} 명
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">개설된 방:</span>
                <span className="font-bold text-sky-400 text-sm">
                  {overview?.stats.activeRooms || 0} 개
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">차단(밴) 목록:</span>
                <span className="font-bold text-rose-400 text-sm">
                  {overview?.stats.bannedCount || 0} 명
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">서버 가동:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {overview ? formatUptime(overview.stats.uptimeSeconds) : '0분'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs overflow-x-auto no-scrollbar">
                {[
                  { id: 'users', label: '접속자 관리', count: overview?.users.length },
                  { id: 'banned', label: '차단(밴) 목록', count: overview?.bannedUsers.length },
                  { id: 'rooms', label: '활성 대전 방', count: overview?.rooms.length },
                  { id: 'broadcast', label: '전체 공지 발송' },
                  { id: 'security', label: '특수코드 변경' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                      activeTab === t.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.count !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={onRefreshOverview}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition text-xs flex items-center space-x-1 shrink-0 ml-2"
                title="현황 새로고침"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">새로고침</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* TAB 1: USERS */}
              {activeTab === 'users' && (
                <div className="space-y-2">
                  {overview?.users.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      현재 접속 중인 사용자가 없습니다.
                    </div>
                  ) : (
                    overview?.users.map((u) => {
                      const isTimedOut = u.timeoutUntil && u.timeoutUntil > Date.now();
                      const remainMins = isTimedOut
                        ? Math.ceil((u.timeoutUntil! - Date.now()) / 60000)
                        : 0;

                      return (
                        <div
                          key={u.id}
                          className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-100">{u.name}</span>
                                <span className="font-mono text-[10px] text-slate-500">({u.id})</span>
                                {isTimedOut && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    타임아웃 {remainMins}분 남음
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                                <span>참여 방: {u.currentRoom ? u.currentRoom : '로비'}</span>
                                <span>·</span>
                                <span>IP: {u.ip || 'local'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedUser(u.id);
                                setActionType('timeout');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition flex items-center space-x-1"
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>타임아웃</span>
                            </button>

                            {u.currentRoom && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u.id);
                                  setActionType('kick');
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition flex items-center space-x-1"
                              >
                                <DoorOpen className="w-3.5 h-3.5" />
                                <span>퇴장</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedUser(u.id);
                                setActionType('ban');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold transition flex items-center space-x-1"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>영구 밴</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: BANNED USERS */}
              {activeTab === 'banned' && (
                <div className="space-y-2 text-xs">
                  {overview?.bannedUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      현재 등록된 차단(밴) 사용자가 없습니다.
                    </div>
                  ) : (
                    overview?.bannedUsers.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs"
                      >
                        <div>
                          <div className="font-bold text-rose-300">{b.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            사유: <span className="text-slate-200">{b.reason}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            차단 일시: {new Date(b.bannedAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => onUnbanUser(b.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 border border-slate-700 font-semibold transition"
                        >
                          밴 해제
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ROOMS */}
              {activeTab === 'rooms' && (
                <div className="space-y-2 text-xs">
                  {overview?.rooms.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      현재 개설된 활성 방이 없습니다.
                    </div>
                  ) : (
                    overview?.rooms.map((r) => (
                      <div
                        key={r.code}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100">{r.title}</span>
                            <span className="font-mono text-amber-400 font-bold text-xs bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800">
                              {r.code}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                              {r.status === 'playing' ? '대국 중' : '대기실'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            백: {r.whiteName || '미지정'} / 흑: {r.blackName || '미지정'} (인원:{' '}
                            {r.playersCount}명)
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`'${r.title}' (${r.code}) 방을 강제 종료하시겠습니까?`)) {
                              onCloseRoom(r.code);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-semibold transition"
                        >
                          방 강제 종료
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: BROADCAST */}
              {activeTab === 'broadcast' && (
                <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-lg mx-auto py-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      전체 접속자 실시간 공지 발송
                    </label>
                    <p className="text-[11px] text-slate-500">
                      현재 웹서비스에 연결된 모든 플레이어 화면 상단에 시스템 공지사항이 팝업됩니다.
                    </p>
                  </div>

                  <textarea
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="공지할 내용을 입력하세요 (예: 매너 대전을 준수해주세요)."
                    rows={4}
                    maxLength={200}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-100 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />

                  {broadcastSent && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>모든 접속자에게 공지가 성공적으로 전송되었습니다!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>전체 접속자에게 즉시 공지 발송</span>
                  </button>
                </form>
              )}

              {/* TAB 5: CHANGE CODE (SECURITY) */}
              {activeTab === 'security' && (
                <form onSubmit={handleChangeCodeSubmit} className="space-y-4 max-w-md mx-auto py-4 text-xs">
                  <div className="space-y-1 text-center">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-1">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-sm text-slate-100">관리자 특수 코드 변경</h5>
                    <p className="text-[11px] text-slate-400">
                      앞으로 관리자 패널 접근 시 사용할 새 특수 코드를 설정합니다.
                    </p>
                  </div>

                  {codeChangeSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>관리자 특수 코드가 성공적으로 변경되었습니다!</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">현재 특수 코드</label>
                    <div className="relative">
                      <input
                        type={showCurrentCode ? 'text' : 'password'}
                        value={currentCodeInput}
                        onChange={(e) => setCurrentCodeInput(e.target.value)}
                        placeholder="현재 사용 중인 특수 코드"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-slate-100 focus:outline-hidden focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentCode(!showCurrentCode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
                        title={showCurrentCode ? '특수 코드 가리기' : '입력한 특수 코드 보기'}
                      >
                        {showCurrentCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">새 특수 코드</label>
                    <div className="relative">
                      <input
                        type={showNewCode ? 'text' : 'password'}
                        value={newCodeInput}
                        onChange={(e) => setNewCodeInput(e.target.value)}
                        placeholder="새 특수 코드 (최소 4자 이상)"
                        required
                        minLength={4}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-slate-100 focus:outline-hidden focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewCode(!showNewCode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
                        title={showNewCode ? '특수 코드 가리기' : '입력한 특수 코드 보기'}
                      >
                        {showNewCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">새 특수 코드 확인</label>
                    <div className="relative">
                      <input
                        type={showNewCodeConfirm ? 'text' : 'password'}
                        value={newCodeConfirmInput}
                        onChange={(e) => setNewCodeConfirmInput(e.target.value)}
                        placeholder="새 특수 코드 재입력"
                        required
                        minLength={4}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-slate-100 focus:outline-hidden focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewCodeConfirm(!showNewCodeConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1"
                        title={showNewCodeConfirm ? '특수 코드 가리기' : '입력한 특수 코드 보기'}
                      >
                        {showNewCodeConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    특수 코드 변경 완료
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Action Confirmation Modal (Timeout, Ban, Kick) */}
        {actionType && selectedUser && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-100">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  {actionType === 'timeout'
                    ? '사용자 채팅 타임아웃'
                    : actionType === 'ban'
                    ? '사용자 영구 밴(차단)'
                    : '사용자 방 강제 퇴장'}
                </span>
              </div>

              {actionType === 'timeout' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">제한 시간 선택</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { min: 5, label: '5분' },
                      { min: 15, label: '15분' },
                      { min: 60, label: '1시간' },
                    ].map((opt) => (
                      <button
                        key={opt.min}
                        type="button"
                        onClick={() => setTimeoutMinutes(opt.min)}
                        className={`py-1.5 rounded-lg border text-center transition ${
                          timeoutMinutes === opt.min
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">제재 사유</label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  maxLength={50}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className={`flex-1 py-2 rounded-xl font-bold ${
                    actionType === 'ban'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  제재 적용
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
