import { GameRecord, UserStats } from '../types/chess';

const STORAGE_KEY = 'chess_arena_records_v1';
const USERNAME_KEY = 'chess_arena_player_name';

export function getStoredPlayerName(): string {
  if (typeof window === 'undefined') return '플레이어';
  const saved = localStorage.getItem(USERNAME_KEY);
  if (saved && saved.trim()) return saved.trim();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const defaultName = `체스마스터#${randomNum}`;
  localStorage.setItem(USERNAME_KEY, defaultName);
  return defaultName;
}

export function savePlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERNAME_KEY, name.trim());
}

export function getGameRecords(): GameRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveGameRecord(record: Omit<GameRecord, 'id' | 'timestamp' | 'date'>): GameRecord {
  const records = getGameRecords();
  const now = new Date();
  const newRecord: GameRecord = {
    ...record,
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };

  records.unshift(newRecord);
  // Keep up to 100 recent games
  const trimmed = records.slice(0, 100);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota exceeded fallback
  }
  return newRecord;
}

export function clearGameRecords(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function calculateUserStats(records: GameRecord[]): UserStats {
  const total = records.length;
  if (total === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      whiteWins: 0,
      blackWins: 0,
    };
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let whiteWins = 0;
  let blackWins = 0;

  for (const r of records) {
    if (r.result === 'win') {
      wins++;
      if (r.playerColor === 'w') whiteWins++;
      else blackWins++;
    } else if (r.result === 'loss') {
      losses++;
    } else {
      draws++;
    }
  }

  const winRate = Math.round((wins / total) * 100);

  return {
    totalGames: total,
    wins,
    losses,
    draws,
    winRate,
    whiteWins,
    blackWins,
  };
}
