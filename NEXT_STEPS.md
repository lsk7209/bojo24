# 다음 단계 가이드

이 문서는 bojo24 프로젝트를 완전히 운영 가능한 상태로 만들기 위한 단계별 가이드를 제공합니다.

## ✅ 완료된 작업

- [x] Vercel, Supabase, GitHub 환경 최적화
- [x] SEO, GEO, AEO 최적화
- [x] AdSense 승인 준비 (필수 페이지, 광고 컴포넌트)
- [x] 템플릿 시스템 구축
- [x] 고유 컨텐츠 생성 시스템

## 🚀 다음 단계 (우선순위 순)

### 1단계: 데이터베이스 설정 (필수)

#### Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL 및 API 키 확인

#### 스키마 실행
Supabase SQL Editor에서 다음 파일들을 순서대로 실행:

```sql
-- 1. 기본 스키마
-- SUPABASE_ADMIN_SETUP.sql 실행

-- 2. 메인 스키마
-- SUPABASE_SCHEMA.sql 실행

-- 3. 템플릿 시스템 스키마
-- SUPABASE_TEMPLATE_SCHEMA.sql 실행
```

**확인 사항**:
- `benefits` 테이블 생성 확인
- `posts` 테이블 생성 확인
- `benefit_content` 테이블 생성 확인
- `content_templates` 테이블 생성 확인
- RLS 정책 설정 확인

### 2단계: 환경 변수 설정 (필수)

#### 로컬 개발 환경
`.env` 파일 생성:

```bash
cp ENV_SAMPLE.txt .env
```

`.env` 파일 수정:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# 공공데이터
PUBLICDATA_SERVICE_KEY_ENC=your-encoded-key
PUBLICDATA_BASE_URL=https://api.odcloud.kr/api/gov24/v3

# 사이트 URL (SEO용)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

#### Vercel 환경 변수
Vercel 대시보드 > Project Settings > Environment Variables에서 위 변수들 설정

#### GitHub Secrets
GitHub 저장소 > Settings > Secrets and variables > Actions에서 위 변수들 설정

### 3단계: 의존성 설치 및 빌드 테스트

```bash
# 의존성 설치
npm install

# 환경 변수 검증
npm run validate-env

# 타입 체크
npm run type-check

# 빌드 테스트
npm run build
```

### 4단계: 초기 데이터 수집

```bash
# 보조금 데이터 수집 (공공데이터 API → DB)
npm run fetch:benefits
```

**예상 시간**: 데이터 양에 따라 수 시간 소요
**확인 사항**:
- Supabase에서 `benefits` 테이블에 데이터 저장 확인
- 최소 20-30개 이상의 보조금 데이터 권장

### 5단계: AI 요약 생성

```bash
# AI 기반 3줄 요약 및 FAQ 생성
npm run gen:gemini
```

**예상 시간**: 20개당 약 1-2분
**확인 사항**:
- `benefits.gemini_summary` 필드에 요약 저장 확인
- `benefits.gemini_faq_json` 필드에 FAQ 저장 확인

### 6단계: 고유 컨텐츠 생성 (구글 인정용)

```bash
# 각 보조금마다 고유 컨텐츠 생성
npm run gen:content
```

**예상 시간**: 보조금당 약 10-15초
**확인 사항**:
- `benefit_content` 테이블에 컨텐츠 저장 확인
- 고유성 점수 70% 이상 권장
- 상세페이지에서 고유 컨텐츠 표시 확인

### 7단계: 배포 및 테스트

#### Vercel 배포
1. GitHub에 코드 푸시
2. Vercel 자동 배포 확인
3. 배포 URL 접속 테스트

#### 기능 테스트
- [ ] 홈페이지 로딩 확인
- [ ] 보조금 목록 페이지 확인
- [ ] 보조금 상세 페이지 확인
- [ ] 고유 컨텐츠 표시 확인
- [ ] FAQ 표시 확인
- [ ] 광고 표시 확인 (AdSense 승인 후)
- [ ] 개인정보처리방침 페이지 확인
- [ ] 이용약관 페이지 확인

### 8단계: AdSense 승인 신청

