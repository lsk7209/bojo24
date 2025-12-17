# SEO 최적화 가이드

이 문서는 bojo24 프로젝트의 SEO 최적화 전략과 구현 내용을 설명합니다.

## 🎯 SEO 목표

1. **구글 노출 최대화**: 검색 결과 상위 노출
2. **중복 컨텐츠 방지**: 고유 컨텐츠로 인덱싱 보장
3. **고유 컨텐츠 생성**: AI 기반 고품질 컨텐츠

## ✅ 구현된 SEO 기능

### 1. 구조화 데이터 (Schema.org)

#### Article Schema
- 보조금 상세 페이지에 Article 구조화 데이터 적용
- 발행일, 수정일, 작성자 정보 포함
- 구글 검색 결과에서 리치 스니펫 표시 가능

#### FAQPage Schema
- AI 생성 FAQ를 구조화 데이터로 제공
- 구글 FAQ 스니펫 표시 가능

#### BreadcrumbList Schema
- 네비게이션 경로 구조화
- 검색 결과에 브레드크럼 표시

#### Organization Schema
- 사이트 정보 구조화
- 구글 지식 패널 표시 가능

**파일**: `src/app/benefit/[category]/[id]/schema.ts`

### 2. 메타 태그 최적화

#### 기본 메타 태그
- `title`: 키워드 포함, 60자 이내
- `description`: 요약 정보, 120-160자
- `keywords`: 관련 키워드 배열

#### Open Graph 태그
- 소셜 미디어 공유 최적화
- 이미지, 제목, 설명 포함

#### Twitter Cards
- 트위터 공유 최적화
- Large Image Card 사용

**파일**: `src/app/benefit/[category]/[id]/page.tsx`

### 3. Canonical URL

모든 페이지에 canonical URL 설정:
- 중복 컨텐츠 방지
- 검색 엔진에 원본 URL 명시

```typescript
alternates: {
  canonical: `${siteUrl}/benefit/${category}/${id}`
}
```

### 4. Robots.txt & Sitemap

#### Robots.txt
- 검색 엔진 크롤링 규칙 설정
- API 경로 제외
- Sitemap 위치 명시

#### Sitemap.xml
- 동적 생성 (DB 기반)
- 보조금 페이지, 블로그 포스트 포함
- 우선순위 및 업데이트 빈도 설정

**파일**: `src/app/robots.ts`, `src/app/sitemap.ts`

### 5. 중복 컨텐츠 방지

#### 컨텐츠 해시 시스템
- 컨텐츠 해시값으로 중복 검사
- 동일 컨텐츠 재생성 방지

**파일**: `src/lib/contentHash.ts`, `src/lib/uniqueContent.ts`

#### 데이터베이스
- `content_duplicates` 테이블로 중복 추적
- 해시값 기반 빠른 검색

**파일**: `SUPABASE_SCHEMA.sql`

### 6. 고유 컨텐츠 생성

#### AI 기반 블로그 포스트
- Gemini AI로 고유 컨텐츠 생성
- 다양한 각도로 포스트 생성 (guide, tips, analysis)
- 중복 체크 후 저장

**파일**: `src/scripts/generateUniquePost.ts`

#### 포스트 각도
- **guide**: 단계별 신청 가이드
- **tips**: 실전 팁과 주의사항
- **analysis**: 심층 분석과 비교
- **news**: 최신 정보
- **comparison**: 유사 정책 비교

## 📊 SEO 체크리스트

### 기술적 SEO

- [x] 구조화 데이터 (Schema.org)
- [x] 메타 태그 최적화
- [x] Canonical URL
- [x] Sitemap.xml
- [x] Robots.txt
- [x] 모바일 최적화 (반응형 디자인)
- [x] 페이지 속도 최적화
- [x] 이미지 최적화 (Next.js Image)

### 컨텐츠 SEO

- [x] 고유 컨텐츠 생성
- [x] 중복 컨텐츠 방지
- [x] 키워드 최적화
- [x] 내부 링크 구조
- [x] 외부 링크 (공식 사이트)

### 사용자 경험

- [x] 빠른 로딩 속도
- [x] 명확한 네비게이션
- [x] 검색 기능
- [x] 필터링 기능
- [x] 반응형 디자인

## 🚀 SEO 개선 전략

### 1. 컨텐츠 품질

- **고유성**: AI 기반 고유 컨텐츠 생성
- **깊이**: 상세한 정보 제공
- **최신성**: 정기적인 업데이트

### 2. 키워드 전략

- **주요 키워드**: 보조금명, 카테고리, 지역
- **롱테일 키워드**: "2025년 [보조금명] 신청 방법"
- **의도 기반**: "받을 수 있는 금액", "자격 요건"

### 3. 링크 구조

- **내부 링크**: 관련 보조금 연결
- **외부 링크**: 공식 사이트 연결
- **사이트맵**: 모든 페이지 인덱싱

### 4. 성능 최적화

- **이미지 최적화**: WebP, AVIF 포맷
- **코드 분할**: Next.js 자동 최적화
- **캐싱**: ISR, SSG 활용

## 📈 모니터링

### Google Search Console

1. 사이트 등록
2. Sitemap 제출
3. 인덱싱 상태 확인
4. 검색 성능 모니터링

### Google Analytics

- 페이지뷰 추적
- 사용자 행동 분석
- 전환 추적

## 🔧 실행 방법

### 1. 데이터 수집

```bash
npm run fetch:benefits
```

### 2. AI 요약 생성

```bash
npm run gen:gemini
```

### 3. 고유 컨텐츠 생성

```bash
npm run gen:post
```

### 4. Sitemap 확인

브라우저에서 `/sitemap.xml` 접속

### 5. Robots.txt 확인

브라우저에서 `/robots.txt` 접속

## 📚 참고 자료

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org)
- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

---

**최종 업데이트**: 2025-01-27

