# Status | 마지막: 2026-05-06
## 현재 작업
K-Startup/MSS 창업지원 데이터 연동 배포 완료. 공공데이터 API는 현재 403으로 수집 대기.
## 최근 변경 (최근 5개만)
- 05-06: `/startup`, `/api/startup`, `startup_items`, `fetch:startup` 추가 후 프로덕션 배포 확인
- 05-06: 운영 `/benefit`, `/api/benefits`, `/disclaimer`, sitemap 반영 확인
- 05-06: Data Sync workflow 재활성화 및 Turso/Gemini secrets 추가
- 05-06: Bing/Naver IndexNow 10,024개 URL 제출, GSC sitemap/RSS 제출 성공
- 05-06: 면책조항/404 추가, 글 30개 생성, 블로그 상세 링크/schema/가독성 보강
## TODO
- [ ] K-Startup/MSS API 403 해소 후 `npm run fetch:startup` 재실행
- [ ] Preview 환경 Turso env가 필요하면 브랜치 지정 방식으로 별도 추가
## 결정사항
- DB: 운영 읽기와 자동 수집은 Turso env가 있으면 Turso 우선 사용
- 수집 주기: GitHub Actions에서 매일 02:00 KST 증분 수집
- canonical: 운영 기준 URL은 `https://www.bojo24.kr`
- 창업지원 API: 승인 직후 403이면 공공데이터포털 반영 대기 또는 활용계정/활용신청 범위 확인
## 주의
- `.env.local`은 git 제외, Vercel/GitHub Secrets는 별도 관리
- 공공데이터 원본 날짜가 오래된 항목은 화면 날짜도 원본 수정일 기준으로 오래 보일 수 있음
