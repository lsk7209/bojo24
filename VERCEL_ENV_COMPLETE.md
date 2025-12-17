# Vercel 환경 변수 완전 가이드

## 📋 현재 상황

- ✅ Vercel 호스팅 중
- ✅ Supabase 연결 완료
- ✅ GitHub 저장소 연결 완료
- ⚠️ 공공데이터 API 변수 미설정

## 🔑 환경 변수 구분

### 1. Vercel 환경 변수 (사이트 실행용)
**목적**: 배포된 사이트가 정상 작동하도록

### 2. GitHub Secrets (자동 수집용)
**목적**: GitHub Actions가 자동으로 데이터를 수집하도록

## ✅ Vercel에 필수로 설정해야 할 변수

### 현재 설정된 변수 (확인됨)
```bash
SUPABASE_URL=✅ 설정됨
SUPABASE_ANON_KEY=✅ 설정됨
SUPABASE_SERVICE_ROLE_KEY=✅ 설정됨
```

### 추가로 설정할 변수

#### 필수 (사이트 정상 작동용)
```bash
NEXT_PUBLIC_SITE_URL=https://bojo24.vercel.app
```

#### 선택 (공공데이터 API - 필요 시)
```bash
PUBLICDATA_SERVICE_KEY_ENC=Dc%2Bm2FOHT2MQxGmXnBE3Qbuw9V4H4hJB8nKKOL6JWfWYK0Tc48AwXm7AkzGDREokxi%2BG1LeRUrqQG6NagZQ%2BAA%3D%3D
PUBLICDATA_BASE_URL=https://api.odcloud.kr/api/gov24/v3
```

**참고**: 공공데이터 API 변수는 **사이트 실행에는 필수 아님**. 
- 이미 Supabase에 10,743개 데이터가 있으므로 사이트는 정상 작동합니다.
- 다만, Vercel에서도 데이터 수집을 하고 싶다면 설정하세요.

## 🚀 Vercel 환경 변수 설정 방법

### 방법 1: Vercel 대시보드에서 설정 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택: `bojo24`

2. **Settings 탭 클릭**
   - 좌측 메뉴에서 "Settings" 선택

3. **Environment Variables 클릭**
   - Settings 하위 메뉴에서 "Environment Variables" 선택

4. **변수 추가**
   - "Add New" 버튼 클릭
   - 다음 변수들을 하나씩 추가:

#### 필수 변수
```
Key: NEXT_PUBLIC_SITE_URL
Value: https://bojo24.vercel.app
Environment: Production, Preview, Development (모두 선택)
```

#### 선택 변수 (공공데이터 API)
```
Key: PUBLICDATA_SERVICE_KEY_ENC
Value: Dc%2Bm2FOHT2MQxGmXnBE3Qbuw9V4H4hJB8nKKOL6JWfWYK0Tc48AwXm7AkzGDREokxi%2BG1LeRUrqQG6NagZQ%2BAA%3D%3D
Environment: Production, Preview, Development (모두 선택)
```

```
Key: PUBLICDATA_BASE_URL
Value: https://api.odcloud.kr/api/gov24/v3
Environment: Production, Preview, Development (모두 선택)
```

5. **저장 후 재배포**
   - 변수 추가 후 "Save" 클릭
   - "Deployments" 탭에서 최신 배포를 "Redeploy" 클릭

### 방법 2: Vercel CLI로 설정

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 로그인
vercel login

# 환경 변수 추가
vercel env add NEXT_PUBLIC_SITE_URL
# 값 입력: https://bojo24.vercel.app
# 환경 선택: Production, Preview, Development

vercel env add PUBLICDATA_SERVICE_KEY_ENC
# 값 입력: Dc%2Bm2FOHT2MQxGmXnBE3Qbuw9V4H4hJB8nKKOL6JWfWYK0Tc48AwXm7AkzGDREokxi%2BG1LeRUrqQG6NagZQ%2BAA%3D%3D
# 환경 선택: Production, Preview, Development

