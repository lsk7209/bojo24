type Segment =
  | { kind: "heading"; text: string }
  | { kind: "subheading"; title: string; body?: string }
  | { kind: "field"; label: string; value: string }
  | { kind: "bullet"; text: string }
  | { kind: "paragraph"; text: string };

const FIELD_PREFIXES = [
  "신청",
  "모집",
  "운영",
  "선정",
  "지원",
  "추천",
  "대상",
  "기간",
  "방법",
  "내용",
  "연령",
  "자격",
  "서류",
  "문의",
  "접수",
  "사업",
].join("|");

const MARKER_PATTERN = /[□■●◆◇▶▷]/;
const LONG_CONTENT_LENGTH = 220;

export function ReadableContent({
  content,
  emptyText = "상세 정보 없음",
}: {
  content: string;
  emptyText?: string;
}) {
  if (!content?.trim()) {
    return <span className="text-slate-400">{emptyText}</span>;
  }

  const segments = parseReadableContent(content);

  if (!isLongContent(content) && segments.length <= 2) {
    return (
      <p className="break-words text-slate-700 leading-8">
        {stripMarker(content)}
      </p>
    );
  }

  return (
    <div className="space-y-3 text-slate-700">
      {segments.map((segment, index) => (
        <ReadableSegment key={`${segment.kind}-${index}`} segment={segment} />
      ))}
    </div>
  );
}

export function getReadablePreview(content: string, maxLength = 300) {
  const chunks = normalizeKoreanAutoText(stripMarker(content))
    .replace(/\s+/g, " ")
    .split(/【\s*지원\s*(?:대상|내용)\s*】|[□■●◆◇▶▷]|\[\d+기\]/)
    .flatMap((chunk) => chunk.split(/\s(?=신청자격|신청방법|모집기간|운영기간|추천대상|[1-9]\.\s)/))
    .map((chunk) => stripMarker(chunk).replace(/\s+-\s+/g, " ").replace(/\s+-\s*$/g, "").trim())
    .filter(Boolean);
  const firstChunk = chunks[0] ?? "";
  const contentChunk = chunks.find((chunk, index) => index > 0 && chunk.length > 24) ?? chunks[1] ?? "";
  const preview = firstChunk.length < 45 && contentChunk
    ? `${firstChunk} ${contentChunk}`
    : firstChunk || normalizeKoreanAutoText(stripMarker(content)).replace(/\s+/g, " ").trim();

  if (preview.length <= maxLength) return preview;

  return `${preview.slice(0, maxLength).replace(/[,\s]+$/g, "")}...`;
}

export function normalizeKoreanAutoText(text: string) {
  return text
    .replace(/([가-힣A-Za-z0-9)]+)은\(는\)/g, (_, word: string) => `${word}${hasBatchim(word) ? "은" : "는"}`)
    .replace(/([가-힣A-Za-z0-9)]+)을\(를\)/g, (_, word: string) => `${word}${hasBatchim(word) ? "을" : "를"}`)
    .replace(/([가-힣A-Za-z0-9)]+)이\(가\)/g, (_, word: string) => `${word}${hasBatchim(word) ? "이" : "가"}`)
    .replace(/([가-힣A-Za-z0-9)]+)와\(과\)/g, (_, word: string) => `${word}${hasBatchim(word) ? "과" : "와"}`)
    .replace(/([가-힣]+)은(?=\s+(누가|어떻게|언제|어디|신청|관련|받을|정해져|상시))/g, (_, word: string) => `${word}${hasBatchim(word) ? "은" : "는"}`)
    .replace(/([.!?。])을\(를\)\s+목적으로 합니다\./g, "$1")
    .replace(/다\.\s*입니다\./g, "다.")
    .replace(/입니다\.\s*입니다\./g, "입니다.")
    .replace(/합니다\.\s*합니다\./g, "합니다.")
    .replace(/\s+/g, " ")
    .trim();
}

