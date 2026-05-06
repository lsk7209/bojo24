# Status | 마지막: 2026-05-06
## 현재 작업
운영 웹 공공데이터 자동 수집/반영 복구 진행 중: Vercel Turso env 추가, GitHub Actions 복구 준비
## 최근 변경 (최근 5개만)
- 05-06: Vercel Production/Development에 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 추가
- 05-06: GitHub Secrets에 Turso/Gemini 키 추가, data-sync workflow Turso 대응
- 05-06: 면책조항/404 추가, 글 30개 생성, 블로그 상세 링크·schema·가독성 보강
- 05-06: sitemap/RSS DB 장애 fallback, RSS favicon 경로 정리
- 05-06: Turso 호환 DB 클라이언트와 SQLite 스키마 초기화 스크립트 추가
## TODO
- [ ] 변경사항 커밋/푸시 후 Vercel 운영 배포 확인
- [ ] `Data Sync (Scheduled)` workflow enable + 수동 실행 확인
- [ ] 운영 `/benefit`, `/api/benefits`, `/sitemap.xml`, `/disclaimer` 최신 반영 확인
## 결정사항
- DB: 운영 웹과 자동 수집은 Turso env가 있으면 Turso 우선 사용
- 수집 주기: GitHub Actions에서 매일 02:00 KST 증분 수집
## 주의
- `.env.local`은 git 제외, Vercel/GitHub Secrets 값 별도 관리
- 공공데이터 원본 수정일이 오래된 항목은 화면 날짜도 원본 수정일 기준으로 오래 보일 수 있음
