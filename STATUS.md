# Status | 마지막: 2026-05-06
## 현재 작업
운영 웹 공공데이터 자동 수집/반영 및 검색엔진 재수집 알림 완료
## 최근 변경 (최근 5개만)
- 05-06: 운영 `/benefit` 최신 날짜(2026-05-05), `/api/benefits`, `/disclaimer`, sitemap 반영 확인
- 05-06: Data Sync workflow 재활성화 및 수동 실행 성공, Turso/Gemini secrets 추가
- 05-06: Bing/Naver IndexNow 10,024개 URL 제출, GSC sitemap/RSS 제출 성공
- 05-06: 면책조항/404 추가, 글 30개 생성, 블로그 상세 링크·schema·가독성 보강
- 05-06: sitemap/RSS DB 장애 fallback, RSS favicon 경로 정리
- 05-06: Turso 호환 DB 클라이언트와 SQLite 스키마 초기화 스크립트 추가
## TODO
- [ ] Preview 환경 Turso env는 필요 시 브랜치 지정 방식으로 별도 추가
## 결정사항
- DB: 운영 웹과 자동 수집은 Turso env가 있으면 Turso 우선 사용
- 수집 주기: GitHub Actions에서 매일 02:00 KST 증분 수집
- canonical: 운영 기준 URL은 `https://www.bojo24.kr`
## 주의
- `.env.local`은 git 제외, Vercel/GitHub Secrets 값 별도 관리
- 공공데이터 원본 수정일이 오래된 항목은 화면 날짜도 원본 수정일 기준으로 오래 보일 수 있음
