# 구글 검색 최적화 가이드 (공공데이터 기반)

이 문서는 Gemini 재생성 없이 공공데이터를 기반으로 구글 검색에 최적화된 상세페이지 구조를 설명합니다.

## 🎯 최적화 전략

### 1. 공공데이터 기반 구조화

**핵심 원칙**:
- 공공데이터를 그대로 활용하되, 구조화하여 표시
- 구글이 이해하기 쉬운 구조로 변환
- 자연어 질문에 대한 답변 구조화

### 2. 구조화된 섹션 구성

각 보조금 상세페이지는 다음 구조로 구성됩니다:

```
1. 헤더 (보조금명, 카테고리, 기관)
2. 핵심 요약 (Zero-click 스니펫 최적화)
3. 지원 대상 (구조화된 Q&A)
4. 지원 내용 (구조화된 Q&A)
5. 신청 방법 (HowTo Schema)
6. FAQ (공공데이터 기반 자동 생성)
7. 문의처 (ContactPoint Schema)
```

### 3. 구글 검색 최적화 포인트

#### Zero-click 스니펫
- **핵심 요약**: 첫 문장에 핵심 정보 포함
- **자연어 질문 답변**: "누가 받을 수 있나요?", "어떻게 신청하나요?" 등
- **구조화된 답변**: Schema.org Answer 타입

#### 구조화된 데이터 (Schema.org)
- **Article**: 보조금 정보
- **FAQPage**: 자주 묻는 질문
- **HowTo**: 신청 방법 단계별 가이드
- **QAPage**: 자연어 질문 답변
- **ContactPoint**: 문의처 정보
- **BreadcrumbList**: 네비게이션 경로

#### 키워드 최적화
- 보조금명, 카테고리, 기관명 자연스럽게 포함
- 롱테일 키워드: "{보조금명} 신청", "{보조금명} 자격"
- 검색 의도(Intent) 반영

## 📊 컨텐츠 구조

### 핵심 요약 생성

공공데이터에서 자동으로 요약 생성:

```typescript
const summary = generateSummary(
  benefitName,    // 보조금명
  category,       // 카테고리
  org,            // 관할 기관
  detail          // 상세 정보
);
```

**생성 규칙**:
1. 보조금명 + 기관 + 카테고리 조합
2. 서비스 목적 포함
3. 지원 대상 요약
4. 지원 내용 요약
5. 총 200-300자 내외

### FAQ 자동 생성

공공데이터 기반으로 5가지 핵심 질문 자동 생성:

1. **누가 받을 수 있나요?**
   - 지원 대상 정보 활용

2. **어떤 혜택을 받나요?**
   - 지원 내용 정보 활용

3. **어떻게 신청하나요?**
   - 신청 방법 정보 활용

4. **문의는 어디로 하나요?**
   - 문의처 정보 활용

5. **신청 기간이 있나요?**
   - 신청 기간 정보 활용

### 신청 방법 구조화

공공데이터의 신청 방법을 단계별로 파싱:

```typescript
const steps = parseApplySteps(applyMethod);
// 예: "1. 온라인 신청 2. 서류 제출 3. 심사" → ["온라인 신청", "서류 제출", "심사"]
```

**파싱 규칙**:
- 번호로 시작하는 단계 추출 (①-⑳, 1-9)
- 줄바꿈으로 분리
- 최대 5단계

### 필요 서류 추출

```typescript
const documents = extractDocuments(documentsText);
// 예: "신분증, 주민등록등본, 소득증명서" → ["신분증", "주민등록등본", "소득증명서"]
```

## 🔍 구글 검색 최적화 요소

### 1. 메타 태그

```typescript
// 제목: 보조금명 + 카테고리 + 기관
title: `${benefit.name} | ${category} | ${org}`

// 설명: 핵심 요약 (120자 내외)
description: optimizedContent.summary.substring(0, 120)

// 키워드: 자동 추출된 키워드
keywords: optimizedContent.keywords.join(", ")
```

### 2. 구조화된 데이터

#### Article Schema
- headline: 보조금명
- description: 핵심 요약
- author: 보조금24
- publisher: 보조금24
- provider: 관할 기관

#### FAQPage Schema
- 공공데이터 기반 FAQ 자동 생성
- 자연어 질문 형식
- 구조화된 답변

#### HowTo Schema
- 신청 방법 단계별 구조화
- 각 단계에 HowToStep Schema
- 필요 서류, 신청 기간 포함

#### QAPage Schema
- 자연어 질문에 대한 답변
- Zero-click 스니펫 최적화

### 3. 마이크로데이터

HTML에 마이크로데이터 추가:

