# 고유 컨텐츠 시스템 가이드

이 문서는 구글이 고유 컨텐츠로 인정받을 수 있는 템플릿 기반 컨텐츠 시스템을 설명합니다.

## 🎯 목표

1. **템플릿 기반 관리**: 일관된 구조 유지
2. **고유 컨텐츠 생성**: 각 보조금마다 고유한 컨텐츠
3. **구글 인정**: E-E-A-T 기준에 맞는 고유 컨텐츠

## 📊 시스템 구조

### 1. 템플릿 시스템

**데이터베이스 테이블**:
- `content_templates`: 템플릿 정의
- `benefit_content`: 각 보조금별 고유 컨텐츠
- `content_sections`: 섹션별 고유 컨텐츠
- `template_variables`: 템플릿 변수 정의

**위치**: `SUPABASE_TEMPLATE_SCHEMA.sql`

### 2. 컨텐츠 타입

각 보조금마다 여러 타입의 고유 컨텐츠 생성:

- **intro**: 인트로 (200-300자)
- **analysis**: 심층 분석 (400-600자)
- **guide**: 신청 가이드 (500-800자)
- **tips**: 실전 팁 (300-500자)
- **comparison**: 비교 분석 (400-600자)

### 3. 고유성 보장 메커니즘

#### 중복 검사
- 컨텐츠 해시 기반 중복 검사
- `content_duplicates` 테이블 활용

#### 고유성 점수
- 다른 보조금과의 유사도 계산
- 0-1 점수 (1 = 완전 고유)
- 최소 0.7 이상 권장

#### AI 기반 생성
- 각 보조금마다 다른 각도로 생성
- 컨텐츠 타입별 다른 프롬프트
- 변수 주입으로 개인화

## 🔄 워크플로우

### 1. 데이터 수집
```bash
npm run fetch:benefits
```
- 공공데이터 API에서 보조금 정보 수집
- `benefits` 테이블에 저장

### 2. AI 요약 생성
```bash
npm run gen:gemini
```
- 기본 요약 및 FAQ 생성
- `benefits.gemini_summary`, `benefits.gemini_faq_json` 저장

### 3. 고유 컨텐츠 생성
```bash
npm run gen:content
```
- 각 보조금마다 고유 컨텐츠 생성
- `benefit_content` 테이블에 저장
- 중복 검사 및 고유성 점수 계산

### 4. 상세페이지 렌더링
- 템플릿 기반 섹션 렌더링
- 고유 컨텐츠 우선 표시
- 기본 데이터 폴백

## 📝 템플릿 구조

### 기본 템플릿

```json
{
  "sections": [
    {"type": "intro", "order": 1, "required": true},
    {"type": "target", "order": 2, "required": true},
    {"type": "benefit", "order": 3, "required": true},
    {"type": "apply", "order": 4, "required": true},
    {"type": "documents", "order": 5, "required": false},
    {"type": "timeline", "order": 6, "required": false},
    {"type": "tips", "order": 7, "required": false}
  ]
}
```

### 템플릿 변수

```json
{
  "benefit_name": {"type": "text", "source": "benefit.name"},
  "category": {"type": "text", "source": "benefit.category"},
  "governing_org": {"type": "text", "source": "benefit.governing_org"},
  "target_audience": {"type": "text", "source": "detail.detail.지원대상"},
  "benefit_content": {"type": "text", "source": "detail.detail.지원내용"},
  "apply_method": {"type": "text", "source": "detail.detail.신청방법"}
}
```

## 🎨 상세페이지 구조

### 우선순위

1. **고유 컨텐츠** (AI 생성)
   - 인트로, 분석, 가이드, 팁
   - 고유성 점수 표시

2. **템플릿 기반 섹션**
   - 구조화된 섹션
   - 변수 주입

3. **기본 데이터** (폴백)
   - 공공데이터 원본
   - 고유 컨텐츠가 없을 때만

