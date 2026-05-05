# Status | 마지막: 2026-05-06
## 현재 작업
검색엔진 후속 제출 및 AdSense 상태 재확인 완료
## 최근 변경 (최근 5개만)
- 05-06: GSC에 `https://www.bojo24.kr/sitemap.xml` 재제출, 오류/경고 0건 확인
- 05-06: Bing/Naver IndexNow에 현재 사이트맵 URL 1,075개 제출 성공
- 05-06: AdSense API 재확인, `bojo24.kr`은 아직 `GETTING_READY`
- 05-06: Next 15.5.15 업그레이드 및 보안 취약점 0건 검증
- 05-06: 블로그 목록/RSS/사이트맵 URL에 post id 포함, 중복 slug SEO 문제 방지
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
