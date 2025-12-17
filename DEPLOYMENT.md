# 배포 가이드 (Vercel + Supabase + GitHub)

이 문서는 bojo24 프로젝트를 Vercel, Supabase, GitHub 환경에서 배포하는 방법을 설명합니다.

## 📋 사전 준비

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 다음 정보 확인:
   - Project URL (`SUPABASE_URL`)
   - API Keys:
     - `anon` key (`SUPABASE_ANON_KEY`)
     - `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`)

3. SQL 에디터에서 `SUPABASE_ADMIN_SETUP.sql` 실행:
   ```sql
   -- 관리자 설정 테이블 및 방문자 로그 테이블 생성
   -- RLS 정책 설정
   ```

4. `benefits` 테이블 생성:
   ```sql
   CREATE TABLE IF NOT EXISTS benefits (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     category TEXT,
     governing_org TEXT,
     detail_json JSONB,
     last_updated_at TIMESTAMPTZ,
     gemini_summary TEXT,
     gemini_faq_json JSONB
   );
   
   -- RLS 정책 설정
   ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Public read benefits" ON benefits FOR SELECT USING (true);
   ```

### 2. GitHub 저장소 설정

1. GitHub에 저장소 푸시
2. Settings > Secrets and variables > Actions에서 다음 Secrets 추가:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `PUBLICDATA_SERVICE_KEY_ENC`
   - `PUBLICDATA_BASE_URL` (선택)
   - `NEXT_PUBLIC_SITE_URL` (선택)

### 3. Vercel 배포 설정

#### 방법 1: Vercel GitHub Integration (권장)

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택 및 Import
4. 환경 변수 설정:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=your-gemini-key
   PUBLICDATA_SERVICE_KEY_ENC=your-encoded-key
   PUBLICDATA_BASE_URL=https://api.odcloud.kr/api/gov24/v3
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```
5. "Deploy" 클릭

#### 방법 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

환경 변수는 Vercel 대시보드에서 설정하거나:
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... 등등
```

## 🚀 배포 후 작업

### 1. 초기 데이터 수집

로컬에서 실행:
```bash
npm install
npm run fetch:benefits
```

또는 GitHub Actions를 통해:
- Repository > Actions > "Data Sync (Scheduled)" > "Run workflow"

### 2. AI 요약 생성

로컬에서 실행:
```bash
npm run gen:gemini
```

또는 GitHub Actions를 통해 자동 실행 (데이터 수집 후)

### 3. 도메인 설정 (선택)

1. Vercel 프로젝트 설정 > Domains
2. 커스텀 도메인 추가
3. DNS 설정 완료 후 `NEXT_PUBLIC_SITE_URL` 업데이트

## 🔄 자동화 워크플로우

### GitHub Actions

프로젝트에는 다음 워크플로우가 포함되어 있습니다:

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - 코드 푸시 시 자동 실행
   - Lint, Type Check, Build 검증

2. **Data Sync** (`.github/workflows/data-sync.yml`)
   - 매일 자동 실행 (한국 시간 오전 2시)
   - 보조금 데이터 수집 및 AI 요약 생성

3. **Daily Blog Post** (`.github/workflows/daily-post.yml`)
   - 매일 블로그 포스트 생성

### Vercel 자동 배포

- `main` 브랜치에 푸시 시 자동 배포
- Preview 배포는 PR 생성 시 자동 생성

## 🔧 환경 변수 체크리스트

### 필수 환경 변수

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `PUBLICDATA_SERVICE_KEY_ENC`

### 선택 환경 변수

- [ ] `PUBLICDATA_BASE_URL` (기본값 사용 가능)
- [ ] `PUBLICDATA_DELAY_MS` (기본값: 600)
- [ ] `PUBLICDATA_PAGE_SIZE` (기본값: 100)
- [ ] `PUBLICDATA_MAX_PAGES` (기본값: null, 전체 수집)
- [ ] `NEXT_PUBLIC_SITE_URL` (SEO용)

## 🐛 문제 해결

### 빌드 실패

1. 환경 변수 확인:
   ```bash
   vercel env ls
   ```

2. 로컬 빌드 테스트:
   ```bash
   npm run build
   ```

### 데이터 수집 실패

1. 공공데이터 API 키 확인
2. Supabase 연결 확인:
   ```bash
   npm run fetch:benefits
   ```

### AI 요약 생성 실패

1. Gemini API 키 확인
2. Rate Limit 확인 (1.5초 딜레이 포함)

## 📊 모니터링

- **Vercel**: 배포 상태, 함수 로그, 성능 메트릭
- **Supabase**: 데이터베이스 로그, API 사용량
- **GitHub Actions**: 워크플로우 실행 상태

## 🔐 보안 주의사항

1. **절대 커밋하지 말 것:**
   - `.env` 파일
   - 환경 변수 값
   - API 키

2. **Vercel 환경 변수:**
   - Production, Preview, Development 환경별로 설정 가능
   - Sensitive 변수는 암호화되어 저장

3. **Supabase RLS:**
   - 클라이언트는 `SUPABASE_ANON_KEY`만 사용
   - `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드 전용

## 📚 참고 자료

- [Vercel 문서](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)

