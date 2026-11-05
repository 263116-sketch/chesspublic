import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Chess } from 'chess.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  RoomState,
  RoomPlayer,
  PlayerColor,
  GameMode,
  FirstAttackerChoice,
  ChatMessage,
  MoveRecord,
  AdminOverview,
  AdminUserRecord,
  BannedRecord,
} from './src/types/chess';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

const PORT = parseInt(process.env.PORT || '3000', 10);
const CONFIG_PATH = path.resolve(__dirname, 'admin-config.json');

let currentAdminKey: string | null = null;
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.adminSecretKey) {
      currentAdminKey = parsed.adminSecretKey;
    }
  }
} catch {
  // ignore
}

if (!currentAdminKey && process.env.ADMIN_SECRET_KEY) {
  currentAdminKey = process.env.ADMIN_SECRET_KEY;
}

function saveAdminKey(key: string) {
  currentAdminKey = key;
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ adminSecretKey: key }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save admin key:', err);
  }
}

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface ServerRoom {
  state: RoomState;
  chess: Chess;
  timerInterval: NodeJS.Timeout | null;
  clients: Map<string, { ws: WebSocket; playerName: string; playerId: string }>;
}

interface ConnectedClient {
  ws: WebSocket;
  playerId: string;
  playerName: string;
  currentRoomCode: string | null;
  connectedAt: number;
  timeoutUntil: number | null;
  ip: string;
  isAdmin: boolean;
}

const rooms = new Map<string, ServerRoom>();
const connectedClients = new Map<string, ConnectedClient>();
const bannedRecords = new Map<string, BannedRecord>();
const serverStartTime = Date.now();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(room: ServerRoom, payload: any) {
  const msg = JSON.stringify(payload);
  room.clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function broadcastToAdmins(payload: any) {
  const msg = JSON.stringify(payload);
  connectedClients.forEach((client) => {
    if (client.isAdmin && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  });
}

function broadcastGlobalAnnouncement(text: string) {
  const msg = JSON.stringify({
    type: 'server_announcement',
    message: text,
    timestamp: Date.now(),
  });
  connectedClients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  });
}

function getAdminOverview(): AdminOverview {
  const users: AdminUserRecord[] = Array.from(connectedClients.values()).map((c) => ({
    id: c.playerId,
    name: c.playerName,
    currentRoom: c.currentRoomCode,
    connectedAt: c.connectedAt,
    timeoutUntil: c.timeoutUntil,
    ip: c.ip,
  }));

  const roomSummaries = Array.from(rooms.values()).map((r) => ({
    code: r.state.code,
    title: r.state.title,
    status: r.state.status,
    playersCount:
      (r.state.whitePlayer ? 1 : 0) + (r.state.blackPlayer ? 1 : 0) + r.state.spectators.length,
    whiteName: r.state.whitePlayer?.name || null,
    blackName: r.state.blackPlayer?.name || null,
  }));

  return {
    users,
    rooms: roomSummaries,
    bannedUsers: Array.from(bannedRecords.values()),
    stats: {
      totalSockets: connectedClients.size,
      activeRooms: rooms.size,
      bannedCount: bannedRecords.size,
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    },
  };
}

