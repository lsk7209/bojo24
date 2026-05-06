# Status | 마지막: 2026-05-06
## 현재 작업
K-Startup/MSS 창업지원 데이터 1,627건 Turso 적재 완료. 상세 페이지/AdSense head 경고 수정 배포 대기.
## 최근 변경 (최근 5개만)
- 05-06: K-Startup/MSS 수집 정상화, XML/JSON 필드 정규화, 상세 페이지 정리형 UI로 변경
- 05-06: AdSense 스크립트 head 경고 제거, 로컬 브라우저 콘솔 무경고 확인
- 05-06: `/startup`, `/api/startup`, `startup_items`, `fetch:startup` 추가 후 프로덕션 배포 확인
- 05-06: 운영 `/benefit`, `/api/benefits`, `/disclaimer`, sitemap 반영 확인
- 05-06: Data Sync workflow 재활성화 및 Turso/Gemini secrets 추가
- 05-06: Bing/Naver IndexNow 10,024개 URL 제출, GSC sitemap/RSS 제출 성공
## TODO
- [ ] AdSense head 경고 수정 배포 후 운영 콘솔 확인
- [ ] Preview 환경 Turso env가 필요하면 브랜치 지정 방식으로 별도 추가
## 결정사항
- DB: 운영 읽기와 자동 수집은 Turso env가 있으면 Turso 우선 사용
- 수집 주기: GitHub Actions에서 매일 02:00 KST 증분 수집
- canonical: 운영 기준 URL은 `https://www.bojo24.kr`
- 창업지원 API: K-Startup은 `returnType=JSON`, MSS는 `_type=xml` 파라미터 필요
## 주의
- `.env.local`은 git 제외, Vercel/GitHub Secrets는 별도 관리
- 공공데이터 원본 날짜가 오래된 항목은 화면 날짜도 원본 수정일 기준으로 오래 보일 수 있음