```html
<section itemScope itemType="https://schema.org/Question">
  <h3 itemProp="name">지원 대상</h3>
  <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
    <div itemProp="text">지원 대상 내용...</div>
  </div>
</section>
```

## 📈 구글 노출 최적화 전략

### 1. Zero-click 스니펫 타겟팅

**핵심 요약 섹션**:
- 첫 문장에 핵심 정보 포함
- 자연어 질문 형식으로 답변
- 200-300자 내외

**예시**:
```
"육아수당은 보건복지부에서 제공하는 육아/교육 분야 지원금입니다. 
만 0세~만 5세 미만 자녀를 양육하는 가구에 월 10만원을 지원합니다. 
신청은 읍면동 주민센터 또는 온라인으로 가능합니다."
```

### 2. 자연어 질문 답변

**FAQ 섹션**:
- "누가 받을 수 있나요?" → 지원 대상
- "어떻게 신청하나요?" → 신청 방법
- "어떤 혜택을 받나요?" → 지원 내용

### 3. 구조화된 단계별 가이드

**신청 방법**:
- HowTo Schema로 구조화
- 각 단계를 명확히 구분
- 필요 서류, 신청 기간 포함

### 4. 키워드 최적화

**자동 추출 키워드**:
- 보조금명
- 카테고리
- 관할 기관
- 지원 대상 키워드
- 지원 내용 키워드
- 롱테일 키워드: "{보조금명} 신청", "{보조금명} 자격"

## 🎨 페이지 구조

### 렌더링 순서

```
1. Breadcrumb (네비게이션)
2. 헤더 (보조금명, 카테고리, 기관)
3. 핵심 요약 (Zero-click 스니펫)
4. 지원 대상 + 지원 내용 (그리드)
5. 광고
6. 신청 방법 (HowTo)
7. FAQ (공공데이터 기반)
8. 문의처 (ContactPoint)
9. 구조화된 데이터 (JSON-LD)
```

### 섹션별 최적화

#### 지원 대상 섹션
- Question Schema 적용
- Answer Schema로 답변 구조화
- 선정 기준 별도 표시

#### 지원 내용 섹션
- Question Schema 적용
- 금액, 형태 자동 추출 및 배지 표시
- Answer Schema로 답변 구조화

#### 신청 방법 섹션
- HowTo Schema 적용
- 단계별 HowToStep
- 필요 서류 리스트
- 신청 기간 표시

#### FAQ 섹션
- FAQPage Schema 적용
- 공공데이터 기반 자동 생성
- 자연어 질문 형식

## 🔧 구현 파일

### 핵심 파일

1. **`src/lib/benefitContentOptimizer.ts`**
   - 공공데이터 기반 컨텐츠 최적화
   - 요약, FAQ, 키워드 자동 생성
   - 섹션별 구조화

2. **`src/app/benefit/[category]/[id]/page.tsx`**
   - 최적화된 컨텐츠 표시
   - 구조화된 데이터 적용
   - Schema.org 마이크로데이터

3. **`src/app/benefit/[category]/[id]/schema.ts`**
   - 구조화된 데이터 생성
   - JSON-LD 형식

## 📊 구글 검색 결과 예상

### 리치 스니펫

1. **FAQ 스니펫**
   - "누가 받을 수 있나요?" 질문과 답변 표시

2. **HowTo 스니펫**
   - 신청 방법 단계별 가이드 표시

3. **Article 스니펫**
   - 보조금 정보 카드 형식 표시

### Zero-click 답변

검색어: "{보조금명} 누가 받을 수 있나요?"

답변: 핵심 요약 또는 FAQ 답변 표시

## ✅ 최적화 체크리스트

### 구조화된 데이터
- [x] Article Schema
- [x] FAQPage Schema
- [x] HowTo Schema
- [x] QAPage Schema
- [x] BreadcrumbList Schema
- [x] ContactPoint Schema

### 컨텐츠 구조
- [x] 핵심 요약 (Zero-click 최적화)
- [x] 구조화된 섹션 (Q&A 형식)
- [x] 단계별 신청 가이드
- [x] 공공데이터 기반 FAQ
- [x] 문의처 정보

### SEO 최적화
- [x] 메타 태그 최적화
- [x] 키워드 자동 추출
- [x] Canonical URL
- [x] Open Graph 태그
- [x] 구조화된 데이터

## 🚀 다음 단계

1. **데이터 수집**: `npm run fetch:benefits`
2. **사이트 배포**: Vercel 자동 배포
3. **Google Search Console 등록**
4. **Sitemap 제출**: `/sitemap.xml`
5. **구조화된 데이터 검증**: [Rich Results Test](https://search.google.com/test/rich-results)

---

**최종 업데이트**: 2025-01-27

