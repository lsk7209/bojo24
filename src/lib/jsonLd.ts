/**
 * JSON-LD를 <script type="application/ld+json"> 안에 안전하게 삽입하기 위한 직렬화 함수.
 * 공공데이터·게시글 제목 등 외부에서 유입되는 문자열에 "</script>"가 포함되면
 * JSON.stringify 결과가 스크립트 태그를 조기 종료시켜 뒤따르는 마크업이 그대로
 * 파싱될 수 있으므로, HTML에서 의미를 갖는 문자를 유니코드 이스케이프로 치환한다.
 */
export const toJsonLdString = (data: unknown): string =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
