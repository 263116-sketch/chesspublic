export type PlayerColor = 'w' | 'b';

export type GameMode = 'classic' | 'first_attacker';
export type FirstAttackerChoice = 'creator' | 'joiner' | 'lobby_select';

export interface RoomPlayer {
  id: string;
  name: string;
  color: PlayerColor | null;
  isConnected: boolean;
  timeLeft: number; // in milliseconds
  isReady: boolean;
}

export interface MoveRecord {
  from: string;
  to: string;
  piece: string;
  color: PlayerColor;
  san: string;
  fen: string;
  timestamp: number;
  captured?: string;
  promotion?: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderColor?: PlayerColor | 'spectator' | 'system';
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoomState {
  code: string;
  title: string;
  gameMode: GameMode;
  firstAttackerChoice: FirstAttackerChoice;
  timeControlMinutes: number; // 0 = unlimited, 3, 5, 10
  status: 'waiting' | 'playing' | 'finished';
  whitePlayer: RoomPlayer | null;
  blackPlayer: RoomPlayer | null;
  spectators: Array<{ id: string; name: string }>;
  fen: string;
  turn: PlayerColor;
  history: MoveRecord[];
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  drawReason: string | null;
  winner: PlayerColor | 'draw' | null;
  winReason: string | null;
  drawOffer: PlayerColor | null;
  rematchOffer: { [key in PlayerColor]?: boolean };
  lastMove: { from: string; to: string } | null;
  createdAt: number;
}

export interface GameRecord {
  id: string;
  date: string;
  timestamp: number;
  roomCode?: string;
  mode: GameMode | 'ai' | 'local';
  opponentName: string;
  playerColor: PlayerColor;
  result: 'win' | 'loss' | 'draw';
  reason: string;
  totalMoves: number;
  durationSeconds: number;
  fen: string;
  history: MoveRecord[];
}

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  whiteWins: number;
  blackWins: number;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  currentRoom: string | null;
  connectedAt: number;
  timeoutUntil: number | null;
  ip?: string;
}

export interface BannedRecord {
  id: string;
  name: string;
  reason: string;
  bannedAt: number;
}

export interface AdminOverview {
  users: AdminUserRecord[];
  rooms: {
    code: string;
    title: string;
    status: string;
    playersCount: number;
    whiteName: string | null;
    blackName: string | null;
  }[];
  bannedUsers: BannedRecord[];
  stats: {
    totalSockets: number;
    activeRooms: number;
    bannedCount: number;
    uptimeSeconds: number;
  };
}
