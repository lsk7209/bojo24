/* eslint-disable no-console */

console.error(
  [
    "외부 API 기반 글생성은 비활성화되었습니다.",
    "새 글은 Codex/persona-writer 워크플로우에서 직접 작성하고, 공식 출처/내부링크/검수일을 포함해 수동 검수 후 저장하세요.",
  ].join("\n"),
);

process.exit(1);