### 렌더링 순서

```
1. 헤더 (보조금명, 카테고리, 기관)
2. AI 요약 (3줄 요약)
3. 고유 인트로 컨텐츠
4. 심층 분석 컨텐츠
5. 주요 정보 그리드 (템플릿 또는 기본)
6. 광고
7. 신청 가이드 (고유 또는 기본)
8. 실전 팁 (고유)
9. FAQ
```

## 🔍 고유성 검증

### 자동 검증

1. **해시 기반 중복 검사**
   - 컨텐츠 해시 생성
   - 기존 컨텐츠와 비교

2. **고유성 점수 계산**
   - 다른 보조금과의 유사도 측정
   - 최소 기준 충족 여부 확인

3. **품질 검증**
   - 최소 단어 수 확인
   - 의미 있는 컨텐츠인지 확인

### 수동 검증

- AdSense 대시보드에서 컨텐츠 품질 확인
- Google Search Console에서 인덱싱 상태 확인
- 수동으로 샘플 컨텐츠 검토

## 📈 구글 고유 컨텐츠 인정 전략

### 1. E-E-A-T 기준

#### Experience (경험)
- 실제 신청 경험 기반 팁
- 실전 가이드 제공

#### Expertise (전문성)
- 정책 분석 전문가 관점
- 심층 분석 컨텐츠

#### Authoritativeness (권위성)
- 공식 데이터 출처 명시
- 전문가 정보 표시

#### Trustworthiness (신뢰성)
- 업데이트 날짜 표시
- 출처 정보 명확히

### 2. 고유성 증명

#### 구조적 고유성
- 각 보조금마다 다른 구조
- 섹션 순서 및 구성 다름

#### 내용적 고유성
- AI 기반 고유 분석
- 보조금별 맞춤 컨텐츠

#### 시각적 고유성
- 고유 컨텐츠 배지 표시
- 고유성 점수 표시

### 3. 컨텐츠 품질

#### 최소 요구사항
- 각 섹션 최소 200자
- 의미 있는 정보 제공
- 중복 없음

#### 권장 사항
- 각 섹션 300-500자
- 구체적이고 실용적
- 독자 가치 제공

## 🚀 실행 방법

### 1. 데이터베이스 설정

```sql
-- Supabase SQL Editor에서 실행
-- SUPABASE_TEMPLATE_SCHEMA.sql 파일 내용 실행
```

### 2. 고유 컨텐츠 생성

```bash
# 모든 보조금에 대해 고유 컨텐츠 생성
npm run gen:content
```

### 3. 상세페이지 확인

- 각 보조금 상세페이지 방문
- 고유 컨텐츠 섹션 확인
- 고유성 점수 확인

## 📊 모니터링

### 고유성 점수 모니터링

```sql
-- 평균 고유성 점수 확인
SELECT 
  AVG(uniqueness_score) as avg_score,
  MIN(uniqueness_score) as min_score,
  COUNT(*) as total
FROM benefit_content;
```

### 컨텐츠 통계

```sql
-- 컨텐츠 타입별 통계
SELECT 
  content_type,
  COUNT(*) as count,
  AVG(word_count) as avg_words,
  AVG(uniqueness_score) as avg_uniqueness
FROM benefit_content
GROUP BY content_type;
```

## 🔧 커스터마이징

### 템플릿 수정

1. `content_templates` 테이블에서 템플릿 수정
2. 변수 추가/수정
3. 섹션 순서 변경

### 프롬프트 커스터마이징

1. `src/scripts/generateUniqueContent.ts` 수정
2. 컨텐츠 타입별 프롬프트 조정
3. 생성 스타일 변경

## 📚 참고 자료

- [Google E-E-A-T 가이드](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [고유 컨텐츠 가이드](./CONTENT_STRATEGY.md)
- [SEO 가이드](./SEO_GUIDE.md)

---

**최종 업데이트**: 2025-01-27

