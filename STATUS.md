# Status | 마지막: 2026-05-06
## 현재 작업
애드센스 검수 품질 보강 및 Lighthouse 재검증 완료
## 최근 변경 (최근 5개만)
- 05-06: 모바일 Lighthouse 접근성 100, SEO 100, Agentic Browsing 100 확인
- 05-06: 푸터 작은 안내문 대비 개선, `llms.txt` 핵심 링크를 Markdown 링크로 정리
- 05-06: GSC에 `https://www.bojo24.kr/sitemap.xml` 재제출, 오류/경고 0건 확인
- 05-06: Bing/Naver IndexNow에 현재 사이트맵 URL 1,075개 제출 성공
- 05-06: AdSense API 재확인, `bojo24.kr`은 아직 `GETTING_READY`
## TODO
- [ ] GSC가 새 사이트맵을 다시 읽은 뒤 발견 URL 수 반영 확인
- [ ] AdSense `bojo24.kr` GETTING_READY 해소 확인
- [ ] AdSense 결제 계정 확인 알림 처리
## 결정사항
- 정규 도메인: `https://www.bojo24.kr/` 사용, 이유는 주요 서비스가 www로 리다이렉트되기 때문
- 검색 알림: 일반 글은 sitemap/GSC + IndexNow 중심, Google Indexing API는 지원 범위 제한
- 댓글: 애드센스 검수형 정보 사이트라 비활성 유지
## 주의
- AdSense 결제/세금 알림은 민감 정보라 대시보드에서 직접 처리 필요
- GSC 성능 데이터는 아직 0건이라 쿼리 기반 콘텐츠 개선은 데이터 축적 후 가능
- DB `posts` 업데이트 트리거가 `updated_at` 컬럼을 기대해 직접 UPDATE는 실패함
