# Gemini 보완 즉시 적용 가이드

## 🚨 현재 문제

사이트에서 여전히 "관내 지역주민 중 국가유공자 본인" (18자)로 표시됩니다.

## ✅ 해결 방법

### 방법 1: Vercel 환경 변수 설정 (프로덕션)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Environment Variables 추가**
   - Settings → Environment Variables
   - 다음 환경 변수 추가:

   ```
   이름: GEMINI_ENHANCEMENT_ALLOWED_IDS
   값: 305000000283
   환경: Production, Preview, Development (모두 선택)
   ```

3. **재배포 필수**
   - 환경 변수 추가 후 **반드시 재배포**
   - Deployments → 최신 배포 → "Redeploy" 클릭

### 방법 2: 로컬 테스트 (개발 환경)

`.env` 파일에 추가:

```env
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283
```

그 다음:
```bash
npm run dev
```

## 🔍 확인 방법

### 로컬에서 테스트

```bash
npm run test:single
```

**예상 결과:**
- ✅ `GEMINI_ENHANCEMENT_ALLOWED_IDS: ✅ 설정됨` 표시
- ✅ Gemini 보완 성공 메시지
- ✅ 100~150자 결과 표시

### 프로덕션에서 확인

1. Vercel 환경 변수 설정 확인
2. 재배포 완료 대기
3. 해당 페이지 접속:
   ```
   https://www.bojo24.kr/benefit/보건·의료/305000000283
   ```
4. **지원 대상** 섹션 확인:
   - ✅ 변경됨: 100~150자의 상세한 설명
   - ❌ 변경 안 됨: "관내 지역주민 중 국가유공자 본인" (18자)

## ⚠️ 중요 사항

1. **환경 변수 이름 정확히 확인**
   - `GEMINI_ENHANCEMENT_ALLOWED_IDS` (대소문자 구분)
   - 값: `305000000283` (쉼표 없이)

2. **재배포 필수**
   - 환경 변수 추가만으로는 적용 안 됨
   - 반드시 재배포 필요

3. **모든 환경에 적용**
   - Production, Preview, Development 모두 선택

## 🐛 문제 해결

### 여전히 변경되지 않음

1. **Vercel 환경 변수 재확인**
   - Settings → Environment Variables
   - `GEMINI_ENHANCEMENT_ALLOWED_IDS` 값 확인
   - `305000000283` 정확히 입력되었는지 확인

2. **재배포 확인**
   - Deployments 탭에서 최신 배포 확인
   - 환경 변수 추가 후 재배포되었는지 확인

3. **브라우저 캐시 삭제**
   - Ctrl + Shift + R (강력 새로고침)
   - 또는 시크릿 모드에서 접속

4. **Vercel Functions 로그 확인**
   - Vercel 대시보드 → Functions 탭
   - 최근 함수 실행 로그 확인
   - 에러 메시지 확인

## 📝 체크리스트

- [ ] `GEMINI_API_KEY` Vercel에 설정됨
- [ ] `GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283` Vercel에 설정됨
- [ ] 모든 환경(Production, Preview, Development)에 적용됨
- [ ] 환경 변수 추가 후 재배포 완료됨
- [ ] 해당 페이지 접속하여 확인
- [ ] 지원 대상 섹션이 100~150자로 표시됨