function stopRoomTimer(room: ServerRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

function startRoomTimer(room: ServerRoom) {
  stopRoomTimer(room);
  if (room.state.timeControlMinutes <= 0) return; // Unlimited

  room.timerInterval = setInterval(() => {
    if (room.state.status !== 'playing') {
      stopRoomTimer(room);
      return;
    }

    const currentTurn = room.state.turn;
    const player = currentTurn === 'w' ? room.state.whitePlayer : room.state.blackPlayer;

    if (player) {
      player.timeLeft = Math.max(0, player.timeLeft - 1000);
      if (player.timeLeft <= 0) {
        // Timeout!
        stopRoomTimer(room);
        room.state.status = 'finished';
        room.state.winner = currentTurn === 'w' ? 'b' : 'w';
        room.state.winReason = 'timeout';

        broadcastToRoom(room, {
          type: 'game_over',
          state: room.state,
          message: `${player.name} 선수의 시간이 초과되었습니다. ${currentTurn === 'w' ? '흑(Black)' : '백(White)'} 승리!`,
        });
        return;
      }
    }

    // Broadcast timer tick
    broadcastToRoom(room, {
      type: 'timer_tick',
      whiteTime: room.state.whitePlayer?.timeLeft ?? 0,
      blackTime: room.state.blackPlayer?.timeLeft ?? 0,
      turn: room.state.turn,
    });
  }, 1000);
}

function initGameIfReady(room: ServerRoom) {
  const { whitePlayer, blackPlayer, status, gameMode } = room.state;
  if (!whitePlayer || !blackPlayer || status !== 'waiting') return;

  if (whitePlayer.isReady && blackPlayer.isReady) {
    // Both players ready!
    if (gameMode === 'classic') {
      if (Math.random() < 0.5) {
        const temp = room.state.whitePlayer;
        room.state.whitePlayer = room.state.blackPlayer;
        room.state.blackPlayer = temp;
      }
    }

    if (room.state.whitePlayer) room.state.whitePlayer.color = 'w';
    if (room.state.blackPlayer) room.state.blackPlayer.color = 'b';

    room.state.status = 'playing';
    room.chess = new Chess();
    room.state.fen = room.chess.fen();
    room.state.turn = 'w';
    room.state.history = [];
    room.state.isCheck = false;
    room.state.isCheckmate = false;
    room.state.isDraw = false;
    room.state.winner = null;
    room.state.winReason = null;
    room.state.drawOffer = null;
    room.state.rematchOffer = {};

    startRoomTimer(room);

    broadcastToRoom(room, {
      type: 'game_started',
      state: room.state,
    });
  }
}

// REST APIs
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    totalConnections: connectedClients.size,
    timestamp: Date.now(),
  });
});

app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values())
    .filter((r) => r.state.status === 'waiting' && (!r.state.whitePlayer || !r.state.blackPlayer))
    .map((r) => ({
      code: r.state.code,
      title: r.state.title,
      gameMode: r.state.gameMode,
      timeControlMinutes: r.state.timeControlMinutes,
      creator: r.state.whitePlayer?.name || r.state.blackPlayer?.name || '익명',
      hasOpponent: !!(r.state.whitePlayer && r.state.blackPlayer),
    }));
  res.json({ rooms: publicRooms });
});

