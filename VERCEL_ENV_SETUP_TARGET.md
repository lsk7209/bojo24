# Vercel 환경 변수 설정 가이드 (지원 대상 Gemini 보완)

## ⚠️ 현재 상태

사이트에서 내용이 변경되지 않는 이유는 **Vercel 환경 변수가 설정되지 않았기 때문**입니다.

## 🔧 필수 환경 변수 설정

### 1. Vercel 대시보드 접속
- https://vercel.com/dashboard
- 프로젝트 선택

### 2. Environment Variables 설정
- Settings → Environment Variables 클릭

### 3. 다음 환경 변수 추가/확인

#### 필수 환경 변수 1: GEMINI_API_KEY
```
이름: GEMINI_API_KEY
값: [Google AI Studio에서 발급한 API 키]
환경: Production, Preview, Development (모두 선택)
```

#### 필수 환경 변수 2: GEMINI_ENHANCEMENT_ALLOWED_IDS
```
이름: GEMINI_ENHANCEMENT_ALLOWED_IDS
값: 305000000283
환경: Production, Preview, Development (모두 선택)
```

**설명:**
- `305000000283` - (국가유공자)인플루엔자 백신 및 접종 지원
- 여러 ID를 추가하려면: `305000000283,305000000284,305000000285`

### 4. 재배포
- 환경 변수 추가 후 **반드시 재배포** 필요
- Deployments 탭 → 최신 배포 → "Redeploy" 클릭
- 또는 GitHub에 새 커밋 푸시

## 🔍 확인 방법

### 배포 후 확인
1. 재배포 완료 대기 (약 2-3분)
2. 해당 페이지 접속:
   ```
   https://www.bojo24.kr/benefit/보건·의료/305000000283
   ```
3. **지원 대상** 섹션 확인:
   - ✅ **변경됨**: 100~150자의 상세한 설명 표시
   - ❌ **변경 안 됨**: "관내 지역주민 중 국가유공자 본인" (18자)만 표시

### 예상 결과

**변경 전 (공공데이터만):**
```
관내 지역주민 중 국가유공자 본인
```

**변경 후 (Gemini 보완):**
```
서울특별시 동대문구에 거주하시는 국가유공자 본인이라면, 인플루엔자 백신 및 접종 지원 대상이 되실 수 있습니다. 
이 지원은 현재 별도의 나이, 소득 제한 없이 동대문구에 거주하시는 국가유공자 본인을 대상으로 하고 있습니다.
따라서, 동대문구에 주민등록이 되어 있으시면서 국가유공자 신분을 가지고 계신 분이라면 이 지원을 받으실 수 있습니다.
```

## 🐛 문제 해결

### 문제 1: 여전히 변경되지 않음

**확인 사항:**
1. ✅ `GEMINI_API_KEY` 설정됨?
2. ✅ `GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283` 설정됨?
3. ✅ 재배포 완료됨?
4. ✅ 브라우저 캐시 삭제 후 새로고침?

**해결 방법:**
- Vercel Functions 로그 확인
- 배포 로그에서 에러 확인
- 환경 변수가 올바르게 설정되었는지 재확인

### 문제 2: Gemini API 에러

**확인 사항:**
- `GEMINI_API_KEY`가 유효한지 확인
- Google AI Studio에서 API 키 확인
- API 할당량 확인

## 📝 체크리스트

배포 전 확인:
- [ ] `GEMINI_API_KEY` Vercel에 설정됨
- [ ] `GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283` Vercel에 설정됨
- [ ] 모든 환경(Production, Preview, Development)에 적용됨
- [ ] 재배포 실행됨

배포 후 확인:
- [ ] 재배포 완료됨
- [ ] 해당 페이지 접속
- [ ] 지원 대상 섹션이 100~150자로 표시됨

## 💡 빠른 테스트

로컬에서 테스트하려면 `.env` 파일에 추가:

```env
GEMINI_API_KEY=your-api-key-here
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283
```

그 다음:
```bash
npm run dev
```

로컬에서 해당 페이지 접속하여 확인

