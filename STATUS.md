# Status | 마지막: 2026-04-23
## 현재 작업
애드센스 검수 대응용 콘텐츠/신뢰 페이지 보강 완료, git 배포 진행 중
## 최근 변경 (최근 5개만)
- 04-23: 홈 콘텐츠 밀도 확장 및 소개/문의/운영 원칙 페이지 추가
- 04-23: 더미 광고 슬롯 비노출 처리 및 광고 라벨 구조 정리
- 04-23: GA4 측정 ID `G-ZQJVKK37Y2`를 레이아웃에 연결
- 04-23: 사이트 기본 URL을 `https://www.bojo24.kr`로 통일
- 04-23: `.gsc-domain` 추가로 GSC 자동화 경로 준비
## TODO
- [ ] GSC에 `https://www.bojo24.kr/` 또는 `sc-domain:bojo24.kr` 권한 확인
- [ ] Google Cloud에서 `analyticsdata.googleapis.com` 활성화
- [ ] 실제 AdSense 슬롯 환경 변수 반영 후 승인 재신청
## 결정사항
- 정규 도메인: `www` 사용, 이유는 실서비스가 `https://www.bojo24.kr/`로 리다이렉트되기 때문
- GA4: `G-ZQJVKK37Y2` 사용, 이유는 Admin API에서 `bojo24.kr` 웹 스트림으로 확인됨
## 주의
- Search Console API에서는 현재 `https://bojo24.kr/`만 조회됨
- 실제 라이브 응답은 `https://www.bojo24.kr/` 기준