// WebSocket Handling
wss.on('connection', (ws, req) => {
  let currentRoomCode: string | null = null;
  let playerId: string = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let playerName: string = '익명 플레이어';
  const ip = req.socket.remoteAddress || 'unknown';

  const clientInfo: ConnectedClient = {
    ws,
    playerId,
    playerName,
    currentRoomCode: null,
    connectedAt: Date.now(),
    timeoutUntil: null,
    ip,
    isAdmin: false,
  };
  connectedClients.set(playerId, clientInfo);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type } = msg;

      // --- ADMIN OPERATIONS ---
      if (type === 'admin_check_status') {
        ws.send(
          JSON.stringify({
            type: 'admin_status',
            isInitialized: !!currentAdminKey,
          })
        );
        return;
      }

      if (type === 'admin_setup_code') {
        const { newPassCode } = msg;
        if (!newPassCode || !newPassCode.trim() || newPassCode.trim().length < 4) {
          ws.send(
            JSON.stringify({
              type: 'admin_auth_failed',
              message: '특수 코드는 최소 4자 이상이어야 합니다.',
            })
          );
          return;
        }
        if (currentAdminKey) {
          ws.send(
            JSON.stringify({
              type: 'admin_auth_failed',
              message: '이미 관리자 특수 코드가 설정되어 있습니다. 기존 코드로 로그인하세요.',
            })
          );
          return;
        }
        saveAdminKey(newPassCode.trim());
        clientInfo.isAdmin = true;
        ws.send(
          JSON.stringify({
            type: 'admin_auth_success',
            overview: getAdminOverview(),
            message: '관리자 특수 코드가 성공적으로 설정되었습니다.',
          })
        );
        return;
      }

      if (type === 'admin_auth') {
        const { passCode } = msg;
        if (!currentAdminKey) {
          ws.send(
            JSON.stringify({
              type: 'admin_needs_setup',
              message: '관리자 특수 코드를 먼저 지정해주세요.',
            })
          );
          return;
        }
        if (passCode === currentAdminKey) {
          clientInfo.isAdmin = true;
          ws.send(
            JSON.stringify({
              type: 'admin_auth_success',
              overview: getAdminOverview(),
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: 'admin_auth_failed',
              message: '관리자 특수 코드가 일치하지 않습니다.',
            })
          );
        }
        return;
      }

      if (type === 'admin_change_code') {
        if (!clientInfo.isAdmin) {
          ws.send(JSON.stringify({ type: 'error', message: '관리자 권한이 필요합니다.' }));
          return;
        }
        const { oldPassCode, newPassCode } = msg;
        if (oldPassCode !== currentAdminKey) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: '현재 사용 중인 특수 코드가 일치하지 않습니다.',
            })
          );
          return;
        }
        if (!newPassCode || newPassCode.trim().length < 4) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: '새 특수 코드는 최소 4자 이상이어야 합니다.',
            })
          );
          return;
        }
        saveAdminKey(newPassCode.trim());
        ws.send(
          JSON.stringify({
            type: 'admin_code_changed',
            message: '관리자 특수 코드가 안전하게 변경되었습니다.',
          })
        );
        return;
      }

      if (type === 'admin_get_overview') {
        if (!clientInfo.isAdmin) {
          ws.send(JSON.stringify({ type: 'error', message: '관리자 권한이 필요합니다.' }));
          return;
        }
        ws.send(
          JSON.stringify({
            type: 'admin_overview',
            overview: getAdminOverview(),
          })
        );
        return;
      }

      if (type === 'admin_timeout_user') {
        if (!clientInfo.isAdmin) return;
        const { targetPlayerId, durationMinutes = 5, reason = '매너 위반' } = msg;
        const target = connectedClients.get(targetPlayerId);
        if (target) {
          target.timeoutUntil = Date.now() + durationMinutes * 60 * 1000;
          target.ws.send(
            JSON.stringify({
              type: 'user_timed_out',
              durationMinutes,
              reason,
              timeoutUntil: target.timeoutUntil,
              message: `관리자에 의해 ${durationMinutes}분 동안 채팅 타임아웃 처리되었습니다. 사유: ${reason}`,
            })
          );

          if (target.currentRoomCode && rooms.has(target.currentRoomCode)) {
            const r = rooms.get(target.currentRoomCode)!;
            broadcastToRoom(r, {
              type: 'chat_message',
              message: {
                id: `sys_${Date.now()}`,
                senderName: '시스템',
                senderColor: 'system',
                text: `[제재] ${target.playerName} 님이 관리자에 의해 ${durationMinutes}분간 채팅 타임아웃 되었습니다. (사유: ${reason})`,
                timestamp: Date.now(),
                isSystem: true,
              },
            });
          }
        }
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'admin_ban_user') {
        if (!clientInfo.isAdmin) return;
        const { targetPlayerId, reason = '서비스 이용 규정 위반' } = msg;
        const target = connectedClients.get(targetPlayerId);
        const targetName = target ? target.playerName : '사용자';

        const banRec: BannedRecord = {
          id: targetPlayerId,
          name: targetName,
          reason,
          bannedAt: Date.now(),
        };
        bannedRecords.set(targetPlayerId, banRec);
        bannedRecords.set(targetName.toLowerCase(), banRec);

        if (target) {
          target.ws.send(
            JSON.stringify({
              type: 'user_banned',
              reason,
              message: `관리자에 의해 서비스에서 영구 차단(밴)되었습니다. 사유: ${reason}`,
            })
          );
          if (target.currentRoomCode && rooms.has(target.currentRoomCode)) {
            const r = rooms.get(target.currentRoomCode)!;
            r.clients.delete(targetPlayerId);
            if (r.state.whitePlayer?.id === targetPlayerId) r.state.whitePlayer = null;
            if (r.state.blackPlayer?.id === targetPlayerId) r.state.blackPlayer = null;
            broadcastToRoom(r, {
              type: 'player_disconnected',
              playerId: targetPlayerId,
              playerName: targetName,
              state: r.state,
            });
          }
          target.ws.close();
          connectedClients.delete(targetPlayerId);
        }

        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'admin_unban_user') {
        if (!clientInfo.isAdmin) return;
        const { targetId } = msg;
        const rec = bannedRecords.get(targetId);
        if (rec) {
          bannedRecords.delete(rec.id);
          bannedRecords.delete(rec.name.toLowerCase());
        } else {
          bannedRecords.delete(targetId);
        }
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'admin_kick_user') {
        if (!clientInfo.isAdmin) return;
        const { targetPlayerId, reason = '관리자 강제 퇴장' } = msg;
        const target = connectedClients.get(targetPlayerId);
        if (target && target.currentRoomCode && rooms.has(target.currentRoomCode)) {
          const r = rooms.get(target.currentRoomCode)!;
          r.clients.delete(targetPlayerId);
          if (r.state.whitePlayer?.id === targetPlayerId) r.state.whitePlayer = null;
          if (r.state.blackPlayer?.id === targetPlayerId) r.state.blackPlayer = null;
          target.currentRoomCode = null;

          target.ws.send(
            JSON.stringify({
              type: 'user_kicked',
              reason,
              message: `관리자에 의해 방에서 강제 퇴장 처리되었습니다. 사유: ${reason}`,
            })
          );
          broadcastToRoom(r, {
            type: 'state_updated',
            state: r.state,
          });
        }
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'admin_close_room') {
        if (!clientInfo.isAdmin) return;
        const { roomCode } = msg;
        if (rooms.has(roomCode)) {
          const r = rooms.get(roomCode)!;
          stopRoomTimer(r);
          broadcastToRoom(r, {
            type: 'room_closed_by_admin',
            message: '관리자에 의해 대전 방이 강제 종료되었습니다.',
          });
          rooms.delete(roomCode);
        }
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'admin_broadcast') {
        if (!clientInfo.isAdmin) return;
        const { message } = msg;
        if (message && message.trim()) {
          broadcastGlobalAnnouncement(message.trim());
        }
        return;
      }

      // --- STANDARD GAME OPERATIONS ---
      if (type === 'create_room') {
        const {
          title = '체스 친선 경기',
          gameMode = 'classic',
          firstAttackerChoice = 'creator',
          timeControlMinutes = 10,
          creatorName = '플레이어 1',
        } = msg;

        // Check Ban
        if (bannedRecords.has(playerId) || (creatorName && bannedRecords.has(creatorName.toLowerCase()))) {
          const ban = bannedRecords.get(playerId) || bannedRecords.get(creatorName.toLowerCase());
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `관리자에 의해 이용이 차단(밴)된 계정입니다. 사유: ${ban?.reason || '규정 위반'}`,
            })
          );
          return;
        }

        let code = generateRoomCode();
        while (rooms.has(code)) {
          code = generateRoomCode();
        }

        playerName = creatorName || '플레이어 1';
        clientInfo.playerName = playerName;
        currentRoomCode = code;
        clientInfo.currentRoomCode = code;

        const initialTime = timeControlMinutes * 60 * 1000;
        const creatorColor: PlayerColor = firstAttackerChoice === 'joiner' ? 'b' : 'w';

        const creatorPlayer: RoomPlayer = {
          id: playerId,
          name: playerName,
          color: creatorColor,
          isConnected: true,
          timeLeft: initialTime,
          isReady: false,
        };

        const roomState: RoomState = {
          code,
          title: title || `${playerName}의 체스 방`,
          gameMode,
          firstAttackerChoice,
          timeControlMinutes,
          status: 'waiting',
          whitePlayer: creatorColor === 'w' ? creatorPlayer : null,
          blackPlayer: creatorColor === 'b' ? creatorPlayer : null,
          spectators: [],
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'w',
          history: [],
          isCheck: false,
          isCheckmate: false,
          isDraw: false,
          drawReason: null,
          winner: null,
          winReason: null,
          drawOffer: null,
          rematchOffer: {},
          lastMove: null,
          createdAt: Date.now(),
        };

        const serverRoom: ServerRoom = {
          state: roomState,
          chess: new Chess(),
          timerInterval: null,
          clients: new Map([[playerId, { ws, playerName, playerId }]]),
        };

        rooms.set(code, serverRoom);

        ws.send(
          JSON.stringify({
            type: 'room_created',
            state: roomState,
            yourPlayerId: playerId,
            yourColor: creatorColor,
          })
        );
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'join_room') {
        const { code, requestedPlayerName } = msg;

        // Check Ban
        if (
          bannedRecords.has(playerId) ||
          (requestedPlayerName && bannedRecords.has(requestedPlayerName.toLowerCase()))
        ) {
          const ban = bannedRecords.get(playerId) || bannedRecords.get(requestedPlayerName.toLowerCase());
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `관리자에 의해 이용이 차단(밴)된 계정입니다. 사유: ${ban?.reason || '규정 위반'}`,
            })
          );
          return;
        }

        const room = rooms.get(code?.toUpperCase());

        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '존재하지 않는 파티 코드입니다.' }));
          return;
        }

        currentRoomCode = room.state.code;
        clientInfo.currentRoomCode = currentRoomCode;
        playerName = requestedPlayerName || '플레이어 2';
        clientInfo.playerName = playerName;
        room.clients.set(playerId, { ws, playerName, playerId });

        const initialTime = room.state.timeControlMinutes * 60 * 1000;

        let assignedColor: PlayerColor | null = null;
        if (!room.state.whitePlayer) {
          assignedColor = 'w';
          room.state.whitePlayer = {
            id: playerId,
            name: playerName,
            color: 'w',
            isConnected: true,
            timeLeft: initialTime,
            isReady: false,
          };
        } else if (!room.state.blackPlayer) {
          assignedColor = 'b';
          room.state.blackPlayer = {
            id: playerId,
            name: playerName,
            color: 'b',
            isConnected: true,
            timeLeft: initialTime,
            isReady: false,
          };
        } else {
          room.state.spectators.push({ id: playerId, name: playerName });
        }

        ws.send(
          JSON.stringify({
            type: 'room_joined',
            state: room.state,
            yourPlayerId: playerId,
            yourColor: assignedColor,
          })
        );

        broadcastToRoom(room, {
          type: 'player_joined',
          state: room.state,
          announcement: `${playerName} 님이 참가했습니다.`,
        });
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      // Check current room
      if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
      const room = rooms.get(currentRoomCode)!;

      if (type === 'set_ready') {
        const { ready } = msg;
        if (room.state.whitePlayer?.id === playerId) {
          room.state.whitePlayer.isReady = ready;
        } else if (room.state.blackPlayer?.id === playerId) {
          room.state.blackPlayer.isReady = ready;
        }

        broadcastToRoom(room, {
          type: 'state_updated',
          state: room.state,
        });

        initGameIfReady(room);
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'swap_sides') {
        if (room.state.status !== 'waiting') return;
        if (room.state.whitePlayer && room.state.blackPlayer) {
          const temp = room.state.whitePlayer;
          room.state.whitePlayer = room.state.blackPlayer;
          room.state.blackPlayer = temp;
          room.state.whitePlayer.color = 'w';
          room.state.blackPlayer.color = 'b';
          room.state.whitePlayer.isReady = false;
          room.state.blackPlayer.isReady = false;

          broadcastToRoom(room, {
            type: 'state_updated',
            state: room.state,
          });
        }
        return;
      }

      if (type === 'make_move') {
        if (room.state.status !== 'playing') return;
        const { from, to, promotion = 'q' } = msg;

        const currentTurn = room.chess.turn();
        const expectedPlayer = currentTurn === 'w' ? room.state.whitePlayer : room.state.blackPlayer;

        if (expectedPlayer?.id !== playerId) {
          ws.send(JSON.stringify({ type: 'error', message: '당신의 차례가 아닙니다.' }));
          return;
        }

        try {
          const moveResult = room.chess.move({
            from,
            to,
            promotion,
          });

          if (!moveResult) {
            ws.send(JSON.stringify({ type: 'error', message: '유효하지 않은 이동입니다.' }));
            return;
          }

          const moveRecord: MoveRecord = {
            from: moveResult.from,
            to: moveResult.to,
            piece: moveResult.piece,
            color: moveResult.color,
            san: moveResult.san,
            fen: room.chess.fen(),
            timestamp: Date.now(),
            captured: moveResult.captured,
            promotion: moveResult.promotion,
          };

          room.state.history.push(moveRecord);
          room.state.fen = room.chess.fen();
          room.state.turn = room.chess.turn();
          room.state.lastMove = { from: moveResult.from, to: moveResult.to };
          room.state.isCheck = room.chess.isCheck();

          if (room.chess.isCheckmate()) {
            stopRoomTimer(room);
            room.state.status = 'finished';
            room.state.isCheckmate = true;
            room.state.winner = moveResult.color;
            room.state.winReason = 'checkmate';

            broadcastToRoom(room, {
              type: 'game_over',
              state: room.state,
              move: moveRecord,
              message: `체크메이트! ${moveResult.color === 'w' ? '백(White)' : '흑(Black)'} 승리!`,
            });
            broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
            return;
          }

          if (room.chess.isDraw()) {
            stopRoomTimer(room);
            room.state.status = 'finished';
            room.state.isDraw = true;
            room.state.winner = 'draw';

            let reason = '무승부';
            if (room.chess.isStalemate()) reason = '스테일메이트 (Stalemate)';
            else if (room.chess.isThreefoldRepetition()) reason = '3회 동형반복 무승부';
            else if (room.chess.isInsufficientMaterial()) reason = '기물 부족 무승부';
            room.state.drawReason = reason;

            broadcastToRoom(room, {
              type: 'game_over',
              state: room.state,
              move: moveRecord,
              message: `게임 종료: ${reason}`,
            });
            broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
            return;
          }

          broadcastToRoom(room, {
            type: 'move_made',
            state: room.state,
            move: moveRecord,
          });
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: '유효하지 않은 체스 이동입니다.' }));
        }
        return;
      }

      if (type === 'send_chat') {
        const { text } = msg;
        if (!text || !text.trim()) return;

        // Check if user is timed out
        if (clientInfo.timeoutUntil && clientInfo.timeoutUntil > Date.now()) {
          const remainMins = Math.max(1, Math.ceil((clientInfo.timeoutUntil - Date.now()) / 60000));
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `타임아웃 제재 중입니다. 채팅 제한 해제까지 약 ${remainMins}분 남았습니다.`,
            })
          );
          return;
        }

        let senderColor: PlayerColor | 'spectator' = 'spectator';
        if (room.state.whitePlayer?.id === playerId) senderColor = 'w';
        else if (room.state.blackPlayer?.id === playerId) senderColor = 'b';

        const chatItem: ChatMessage = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          senderName: playerName,
          senderColor,
          text: text.trim().substring(0, 300),
          timestamp: Date.now(),
        };

        broadcastToRoom(room, {
          type: 'chat_message',
          message: chatItem,
        });
        return;
      }

      if (type === 'offer_draw') {
        if (room.state.status !== 'playing') return;
        const myColor: PlayerColor | null =
          room.state.whitePlayer?.id === playerId ? 'w' : room.state.blackPlayer?.id === playerId ? 'b' : null;

        if (!myColor) return;
        room.state.drawOffer = myColor;

        broadcastToRoom(room, {
          type: 'draw_offered',
          fromColor: myColor,
          state: room.state,
        });
        return;
      }

      if (type === 'respond_draw') {
        const { accept } = msg;
        const myColor: PlayerColor | null =
          room.state.whitePlayer?.id === playerId ? 'w' : room.state.blackPlayer?.id === playerId ? 'b' : null;

        if (!myColor || !room.state.drawOffer || room.state.drawOffer === myColor) return;

        if (accept) {
          stopRoomTimer(room);
          room.state.status = 'finished';
          room.state.isDraw = true;
          room.state.winner = 'draw';
          room.state.winReason = 'agreement';
          room.state.drawReason = '상호 합의 무승부';
          room.state.drawOffer = null;

          broadcastToRoom(room, {
            type: 'game_over',
            state: room.state,
            message: '양 선수의 합의로 무승부 처리되었습니다.',
          });
          broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        } else {
          room.state.drawOffer = null;
          broadcastToRoom(room, {
            type: 'draw_declined',
            state: room.state,
          });
        }
        return;
      }

      if (type === 'resign') {
        if (room.state.status !== 'playing') return;
        const myColor: PlayerColor | null =
          room.state.whitePlayer?.id === playerId ? 'w' : room.state.blackPlayer?.id === playerId ? 'b' : null;

        if (!myColor) return;
        stopRoomTimer(room);

        room.state.status = 'finished';
        room.state.winner = myColor === 'w' ? 'b' : 'w';
        room.state.winReason = 'resignation';

        broadcastToRoom(room, {
          type: 'game_over',
          state: room.state,
          message: `${myColor === 'w' ? '백' : '흑'} 선수가 기권했습니다. ${room.state.winner === 'w' ? '백' : '흑'} 승리!`,
        });
        broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
        return;
      }

      if (type === 'request_rematch') {
        const myColor: PlayerColor | null =
          room.state.whitePlayer?.id === playerId ? 'w' : room.state.blackPlayer?.id === playerId ? 'b' : null;

        if (!myColor) return;
        room.state.rematchOffer[myColor] = true;

        if (room.state.rematchOffer['w'] && room.state.rematchOffer['b']) {
          const temp = room.state.whitePlayer;
          room.state.whitePlayer = room.state.blackPlayer;
          room.state.blackPlayer = temp;

          const initialTime = room.state.timeControlMinutes * 60 * 1000;
          if (room.state.whitePlayer) {
            room.state.whitePlayer.color = 'w';
            room.state.whitePlayer.timeLeft = initialTime;
            room.state.whitePlayer.isReady = true;
          }
          if (room.state.blackPlayer) {
            room.state.blackPlayer.color = 'b';
            room.state.blackPlayer.timeLeft = initialTime;
            room.state.blackPlayer.isReady = true;
          }

          room.chess = new Chess();
          room.state.status = 'playing';
          room.state.fen = room.chess.fen();
          room.state.turn = 'w';
          room.state.history = [];
          room.state.isCheck = false;
          room.state.isCheckmate = false;
          room.state.isDraw = false;
          room.state.winner = null;
          room.state.winReason = null;
          room.state.drawOffer = null;
          room.state.rematchOffer = {};
          room.state.lastMove = null;

          startRoomTimer(room);

          broadcastToRoom(room, {
            type: 'game_started',
            state: room.state,
          });
        } else {
          broadcastToRoom(room, {
            type: 'rematch_requested',
            byColor: myColor,
            state: room.state,
          });
        }
        return;
      }
    } catch (err) {
      console.error('WebSocket parsing error:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(playerId);
    if (currentRoomCode && rooms.has(currentRoomCode)) {
      const room = rooms.get(currentRoomCode)!;
      room.clients.delete(playerId);

      if (room.state.whitePlayer?.id === playerId) {
        room.state.whitePlayer.isConnected = false;
      } else if (room.state.blackPlayer?.id === playerId) {
        room.state.blackPlayer.isConnected = false;
      }

      broadcastToRoom(room, {
        type: 'player_disconnected',
        playerId,
        playerName,
        state: room.state,
      });

      if (room.clients.size === 0) {
        stopRoomTimer(room);
        setTimeout(() => {
          if (room.clients.size === 0) {
            rooms.delete(currentRoomCode!);
          }
        }, 10 * 60 * 1000);
      }
    }
    broadcastToAdmins({ type: 'admin_overview', overview: getAdminOverview() });
  });
});

// Setup Vite dev server or serve production build
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Chess server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
