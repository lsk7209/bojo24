# 로컬 개발 환경 변수 설정

## 🔴 현재 문제

클라이언트 컴포넌트에서 `process.env.NEXT_PUBLIC_SUPABASE_URL`이 `undefined`로 나타납니다.

## ✅ 해결 방법

### .env 파일에 추가

`.env` 파일에 다음 변수를 추가하세요:

```bash
# 기존 변수들...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 클라이언트 접근용 (추가 필요)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://bojo24.kr
```

**중요**: 
- `SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_URL`은 **동일한 값**을 사용합니다
- `SUPABASE_ANON_KEY`와 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 **동일한 값**을 사용합니다
- 클라이언트에서 접근하려면 `NEXT_PUBLIC_` 접두사가 **필수**입니다

### 값 복사 방법

1. Vercel 대시보드에서 `SUPABASE_URL` 값 복사
2. `.env` 파일에 `NEXT_PUBLIC_SUPABASE_URL={복사한 값}` 추가
3. Vercel 대시보드에서 `SUPABASE_ANON_KEY` 값 복사
4. `.env` 파일에 `NEXT_PUBLIC_SUPABASE_ANON_KEY={복사한 값}` 추가

### 개발 서버 재시작

환경 변수 추가 후:
```bash
# 개발 서버 중지 (Ctrl+C)
npm run dev
```

## 🔍 확인 방법

브라우저 콘솔(F12)에서:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
```

값이 표시되면 성공입니다.