vercel env add PUBLICDATA_BASE_URL
# 값 입력: https://api.odcloud.kr/api/gov24/v3
# 환경 선택: Production, Preview, Development
```

## 🔄 GitHub Secrets 설정 (자동 수집용)

GitHub Actions가 자동으로 데이터를 수집하려면 GitHub Secrets도 설정해야 합니다.

### GitHub Secrets 설정 방법

1. **GitHub 저장소 접속**
   - https://github.com/lsk7209/bojo24
   - Settings > Secrets and variables > Actions

2. **New repository secret 클릭**
   - 다음 변수들을 추가:

```bash
PUBLICDATA_SERVICE_KEY_ENC=Dc%2Bm2FOHT2MQxGmXnBE3Qbuw9V4H4hJB8nKKOL6JWfWYK0Tc48AwXm7AkzGDREokxi%2BG1LeRUrqQG6NagZQ%2BAA%3D%3D
PUBLICDATA_BASE_URL=https://api.odcloud.kr/api/gov24/v3
SUPABASE_URL=이미 설정되어 있을 수 있음 (확인 필요)
SUPABASE_SERVICE_ROLE_KEY=이미 설정되어 있을 수 있음 (확인 필요)
```

## 📊 환경 변수 용도 정리

| 변수 | Vercel | GitHub Secrets | 용도 |
|------|--------|----------------|------|
| `SUPABASE_URL` | ✅ 필수 | ✅ 필수 | Supabase 연결 |
| `SUPABASE_ANON_KEY` | ✅ 필수 | ❌ 불필요 | 클라이언트 연결 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 필수 | ✅ 필수 | 서버 연결 |
| `NEXT_PUBLIC_SITE_URL` | ✅ 필수 | ❌ 불필요 | SEO 최적화 |
| `PUBLICDATA_SERVICE_KEY_ENC` | ⚠️ 선택 | ✅ 필수 | 공공데이터 API |
| `PUBLICDATA_BASE_URL` | ⚠️ 선택 | ✅ 필수 | 공공데이터 API |
| `GEMINI_API_KEY` | ⚠️ 선택 | ⚠️ 선택 | AI 요약 생성 |

## ✅ 체크리스트

### Vercel 환경 변수
- [ ] `NEXT_PUBLIC_SITE_URL` 설정
- [ ] `PUBLICDATA_SERVICE_KEY_ENC` 설정 (선택)
- [ ] `PUBLICDATA_BASE_URL` 설정 (선택)

### GitHub Secrets
- [ ] `PUBLICDATA_SERVICE_KEY_ENC` 설정
- [ ] `PUBLICDATA_BASE_URL` 설정
- [ ] `SUPABASE_URL` 확인
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 확인

## 🎯 권장 설정 순서

### 1단계: 필수 설정 (즉시)
1. Vercel에 `NEXT_PUBLIC_SITE_URL` 추가
2. 재배포하여 사이트 정상 작동 확인

### 2단계: 자동 수집 설정 (선택)
1. GitHub Secrets에 공공데이터 API 변수 추가
2. GitHub Actions에서 수동 실행 테스트
3. 자동 스케줄링 확인

### 3단계: Vercel 공공데이터 변수 (선택)
- Vercel에서도 데이터 수집을 하고 싶다면 설정
- 대부분의 경우 GitHub Actions로 충분

## ⚠️ 주의사항

1. **공공데이터 API 키 보안**
   - 절대 코드에 직접 입력하지 마세요
   - 환경 변수로만 관리하세요

2. **환경별 설정**
   - Production, Preview, Development 모두 동일하게 설정 권장
   - 또는 Production만 설정해도 됩니다

3. **재배포 필요**
   - 환경 변수 추가 후 반드시 재배포해야 적용됩니다
   - Vercel은 자동으로 재배포하지 않습니다

## 🔍 현재 설정 확인 방법

### Vercel에서 확인
1. Vercel 대시보드 > 프로젝트 > Settings > Environment Variables
2. 설정된 변수 목록 확인

### GitHub에서 확인
1. GitHub 저장소 > Settings > Secrets and variables > Actions
2. 설정된 Secrets 목록 확인

---

**최종 업데이트**: 2025-01-27

