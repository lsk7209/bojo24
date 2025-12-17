# Gemini 프롬프트 템플릿

이 디렉토리는 보조금 상세페이지의 각 섹션을 Gemini로 보완할 때 사용하는 프롬프트 템플릿을 관리합니다.

## 📁 파일 구조

- `targetEnhancement.ts` - 지원 대상 섹션 보완 프롬프트

## 📋 지원 대상 프롬프트 (`targetEnhancement.ts`)

### 형식

```
**지원 대상**
[개요 문단]

- [자격 요건 1]
- [자격 요건 2]

**예를 들어** [구체적인 인물 예시]
```

### 사용법

```typescript
import { buildTargetEnhancementPrompt } from "@lib/prompts/targetEnhancement";

const prompt = buildTargetEnhancementPrompt(
  benefitName,      // 보조금 이름
  governingOrg,     // 관할 기관
  publicDataTarget, // 공공데이터 원본 지원 대상 정보
  criteria          // 선정 기준
);
```

### 특징

- **150~200자** 범위
- **개요 문단** 포함
- **목록 형식**으로 자격 요건 나열
- **예시 필수** 포함 (같은 줄에 작성)
- **볼드**로 중요한 키워드 강조

## 🔄 다른 섹션 프롬프트 추가

새로운 섹션 프롬프트를 추가할 때는 `targetEnhancement.ts`를 참고하여 동일한 구조로 작성하세요.

### 예시: 지원 내용 프롬프트

```typescript
// src/lib/prompts/benefitEnhancement.ts
export const BENEFIT_ENHANCEMENT_PROMPT = `
[요구사항]
- 150~200자 범위
- 개요 문단 포함
- 목록 형식
- 예시 필수

[출력 형식]
**지원 내용**
[개요]

- [혜택 1]
- [혜택 2]

**예를 들어** [예시]
`;
```

## 📝 공통 가이드라인

1. **구조화된 형식**: 제목 → 개요 → 목록 → 예시
2. **볼드 활용**: 중요한 키워드 강조
3. **예시 필수**: 구체적인 인물/사례 포함
4. **공공데이터 기반**: 추가 정보 금지
5. **150~200자**: 목표 글자수 범위

