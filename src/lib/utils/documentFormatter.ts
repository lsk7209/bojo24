/**
 * 필요서류 정리 유틸리티
 * 줄바꿈이 잘못된 필요서류 목록을 가독성 있게 정리
 */

/**
 * 줄바꿈이 잘못된 필요서류 목록을 정리
 * 
 * 예시:
 * 입력:
 * "1. 신청서\n✓\n서약서 및 동의서 각 1부부\n✓\n2. 가족관계증명서 (신청인\n✓\n배우자) 각 1부"
 * 
 * 출력:
 * [
 *   "1. 신청서 서약서 및 동의서 각 1부",
 *   "2. 가족관계증명서 (신청인 배우자) 각 1부"
 * ]
 */
export function formatDocuments(rawDocuments: string): string[] {
  if (!rawDocuments || rawDocuments.trim().length === 0) {
    return [];
  }

  // 1. 줄바꿈으로 분리
  const lines = rawDocuments.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return [];
  }

  const formatted: string[] = [];
  let currentItem: string[] = [];
  let currentNumber: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 번호 패턴 감지 (1., 2., 3. 등 또는 1), 2), 3) 등)
    const numberMatch = line.match(/^(\d+)[\.\)]\s*(.+)$/);
    
    if (numberMatch) {
      // 이전 항목 저장
      if (currentItem.length > 0 && currentNumber !== null) {
        formatted.push(`${currentNumber}. ${currentItem.join(" ")}`);
      }
      
      // 새 항목 시작
      currentNumber = numberMatch[1];
      currentItem = [numberMatch[2].trim()];
    } else if (line === "✓" || line === "•" || line === "-" || line === "*") {
      // 체크마크나 불릿은 무시 (하위 항목 표시)
      continue;
    } else if (line.match(/^[✓•\-*]\s*(.+)$/)) {
      // 체크마크가 포함된 줄은 내용만 추출하여 현재 항목에 추가
      const contentMatch = line.match(/^[✓•\-*]\s*(.+)$/);
      if (contentMatch && currentItem.length > 0) {
        currentItem.push(contentMatch[1].trim());
      }
    } else if (currentItem.length > 0) {
      // 현재 항목의 연속으로 판단 (들여쓰기나 하위 항목)
      // 줄바꿈 없이 공백으로 연결
      currentItem.push(line);
    } else {
      // 번호가 없는 첫 항목인 경우
      const firstNumberMatch = line.match(/^(\d+)[\.\)]/);
      if (firstNumberMatch) {
        currentNumber = firstNumberMatch[1];
        currentItem = [line.replace(/^\d+[\.\)]\s*/, "").trim()];
      } else {
        // 번호 없이 시작하는 경우 임시로 처리
        currentNumber = "1";
        currentItem = [line];
      }
    }
  }

  // 마지막 항목 저장
  if (currentItem.length > 0 && currentNumber !== null) {
    formatted.push(`${currentNumber}. ${currentItem.join(" ")}`);
  }

  // 번호가 없는 경우 순차적으로 번호 부여
  if (formatted.length === 0 && lines.length > 0) {
    // 번호 패턴이 전혀 없는 경우
    const items: string[] = [];
    let itemBuffer: string[] = [];
    
    for (const line of lines) {
      if (line === "✓" || line === "•" || line === "-" || line === "*") {
        continue;
      }
      
      const cleanLine = line.replace(/^[✓•\-*]\s*/, "").trim();
      if (cleanLine.length > 0) {
        itemBuffer.push(cleanLine);
        
        // 번호 패턴이나 명확한 구분자가 있으면 항목 완성
        if (cleanLine.match(/[\.\)]$/) || cleanLine.length > 50) {
          if (itemBuffer.length > 0) {
            items.push(itemBuffer.join(" "));
            itemBuffer = [];
          }
        }
      }
    }
    
    if (itemBuffer.length > 0) {
      items.push(itemBuffer.join(" "));
    }
    
    return items.map((item, idx) => `${idx + 1}. ${item}`);
  }

  return formatted;
}

/**
 * 필요서류 목록을 Gemini로 보완하기 전에 정리
 * 원본 형식을 유지하면서 가독성만 향상
 */
export function cleanDocumentText(rawDocuments: string): string {
  const formatted = formatDocuments(rawDocuments);
  return formatted.join("\n");
}

