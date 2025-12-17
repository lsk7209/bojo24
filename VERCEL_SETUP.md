# Vercel 배포 설정 가이드

이 문서는 Vercel에서 bojo24 프로젝트를 배포하는 상세 가이드를 제공합니다.

## 🚀 빠른 시작

### 1. Vercel 프로젝트 생성

#### 방법 A: GitHub Integration (권장)

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택 및 Import
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `next build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm ci` (권장)

#### 방법 B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

## 🔐 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

### 필수 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGc...` |
| `SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhbGc...` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIza...` |
| `PUBLICDATA_SERVICE_KEY_ENC` | 공공데이터 인코딩된 키 | `Dc%2Bm2...%3D%3D` |

### 선택 환경 변수

| 변수명 | 기본값 | 설명 |
|--------|-------|------|
| `PUBLICDATA_BASE_URL` | `https://api.odcloud.kr/api/gov24/v3` | 공공데이터 API URL |
| `PUBLICDATA_DELAY_MS` | `600` | API 호출 딜레이 (ms) |
| `PUBLICDATA_PAGE_SIZE` | `100` | 페이지당 항목 수 |
| `PUBLICDATA_MAX_PAGES` | `null` | 최대 페이지 수 (null = 전체) |
| `NEXT_PUBLIC_SITE_URL` | `https://bojo24.vercel.app` | 사이트 URL (SEO용) |

### 환경별 설정

Vercel은 다음 환경별로 변수를 설정할 수 있습니다:

- **Production**: 프로덕션 배포
- **Preview**: PR/브랜치별 프리뷰
- **Development**: 로컬 개발

설정 방법:
1. Project Settings > Environment Variables
2. 각 변수에 대해 환경 선택
3. Save

## 🌍 리전 설정

Vercel은 자동으로 최적의 리전을 선택하지만, `vercel.json`에서 명시적으로 설정할 수 있습니다:

```json
{
  "regions": ["icn1"]  // 서울 리전 (한국 사용자 최적화)
}
```

## ⚡ 빌드 최적화

### 빌드 캐시

Vercel은 자동으로 다음을 캐시합니다:
- `node_modules` (npm ci 사용 시)
- `.next/cache`

### 빌드 시간 단축

1. **의존성 최소화**: 불필요한 패키지 제거
2. **TypeScript**: `skipLibCheck: true` 사용
3. **이미지 최적화**: Next.js Image 컴포넌트 사용

## 🔍 모니터링

### 배포 상태 확인

1. Vercel 대시보드 > Deployments
2. 각 배포의 상태, 로그, 성능 메트릭 확인

### 함수 로그

1. Deployments > 특정 배포 선택
2. Functions 탭에서 서버리스 함수 로그 확인

### 성능 분석

1. Analytics 탭에서:
   - 페이지뷰
   - 방문자 수
   - 성능 메트릭 (LCP, FID, CLS)

## 🐛 문제 해결

### 빌드 실패

**증상**: 배포가 실패하고 빌드 에러 발생

**해결 방법**:
1. 로컬에서 빌드 테스트:
   ```bash
   npm run build
   ```
2. 환경 변수 확인:
   ```bash
   vercel env ls
   ```
3. 빌드 로그 확인 (Vercel 대시보드)

### 환경 변수 누락

**증상**: 런타임 에러 "환경 변수가 설정되지 않았습니다"

**해결 방법**:
1. Vercel 대시보드 > Environment Variables 확인
2. 필수 변수가 모두 설정되었는지 확인
3. 환경별 설정 확인 (Production/Preview)

### 함수 타임아웃

**증상**: API 요청이 타임아웃

**해결 방법**:
1. `vercel.json`에서 함수 타임아웃 증가:
   ```json
   {
     "functions": {
       "src/app/**/*.ts": {
         "maxDuration": 60
       }
     }
   }
   ```
2. Vercel Pro 플랜 필요 (Hobby는 10초 제한)

## 🔄 자동 배포

### GitHub Integration

기본적으로 다음이 자동 배포됩니다:

- **Production**: `main` 브랜치 푸시 시
- **Preview**: 다른 브랜치/PR 생성 시

### 배포 설정 변경

1. Project Settings > Git
2. Production Branch 설정
3. Ignored Build Step 설정 (선택적)

## 📊 성능 최적화

### Edge Functions

Vercel Edge Functions를 사용하려면:

```typescript
export const runtime = 'edge';
```

### 이미지 최적화

Next.js Image 컴포넌트 사용:
- 자동 WebP/AVIF 변환
- 자동 리사이징
- CDN 캐싱

### 정적 페이지 생성

ISR (Incremental Static Regeneration) 사용:
```typescript
export const revalidate = 3600; // 1시간마다 재생성
```

## 🔐 보안

### 환경 변수 보호

- ✅ Vercel 대시보드에서만 관리
- ✅ 절대 코드에 하드코딩하지 않음
- ✅ `.env` 파일은 `.gitignore`에 포함

### 헤더 설정

`vercel.json`에서 보안 헤더 설정:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## 📚 참고 자료

- [Vercel 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel 환경 변수](https://vercel.com/docs/concepts/projects/environment-variables)

