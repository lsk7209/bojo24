# Vercel 환경 변수 수정 가이드

## 🔴 문제 발견

클라이언트 컴포넌트에서 `process.env.NEXT_PUBLIC_SUPABASE_URL`이 `undefined`로 나타나는 문제가 있습니다.

## 원인

Next.js에서 클라이언트 사이드 환경 변수는:
1. **빌드 타임**에 번들에 포함됩니다
2. `NEXT_PUBLIC_` 접두사가 **필수**입니다
3. `next.config.js`의 `env`는 빌드 타임에만 적용되며, Vercel에서는 제한적입니다

## ✅ 해결 방법

### Vercel 환경 변수에 직접 추가

Vercel 대시보드에서 다음 환경 변수를 **추가**하세요:

```
NEXT_PUBLIC_SUPABASE_URL={SUPABASE_URL 값}
NEXT_PUBLIC_SUPABASE_ANON_KEY={SUPABASE_ANON_KEY 값}
```

**중요**: 
- `SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_URL`은 **별도로** 설정해야 합니다
- 클라이언트에서 접근하려면 `NEXT_PUBLIC_` 접두사가 **필수**입니다

### 설정 방법

1. Vercel 대시보드 > 프로젝트 > Settings > Environment Variables
2. "Add New" 클릭
3. 다음 변수 추가:

```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: {SUPABASE_URL과 동일한 값}
Environment: Production, Preview, Development (모두 선택)
```

```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: {SUPABASE_ANON_KEY와 동일한 값}
Environment: Production, Preview, Development (모두 선택)
```

4. Save 클릭
5. **재배포** (중요!)

## 🔍 확인 방법

배포 후 브라우저 콘솔에서:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
```

값이 표시되면 성공입니다.

## ⚠️ 보안 주의사항

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 클라이언트에 노출됩니다
- 이는 **의도된 동작**입니다 (Supabase Anonymous Key는 공개되어도 안전합니다)
- **절대** `SUPABASE_SERVICE_ROLE_KEY`를 `NEXT_PUBLIC_` 접두사로 노출하지 마세요