function ReadableSegment({ segment }: { segment: Segment }) {
  if (segment.kind === "heading") {
    return (
      <div className="mt-5 first:mt-0 border-b border-slate-200 pb-2">
        <h4 className="text-base font-bold text-slate-950 break-keep">
          {segment.text}
        </h4>
      </div>
    );
  }

  if (segment.kind === "subheading") {
    return (
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/70 px-4 py-3">
        <div className="font-bold text-slate-950 leading-7 break-keep">
          {segment.title}
        </div>
        {segment.body ? (
          <p className="mt-1 text-sm leading-7 text-slate-700 break-words">
            {segment.body}
          </p>
        ) : null}
      </div>
    );
  }

  if (segment.kind === "field") {
    return (
      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white/80 p-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {segment.label}
        </span>
        <p className="text-sm leading-7 text-slate-800 break-words">
          {segment.value}
        </p>
      </div>
    );
  }

  if (segment.kind === "bullet") {
    return (
      <div className="flex gap-2 rounded-lg bg-white/70 px-3 py-2">
        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-500" />
        <p className="text-sm leading-7 text-slate-800 break-words">
          {segment.text}
        </p>
      </div>
    );
  }

  return (
    <p className="rounded-lg bg-white/70 px-3 py-2 text-sm leading-7 text-slate-800 break-words">
      {segment.text}
    </p>
  );
}

function parseReadableContent(content: string): Segment[] {
  const lines = normalizeContent(content)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.flatMap(parseLine).filter((segment) => {
    if ("text" in segment) return Boolean(segment.text.trim());
    if ("value" in segment) return Boolean(segment.value.trim());
    return Boolean(segment.title.trim());
  });
}

function parseLine(line: string): Segment[] {
  const headingMatch = line.match(/^【\s*([^】]+)\s*】\s*(.*)$/);
  if (headingMatch) {
    const rest = headingMatch[2]?.trim();
    return rest
      ? [{ kind: "heading", text: headingMatch[1] }, ...parseLine(rest)]
      : [{ kind: "heading", text: headingMatch[1] }];
  }

  const roundMatch = line.match(/^\[(\d+기)\]\s*[:：]?\s*(.*)$/);
  if (roundMatch) {
    return [{
      kind: "subheading",
      title: roundMatch[1],
      body: roundMatch[2]?.trim() || undefined,
    }];
  }

  const courseMatch = line.match(/^(\d+)\.\s*([^:：-]+?)(?:\s*[:：-]\s*(.*))?$/);
  if (courseMatch) {
    return [{
      kind: "subheading",
      title: `${courseMatch[1]}. ${courseMatch[2].trim()}`,
      body: courseMatch[3]?.trim() || undefined,
    }];
  }

  const fieldMatch = stripMarker(line).match(/^([^:：]{2,18})\s*[:：]\s*(.+)$/);
  if (fieldMatch && !fieldMatch[1].includes("http")) {
    return [{
      kind: "field",
      label: fieldMatch[1].trim(),
      value: fieldMatch[2].trim(),
    }];
  }

  const cleaned = stripMarker(line);
  if (line.startsWith("-") || MARKER_PATTERN.test(line)) {
    return [{ kind: "bullet", text: cleaned.replace(/^-+\s*/, "") }];
  }

  return splitLongParagraph(cleaned).map((text) => ({ kind: "paragraph", text }));
}

function normalizeContent(content: string) {
  const fieldBoundary = new RegExp(`\\s+-\\s+(?=${FIELD_PREFIXES})`, "g");
  const labelBoundary = new RegExp(`\\s+(?=(${FIELD_PREFIXES})[^\\s:：]{0,8}\\s*[:：])`, "g");

  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/\s*(【[^】]+】)\s*/g, "\n$1 ")
    .replace(/\s*(\[\d+기\])\s*/g, "\n$1 ")
    .replace(/\s+(\d+\.\s*[가-힣A-Za-z])/g, "\n$1")
    .replace(/\s*([□■●◆◇▶▷])\s*/g, "\n$1 ")
    .replace(fieldBoundary, "\n- ")
    .replace(labelBoundary, "\n")
    .trim();
}

function splitLongParagraph(text: string) {
  if (text.length <= 180) return [text];

  const sentences = text
    .split(/(?<=[.!?。])\s+|(?<=다\.)\s+|(?<=니다\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.length > 1 ? sentences : [text];
}

function stripMarker(text: string) {
  return text.replace(/^[\s□■●◆◇▶▷-]+/, "").trim();
}

function isLongContent(content: string) {
  return content.length > LONG_CONTENT_LENGTH || /【|\[\d+기\]|[□■●◆◇▶▷]| - /.test(content);
}

function hasBatchim(word: string) {
  const last = word.trim().at(-1);
  if (!last) return false;

  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;

  return (code - 0xac00) % 28 !== 0;
}
