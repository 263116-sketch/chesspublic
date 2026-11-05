# ♟️ 실시간 체스 아레나 (Online Chess Arena)

파티 코드로 친구를 초대해 실시간으로 즐기는 고품질 멀티플레이어 온라인 체스 게임 웹 애플리케이션입니다.

## ✨ 주요 기능

- **실시간 1:1 대전**: 파티 코드 생성 및 원클릭 링크 복사(`?room=CODE`)로 친구를 손쉽게 초대
- **선공/모드 선택**:
  - **클래식 모드**: 흑/백 랜덤 배정
  - **선공 선택 모드**: 방 생성자가 백(선공) 또는 흑을 직접 지정
- **직관적인 체스보드 조작**:
  - 드래그 앤 드롭 & 클릭 이동 모두 지원
  - 정교한 Staunton 스타일 벡터 기물 그래픽 (나이트/퀸 등 대칭 미려 디자인)
  - 이동 가능 칸 하이라이트, 체크/체크메이트 감지, 폰 프로모션 UI
- **인게임 실시간 채팅**: 방 참가자 간 실시간 대화 및 시스템 메시지 알림
- **전적 기록 및 통계**: 로컬 스토리지 기반 최근 대국 기록, 승률 통계 및 이전 대국 FEN 복기
- **관리자 제어 패널**:
  - 비밀 코드를 통한 관리자 등록 및 로그인 (비밀번호 표시/숨김 토글)
  - 악성 사용자 타임아웃, 방 강퇴(Kick), 영구 차단(Ban), 방 강제 종료, 전체 공지 브로드캐스트

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend / Realtime**: Node.js, Express, WebSocket (`ws`)
- **Chess Logic**: `chess.js` (서버 권한 기반 수 검증 및 상태 동기화)
- **Audio**: Web Audio API 기반 효과음 (이동, 캡처, 체크, 게임 종료, 채팅)

## 🚀 로컬 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (Express + Vite 통합 서버, Port 3000)
npm run dev

# 3. 프로덕션 빌드
npm run build
npm start
```

## 🌐 호스팅 및 배포

이 프로젝트는 WebSocket(`ws`)과 Express 풀스택 서버로 구동됩니다.
- **Node.js 서버 지원 호스팅 서비스**:
  - [Render](https://render.com) (Web Service - Node)
  - [Railway](https://railway.app)
  - [Fly.io](https://fly.io)
  - [Google Cloud Run](https://cloud.google.com/run)
  - [Heroku](https://www.heroku.com)
- 빌드 커맨드: `npm run build`
- 시작 커맨드: `npm start` (또는 `npx tsx server.ts`)
