# Gemini 보완 기능 디버깅 가이드

## 🚨 현재 문제

사이트에서 여전히 "관내 지역주민 중 국가유공자 본인" (18자)로 표시됩니다.

## 🔍 디버깅 단계

### 1. Vercel 환경 변수 확인

**필수 환경 변수:**
```
GEMINI_API_KEY=your-api-key
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283
```

**확인 방법:**
1. Vercel 대시보드 → Settings → Environment Variables
2. 다음 변수들이 **모든 환경**에 설정되어 있는지 확인:
   - Production ✅
   - Preview ✅
   - Development ✅

### 2. Vercel Functions 로그 확인

배포 후 Vercel Functions 로그에서 디버그 메시지 확인:

1. Vercel 대시보드 → 프로젝트 → Functions 탭
2. 최근 함수 실행 로그 확인
3. 다음 메시지들을 찾아보세요:

```
[Gemini Debug] benefitId: 305000000283, isAllowed: true/false, hasApiKey: true/false
[Gemini Debug] enhanceTarget - benefitId: 305000000283, isEnabled: true/false
```

**예상 시나리오:**

#### 시나리오 1: 환경 변수 미설정
```
[Gemini Debug] benefitId: 305000000283, isAllowed: false, hasApiKey: true
[Gemini Debug] enhanceTarget - 비활성화됨. GEMINI_ENHANCEMENT_ALLOWED_IDS: 없음
```
**해결:** `GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283` 추가 후 재배포

#### 시나리오 2: API 키 미설정
```
[Gemini Debug] benefitId: 305000000283, isAllowed: true, hasApiKey: false
[Gemini Debug] enhanceTarget - Gemini 모델 초기화 실패
```
**해결:** `GEMINI_API_KEY` 추가 후 재배포

#### 시나리오 3: 정상 작동
```
[Gemini Debug] benefitId: 305000000283, isAllowed: true, hasApiKey: true
[Gemini Debug] enhanceTarget - Gemini API 호출 시작
✅ 지원 대상 Gemini 보완 완료: 144자
```

### 3. 환경 변수 설정 체크리스트

- [ ] `GEMINI_API_KEY` 설정됨 (모든 환경)
- [ ] `GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283` 설정됨 (모든 환경)
- [ ] 환경 변수 추가 후 **재배포 완료**
- [ ] Vercel Functions 로그에서 디버그 메시지 확인
- [ ] 해당 페이지 접속하여 내용 확인

### 4. 수동 재배포

환경 변수를 추가/수정한 경우:

1. Vercel 대시보드 → Deployments
2. 최신 배포 선택
3. "Redeploy" 클릭
4. 배포 완료 대기 (약 2-3분)

### 5. 브라우저 캐시 클리어

변경사항이 반영되지 않으면:

- **강력 새로고침**: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
- **시크릿 모드**에서 접속하여 확인

## 📝 환경 변수 설정 예시

Vercel 대시보드에서:

```
이름: GEMINI_ENHANCEMENT_ALLOWED_IDS
값: 305000000283
환경: Production, Preview, Development (모두 선택)
```

**주의사항:**
- 쉼표로 여러 ID를 구분할 수 있습니다: `305000000283,305000000284`
- 공백 없이 정확히 입력하세요
- 모든 환경에 적용해야 합니다

## 🐛 문제 해결 순서

1. **Vercel 환경 변수 확인** (가장 중요!)
2. **재배포 실행**
3. **Vercel Functions 로그 확인**
4. **디버그 메시지 분석**
5. **필요시 환경 변수 재설정**
6. **브라우저 캐시 클리어 후 재확인**

## ✅ 성공 확인

다음 페이지에서:
```
https://www.bojo24.kr/benefit/보건·의료/305000000283
```

**지원 대상** 섹션이 다음과 같이 표시되면 성공:
- ✅ 100~150자의 상세한 설명
- ✅ "서울특별시 동대문구에 거주하는 국가유공자 본인이라면..." 형태

**실패 시:**
- ❌ "관내 지역주민 중 국가유공자 본인" (18자) - 원본 그대로