#### 사전 준비 확인
- [ ] 개인정보처리방침 페이지 존재 (`/privacy`)
- [ ] 이용약관 페이지 존재 (`/terms`)
- [ ] ads.txt 파일 존재 (`/ads.txt`)
- [ ] 충분한 컨텐츠 (최소 20-30페이지)
- [ ] 고유 컨텐츠 생성 완료
- [ ] 반응형 디자인 확인
- [ ] 빠른 로딩 속도 확인

#### AdSense 계정 설정
1. [Google AdSense](https://www.google.com/adsense) 접속
2. 계정 생성 및 사이트 등록
3. Publisher ID 확인: `ca-pub-3050601904412736`
4. 광고 단위 생성 및 슬롯 ID 확인

#### 광고 슬롯 ID 교체
`src/app/benefit/[category]/[id]/page.tsx` 등에서:
```typescript
// 현재: "1234567890" (플레이스홀더)
// 실제 슬롯 ID로 교체 필요
<InlineAd adSlot="실제_슬롯_ID" />
```

#### 승인 신청
1. AdSense 대시보드에서 승인 신청
2. 검토 대기 (보통 1-2주)
3. 승인 후 광고 활성화

### 9단계: SEO 최적화 확인

#### Google Search Console
1. 사이트 등록
2. Sitemap 제출: `https://your-domain.com/sitemap.xml`
3. 구조화 데이터 확인

#### 구조화 데이터 검증
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

### 10단계: 모니터링 및 최적화

#### 정기 작업
- **매일**: 데이터 수집 (`npm run fetch:benefits`)
- **매일**: AI 요약 생성 (`npm run gen:gemini`)
- **주 2-3회**: 고유 컨텐츠 생성 (`npm run gen:content`)

#### GitHub Actions 자동화
- 이미 설정된 워크플로우 확인
- 스케줄 실행 확인

#### 성능 모니터링
- Vercel Analytics
- Google Analytics
- AdSense 대시보드
- Supabase 대시보드

## 📋 체크리스트

### 필수 작업 (배포 전)

- [ ] Supabase 프로젝트 생성 및 스키마 실행
- [ ] 환경 변수 설정 (로컬, Vercel, GitHub)
- [ ] 의존성 설치 및 빌드 테스트
- [ ] 초기 데이터 수집 (최소 20개)
- [ ] AI 요약 생성
- [ ] 고유 컨텐츠 생성 (최소 10개)
- [ ] Vercel 배포
- [ ] 기능 테스트

### 권장 작업 (운영 전)

- [ ] Google Search Console 등록
- [ ] Sitemap 제출
- [ ] 구조화 데이터 검증
- [ ] AdSense 승인 신청
- [ ] 광고 슬롯 ID 교체
- [ ] 모니터링 설정

### 지속적 작업 (운영 중)

- [ ] 정기 데이터 수집
- [ ] 정기 고유 컨텐츠 생성
- [ ] 성능 모니터링
- [ ] SEO 최적화
- [ ] 컨텐츠 품질 개선

## 🎯 우선순위별 실행 순서

### 즉시 실행 (필수)
1. Supabase 스키마 실행
2. 환경 변수 설정
3. 데이터 수집
4. 배포

### 단기 (1주일 내)
5. AI 요약 생성
6. 고유 컨텐츠 생성
7. AdSense 승인 신청
8. SEO 검증

### 중기 (1개월 내)
9. 모니터링 설정
10. 성능 최적화
11. 컨텐츠 품질 개선

## 📚 참고 문서

- [배포 가이드](./DEPLOYMENT.md)
- [환경 변수 설정](./ENV_SETUP.md)
- [AdSense 최적화](./ADSENSE_OPTIMIZATION.md)
- [고유 컨텐츠 가이드](./UNIQUE_CONTENT_GUIDE.md)
- [SEO 가이드](./SEO_GUIDE.md)

## ❓ 문제 해결

### 빌드 실패
- 환경 변수 확인: `npm run validate-env`
- 타입 에러 확인: `npm run type-check`

### 데이터 수집 실패
- 공공데이터 API 키 확인
- Supabase 연결 확인
- 딜레이 증가 (환경 변수)

### AI 생성 실패
- Gemini API 키 확인
- Rate Limit 확인
- 재시도

### 배포 실패
- Vercel 로그 확인
- 환경 변수 확인
- 빌드 로그 확인

---

**다음 단계**: 1단계부터 순서대로 진행하세요!

