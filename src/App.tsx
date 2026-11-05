import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import {
  RoomState,
  PlayerColor,
  GameMode,
  FirstAttackerChoice,
  ChatMessage,
  GameRecord,
  AdminOverview,
} from './types/chess';
import { sounds } from './utils/sound';
import {
  getStoredPlayerName,
  savePlayerName,
  getGameRecords,
  saveGameRecord,
  calculateUserStats,
} from './utils/records';
import { getAIMove } from './utils/chessEngine';
import { ChessBoard } from './components/ChessBoard';
import { GamePlayerCard } from './components/GameInfo';
import { ChatPanel } from './components/ChatPanel';
import { MoveHistory } from './components/MoveHistory';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { GameOverModal } from './components/GameOverModal';
import { StatsModal } from './components/StatsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import {
  Swords,
  Users,
  Bot,
  Trophy,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  ShieldAlert,
  Palette,
  Play,
  UserCheck,
  Megaphone,
  X,
} from 'lucide-react';

export default function App() {
  // User & Settings State
  const [playerName, setPlayerName] = useState<string>('체스마스터');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [boardTheme, setBoardTheme] = useState<'emerald' | 'wood' | 'midnight'>('emerald');
  const [manualFlip, setManualFlip] = useState<boolean>(false);

  // App Tabs / Modes
  const [activeTab, setActiveTab] = useState<'online' | 'ai' | 'local'>('online');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isCodeInitialized, setIsCodeInitialized] = useState<boolean>(false);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [serverAnnouncement, setServerAnnouncement] = useState<string | null>(null);

  // Stats & Records
  const [records, setRecords] = useState<GameRecord[]>([]);

  // Online Multiplayer State
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<PlayerColor | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [onlineTab, setOnlineTab] = useState<'chat' | 'moves'>('moves');

  // AI & Local Practice State
  const [aiChess, setAiChess] = useState<Chess | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiPlayerSide, setAiPlayerSide] = useState<PlayerColor>('w');
  const [aiGameStatus, setAiGameStatus] = useState<'playing' | 'finished'>('playing');
  const [aiWinner, setAiWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [aiWinReason, setAiWinReason] = useState<string | null>(null);
  const [aiLastMove, setAiLastMove] = useState<{ from: string; to: string } | null>(null);
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  // WebSocket Refs & Message Queue
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const handleServerMessageRef = useRef<((data: any) => void) | null>(null);

  // Flush queued messages when socket connects
  const flushMessageQueue = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      while (messageQueueRef.current.length > 0) {
        const msg = messageQueueRef.current.shift();
        if (msg) {
          try {
            wsRef.current.send(msg);
          } catch (err) {
            console.error('Failed to send queued message:', err);
          }
        }
      }
    }
  }, []);

  // Connect to WebSocket Server with singleton reuse and auto-drain queue
  const getWebSocket = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return wsRef.current;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WS connection established.');
      flushMessageQueue();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (handleServerMessageRef.current) {
          handleServerMessageRef.current(data);
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('WS connection closed.');
      wsRef.current = null;
    };

    ws.onerror = (err) => {
      console.error('WS connection error:', err);
      wsRef.current = null;
    };

    wsRef.current = ws;
    return ws;
  }, [flushMessageQueue]);

  // Safe message dispatch helper: immediately sends if OPEN, otherwise buffers until OPEN
  const sendMessage = useCallback(
    (payload: any) => {
      const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const ws = getWebSocket();
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(raw);
        } catch (err) {
          console.warn('ws.send failed, buffering:', err);
          messageQueueRef.current.push(raw);
        }
      } else {
        messageQueueRef.current.push(raw);
      }
    },
    [getWebSocket]
  );

  // Load initial data and proactively initiate WebSocket connection
  useEffect(() => {
    const savedName = getStoredPlayerName();
    setPlayerName(savedName);
    setTempName(savedName);
    setRecords(getGameRecords());

    // Eagerly connect WebSocket so it's ready when user interacts
    getWebSocket();

    // Check URL parameters for direct room invitation code (?room=CODE)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        sendMessage({
          type: 'join_room',
          code: roomParam.toUpperCase(),
          requestedPlayerName: savedName,
        });
      }
    }
  }, [getWebSocket, sendMessage]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      savePlayerName(tempName.trim());
      setPlayerName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleServerMessage = (data: any) => {
    const { type } = data;

    if (type === 'room_created' || type === 'room_joined') {
      setRoomState(data.state);
      setMyPlayerId(data.yourPlayerId);
      setMyColor(data.yourColor);
      setIsCreateModalOpen(false);
      setIsJoinModalOpen(false);
      setChatMessages([]);
      return;
    }

    if (type === 'player_joined') {
      setRoomState(data.state);
      sounds.playChat();
      if (data.announcement) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sys_${Date.now()}`,
            senderName: '시스템',
            senderColor: 'system',
            text: data.announcement,
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      }
      return;
    }

    if (type === 'state_updated') {
      setRoomState(data.state);
      return;
    }

    if (type === 'game_started') {
      setRoomState(data.state);
      setIsGameOverModalOpen(false);
      sounds.playMove();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          senderName: '시스템',
          senderColor: 'system',
          text: '체스 대국이 시작되었습니다! 백(White)의 선공입니다.',
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
      return;
    }

    if (type === 'move_made') {
      setRoomState(data.state);
      const move = data.move;
      if (move) {
        if (move.captured) {
          sounds.playCapture();
        } else {
          sounds.playMove();
        }
        if (data.state.isCheck) {
          sounds.playCheck();
        }
      }
      return;
    }

    if (type === 'timer_tick') {
      setRoomState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          whitePlayer: prev.whitePlayer ? { ...prev.whitePlayer, timeLeft: data.whiteTime } : null,
          blackPlayer: prev.blackPlayer ? { ...prev.blackPlayer, timeLeft: data.blackTime } : null,
        };
      });
      return;
    }

    if (type === 'chat_message') {
      setChatMessages((prev) => [...prev, data.message]);
      sounds.playChat();
      return;
    }

    if (type === 'draw_offered') {
      setRoomState(data.state);
      sounds.playChat();
      return;
    }

    if (type === 'draw_declined') {
      setRoomState(data.state);
      return;
    }

    if (type === 'game_over') {
      setRoomState(data.state);
      setIsGameOverModalOpen(true);

      const isMyWin = Boolean(myColor && data.state.winner === myColor);
      sounds.playGameEnd(isMyWin);

      // Record to history
      if (myColor && data.state.winner) {
        const opponent = myColor === 'w' ? data.state.blackPlayer?.name : data.state.whitePlayer?.name;
        const result: 'win' | 'loss' | 'draw' =
          data.state.winner === 'draw' ? 'draw' : data.state.winner === myColor ? 'win' : 'loss';

        const newRec = saveGameRecord({
          mode: data.state.gameMode,
          roomCode: data.state.code,
          opponentName: opponent || '상대 플레이어',
          playerColor: myColor,
          result,
          reason: data.state.winReason || (result === 'draw' ? '무승부' : '게임 종료'),
          totalMoves: data.state.history.length,
          durationSeconds: 0,
          fen: data.state.fen,
          history: data.state.history,
        });

        setRecords((prev) => [newRec, ...prev]);
      }
      return;
    }

    if (type === 'rematch_requested') {
      setRoomState(data.state);
      sounds.playChat();
      return;
    }

    // --- Admin Event Handling ---
    if (type === 'admin_status') {
      setIsCodeInitialized(data.isInitialized);
      return;
    }

    if (type === 'admin_needs_setup') {
      setIsCodeInitialized(false);
      return;
    }

    if (type === 'admin_auth_success') {
      setIsAdminAuthenticated(true);
      setIsCodeInitialized(true);
      setAdminOverview(data.overview);
      if (data.message) {
        alert(data.message);
      }
      return;
    }

    if (type === 'admin_auth_failed') {
      alert(data.message || '관리자 인증에 실패했습니다.');
      return;
    }

    if (type === 'admin_code_changed') {
      alert(data.message || '특수 코드가 성공적으로 변경되었습니다.');
      return;
    }

    if (type === 'admin_overview') {
      setAdminOverview(data.overview);
      return;
    }

    if (type === 'user_timed_out') {
      alert(data.message || '관리자에 의해 채팅 타임아웃 되었습니다.');
      return;
    }

    if (type === 'user_banned') {
      alert(data.message || '관리자에 의해 서비스에서 영구 차단(밴)되었습니다.');
      handleLeaveRoom();
      return;
    }

    if (type === 'user_kicked') {
      alert(data.message || '관리자에 의해 방에서 퇴장되었습니다.');
      handleLeaveRoom();
      return;
    }

    if (type === 'room_closed_by_admin') {
      alert(data.message || '관리자에 의해 대전 방이 종료되었습니다.');
      handleLeaveRoom();
      return;
    }

    if (type === 'server_announcement') {
      setServerAnnouncement(data.message);
      sounds.playChat();
      return;
    }

    if (type === 'error') {
      alert(data.message || '오류가 발생했습니다.');
    }
  };
  handleServerMessageRef.current = handleServerMessage;

  // Room Creation
  const handleCreateRoom = (options: {
    title: string;
    gameMode: GameMode;
    firstAttackerChoice: FirstAttackerChoice;
    timeControlMinutes: number;
    creatorName: string;
  }) => {
    sendMessage({
      type: 'create_room',
      ...options,
    });
  };

  // Join Room
  const connectToRoom = (code: string, pName: string) => {
    sendMessage({
      type: 'join_room',
      code,
      requestedPlayerName: pName,
    });
  };

  const handleToggleReady = () => {
    if (!roomState || !myPlayerId) return;
    const myReady =
      roomState.whitePlayer?.id === myPlayerId
        ? roomState.whitePlayer.isReady
        : roomState.blackPlayer?.id === myPlayerId
        ? roomState.blackPlayer.isReady
        : false;

    sendMessage({
      type: 'set_ready',
      ready: !myReady,
    });
  };

  const handleSwapSides = () => {
    sendMessage({ type: 'swap_sides' });
  };

  const handleMakeMoveOnline = (from: Square, to: Square, promotion?: string) => {
    sendMessage({
      type: 'make_move',
      from,
      to,
      promotion,
    });
  };

  const handleSendChat = (text: string) => {
    sendMessage({
      type: 'send_chat',
      text,
    });
  };

  const handleOfferDraw = () => {
    sendMessage({ type: 'offer_draw' });
  };

  const handleRespondDraw = (accept: boolean) => {
    sendMessage({ type: 'respond_draw', accept });
  };

  const handleResign = () => {
    sendMessage({ type: 'resign' });
  };

  const handleRequestRematch = () => {
    sendMessage({ type: 'request_rematch' });
  };

  const handleLeaveRoom = () => {
    setRoomState(null);
    setMyPlayerId(null);
    setMyColor(null);
    setIsGameOverModalOpen(false);
  };

  // Admin Operations
  const handleCheckAdminStatus = () => {
    sendMessage({ type: 'admin_check_status' });
  };

  const handleAdminAuth = (passCode: string) => {
    sendMessage({ type: 'admin_auth', passCode });
  };

  const handleSetupAdminCode = (newPassCode: string) => {
    sendMessage({ type: 'admin_setup_code', newPassCode });
  };

  const handleChangeAdminCode = (oldPassCode: string, newPassCode: string) => {
    sendMessage({ type: 'admin_change_code', oldPassCode, newPassCode });
  };

  const handleRefreshAdminOverview = () => {
    sendMessage({ type: 'admin_get_overview' });
  };

  const handleTimeoutUser = (targetPlayerId: string, durationMinutes: number, reason: string) => {
    sendMessage({
      type: 'admin_timeout_user',
      targetPlayerId,
      durationMinutes,
      reason,
    });
  };

  const handleBanUser = (targetPlayerId: string, reason: string) => {
    sendMessage({
      type: 'admin_ban_user',
      targetPlayerId,
      reason,
    });
  };

  const handleUnbanUser = (targetId: string) => {
    sendMessage({
      type: 'admin_unban_user',
      targetId,
    });
  };

  const handleKickUser = (targetPlayerId: string, reason: string) => {
    sendMessage({
      type: 'admin_kick_user',
      targetPlayerId,
      reason,
    });
  };

  const handleCloseRoom = (roomCode: string) => {
    sendMessage({
      type: 'admin_close_room',
      roomCode,
    });
  };

  const handleBroadcastAnnouncement = (message: string) => {
    sendMessage({
      type: 'admin_broadcast',
      message,
    });
  };

  const copyRoomCode = () => {
    if (!roomState) return;
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = () => {
    if (!roomState) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // AI Game Logic
  const startAIGame = (side: PlayerColor = 'w', diff: 'easy' | 'medium' | 'hard' = aiDifficulty) => {
    const newChess = new Chess();
    setAiChess(newChess);
    setAiPlayerSide(side);
    setAiDifficulty(diff);
    setAiGameStatus('playing');
    setAiWinner(null);
    setAiWinReason(null);
    setAiLastMove(null);
    setAiHistory([]);

    if (side === 'b') {
      // AI is white, make first move
      setTimeout(() => {
        const move = getAIMove(newChess.fen(), diff);
        if (move) {
          const res = newChess.move(move);
          setAiLastMove({ from: res.from, to: res.to });
          setAiHistory([
            {
              from: res.from,
              to: res.to,
              piece: res.piece,
              color: res.color,
              san: res.san,
              fen: newChess.fen(),
              timestamp: Date.now(),
              captured: res.captured,
            },
          ]);
          sounds.playMove();
        }
      }, 500);
    }
  };

  const handleAIMove = (from: Square, to: Square, promotion?: string) => {
    if (!aiChess || aiGameStatus !== 'playing') return;
    if (aiChess.turn() !== aiPlayerSide) return;

    try {
      const moveResult = aiChess.move({ from, to, promotion: promotion || 'q' });
      if (!moveResult) return;

      if (moveResult.captured) sounds.playCapture();
      else sounds.playMove();

      const newHistory = [
        ...aiHistory,
        {
          from: moveResult.from,
          to: moveResult.to,
          piece: moveResult.piece,
          color: moveResult.color,
          san: moveResult.san,
          fen: aiChess.fen(),
          timestamp: Date.now(),
          captured: moveResult.captured,
        },
      ];

      setAiLastMove({ from, to });
      setAiHistory(newHistory);

      // Check game over for user move
      if (aiChess.isGameOver()) {
        finishAIGame(newHistory);
        return;
      }

      if (aiChess.isCheck()) {
        sounds.playCheck();
      }

      // AI turn
      setTimeout(() => {
        if (!aiChess || aiChess.isGameOver()) return;
        const aiMove = getAIMove(aiChess.fen(), aiDifficulty);
        if (aiMove) {
          const aiRes = aiChess.move(aiMove);
          if (aiRes.captured) sounds.playCapture();
          else sounds.playMove();

          const finalHistory = [
            ...newHistory,
            {
              from: aiRes.from,
              to: aiRes.to,
              piece: aiRes.piece,
              color: aiRes.color,
              san: aiRes.san,
              fen: aiChess.fen(),
              timestamp: Date.now(),
              captured: aiRes.captured,
            },
          ];

          setAiLastMove({ from: aiRes.from, to: aiRes.to });
          setAiHistory(finalHistory);

          if (aiChess.isGameOver()) {
            finishAIGame(finalHistory);
          } else if (aiChess.isCheck()) {
            sounds.playCheck();
          }
        }
      }, 400);
    } catch {
      // Invalid move
    }
  };

  const finishAIGame = (hist: any[]) => {
    if (!aiChess) return;
    setAiGameStatus('finished');

    let winner: PlayerColor | 'draw' = 'draw';
    let reason = '무승부';

    if (aiChess.isCheckmate()) {
      winner = aiChess.turn() === 'w' ? 'b' : 'w';
      reason = '체크메이트';
    } else if (aiChess.isStalemate()) {
      reason = '스테일메이트';
    } else if (aiChess.isThreefoldRepetition()) {
      reason = '3회 동형반복 무승부';
    }

    setAiWinner(winner);
    setAiWinReason(reason);

    const isWin = winner === aiPlayerSide;
    sounds.playGameEnd(isWin);

    // Save game record
    const result = winner === 'draw' ? 'draw' : isWin ? 'win' : 'loss';
    const rec = saveGameRecord({
      mode: 'ai',
      opponentName: `AI (${aiDifficulty === 'easy' ? '초급' : aiDifficulty === 'medium' ? '중급' : '고급'})`,
      playerColor: aiPlayerSide,
      result,
      reason,
      totalMoves: hist.length,
      durationSeconds: 0,
      fen: aiChess.fen(),
      history: hist,
    });
    setRecords((prev) => [rec, ...prev]);
  };

  // Helper to extract captured pieces
  const getCapturedPieces = (fen: string) => {
    const pieces: { [key: string]: number } = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const whiteRem: { [key: string]: number } = { ...pieces };
    const blackRem: { [key: string]: number } = { ...pieces };

    const rows = fen.split(' ')[0].split('/');
    for (const row of rows) {
      for (const char of row) {
        if (/[pnbrqkPNBRQK]/.test(char)) {
          const type = char.toLowerCase();
          if (type === 'k') continue;
          if (char === char.toUpperCase()) {
            if (whiteRem[type] > 0) whiteRem[type]--;
          } else {
            if (blackRem[type] > 0) blackRem[type]--;
          }
        }
      }
    }

    const whiteCaptured: string[] = []; // captured by black
    const blackCaptured: string[] = []; // captured by white

    for (const [t, count] of Object.entries(whiteRem)) {
      for (let i = 0; i < count; i++) whiteCaptured.push(t);
    }
    for (const [t, count] of Object.entries(blackRem)) {
      for (let i = 0; i < count; i++) blackCaptured.push(t);
    }

    return {
      capturedByWhite: blackCaptured,
      capturedByBlack: whiteCaptured,
    };
  };

  const userStats = calculateUserStats(records);

  // Determine current board orientation
  const currentOrientation: PlayerColor =
    activeTab === 'online'
      ? myColor
        ? manualFlip
          ? myColor === 'w'
            ? 'b'
            : 'w'
          : myColor
        : manualFlip
        ? 'b'
        : 'w'
      : activeTab === 'ai'
      ? manualFlip
        ? aiPlayerSide === 'w'
          ? 'b'
          : 'w'
        : aiPlayerSide
      : manualFlip
      ? 'b'
      : 'w';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleLeaveRoom}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight flex items-center space-x-1.5 text-slate-100">
                <span>실시간 체스 아레나</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                초대 코드로 즉시 대전하는 고품질 체스 플랫폼
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Player Name Tag */}
            <div className="flex items-center bg-slate-800/80 rounded-xl px-2.5 py-1 border border-slate-700/60">
              {isEditingName ? (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={15}
                    className="w-24 sm:w-28 bg-slate-900 text-xs px-2 py-0.5 rounded-md border border-amber-400 text-amber-300 focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-amber-300 transition"
                  title="닉네임 변경"
                >
                  <span className="font-semibold truncate max-w-[100px]">{playerName}</span>
                  <span className="text-[10px] text-slate-500">✏️</span>
                </button>
              )}
            </div>

            {/* Stats Button */}
            <button
              onClick={() => setIsStatsModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">내 전적</span>
              <span className="text-amber-400 font-bold">{userStats.winRate}%</span>
            </button>

            {/* Theme Toggle */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/60">
              <button
                onClick={() => setBoardTheme('emerald')}
                title="에메랄드 테마"
                className={`w-6 h-6 rounded-lg bg-[#779954] transition ${
                  boardTheme === 'emerald' ? 'ring-2 ring-amber-400' : 'opacity-60'
                }`}
              />
              <button
                onClick={() => setBoardTheme('wood')}
                title="우드 테마"
                className={`w-6 h-6 rounded-lg bg-[#b58863] transition ${
                  boardTheme === 'wood' ? 'ring-2 ring-amber-400' : 'opacity-60'
                }`}
              />
              <button
                onClick={() => setBoardTheme('midnight')}
                title="미드나잇 테마"
                className={`w-6 h-6 rounded-lg bg-[#1e293b] transition ${
                  boardTheme === 'midnight' ? 'ring-2 ring-amber-400' : 'opacity-60'
                }`}
              />
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Admin Panel Button */}
            <button
              onClick={() => {
                setIsAdminModalOpen(true);
                handleCheckAdminStatus();
                if (isAdminAuthenticated) {
                  handleRefreshAdminOverview();
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-800/50 text-xs font-semibold transition cursor-pointer"
              title="관리자 제어 패널"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">관리자</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Server Announcement Banner */}
      {serverAnnouncement && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2 z-30">
          <div className="flex items-center space-x-2.5 max-w-5xl mx-auto w-full">
            <Megaphone className="w-4 h-4 animate-bounce shrink-0" />
            <span className="leading-snug break-words flex-1">
              [전체 공지] {serverAnnouncement}
            </span>
            <button
              onClick={() => setServerAnnouncement(null)}
              className="p-1 rounded-md hover:bg-black/20 text-white/80 hover:text-white transition shrink-0"
              title="닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
        {/* If in an Online Room */}
        {roomState ? (
          <div className="space-y-4">
            {/* Top Room Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  {roomState.gameMode === 'classic' ? '클래식 (흑백 랜덤)' : '선공 선택 모드'}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-100">{roomState.title}</h2>
              </div>

              {/* Code & Share Link */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-mono text-xs">
                  <span className="text-slate-500 font-semibold">코드:</span>
                  <span className="font-bold text-amber-400 tracking-wider text-sm">{roomState.code}</span>
                  <button
                    onClick={copyRoomCode}
                    className="ml-1 text-slate-400 hover:text-amber-300 p-0.5"
                    title="코드 복사"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  onClick={copyInviteLink}
                  className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition"
                  title="초대 링크 복사"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">초대 링크 복사</span>
                </button>

                <button
                  onClick={handleLeaveRoom}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 text-xs transition"
                >
                  나가기
                </button>
              </div>
            </div>

            {/* Waiting in Lobby View */}
            {roomState.status === 'waiting' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-5xl mx-auto w-full">
                {/* Left Column: Player Slots and Ready Controls */}
                <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">대전 상대를 기다리는 중입니다</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      상단 파티 코드를 친구에게 알려주거나 초대 링크를 공유하세요!
                    </p>
                  </div>

                  {/* Mode Explanation Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-300/90 flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">
                        {roomState.gameMode === 'classic' ? '클래식 모드' : '선공 선택 모드'}:
                      </span>{' '}
                      {roomState.gameMode === 'classic'
                        ? '양쪽 플레이어가 모두 준비를 완료하면 흑과 백이 50% 확률로 랜덤 배정되어 게임이 시작됩니다.'
                        : '지정된 선공(백) 플레이어가 먼저 공격을 시작합니다. 로비에서 자리 바꾸기가 가능합니다.'}
                    </div>
                  </div>

                  {/* Player Slots */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* White slot */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-950 font-black text-lg flex items-center justify-center border-2 border-slate-300 shadow-md">
                        W
                      </div>
                      <span className="font-bold text-sm text-slate-200">
                        {roomState.whitePlayer ? roomState.whitePlayer.name : '참가자 대기 중...'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          roomState.whitePlayer?.isReady
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {roomState.whitePlayer?.isReady ? '준비 완료 (READY)' : '대기 중'}
                      </span>
                    </div>

                    {/* Black slot */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-slate-100 font-black text-lg flex items-center justify-center border-2 border-slate-700 shadow-md">
                        B
                      </div>
                      <span className="font-bold text-sm text-slate-200">
                        {roomState.blackPlayer ? roomState.blackPlayer.name : '참가자 대기 중...'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          roomState.blackPlayer?.isReady
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {roomState.blackPlayer?.isReady ? '준비 완료 (READY)' : '대기 중'}
                      </span>
                    </div>
                  </div>

                  {/* Lobby Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {roomState.gameMode === 'first_attacker' && roomState.whitePlayer && roomState.blackPlayer && (
                      <button
                        onClick={handleSwapSides}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>선공/후공 자리 교환</span>
                      </button>
                    )}

                    {myColor !== null && (
                      <button
                        onClick={handleToggleReady}
                        className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition transform active:scale-95 shadow-lg ${
                          (myColor === 'w' && roomState.whitePlayer?.isReady) ||
                          (myColor === 'b' && roomState.blackPlayer?.isReady)
                            ? 'bg-slate-800 text-amber-400 border border-amber-400/50'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>
                          {(myColor === 'w' && roomState.whitePlayer?.isReady) ||
                          (myColor === 'b' && roomState.blackPlayer?.isReady)
                            ? '준비 취소'
                            : '게임 준비 완료 (READY)'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: In-Lobby Live Chat */}
                <div className="lg:col-span-5 h-[420px]">
                  <ChatPanel
                    messages={chatMessages}
                    onSendMessage={handleSendChat}
                    disabled={!myPlayerId}
                  />
                </div>
              </div>
            ) : (
              /* Active Playing or Finished Match View */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Chess Board & Players Column */}
                <div className="lg:col-span-8 flex flex-col items-center space-y-3">
                  {/* Opponent Card (Top) */}
                  <div className="w-full max-w-[540px]">
                    <GamePlayerCard
                      player={currentOrientation === 'w' ? roomState.blackPlayer : roomState.whitePlayer}
                      color={currentOrientation === 'w' ? 'b' : 'w'}
                      isTurn={roomState.turn === (currentOrientation === 'w' ? 'b' : 'w')}
                      isMe={myColor === (currentOrientation === 'w' ? 'b' : 'w')}
                      capturedPieces={
                        currentOrientation === 'w'
                          ? getCapturedPieces(roomState.fen).capturedByBlack
                          : getCapturedPieces(roomState.fen).capturedByWhite
                      }
                      materialAdvantage={0}
                    />
                  </div>

                  {/* Main Board */}
                  <div className="w-full flex justify-center">
                    <ChessBoard
                      fen={roomState.fen}
                      orientation={currentOrientation}
                      lastMove={roomState.lastMove}
                      isCheck={roomState.isCheck}
                      turn={roomState.turn}
                      myColor={myColor}
                      interactive={roomState.status === 'playing'}
                      theme={boardTheme}
                      onMove={handleMakeMoveOnline}
                    />
                  </div>

                  {/* Self Card (Bottom) */}
                  <div className="w-full max-w-[540px]">
                    <GamePlayerCard
                      player={currentOrientation === 'w' ? roomState.whitePlayer : roomState.blackPlayer}
                      color={currentOrientation === 'w' ? 'w' : 'b'}
                      isTurn={roomState.turn === (currentOrientation === 'w' ? 'w' : 'b')}
                      isMe={myColor === (currentOrientation === 'w' ? 'w' : 'b')}
                      capturedPieces={
                        currentOrientation === 'w'
                          ? getCapturedPieces(roomState.fen).capturedByWhite
                          : getCapturedPieces(roomState.fen).capturedByBlack
                      }
                      materialAdvantage={0}
                    />
                  </div>
                </div>

                {/* Right Sidebar: Chat & Move History */}
                <div className="lg:col-span-4 flex flex-col space-y-4 h-full">
                  {/* Tab switches for small screens */}
                  <div className="grid grid-cols-2 gap-2 lg:hidden">
                    <button
                      onClick={() => setOnlineTab('moves')}
                      className={`py-2 rounded-xl text-xs font-semibold ${
                        onlineTab === 'moves' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      기보 & 조작
                    </button>
                    <button
                      onClick={() => setOnlineTab('chat')}
                      className={`py-2 rounded-xl text-xs font-semibold ${
                        onlineTab === 'chat' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      실시간 채팅 ({chatMessages.length})
                    </button>
                  </div>

                  {/* Desktop view shows both, mobile toggles */}
                  <div className={`space-y-4 ${onlineTab === 'moves' ? 'block' : 'hidden lg:block'}`}>
                    <MoveHistory
                      history={roomState.history}
                      isMuted={isMuted}
                      onToggleMute={handleToggleMute}
                      onFlipBoard={() => setManualFlip(!manualFlip)}
                      onResign={handleResign}
                      onOfferDraw={handleOfferDraw}
                      canControlGame={roomState.status === 'playing' && myColor !== null}
                      drawOfferedBy={roomState.drawOffer}
                      myColor={myColor}
                      onRespondDraw={handleRespondDraw}
                    />
                  </div>

                  <div className={`space-y-4 ${onlineTab === 'chat' ? 'block' : 'hidden lg:block'}`}>
                    <ChatPanel
                      messages={chatMessages}
                      onSendMessage={handleSendChat}
                      disabled={!myPlayerId}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Main Arena Lobby Tabs */
          <div className="space-y-8 max-w-4xl mx-auto w-full">
            {/* Hero Banner */}
            <div className="text-center space-y-3 pt-2 pb-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>웹 브라우저에서 바로 즐기는 실시간 무료 체스 대전</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
                초대 코드로 친구와 함께 <span className="text-amber-400">체스 한 판!</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
                드래그 앤 드롭 및 클릭 조작, 흑백 랜덤 배정 클래식 모드와 선공 선택 모드, 실시간 대화 및 전적 복기까지 모두 지원합니다.
              </p>
            </div>

            {/* Mode Select Tabs */}
            <div className="flex items-center justify-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto">
              <button
                onClick={() => setActiveTab('online')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition ${
                  activeTab === 'online'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>온라인 파티 대전</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('ai');
                  if (!aiChess) startAIGame('w', 'medium');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition ${
                  activeTab === 'ai'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>AI 솔로 연습</span>
              </button>
            </div>

            {/* TAB 1: Online Multiplayer Home */}
            {activeTab === 'online' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Card 1: Create Room */}
                <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-6 rounded-3xl shadow-xl flex flex-col justify-between transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                      <Swords className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">새 게임 방 개설</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      6자리 파티 코드를 생성합니다. 클래식(랜덤 흑백) 또는 선공 선택 모드, 시간 제한을 자유롭게 설정하세요.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <span>방 만들고 코드 생성하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 2: Join with Code */}
                <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-6 rounded-3xl shadow-xl flex flex-col justify-between transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition" />
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">파티 코드로 참가</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      상대방에게 공유받은 파티 코드를 입력하거나 현재 대기 중인 오픈 대전 목록을 확인하고 즉시 참여하세요.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 hover:border-amber-400 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <span>코드 입력 및 오픈 방 보기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: AI Practice Mode */}
            {activeTab === 'ai' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
                {/* AI Controls Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-400">AI 난이도:</span>
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      {[
                        { id: 'easy', label: '초급' },
                        { id: 'medium', label: '중급' },
                        { id: 'hard', label: '고급' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setAiDifficulty(d.id as any);
                            startAIGame(aiPlayerSide, d.id as any);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                            aiDifficulty === d.id
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-400">내 진영:</span>
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={() => startAIGame('w', aiDifficulty)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                          aiPlayerSide === 'w' ? 'bg-slate-200 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        선공 (백)
                      </button>
                      <button
                        onClick={() => startAIGame('b', aiDifficulty)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                          aiPlayerSide === 'b' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        후공 (흑)
                      </button>
                    </div>

                    <button
                      onClick={() => startAIGame(aiPlayerSide, aiDifficulty)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition"
                      title="판 초기화"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI Game Board */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-8 flex flex-col items-center space-y-3">
                    {/* Opponent AI card */}
                    <div className="w-full max-w-[540px]">
                      <GamePlayerCard
                        player={{
                          id: 'ai_bot',
                          name: `인공지능 AI (${aiDifficulty === 'easy' ? '초급' : aiDifficulty === 'medium' ? '중급' : '고급'})`,
                          color: aiPlayerSide === 'w' ? 'b' : 'w',
                          isConnected: true,
                          timeLeft: 0,
                          isReady: true,
                        }}
                        color={aiPlayerSide === 'w' ? 'b' : 'w'}
                        isTurn={aiChess ? aiChess.turn() === (aiPlayerSide === 'w' ? 'b' : 'w') : false}
                        isMe={false}
                        capturedPieces={
                          aiChess
                            ? aiPlayerSide === 'w'
                              ? getCapturedPieces(aiChess.fen()).capturedByBlack
                              : getCapturedPieces(aiChess.fen()).capturedByWhite
                            : []
                        }
                        materialAdvantage={0}
                      />
                    </div>

                    {/* Board */}
                    <div className="w-full flex justify-center">
                      <ChessBoard
                        fen={aiChess ? aiChess.fen() : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                        orientation={currentOrientation}
                        lastMove={aiLastMove}
                        isCheck={aiChess ? aiChess.isCheck() : false}
                        turn={aiChess ? aiChess.turn() : 'w'}
                        myColor={aiPlayerSide}
                        interactive={aiGameStatus === 'playing'}
                        theme={boardTheme}
                        onMove={handleAIMove}
                      />
                    </div>

                    {/* Self card */}
                    <div className="w-full max-w-[540px]">
                      <GamePlayerCard
                        player={{
                          id: 'me',
                          name: playerName,
                          color: aiPlayerSide,
                          isConnected: true,
                          timeLeft: 0,
                          isReady: true,
                        }}
                        color={aiPlayerSide}
                        isTurn={aiChess ? aiChess.turn() === aiPlayerSide : false}
                        isMe={true}
                        capturedPieces={
                          aiChess
                            ? aiPlayerSide === 'w'
                              ? getCapturedPieces(aiChess.fen()).capturedByWhite
                              : getCapturedPieces(aiChess.fen()).capturedByBlack
                            : []
                        }
                        materialAdvantage={0}
                      />
                    </div>
                  </div>

                  {/* Moves */}
                  <div className="lg:col-span-4">
                    <MoveHistory
                      history={aiHistory}
                      isMuted={isMuted}
                      onToggleMute={handleToggleMute}
                      onFlipBoard={() => setManualFlip(!manualFlip)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        defaultPlayerName={playerName}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinRoom={connectToRoom}
        defaultPlayerName={playerName}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        records={records}
        stats={userStats}
        onClearRecords={() => setRecords([])}
      />

      <GameOverModal
        isOpen={isGameOverModalOpen}
        winner={roomState?.winner || null}
        winReason={roomState?.winReason || null}
        myColor={myColor}
        onRematch={handleRequestRematch}
        onReturnToLobby={handleLeaveRoom}
        onReviewBoard={() => setIsGameOverModalOpen(false)}
        rematchRequestedByMe={myColor ? !!roomState?.rematchOffer[myColor] : false}
        rematchRequestedByOpponent={
          myColor ? !!roomState?.rematchOffer[myColor === 'w' ? 'b' : 'w'] : false
        }
      />

      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdminAuthenticated={isAdminAuthenticated}
        isCodeInitialized={isCodeInitialized}
        onAuthenticate={handleAdminAuth}
        onSetupCode={handleSetupAdminCode}
        onChangeCode={handleChangeAdminCode}
        overview={adminOverview}
        onRefreshOverview={handleRefreshAdminOverview}
        onTimeoutUser={handleTimeoutUser}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
        onKickUser={handleKickUser}
        onCloseRoom={handleCloseRoom}
        onBroadcastAnnouncement={handleBroadcastAnnouncement}
      />
    </div>
  );
}
