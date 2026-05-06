# Status | 마지막: 2026-05-06
## 현재 작업
기업마당 CSV 97,794건 Turso 적재 및 Vercel 배포 완료. 운영 필터/상세/콘솔 확인 완료.
## 최근 변경 (최근 5개만)
- 05-06: 기업마당 CSV(`bizinfo_support`) 로컬 수집기 추가 및 로컬 화면 검증
- 05-06: K-Startup/MSS 수집 정상화, XML/JSON 필드 정규화, 상세 페이지 정리형 UI로 변경
- 05-06: AdSense 스크립트 head 경고 제거, 로컬 브라우저 콘솔 무경고 확인
- 05-06: `/startup`, `/api/startup`, `startup_items`, `fetch:startup` 추가 후 프로덕션 배포 확인
- 05-06: 운영 `/benefit`, `/api/benefits`, `/disclaimer`, sitemap 반영 확인
## TODO
- [ ] Preview 환경 Turso env가 필요하면 브랜치 지정 방식으로 별도 추가
## 결정사항
- DB: 운영 읽기와 자동 수집은 Turso env가 있으면 Turso 우선 사용
- 수집 주기: GitHub Actions에서 매일 02:00 KST 증분 수집
- canonical: 운영 기준 URL은 `https://www.bojo24.kr`
- 창업지원 API: K-Startup은 `returnType=JSON`, MSS는 `_type=xml` 파라미터 필요
- 기업마당 CSV: 로컬 파일은 CP949/EUC-KR, 현재 파일 행 수는 포털 설명과 다르게 97,794건
## 주의
- `.env.local`은 git 제외, Vercel/GitHub Secrets는 별도 관리
- 공공데이터 원본 날짜가 오래된 항목은 화면 날짜도 원본 수정일 기준으로 오래 보일 수 있음
