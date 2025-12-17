# Gemini API 모델 이름 문제 해결 가이드

## 문제 상황

현재 Gemini API 호출 시 다음과 같은 오류가 발생합니다:
```
[404 Not Found] models/gemini-pro is not found for API version v1beta
```

## 원인

`@google/generative-ai` 패키지가 v1beta API를 사용하는데, `gemini-pro` 모델은 v1 API에서만 사용 가능합니다.

## 해결 방법

### 방법 1: 모델 이름 변경 (권장)

최신 Gemini API에서는 다음 모델을 사용해야 합니다:
- `gemini-1.5-flash` (빠르고 효율적, 권장)
- `gemini-1.5-pro` (더 강력하지만 느림)

### 방법 2: API 버전 확인

실제 사용 가능한 모델을 확인하려면:
1. Google AI Studio에서 API 키 확인
2. 사용 가능한 모델 목록 확인
3. 해당 모델 이름 사용

### 방법 3: 패키지 버전 확인

`@google/generative-ai` 패키지 버전에 따라 사용 가능한 모델이 다를 수 있습니다.
현재 버전: `^0.11.5`

## 임시 해결책

현재는 Gemini API 키가 없거나 모델 이름이 맞지 않아도, 공공데이터만으로도 페이지가 정상 작동합니다.
Gemini 보완은 선택적 기능이므로, API 키가 설정되지 않으면 공공데이터만 사용합니다.

## 다음 단계

1. Google AI Studio에서 API 키 발급
2. 사용 가능한 모델 확인
3. 올바른 모델 이름으로 코드 수정
4. 테스트 실행

