# Gemini 보완 수동 제어 가이드

## 🎯 개요

Gemini 보완 기능을 **자동으로 모든 페이지에 적용하지 않고**, **수동으로 특정 보조금에만 적용**할 수 있도록 변경했습니다.

## ⚙️ 설정 방법

### 방법 1: 환경 변수로 특정 보조금 ID만 활성화 (권장)

Vercel 환경 변수에 다음을 추가:

```bash
# 특정 보조금 ID만 Gemini 보완 활성화 (쉼표로 구분)
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283,305000000284,305000000285
```

**예시:**
- `305000000283` - (국가유공자)인플루엔자 백신 및 접종 지원
- 이 ID의 보조금만 Gemini 보완이 적용됩니다.

### 방법 2: 전역 활성화 (모든 페이지에 적용)

```bash
# 모든 보조금에 Gemini 보완 활성화
GEMINI_ENHANCEMENT_ENABLED=true
```

⚠️ **주의**: 이 방법은 모든 페이지에서 Gemini API를 호출하므로 비용이 발생합니다.

### 방법 3: 완전 비활성화 (기본값)

환경 변수를 설정하지 않으면:
- ✅ 공공데이터만 사용
- ❌ Gemini 보완 비활성화
- 💰 비용 없음

## 📋 사용 시나리오

### 시나리오 1: 1개 보조금만 테스트

1. Vercel 환경 변수 설정:
   ```
   GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283
   ```

2. 해당 페이지 접속:
   ```
   https://www.bojo24.kr/benefit/보건·의료/305000000283
   ```

3. Gemini 보완된 내용 확인

4. 마음에 들면 다른 ID 추가:
   ```
   GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283,305000000284,305000000285
   ```

### 시나리오 2: 여러 보조금 점진적 적용

1. 첫 번째 보조금 테스트
   ```
   GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283
   ```

2. 결과 확인 후 두 번째 추가
   ```
   GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283,305000000284
   ```

3. 반복하여 점진적 확대

## 🔍 확인 방법

### 개발 환경에서 확인

로컬에서 테스트할 경우 `.env` 파일에 추가:

```env
GEMINI_API_KEY=your-api-key
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283
```

### 프로덕션에서 확인

1. Vercel 대시보드 → Environment Variables
2. `GEMINI_ENHANCEMENT_ALLOWED_IDS` 추가
3. 재배포
4. 해당 페이지 접속하여 확인

## 📊 현재 상태

### 기본 동작 (환경 변수 없음)
- ✅ 공공데이터만 사용
- ❌ Gemini 보완 비활성화
- 💰 비용 없음

### 활성화된 경우
- ✅ 공공데이터 + Gemini 보완
- ✅ 상세하고 사용자 친화적인 내용
- 💰 Gemini API 비용 발생

## 🛠️ 관리자 페이지에서 수동 재생성 (향후 구현)

향후 관리자 페이지에서:
1. 특정 보조금 선택
2. "Gemini 보완 재생성" 버튼 클릭
3. 결과 확인 후 적용/취소

현재는 환경 변수로만 제어 가능합니다.

## ⚠️ 주의사항

1. **비용 관리**
   - Gemini API는 사용량에 따라 비용 발생
   - 특정 ID만 활성화하여 비용 제어

2. **재배포 필요**
   - 환경 변수 변경 후 Vercel 재배포 필요

3. **캐싱**
   - 현재는 매 요청마다 새로 생성
   - 향후 캐싱 기능 추가 예정

## 📝 예시

### 테스트용 설정

```env
# .env (로컬) 또는 Vercel Environment Variables
GEMINI_API_KEY=your-api-key-here
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283
```

### 프로덕션 설정 (여러 보조금)

```env
GEMINI_API_KEY=your-api-key-here
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283,305000000284,305000000285,305000000286
```

## 🚀 다음 단계

1. **1개 보조금 테스트**
   - `GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283` 설정
   - 페이지 확인

2. **결과 평가**
   - 내용 품질 확인
   - 사용자 경험 평가

3. **점진적 확대**
   - 마음에 들면 다른 ID 추가
   - 단계적으로 확대

