# 환경 변수 설정 가이드

> **중요**: Vercel과 GitHub Secrets는 별도로 설정해야 합니다!
> - **Vercel**: 사이트 실행용
> - **GitHub Secrets**: 자동 데이터 수집용

자세한 내용은 `VERCEL_ENV_COMPLETE.md` 파일을 참고하세요.

> 아래 값들은 로컬 `.env` 또는 Vercel 환경 변수로 설정하세요. 민감 정보는 절대 커밋하지 않습니다.

## 공공데이터(보조금24)
- `PUBLICDATA_SERVICE_KEY_ENC`: 인코딩된 서비스 키 (예: `Dc%2Bm2...%3D%3D`)
- `PUBLICDATA_BASE_URL`: 기본값 `https://api.odcloud.kr/api/gov24/v3`

## Supabase
- `SUPABASE_URL`: 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role 키 (서버/스크립트용)
- `SUPABASE_ANON_KEY`: Anonymous 키 (클라이언트 전용)

## Gemini
- `GEMINI_API_KEY`: Gemini API 키

