# Vercel 환경 변수 설정 가이드

현재 Vercel에 Supabase 변수만 설정되어 있습니다. 다음 변수들을 추가해야 합니다.

## ✅ 이미 설정된 변수

- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

## ❌ 추가 필요한 변수

### 필수 변수 (즉시 추가 필요)

#### 1. GEMINI_API_KEY
- **설명**: Google Gemini AI API 키 (AI 요약 및 고유 컨텐츠 생성용)
- **발급 방법**:
  1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
  2. "Create API Key" 클릭
  3. API 키 복사
- **예시**: `AIzaSy...` (길이: 약 39자)

#### 2. PUBLICDATA_SERVICE_KEY_ENC
- **설명**: 공공데이터포털 인코딩된 서비스 키 (보조금 데이터 수집용)
- **발급 방법**:
  1. [공공데이터포털](https://www.data.go.kr/) 접속
  2. 회원가입 및 로그인
  3. "보조금24" API 검색
  4. 활용신청 후 서비스 키 발급
  5. **URL 인코딩 필요**: `%` 기호가 포함된 형태
- **예시**: `Dc%2Bm2...%3D%3D` (인코딩된 형태)

### 선택 변수 (권장)

#### 3. NEXT_PUBLIC_SITE_URL
- **설명**: 배포된 사이트 URL (SEO 최적화용)
- **현재 배포 URL 확인**: Vercel 대시보드 > 프로젝트 > Domains
- **예시**: `https://bojo24.vercel.app` 또는 커스텀 도메인

#### 4. PUBLICDATA_BASE_URL (선택)
- **설명**: 공공데이터 API 기본 URL
- **기본값**: `https://api.odcloud.kr/api/gov24/v3`
- **설정 필요 없음** (기본값 사용)

#### 5. PUBLICDATA_DELAY_MS (선택)
- **설명**: API 호출 딜레이 (밀리초)
- **기본값**: `600`
- **설정 필요 없음** (기본값 사용)

## 📝 Vercel에 환경 변수 추가하는 방법

### 방법 1: Vercel 대시보드 (권장)

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 클릭
4. 각 변수 추가:
   - **Key**: 변수명 (예: `GEMINI_API_KEY`)
   - **Value**: 변수 값
   - **Environment**: `Production`, `Preview`, `Development` 모두 선택 (또는 Production만)
5. **Save** 클릭

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 로그인
vercel login

# 환경 변수 추가
vercel env add GEMINI_API_KEY
vercel env add PUBLICDATA_SERVICE_KEY_ENC
vercel env add NEXT_PUBLIC_SITE_URL production
```

## 🔑 API 키 발급 가이드

### Google Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Google 계정으로 로그인
3. "Get API Key" 또는 "Create API Key" 클릭
4. 프로젝트 선택 또는 새 프로젝트 생성
5. API 키 복사
6. Vercel 환경 변수에 추가

**참고**: 
- 무료 할당량: 분당 60회 요청
- 유료 플랜: 더 많은 할당량 제공

### 공공데이터 서비스 키 발급

1. [공공데이터포털](https://www.data.go.kr/) 접속
2. 회원가입 및 로그인
3. 검색창에 "보조금24" 검색
4. "보조금24 서비스 목록 조회" API 선택
5. "활용신청" 클릭
6. 신청 완료 후 서비스 키 확인
7. **URL 인코딩**: 
   - 원본 키: `Dc+Bm2...==`
   - 인코딩: `Dc%2Bm2...%3D%3D`
   - 온라인 인코더: https://www.urlencoder.org/

## ✅ 설정 완료 체크리스트

환경 변수 추가 후 확인:

- [ ] `GEMINI_API_KEY` 추가됨
- [ ] `PUBLICDATA_SERVICE_KEY_ENC` 추가됨
- [ ] `NEXT_PUBLIC_SITE_URL` 추가됨 (선택이지만 권장)
- [ ] 모든 변수가 **Production** 환경에 설정됨
- [ ] 변수 값이 올바르게 입력됨 (공백 없음)

## 🧪 환경 변수 검증

로컬에서 테스트하려면:

```bash
# 1. .env 파일 생성
cp ENV_SAMPLE.txt .env

# 2. .env 파일에 Vercel 환경 변수 값 입력
# (Vercel 대시보드에서 복사)

# 3. 검증
npm run validate-env
```

## 🚀 다음 단계

환경 변수 설정 완료 후:

1. **데이터 수집**:
   ```bash
   npm run fetch:benefits
   ```

2. **AI 요약 생성**:
   ```bash
   npm run gen:gemini
   ```

3. **고유 컨텐츠 생성**:
   ```bash
   npm run gen:content
   ```

## ⚠️ 주의사항

1. **API 키 보안**:
   - 절대 코드에 하드코딩하지 않음
   - GitHub에 커밋하지 않음
   - Vercel 대시보드에서만 관리

2. **공공데이터 키 인코딩**:
   - URL 인코딩 필수
   - `+` → `%2B`
   - `=` → `%3D`

3. **환경별 설정**:
   - Production: 실제 운영 환경
   - Preview: PR/브랜치별 프리뷰
   - Development: 로컬 개발

## 📚 참고 자료

- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Gemini API 문서](https://ai.google.dev/docs)
- [공공데이터포털 API 가이드](https://www.data.go.kr/)

---

**다음 단계**: 위 변수들을 Vercel에 추가한 후 데이터 수집을 시작하세요!

