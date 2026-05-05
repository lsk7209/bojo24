# Status | 마지막: 2026-05-06
## 현재 작업
Next 15.5.15 업그레이드, 글 URL 중복 방지, 배포 전 최종 확인 단계
## 최근 변경 (최근 5개만)
- 05-06: Next 15.5.15, eslint-config-next 15.5.15, Supabase 2.105.3 등 보안 업데이트
- 05-06: Next 15 App Router params/searchParams Promise 타입 호환 수정
- 05-06: 블로그 목록/RSS/사이트맵 URL에 post id 포함, 중복 slug SEO 문제 방지
- 05-06: `posts.updated_at` 의존 제거로 사이트맵/RSS 글 누락 가능성 수정
- 05-06: npm audit 취약점 0건, type-check/lint/build 통과 확인
## TODO
- [x] Vercel Production 배포 및 라이브 주요 경로 확인
- [ ] AdSense `bojo24.kr` GETTING_READY 해소 확인
- [ ] AdSense 결제 계정 확인 알림 처리
## 결정사항
- 정규 도메인: `https://www.bojo24.kr/` 사용, 이유는 주요 서비스가 www로 리다이렉트되기 때문
- 검색 알림: 일반 글은 sitemap/GSC + IndexNow 중심, Google Indexing API는 지원 범위 제한
- 댓글: 애드센스 검수형 정보 사이트라 비활성 유지
## 주의
- AdSense 결제/세금 알림은 민감 정보라 대시보드에서 직접 처리 필요
- Next 15에서 `next lint`는 deprecated 안내가 나오므로 추후 ESLint CLI 전환 검토
- DB `posts` 업데이트 트리거가 `updated_at` 컬럼을 기대해 직접 UPDATE는 실패함
