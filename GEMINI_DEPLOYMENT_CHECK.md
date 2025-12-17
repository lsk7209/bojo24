# Gemini 보완 기능 배포 확인 가이드

## 문제 상황

실제 사이트(https://www.bojo24.kr)에서 Gemini로 보완된 내용이 표시되지 않습니다.

## 가능한 원인

### 1. Vercel 환경 변수 미설정 ⚠️ (가장 가능성 높음)

**확인 방법:**
1. Vercel 대시보드 접속
2. 프로젝트 설정 → Environment Variables
3. `GEMINI_API_KEY` 확인

**해결 방법:**
- `GEMINI_API_KEY` 환경 변수를 Vercel에 추가
- 모든 환경(Production, Preview, Development)에 설정
- 재배포 필요

### 2. 최신 코드 미배포

**확인 방법:**
- GitHub에 최신 코드가 푸시되었는지 확인
- Vercel 배포 로그에서 최신 커밋 확인

**해결 방법:**
- `git push origin main` 실행
- Vercel 자동 배포 대기 또는 수동 재배포

### 3. Gemini API 호출 실패

**확인 방법:**
- Vercel 함수 로그 확인
- 개발 환경에서 로컬 테스트

**해결 방법:**
- API 키 유효성 확인
- 모델 이름 확인 (`gemini-2.5-flash-lite`)
- API 할당량 확인

## 디버깅 방법

### 로컬 테스트

```bash
# 환경 변수 설정
export GEMINI_API_KEY="your-api-key"

# 테스트 실행
npm run test:gemini
```

### Vercel 로그 확인

1. Vercel 대시보드 → 프로젝트 → Functions
2. 최근 함수 실행 로그 확인
3. 에러 메시지 확인

### 개발 환경 로그

코드에 디버그 로그가 추가되었습니다:
- `⚠️ GEMINI_API_KEY가 설정되지 않았습니다` - API 키 없음
- `🔄 요약 보완 필요` - Gemini 호출 시작
- `✅ 요약 보완 완료` - Gemini 보완 성공
- `⚠️ Gemini 보완 실패` - Gemini 호출 실패

## 빠른 확인 체크리스트

- [ ] Vercel에 `GEMINI_API_KEY` 환경 변수 설정됨
- [ ] 최신 코드가 GitHub에 푸시됨
- [ ] Vercel 배포가 완료됨
- [ ] Gemini API 키가 유효함
- [ ] 모델 이름이 `gemini-2.5-flash-lite`로 설정됨

## 다음 단계

1. **Vercel 환경 변수 확인 및 설정**
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

2. **재배포**
   - Vercel에서 수동 재배포 또는
   - GitHub에 새 커밋 푸시

3. **테스트**
   - 특정 페이지 접속 (예: https://www.bojo24.kr/benefit/보건·의료/305000000283)
   - 핵심 요약, 지원 대상, 지원 내용 섹션 확인
   - Gemini 보완된 내용이 표시되는지 확인

## 예상 결과

Gemini 보완이 정상 작동하면:
- **핵심 요약**: 200자 이상의 상세한 설명
- **지원 대상**: 구체적인 자격 요건과 예시
- **지원 내용**: 상세한 혜택 설명과 활용 방법

공공데이터만 사용되면:
- 짧고 간략한 설명만 표시
- "정보 없음" 또는 매우 짧은 텍스트

