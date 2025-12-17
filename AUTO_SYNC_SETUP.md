# 자동 데이터 동기화 설정 가이드

## 📋 개요

공공데이터 포털에서 정보가 갱신되면 **자동으로 수집하여 Supabase에 저장**하는 시스템이 설정되어 있습니다.

## ✅ 현재 설정 상태

### 1. 자동 스케줄링 (GitHub Actions)
- **실행 주기**: 매일 한국 시간 오전 2시 (UTC 17:00)
- **워크플로우**: `.github/workflows/data-sync.yml`
- **모드**: 증분 업데이트 (변경된 데이터만 처리)

### 2. 증분 업데이트 로직
- 기존 데이터와 비교하여 **변경된 데이터만** 수집
- 신규 보조금 자동 추가
- 수정된 보조금 자동 업데이트
- 변경 없는 데이터는 스킵하여 **효율성 극대화**

## 🔧 설정 방법

### GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 변수를 추가하세요:

#### 필수 환경 변수
```bash
PUBLICDATA_SERVICE_KEY_ENC=Dc%2Bm2FOHT2MQxGmXnBE3Qbuw9V4H4hJB8nKKOL6JWfWYK0Tc48AwXm7AkzGDREokxi%2BG1LeRUrqQG6NagZQ%2BAA%3D%3D
PUBLICDATA_BASE_URL=https://api.odcloud.kr/api/gov24/v3
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 선택 환경 변수
```bash
PUBLICDATA_DELAY_MS=600          # API 호출 간 딜레이 (밀리초)
PUBLICDATA_PAGE_SIZE=100         # 페이지당 데이터 수
GEMINI_API_KEY=your-gemini-key   # AI 요약 생성용 (선택)
```

### Vercel 환경 변수 (선택)

Vercel에서도 동일한 환경 변수를 설정하면 로컬에서도 테스트할 수 있습니다.

## 🚀 사용 방법

### 자동 실행
- **매일 자동 실행**: 별도 작업 없이 자동으로 실행됩니다
- **실행 시간**: 한국 시간 오전 2시
- **실행 내역**: GitHub Actions 탭에서 확인 가능

### 수동 실행
GitHub Actions에서 수동으로 실행할 수도 있습니다:

1. GitHub 저장소 > Actions 탭
2. "Data Sync (Scheduled)" 워크플로우 선택
3. "Run workflow" 버튼 클릭

### 로컬에서 테스트
```bash
# 증분 업데이트 모드 (권장)
npm run fetch:benefits:incremental

# 전체 수집 모드 (처음 한 번만)
npm run fetch:benefits
```

## 📊 동작 방식

### 증분 업데이트 프로세스

1. **기존 데이터 조회**
   - Supabase에서 모든 보조금의 ID와 수정일시 조회

2. **API 목록 수집**
   - 공공데이터 API에서 전체 목록 가져오기

3. **변경 감지**
   - 신규: DB에 없는 서비스
   - 업데이트: 수정일시가 더 최신인 서비스
   - 변경 없음: 동일한 서비스

4. **선택적 처리**
   - 변경된 데이터만 상세 정보 수집
   - 배치 단위로 Supabase에 저장

### 예상 실행 시간
- **전체 수집**: 약 30-60분 (10,000+ 건)
- **증분 업데이트**: 약 1-5분 (변경된 데이터만)

## 📈 모니터링

### GitHub Actions 로그 확인
1. GitHub 저장소 > Actions 탭
2. 최근 실행 내역 확인
3. 로그에서 다음 정보 확인:
   - 처리된 데이터 수
   - 신규/업데이트/변경 없음 통계
   - 성공/실패 건수

### 데이터 상태 확인
```bash
npm run check:data
```

이 명령어로 현재 데이터 상태를 확인할 수 있습니다:
- 총 보조금 데이터 수
- 최근 업데이트 시간
- 카테고리별 통계

## ⚙️ 고급 설정

### 실행 주기 변경
`.github/workflows/data-sync.yml` 파일에서 cron 표현식 수정:

```yaml
schedule:
  # 매일 오전 2시 (현재)
  - cron: '0 17 * * *'
  
  # 매일 오전 3시로 변경하려면
  - cron: '0 18 * * *'
  
  # 매 6시간마다 실행하려면
  - cron: '0 */6 * * *'
```

### Rate Limit 조정
환경 변수 `PUBLICDATA_DELAY_MS`로 API 호출 간 딜레이 조정:
- 기본값: 600ms (0.6초)
- 더 빠르게: 300ms (주의: API 제한 확인 필요)
- 더 안전하게: 1000ms (1초)

## 🔍 문제 해결

### 자동 실행이 안 될 때
1. GitHub Actions 활성화 확인
2. Secrets 설정 확인
3. 워크플로우 파일 문법 확인
4. 수동 실행으로 테스트

### 데이터가 업데이트 안 될 때
1. API 키 유효성 확인
2. Supabase 연결 확인
3. 로그에서 에러 메시지 확인
4. 수동 실행으로 디버깅

### Rate Limit 에러
- `PUBLICDATA_DELAY_MS` 값을 증가
- 배치 크기 감소 (코드 수정 필요)

## 📝 참고 사항

- **첫 실행**: 전체 데이터 수집이 필요할 수 있습니다 (`npm run fetch:benefits`)
- **일일 제한**: 공공데이터 API는 일일 호출 제한이 있습니다 (500,000회)
- **데이터 보존**: 기존 데이터는 유지되며, 변경된 부분만 업데이트됩니다
- **AI 요약**: Gemini API 키가 설정되어 있으면 자동으로 AI 요약도 생성됩니다

---

**최종 업데이트**: 2025-01-27

