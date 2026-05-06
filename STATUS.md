# Status | 마지막: 2026-05-06
## 현재 작업
콘텐츠 200개 예약 운영 완료. Actions Node 24 전환, 청년정책 수집, Gemini 요약 자동화 검증 완료.
## 최근 변경 (최근 5개만)
- 05-06: 데이터 동기화에서 청년정책 2,496건 저장 및 Gemini 요약 성공 20/실패 0 확인
- 05-06: Gemini 요약 단계에 429/500/503 재시도 추가
- 05-06: CI 빌드에 Turso env를 전달해 Supabase placeholder 조회 경고 제거 시도
- 05-06: GitHub Actions checkout/setup-node를 v6, Node 24로 전환
- 05-06: GitHub Secret `GEMINI_API_KEY`를 유효 키로 교체
## TODO
- [ ] Next.js `next lint` deprecation 대응
- [ ] 기업마당 MSS API 502 간헐 오류 별도 재시도/대체 확인
## 결정사항
- 청년정책 저장: YouthCenter `getPlcy` 데이터를 `benefits`에 `youth_` prefix ID로 적재
- 콘텐츠 저장: `benefits` 테이블 기반으로 제목·본문 생성
- 발행 방식: DB `published_at` 미래 시각 예약, 공개 시점 이후 GitHub Actions가 IndexNow 제출
## 주의
- YouthCenter API 키는 `YOUTHCENTER_API_KEY` GitHub Secret/환경변수로만 관리
- 공공데이터포털/MSS API는 간헐적으로 지연·502가 발생해 워크플로우에서 실패 격리 필요
- 예약 글은 2026-05-09 12:46:48Z부터 2026-06-19 23:46:48Z까지 순차 공개
