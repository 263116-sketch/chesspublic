import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/chess';
import { Send, MessageSquare, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

const QUICK_PHRASES = [
  '안녕하세요! 잘 부탁드립니다 👋',
  '준비 완료되었습니다! ⚔️',
  '좋은 경기였습니다! 👏',
  '한 수 배웠습니다! 🙏',
  '체크! 👑',
  '멋진 수네요! 🔥',
  '잠시만요! ⏱️',
  '다시 한 판? 🔄',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickPhrase = (phrase: string) => {
    if (disabled) return;
    onSendMessage(phrase);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-200">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-sm">실시간 대전 채팅</span>
        </div>
        <span className="text-xs text-slate-400">{messages.length}개 메시지</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[160px] max-h-[280px] lg:max-h-[340px] text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8 text-center">
            <Sparkles className="w-6 h-6 mb-2 opacity-40 text-amber-400" />
            <p>상대방과 자유롭게 대화하고</p>
            <p className="text-[11px] text-slate-600">빠른 문구를 터치해 전송해보세요!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="text-center my-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800/80 text-amber-300 text-[11px] border border-amber-500/20">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isWhite = msg.senderColor === 'w';
            const isBlack = msg.senderColor === 'b';

            return (
              <div key={msg.id} className="flex flex-col space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`font-semibold ${
                      isWhite
                        ? 'text-slate-100'
                        : isBlack
                        ? 'text-slate-300'
                        : 'text-amber-400'
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  {msg.senderColor && msg.senderColor !== 'spectator' && (
                    <span className="text-[9px] px-1 py-0.2 rounded-xs bg-slate-800 text-slate-400 font-mono">
                      {isWhite ? '백' : '흑'}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 ml-auto">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="bg-slate-800/70 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700/60 leading-relaxed break-words">
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Phrases */}
      <div className="px-2.5 py-1.5 bg-slate-950/60 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        {QUICK_PHRASES.map((phrase, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => handleQuickPhrase(phrase)}
            className="text-[11px] whitespace-nowrap px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition disabled:opacity-40"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={disabled ? '채팅을 사용할 수 없습니다...' : '상대방에게 메시지 전송...'}
          disabled={disabled}
          maxLength={200}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-40 transition active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
