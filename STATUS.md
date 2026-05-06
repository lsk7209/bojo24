# Status | 마지막: 2026-05-06
## 현재 작업
Turso 사용 지적 반영, 잘못된 Supabase RLS 작업 롤백 완료
## 최근 변경 (최근 5개만)
- 05-06: Supabase RLS 수정 커밋은 Turso 실제 사용 지적에 따라 롤백
- 05-06: 예약 글 200개 코호트 확인, 부족분만 생성하도록 스크립트 보강
- 05-06: `.env.local` 자동 로딩과 제목/본문 품질 감사 기준 강화
- 05-06: 실행용 스크립트 `console` 출력은 CLI 용도로 명시하고 lint warning 0건 확인
- 05-06: Gemini/혜택 콘텐츠 런타임 로그를 개발 환경에서만 출력하도록 정리
## TODO
- [ ] GSC가 새 사이트맵을 다시 읽은 뒤 발견 URL 수 반영 확인
- [ ] AdSense `bojo24.kr` GETTING_READY 해소 확인
- [ ] AdSense 결제 계정 확인 알림 처리
- [ ] Turso 연결 정보와 현재 Supabase 의존 코드 정합성 확인
## 결정사항
- 정규 도메인: `https://www.bojo24.kr/` 사용, 주요 서비스가 www로 리다이렉트되기 때문
- 검색 알림: 일반 글은 sitemap/GSC + IndexNow 중심, Google Indexing API는 지원 범위 제한
- 광고: 애드센스 검수형 정보 사이트라 비활성 유저 댓글은 사용하지 않음
## 주의
- AdSense 결제/인증 알림은 민감 정보라 대시보드에서 직접 처리 필요
- GSC 성능 데이터는 아직 0건이므로 쿼리 기반 콘텐츠 개선은 데이터 축적 후 가능
- DB `posts` 업데이트 트리거가 `updated_at` 컬럼을 기대해 직접 UPDATE는 실패함
- 선택적 Gemini 보강은 기본 비활성, 필요 시 `GEMINI_ENHANCEMENT_ENABLED=true`와 allowed IDs 함께 설정
