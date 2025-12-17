/**
 * 동적 글자수 계산 유틸리티
 * 현재 글자수에 따라 목표 글자수 범위를 계산
 */

export interface TargetLength {
  min: number;
  max: number;
  overflow: number;
}

/**
 * 현재 글자수에 따라 목표 글자수 범위를 계산
 * 
 * @param currentLength 현재 컨텐츠의 글자수
 * @returns 목표 글자수 범위 (min, max, overflow)
 * 
 * 규칙:
 * - 100자 이내 → 200~300자
 * - 300자 이내 → 400~500자
 * - 600자 이내 → 700~800자
 * - 600자 초과 → 현재 글자수의 1.2~1.5배
 */
export function calculateTargetLength(currentLength: number): TargetLength {
  if (currentLength <= 100) {
    return { min: 200, max: 300, overflow: 30 };
  } else if (currentLength <= 300) {
    return { min: 400, max: 500, overflow: 50 };
  } else if (currentLength <= 600) {
    return { min: 700, max: 800, overflow: 80 };
  } else {
    // 600자 초과는 현재 글자수의 1.2~1.5배로 증가
    return {
      min: Math.floor(currentLength * 1.2),
      max: Math.floor(currentLength * 1.5),
      overflow: Math.floor(currentLength * 0.1)
    };
  }
}

