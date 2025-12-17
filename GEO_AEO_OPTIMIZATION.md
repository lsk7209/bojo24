# GEO & AEO 최적화 가이드

이 문서는 bojo24 프로젝트의 GEO (Google E-E-A-T) 및 AEO (Answer Engine Optimization) 최적화 전략을 설명합니다.

## 🎯 최적화 목표

### GEO (Google E-E-A-T)
- **Experience**: 실제 경험 기반 컨텐츠
- **Expertise**: 전문성 증명
- **Authoritativeness**: 권위성
- **Trustworthiness**: 신뢰성

### AEO (Answer Engine Optimization)
- 자연어 질문에 대한 구조화된 답변
- Zero-click 스니펫 최적화
- AI 검색 엔진 (ChatGPT, Gemini 등) 최적화

## ✅ 구현된 기능

### 1. GEO 최적화

#### Expertise (전문성)

**Person Schema**
```json
{
  "@type": "Person",
  "name": "보조금 파인더 AI",
  "jobTitle": "정부 보조금 분석 전문가",
  "knowsAbout": ["정부 보조금", "공공서비스", "지원금 신청", "정책 분석"]
}
```

**구현 위치**: `src/app/benefit/[category]/[id]/schema.ts`

#### Authoritativeness (권위성)

**Dataset Schema**
- 공식 데이터 출처 명시
- 행정안전부 보조금24 공공데이터 기반
- 출처 및 라이선스 정보 포함

**구현 위치**: `src/app/benefit/[category]/[id]/schema.ts`

#### Trustworthiness (신뢰성)

**Review/Rating Schema**
- 서비스에 대한 리뷰 및 평점
- 업데이트 날짜 명시
- 출처 정보 표시

**출처 정보 표시**
- 페이지 하단에 출처 명시
- 업데이트 날짜 표시
- 관할 기관 정보

**구현 위치**: `src/app/benefit/[category]/[id]/page.tsx`

### 2. AEO 최적화

#### HowTo Schema

**단계별 신청 가이드**
```json
{
  "@type": "HowTo",
  "name": "보조금 신청 방법",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "신청서 작성",
      "text": "..."
    }
  ]
}
```

**구현 위치**: `src/app/benefit/[category]/[id]/schema.ts`

#### QAPage Schema

**자연어 질문 답변**
```json
{
  "@type": "QAPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "누가 받을 수 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "..."
      }
    }
  ]
}
```

**구현 위치**: `src/app/benefit/[category]/[id]/schema.ts`

#### FAQPage Schema

**자주 묻는 질문 구조화**
- AI 생성 FAQ를 구조화 데이터로 제공
- 구글 FAQ 스니펫 표시 가능

**구현 위치**: `src/app/benefit/[category]/[id]/schema.ts`

### 3. Zero-click 스니펫 최적화

#### 메타 태그

**답변 메타 태그**
```html
<meta name="answer" content="보조금 정보 요약..." />
```

**구현 위치**: `src/app/benefit/[category]/[id]/page.tsx`

#### 구조화된 답변

**자연어 질문 답변 생성**
- "누가 받을 수 있나요?"
- "어떻게 신청하나요?"
- "어떤 혜택을 받나요?"
- "언제까지 신청하나요?"
- "문의는 어디로 하나요?"

**구현 위치**: `src/lib/zeroClickOptimization.ts`

### 4. 마이크로데이터 (Microdata)

#### HTML 구조화

**Article 마이크로데이터**
```html
<article itemScope itemType="https://schema.org/Article">
  <h1 itemProp="headline">...</h1>
  <time itemProp="dateModified">...</time>
</article>
```

**HowTo 마이크로데이터**
```html
<section itemScope itemType="https://schema.org/HowTo">
  <div itemScope itemType="https://schema.org/HowToStep">
    <div itemProp="text">...</div>
  </div>
</section>
```

**QAPage 마이크로데이터**
```html
<section itemScope itemType="https://schema.org/QAPage">
  <div itemScope itemType="https://schema.org/Question">
    <h4 itemProp="name">...</h4>
    <div itemScope itemType="https://schema.org/Answer">
      <span itemProp="text">...</span>
    </div>
  </div>
</section>
```

**구현 위치**: `src/app/benefit/[category]/[id]/page.tsx`

## 📊 구조화 데이터 목록

### JSON-LD (구조화 데이터)

1. **Article**: 보조금 상세 정보
2. **FAQPage**: 자주 묻는 질문
3. **QAPage**: 자연어 질문 답변
4. **HowTo**: 신청 방법 단계별 가이드
5. **BreadcrumbList**: 네비게이션 경로
6. **Organization**: 사이트 정보
7. **Person**: 전문가 정보 (GEO)
8. **Dataset**: 데이터 출처 (GEO)
9. **Review**: 서비스 리뷰 (GEO)

### 마이크로데이터 (HTML)

- Article 구조화
- HowTo 단계 구조화
- QAPage 질문-답변 구조화
- Answer 답변 구조화

## 🚀 최적화 효과

### 구글 검색 결과

1. **리치 스니펫**
   - FAQ 스니펫
   - HowTo 스니펫
   - Article 스니펫

2. **Zero-click 답변**
   - 검색 결과에서 직접 답변 표시
   - 클릭 없이 정보 제공

3. **지식 패널**
   - Organization 정보 표시
   - 전문가 정보 표시

### AI 검색 엔진 (ChatGPT, Gemini 등)

1. **구조화된 답변**
   - 자연어 질문에 대한 정확한 답변
   - 단계별 가이드 제공

2. **출처 명시**
   - 공식 데이터 출처 표시
   - 신뢰성 향상

## 📝 체크리스트

### GEO (E-E-A-T)

- [x] Person Schema (전문성)
- [x] Dataset Schema (권위성)
- [x] Review Schema (신뢰성)
- [x] 출처 정보 표시
- [x] 업데이트 날짜 명시
- [x] 관할 기관 정보

### AEO

- [x] HowTo Schema
- [x] QAPage Schema
- [x] FAQPage Schema
- [x] Zero-click 스니펫 메타 태그
- [x] 자연어 질문 답변 생성
- [x] 구조화된 답변 데이터

### 기술적 구현

- [x] JSON-LD 구조화 데이터
- [x] 마이크로데이터 (HTML)
- [x] 메타 태그 최적화
- [x] Zero-click 답변 생성

## 🔧 테스트 방법

### Google Rich Results Test

1. [Google Rich Results Test](https://search.google.com/test/rich-results) 접속
2. 페이지 URL 입력
3. 구조화 데이터 검증

### Schema Markup Validator

1. [Schema.org Validator](https://validator.schema.org/) 접속
2. 페이지 URL 또는 HTML 입력
3. 구조화 데이터 검증

### Google Search Console

1. 사이트 등록
2. Sitemap 제출
3. 구조화 데이터 확인
4. 성능 모니터링

## 📚 참고 자료

- [Google E-E-A-T 가이드](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Schema.org 문서](https://schema.org)
- [Answer Engine Optimization](https://www.searchenginejournal.com/answer-engine-optimization/)
- [Zero-click Search](https://sparktoro.com/blog/zero-click-searches/)

---

**최종 업데이트**: 2025-01-27

