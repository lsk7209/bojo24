# Gemini 프롬프트 템플릿 가이드

이 문서는 보조금 상세페이지의 각 섹션을 Gemini로 보완할 때 사용하는 프롬프트 템플릿을 정리합니다.

## 📊 동적 글자수 조정 시스템

### 글자수 증가 패턴

현재 글자수에 따라 목표 글자수를 동적으로 조정합니다:

- **100자 이내** → **200~300자**로 증가
- **300자 이내** → **400~500자**로 증가
- **600자 이내** → **700~800자**로 증가
- **600자 초과** → 현재 글자수의 **1.2~1.5배**로 증가

### 구현 위치

- **유틸리티**: `src/lib/utils/contentLengthCalculator.ts`
- **함수**: `calculateTargetLength(currentLength: number)`

### 사용 예시

```typescript
import { calculateTargetLength } from "@lib/utils/contentLengthCalculator";

const currentLength = 150; // 현재 글자수
const target = calculateTargetLength(currentLength);
// 결과: { min: 200, max: 300, overflow: 30 }
```

## 📋 필요서류 (Documents) 프롬프트

**파일 위치**: `src/lib/prompts/documentsEnhancement.ts`

### 목적

줄바꿈이 잘못된 필요서류 목록을 가독성 있게 정리합니다.

### 처리 예시

**입력 (잘못된 형식)**:
```
1. 신청서
✓
서약서 및 동의서 각 1부부
✓
2. 가족관계증명서 (신청인
✓
배우자) 각 1부
```

**출력 (정리된 형식)**:
```
1. 신청서 서약서 및 동의서 각 1부
2. 가족관계증명서 (신청인 배우자) 각 1부
```

### 특징

- 줄바꿈 오류 자동 수정
- 불필요한 체크마크(✓) 제거
- 각 항목을 하나의 완전한 문장으로 병합
- 번호 형식 유지 (1., 2., 3. 등)

### 사용법

```typescript
import { enhanceDocuments } from "@lib/geminiEnhancer";

const formatted = await enhanceDocuments(
  benefitName,
  governingOrg,
  rawDocuments,
  benefitId
);
```

## 📋 지원 대상 (Target) 프롬프트

**파일 위치**: `src/lib/prompts/targetEnhancement.ts`

### 형식 구조

```
**지원 대상**
[개요 문단 - 1~2문장]

- [자격 요건 1]
- [자격 요건 2]

**예를 들어** [구체적인 인물 예시 1~2개]
```

### 필수 요소

1. **제목**: `**지원 대상**` (볼드)
2. **개요 문단**: 지원 대상에 대한 간단한 설명 (1~2문장)
3. **목록**: `-` 로 시작하는 자격 요건 나열
4. **예시**: `**예를 들어**` (같은 줄에 예시 내용 포함)

### 글자수 제한

- **동적 조정**: 현재 글자수에 따라 목표 글자수 자동 계산
- **예시**: 100자 → 200~300자, 300자 → 400~500자
- **허용 범위**: 목표 최대값 + overflow (문장 완성을 위해)

### 마크다운 규칙

- **볼드**: 중요한 키워드나 요건 강조 (`**텍스트**`)
- **목록**: `-` 로 자격 요건 나열
- **예시**: `**예를 들어**` + 같은 줄에 예시 내용

### 사용 예시

```typescript
import { buildTargetEnhancementPrompt } from "@lib/prompts/targetEnhancement";

const prompt = buildTargetEnhancementPrompt(
  benefitName,
  governingOrg,
  publicDataTarget,
  criteria
);
```

### 생성 결과 예시

```
**지원 대상**
본 지원은 서울특별시 동대문구에 거주하는 국가유공자 본인을 대상으로 합니다.

- 서울특별시 동대문구에 거주하는 **국가유공자 본인**
- 나이, 소득 등 별도의 자격 요건은 없습니다

**예를 들어** 동대문구에 거주하시는 60대 **국가유공자** 김철수 씨나, 40대 **독립유공자** 이영희 씨는 이 지원을 신청하실 수 있습니다.
```

## 📋 신청 방법 (Apply) 프롬프트

**파일 위치**: `src/lib/prompts/applyEnhancement.ts`

### 형식 구조

```
**신청 방법**
[개요 문단]

**1단계**: [단계 1 설명]
**2단계**: [단계 2 설명]
**3단계**: [단계 3 설명]

[추가 안내]
```

### 특징

- 단계별 가이드 형식
- 동적 글자수 조정
- 구체적인 행동 지침 포함

### 글자수 제한

- **동적 조정**: 현재 글자수에 따라 목표 글자수 자동 계산

## 🔄 다른 섹션에 적용하기

### 지원 내용 (Benefit) 섹션

**파일 위치**: `src/lib/prompts/benefitEnhancement.ts` (생성 필요)

**형식 구조**:
```
**지원 내용**
[개요 문단]

- [혜택 1]
- [혜택 2]

**예를 들어** [구체적인 혜택 예시]
```

### 신청 방법 (Apply) 섹션

**파일 위치**: `src/lib/prompts/applyEnhancement.ts` (생성 필요)

**형식 구조**:
```
**신청 방법**
[개요 문단]

1. [단계 1]
2. [단계 2]

**예를 들어** [구체적인 신청 예시]
```

## 📝 프롬프트 작성 가이드라인

### 공통 원칙

1. **동적 글자수 조정** - 현재 글자수에 따라 목표 자동 계산
2. **구조화된 형식** 사용 (제목, 개요, 목록, 예시)
3. **볼드 활용**으로 중요한 키워드 강조
4. **예시 필수** 포함 (구체적인 인물/사례) - 지원 대상, 지원 내용에만 해당
5. **공공데이터 기반**으로만 작성 (추가 정보 금지)
6. **고유 컨텐츠 생성** - 단순 복사가 아닌 재구성 및 가공
7. **가독성 향상** - 문단 구분, 목록 활용, 자연스러운 문장

### 마크다운 규칙

- **볼드**: `**텍스트**`
- **목록**: `- 항목` 또는 `1. 항목`
- **예시**: `**예를 들어**` + 같은 줄에 내용

### 예시 작성 규칙

- 구체적인 인물 이름과 연령대 포함
- 실제로 해당 요건을 만족하는 사람으로 작성
- 다양한 케이스 제시 (가능한 경우)

## 🛠️ 새 프롬프트 추가 방법

1. `src/lib/prompts/` 디렉토리에 새 파일 생성
2. `targetEnhancement.ts`를 참고하여 형식 맞추기
3. `buildTargetEnhancementPrompt` 함수와 유사한 구조로 작성
4. `src/lib/geminiEnhancer.ts`에서 import하여 사용

## 📌 현재 적용 상태

- ✅ **핵심 요약**: `summaryEnhancement.ts` - 동적 글자수 적용 완료
- ✅ **지원 대상**: `targetEnhancement.ts` - 동적 글자수 적용 완료
- ✅ **지원 내용**: `benefitEnhancement.ts` - 동적 글자수 적용 완료
- ✅ **신청 방법**: `applyEnhancement.ts` - 동적 글자수 적용 완료
- ✅ **FAQ 답변**: `faqEnhancement.ts` - 동적 글자수 적용 완료
- ✅ **필요서류**: `documentsEnhancement.ts` - 줄바꿈 오류 수정 완료

## 🔍 환경 변수 설정

특정 보조금에만 Gemini 보완을 적용하려면:

```env
GEMINI_ENHANCEMENT_ALLOWED_IDS=305000000283,305000000284
```

모든 보조금에 적용하려면:

```env
GEMINI_ENHANCEMENT_ENABLED=true
```

