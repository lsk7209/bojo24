# Vercel 환경 변수 디버깅 방법

## 🔍 Functions 탭이 없는 경우

Vercel의 UI가 변경되었거나, Functions 탭이 다른 위치에 있을 수 있습니다. 다음 방법들을 시도해보세요:

## 방법 1: Deployments 로그 확인

1. **Vercel 대시보드** → 프로젝트 선택
2. **Deployments** 탭 클릭
3. **최신 배포** 선택 (상단의 가장 최근 배포)
4. **Build Logs** 또는 **Runtime Logs** 확인
5. `[Gemini Debug]`로 시작하는 메시지 검색

## 방법 2: 디버그 API 엔드포인트 사용 (추천)

배포 완료 후 다음 URL로 접속:

```
https://www.bojo24.kr/api/debug-env
```

또는

```
https://bojo24.vercel.app/api/debug-env
```

**예상 응답:**
```json
{
  "geminiApiKey": "✅ 설정됨" 또는 "❌ 설정 안 됨",
  "geminiEnhancementAllowedIds": "305000000283" 또는 "❌ 설정 안 됨",
  "allowedIdsArray": ["305000000283"],
  "isBenefitAllowed": true 또는 false,
  "benefitId": "305000000283",
  "nodeEnv": "production",
  "timestamp": "2025-01-XX..."
}
```

### 해석

#### ✅ 정상 작동
```json
{
  "geminiApiKey": "✅ 설정됨",
  "geminiEnhancementAllowedIds": "305000000283",
  "isBenefitAllowed": true
}
```
→ 환경 변수가 정상적으로 설정되어 있습니다.

#### ❌ 문제 발견
```json
{
  "geminiApiKey": "✅ 설정됨",
  "geminiEnhancementAllowedIds": "❌ 설정 안 됨",
  "isBenefitAllowed": false
}
```
→ `GEMINI_ENHANCEMENT_ALLOWED_IDS` 환경 변수가 설정되지 않았습니다.

**해결 방법:**
1. Vercel 대시보드 → Settings → Environment Variables
2. 다음 환경 변수 추가:
   ```
   이름: GEMINI_ENHANCEMENT_ALLOWED_IDS
   값: 305000000283
   환경: Production, Preview, Development (모두 선택)
   ```
3. 재배포: Deployments → 최신 배포 → "Redeploy"

## 방법 3: Vercel CLI 사용 (선택사항)

로컬에서 Vercel CLI를 설치하고 로그 확인:

```bash
npm i -g vercel
vercel login
vercel logs --follow
```

## 방법 4: 환경 변수 직접 확인

1. **Vercel 대시보드** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수들이 **모두** 설정되어 있는지 확인:
   - `GEMINI_API_KEY` ✅
   - `GEMINI_ENHANCEMENT_ALLOWED_IDS` ✅ (값: `305000000283`)
4. 각 변수의 **환경** 확인:
   - Production ✅
   - Preview ✅
   - Development ✅

## 🚨 가장 흔한 문제

### 문제: 환경 변수는 설정했는데 작동 안 함

**원인:**
- 환경 변수 추가 후 **재배포를 하지 않음**
- 특정 환경(예: Production만)에만 설정하고 다른 환경에는 설정 안 함

**해결:**
1. 모든 환경(Production, Preview, Development)에 설정
2. **반드시 재배포** 실행:
   - Deployments → 최신 배포 → "Redeploy"
   - 또는 새 커밋 푸시

## ✅ 빠른 확인 체크리스트

1. [ ] `https://www.bojo24.kr/api/debug-env` 접속하여 환경 변수 확인
2. [ ] `isBenefitAllowed: true`인지 확인
3. [ ] `geminiEnhancementAllowedIds`에 값이 있는지 확인
4. [ ] Vercel Settings에서 환경 변수 재확인
5. [ ] 재배포 완료 대기 (2-3분)
6. [ ] 해당 페이지 접속하여 내용 확인

## 📝 다음 단계

1. **디버그 API 확인**: `https://www.bojo24.kr/api/debug-env`
2. **결과 공유**: 어떤 값이 나오는지 확인
3. **문제 해결**: 환경 변수 설정 또는 재배포

