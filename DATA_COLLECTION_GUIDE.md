# 데이터 수집 가이드

## 현재 상태 확인

데이터 수집 전 현재 상태를 확인하세요:

```bash
npm run check:data
```

이 명령어는 다음을 확인합니다:
- Supabase에 저장된 보조금 데이터 개수
- AI 요약/FAQ 생성 여부
- 카테고리별 통계
- 최근 업데이트 날짜

## 로컬 환경 변수 설정

로컬에서 스크립트를 실행하려면 `.env` 파일이 필요합니다.

### 1. .env 파일 생성

```bash
cp ENV_SAMPLE.txt .env
```

### 2. .env 파일 수정

Vercel 대시보드에서 환경 변수를 복사하여 `.env` 파일에 입력:

```env
# Supabase (Vercel에서 복사)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Gemini AI (Vercel에서 복사)
GEMINI_API_KEY=your-gemini-api-key

# 공공데이터 (Vercel에서 복사)
PUBLICDATA_SERVICE_KEY_ENC=your-encoded-key
PUBLICDATA_BASE_URL=https://api.odcloud.kr/api/gov24/v3

# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

## 데이터 수집 방법

### 방법 1: 로컬에서 실행 (권장 - 초기 수집)

```bash
# 1. 환경 변수 확인
npm run validate-env

# 2. 데이터 상태 확인
npm run check:data

# 3. 데이터 수집 실행
npm run fetch:benefits
```

**예상 시간**: 
- 데이터 양에 따라 수 시간 소요
- 1000개 보조금 기준 약 1-2시간

### 방법 2: GitHub Actions로 실행 (자동화)

1. GitHub Secrets 설정 확인
2. Repository > Actions > "Data Sync (Scheduled)"
3. "Run workflow" 클릭

## 데이터 수집 프로세스

### 1단계: 목록 수집
- 공공데이터 API에서 전체 보조금 목록 수집
- 페이지별로 순차 수집

### 2단계: 상세 정보 수집
- 각 보조금의 상세 정보 수집
- 지원 조건 정보 수집
- 배치 단위로 처리 (30개씩)

### 3단계: 데이터베이스 저장
- Supabase `benefits` 테이블에 저장
- 중복 방지 (upsert 사용)

## 진행 상황 모니터링

수집 중 다음 정보가 표시됩니다:

```
목록 수집 진행: 10/50 페이지
[5/20] 배치 완료. 누적 저장: 150건 (75%)
```

## 문제 해결

### 환경 변수 오류
- `.env` 파일 확인
- Vercel 대시보드에서 값 복사
- `npm run validate-env` 실행

### API 오류
- 공공데이터 서비스 키 확인
- URL 인코딩 확인 (`+` → `%2B`, `=` → `%3D`)
- 딜레이 증가 (`PUBLICDATA_DELAY_MS`)

### 데이터베이스 오류
- Supabase 연결 확인
- RLS 정책 확인
- 테이블 존재 확인

## 다음 단계

데이터 수집 완료 후:

1. **AI 요약 생성** (선택):
   ```bash
   npm run gen:gemini
   ```

2. **사이트 확인**:
   - 배포된 사이트에서 보조금 목록 확인
   - 상세페이지 확인

3. **Google Search Console 등록**:
   - Sitemap 제출
   - 구조화된 데이터 검증

---

**팁**: 대량 데이터 수집 시 `PUBLICDATA_MAX_PAGES` 환경 변수로 페이지 수를 제한할 수 있습니다.

