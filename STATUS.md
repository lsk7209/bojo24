# Status | 마지막: 2026-05-06
## 현재 작업
200개 제목·글 예약 발행 자동화 구현 중
## 최근 변경 (최근 5개만)
- 05-06: 예약 글 공개 조건과 5시간 IndexNow 알림 워크플로우 추가
- 05-05: Vercel Production `INDEXNOW_KEY` 설정 및 Bing/Naver IndexNow 수락 확인
- 05-05: 홈을 애드센스 자동광고 검수용 정보형 구조로 재기획
- 05-05: sitemap 정적 페이지 lastmod 최신화, about/contact/editorial-policy 포함
- 05-05: robots AI봇 허용/Bytespider 차단, llms/ai-index 문서 추가
- 05-05: 글 발행 후 IndexNow(Bing/Naver) 알림 유틸 추가
## TODO
- [ ] GSC에 `https://www.bojo24.kr/` 또는 `sc-domain:bojo24.kr` 권한 확인
- [ ] Google Cloud에서 `analyticsdata.googleapis.com` 활성화
- [ ] AdSense에서 `bojo24.kr` GETTING_READY 해소 후 자동광고 재확인
- [x] `INDEXNOW_KEY` 환경 변수와 key txt 접근 확인
- [ ] 200개 예약 글 DB 삽입 후 첫 공개 URL 확인
## 결정사항
- 정규 도메인: `www` 사용, 이유는 실서비스가 `https://www.bojo24.kr/`로 리다이렉트되기 때문
- GA4: `G-ZQJVKK37Y2` 사용, 이유는 Admin API에서 `bojo24.kr` 웹 스트림으로 확인됨
- 검색 알림: 일반 글은 Google Indexing API 대상 제한 때문에 sitemap/GSC + IndexNow 중심
## 주의
- Search Console API에서는 현재 `https://bojo24.kr/`만 조회됨
- 실제 라이브 응답은 `https://www.bojo24.kr/` 기준
