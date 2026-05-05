# Status | 마지막: 2026-05-06
## 현재 작업
GSC www 속성 검증·사이트맵 제출 및 AdSense/GA4 API 점검 완료
## 최근 변경 (최근 5개만)
- 05-06: GSC `https://www.bojo24.kr/` 서비스 계정 소유권 확인 및 `sitemap.xml` 제출 성공
- 05-06: Google 인증 메타태그 추가 후 Vercel Production 배포 완료
- 05-06: GA4 Data API 조회 성공, AdSense `bojo24.kr` 상태는 `GETTING_READY` 확인
- 05-06: `content:audit` 추가, 예약 글 200개 제목 중복·본문 품질 85점 기준 통과 확인
- 05-06: Supabase `posts`에 200개 글 예약 삽입, 첫 공개 2026-05-06 05:25 KST
- 05-06: 예약 글 공개 조건과 5시간 IndexNow 알림 워크플로우 추가
## TODO
- [x] GSC에 `https://www.bojo24.kr/` 권한 확인 및 사이트맵 제출
- [x] Google Cloud에서 `analyticsdata.googleapis.com` 조회 가능 확인
- [ ] AdSense에서 `bojo24.kr` GETTING_READY 해소 후 자동광고 재확인
- [ ] AdSense 결제 계정 확인 알림 처리
- [x] `INDEXNOW_KEY` 환경 변수와 key txt 접근 확인
- [x] 200개 예약 글 DB 삽입 후 첫 공개 URL 확인
- [x] 예약 글 200개 품질·중복 감사 통과
## 결정사항
- 정규 도메인: `www` 사용, 이유는 실서비스가 `https://www.bojo24.kr/`로 리다이렉트되기 때문
- GA4: `G-ZQJVKK37Y2` 사용, 이유는 Admin API에서 `bojo24.kr` 웹 스트림으로 확인됨
- 검색 알림: 일반 글은 Google Indexing API 대상 제한 때문에 sitemap/GSC + IndexNow 중심
## 주의
- AdSense API상 `bojo24.kr`은 `GETTING_READY`, 결제 계정 확인 알림은 대시보드 처리 필요
