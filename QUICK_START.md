# 빠른 시작 가이드

## 현재 상황

- ✅ Vercel 배포 완료
- ✅ Supabase 스키마 설정 완료
- ✅ Vercel 환경 변수: Supabase 변수만 설정됨
- ❌ 로컬 .env 파일 필요
- ❌ 데이터 수집 필요

## 즉시 해야 할 작업

### 1. 로컬 .env 파일 설정

Vercel 대시보드에서 환경 변수를 복사하여 로컬 `.env` 파일에 입력:

```bash
# .env 파일이 생성되었습니다. 아래 값들을 Vercel에서 복사하여 입력하세요.

# Supabase (이미 Vercel에 설정됨)
SUPABASE_URL=여기에_Vercel에서_복사한_값_입력
SUPABASE_SERVICE_ROLE_KEY=여기에_Vercel에서_복사한_값_입력
SUPABASE_ANON_KEY=여기에_Vercel에서_복사한_값_입력

# Gemini AI (Vercel에 추가 필요)
GEMINI_API_KEY=여기에_발급받은_API_키_입력

# 공공데이터 (Vercel에 추가 필요)
PUBLICDATA_SERVICE_KEY_ENC=여기에_인코딩된_서비스_키_입력
PUBLICDATA_BASE_URL=https://api.odcloud.kr/api/gov24/v3

# 사이트 URL
NEXT_PUBLIC_SITE_URL=여기에_배포된_Vercel_도메인_입력
```

### 2. 데이터 상태 확인

```bash
npm run check:data
```

이 명령어로 현재 Supabase에 저장된 데이터를 확인할 수 있습니다.

### 3. 데이터 수집

```bash
npm run fetch:benefits
```

## Vercel 환경 변수 복사 방법

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables**
4. 각 변수의 **Value** 옆 눈 아이콘 클릭하여 값 확인
5. `.env` 파일에 복사

## 빠른 체크리스트

### 로컬 설정
- [ ] `.env` 파일 생성
- [ ] Supabase 변수 입력 (Vercel에서 복사)
- [ ] `npm run validate-env` 실행하여 확인

### Vercel 설정 (추가 필요)
- [ ] `GEMINI_API_KEY` 추가
- [ ] `PUBLICDATA_SERVICE_KEY_ENC` 추가
- [ ] `NEXT_PUBLIC_SITE_URL` 추가

### 데이터 수집
- [ ] `npm run check:data` 실행 (현재 상태 확인)
- [ ] `npm run fetch:benefits` 실행 (데이터 수집)

## 다음 단계

데이터 수집 완료 후:
1. 사이트에서 보조금 목록 확인
2. 상세페이지 확인
3. Google Search Console 등록

