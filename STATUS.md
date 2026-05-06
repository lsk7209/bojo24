# Status | 마지막: 2026-05-06
## 현재 작업
콘텐츠 200개 예약 운영 완료. 청년센터 청년정책 API 2,496건 benefits 적재 및 프론트 조회 확인.
## 최근 변경 (최근 5개만)
- 05-06: 청년센터 청년정책 API 수집기 추가 및 2,496건 DB 적재
- 05-06: 예약 글 상세 페이지에 FAQPage JSON-LD 자동 생성 추가
- 05-06: 블로그 예약 생성기를 90점 기준, 중복 회피, 5시간 유동 예약으로 개선
- 05-06: 예약 글 200개를 DB에 저장하고 제목 10개를 가독성 기준으로 보정
- 05-06: 글별 동적 OG 이미지 라우트 추가 및 블로그 상세 UI 한글 깨짐 수정
## TODO
- [ ] GitHub Actions 데이터 동기화의 청년정책 단계 첫 정기 실행 확인
## 결정사항
- 청년정책 저장: YouthCenter `getPlcy` 데이터를 `benefits`에 `youth_` prefix ID로 적재
- 콘텐츠 저장: `benefits` 테이블 기반으로 제목·본문 생성
- 발행 방식: DB `published_at` 미래 시각 예약, 공개 시점 이후 GitHub Actions가 IndexNow 제출
## 주의
- YouthCenter API 키는 `YOUTHCENTER_API_KEY` GitHub Secret/환경변수로만 관리
- 예약 글은 2026-05-09 12:46:48Z부터 2026-06-19 23:46:48Z까지 순차 공개
