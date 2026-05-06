# Status | 마지막: 2026-05-06
## 현재 작업
콘텐츠 200개 예약 운영 완료. 청년센터 청년정책 API 2,496건 적재 및 Actions 정기 동기화 검증 완료.
## 최근 변경 (최근 5개만)
- 05-06: GitHub Actions 데이터 동기화에서 청년정책 2,496건 수집 통과 확인
- 05-06: 청년센터 수집기에 페이지별 재시도와 즉시 저장 적용
- 05-06: 공공데이터 수집 타임아웃 60초/4회 재시도로 보강하고 단계 실패 격리
- 05-06: 청년센터 청년정책 API 수집기 추가 및 2,496건 DB 적재
- 05-06: 예약 글 상세 페이지에 FAQPage JSON-LD 자동 생성 추가
## TODO
- [ ] GitHub Actions Node.js 20 deprecation 경고 대응
- [ ] GitHub Secret `GEMINI_API_KEY` 유효 키로 교체
## 결정사항
- 청년정책 저장: YouthCenter `getPlcy` 데이터를 `benefits`에 `youth_` prefix ID로 적재
- 콘텐츠 저장: `benefits` 테이블 기반으로 제목·본문 생성
- 발행 방식: DB `published_at` 미래 시각 예약, 공개 시점 이후 GitHub Actions가 IndexNow 제출
## 주의
- YouthCenter API 키는 `YOUTHCENTER_API_KEY` GitHub Secret/환경변수로만 관리
- 공공데이터포털 API는 간헐적으로 15초 이상 지연되어 워크플로우에서 실패 격리 필요
- Gemini 요약 단계는 현재 키 오류를 내부 실패로 기록하지만 워크플로우 자체는 성공 처리됨
- 예약 글은 2026-05-09 12:46:48Z부터 2026-06-19 23:46:48Z까지 순차 공개
