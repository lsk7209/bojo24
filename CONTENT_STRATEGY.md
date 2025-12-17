# 컨텐츠 전략 가이드

## 📋 개요

bojo24는 공공데이터 API에서 보조금 정보를 수집하여 데이터베이스에 저장하고, 이를 기반으로 고유 컨텐츠를 생성하여 사이트에 표시합니다.

## 🔄 데이터 흐름

```
공공데이터 API → DB 저장 → 사이트 표시
                    ↓
              AI 요약 생성
                    ↓
            고유 컨텐츠 생성
```

### 1단계: 데이터 수집

**스크립트**: `npm run fetch:benefits`

- 공공데이터 API에서 보조금 정보 수집
- `serviceList` → `serviceDetail` → `supportConditions` 순회
- Supabase `benefits` 테이블에 저장
- 중복 방지: `id` 기반 upsert

### 2단계: AI 요약 생성

**스크립트**: `npm run gen:gemini`

- Gemini AI로 3줄 요약 생성
- FAQ 5개 자동 생성
- `benefits` 테이블에 저장

### 3단계: 고유 컨텐츠 생성

**스크립트**: `npm run gen:post`

- AI 기반 블로그 포스트 생성
- 중복 체크 후 저장
- SEO 최적화된 컨텐츠

## 🎯 구글 노출 전략

### 1. 구조화 데이터

- **Article Schema**: 보조금 상세 페이지
- **FAQPage Schema**: AI 생성 FAQ
- **BreadcrumbList**: 네비게이션 경로
- **Organization**: 사이트 정보

### 2. 메타 태그 최적화

- **Title**: 키워드 포함, 60자 이내
- **Description**: 요약 정보, 120-160자
- **Open Graph**: 소셜 공유 최적화
- **Twitter Cards**: 트위터 공유 최적화

### 3. Canonical URL

- 모든 페이지에 canonical URL 설정
- 중복 컨텐츠 방지
- 검색 엔진에 원본 명시

### 4. Sitemap & Robots.txt

- 동적 Sitemap 생성 (DB 기반)
- 모든 보조금 페이지 포함
- Robots.txt로 크롤링 규칙 설정

## 🚫 중복 컨텐츠 방지

### 해시 기반 중복 검사

1. **컨텐츠 해시 생성**
   - 보조금 데이터 → 해시값 생성
   - 블로그 포스트 → 해시값 생성

2. **중복 체크**
   - `content_duplicates` 테이블 조회
   - 동일 해시값 존재 시 생성 중단

3. **고유성 보장**
   - 같은 보조금에 대해 여러 각도로 포스트 생성 가능
   - 각 포스트는 고유한 해시값 보유

### 데이터베이스 구조

```sql
CREATE TABLE content_duplicates (
  content_hash TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL, -- 'benefit' or 'post'
  content_id TEXT NOT NULL
);
```

## ✨ 고유 컨텐츠 생성

### AI 기반 생성

- **도구**: Google Gemini Pro
- **입력**: 보조금 데이터 + AI 요약
- **출력**: 고유한 블로그 포스트

### 포스트 각도

1. **guide**: 단계별 신청 가이드
2. **tips**: 실전 팁과 주의사항
3. **analysis**: 심층 분석과 비교
4. **news**: 최신 정보
5. **comparison**: 유사 정책 비교

### 고유성 보장

- 같은 보조금에 대해 여러 각도로 포스트 생성
- 각 포스트는 고유한 제목과 컨텐츠
- 중복 체크 후 저장

## 📊 데이터베이스 스키마

### benefits 테이블

```sql
CREATE TABLE benefits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  governing_org TEXT,
  detail_json JSONB NOT NULL,
  last_updated_at TIMESTAMPTZ,
  gemini_summary TEXT,
  gemini_faq_json JSONB
);
```

### posts 테이블

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  benefit_id TEXT REFERENCES benefits(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  tags TEXT[],
  seo_keywords TEXT[],
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT true
);
```

### content_duplicates 테이블

```sql
CREATE TABLE content_duplicates (
  content_hash TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL
);
```

## 🚀 실행 순서

### 초기 설정

1. Supabase 프로젝트 생성
2. `SUPABASE_SCHEMA.sql` 실행
3. 환경 변수 설정

### 정기 작업

1. **데이터 수집** (매일)
   ```bash
   npm run fetch:benefits
   ```

2. **AI 요약 생성** (매일)
   ```bash
   npm run gen:gemini
   ```

3. **고유 컨텐츠 생성** (주 2-3회)
   ```bash
   npm run gen:post
   ```

### 자동화

GitHub Actions로 자동 실행:
- 매일 오전 2시: 데이터 수집 + AI 요약
- 수동 실행: 고유 컨텐츠 생성

## 📈 성과 측정

### Google Search Console

- 인덱싱된 페이지 수
- 검색 성능 (노출, 클릭)
- 평균 순위

### Google Analytics

- 페이지뷰
- 사용자 행동
- 전환율

### Supabase Analytics

- 데이터베이스 쿼리 수
- 저장된 컨텐츠 수
- 중복 방지 효과

## 🔧 문제 해결

### 중복 컨텐츠 감지

**증상**: "중복 컨텐츠 감지" 메시지

**해결**:
- 다른 각도로 포스트 생성
- 컨텐츠 수정 후 재생성

### AI 생성 실패

**증상**: Gemini API 에러

**해결**:
- API 키 확인
- Rate Limit 확인
- 재시도

### 데이터 수집 실패

**증상**: 공공데이터 API 에러

**해결**:
- API 키 확인
- 딜레이 증가
- 재시도

## 📚 참고 문서

- [SEO 가이드](./SEO_GUIDE.md)
- [배포 가이드](./DEPLOYMENT.md)
- [데이터베이스 스키마](./SUPABASE_SCHEMA.sql)

---

**최종 업데이트**: 2025-01-27

