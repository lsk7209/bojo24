import React from "react";

export function formatDescription(text: string) {
    if (!text) return text;

    // 1. "○" 또는 "- " 등을 기준으로 문단을 나눕니다.
    // 정규식 설명: (○|-) 문자가 나오면 그 앞에서 자르되, 구분자도 포함하거나 처리 방식 결정
    // 여기서는 단순히 줄바꿈을 유도하기 위해 교체합니다.

    // 먼저 보기 좋게 전처리
    let cleaned = text
        .replace(/ - /g, "\n- ") // " - " -> 줄바꿈 + "- "
        .replace(/ ○/g, "\n○")   // " ○" -> 줄바꿈 + "○"
        .replace(/\. /g, ".\n"); // ". " -> 마침표 뒤 줄바꿈 (선택적)

    // 줄바꿈으로 분리
    const lines = cleaned.split("\n").map(line => line.trim()).filter(Boolean);

    if (lines.length === 0) return text;

    return (
        <ul className="space-y-2">
            {lines.map((line, idx) => {
                const isBullet = line.startsWith("○") || line.startsWith("-");
                return (
                    <li
                        key={idx}
                        className={`text-slate-700 leading-relaxed ${isBullet ? "pl-4 -indent-4" : ""}`}
                    >
                        {/* 불렛 기호에 색상 포인트 좀 주기 */}
                        {isBullet && (
                            <span className="inline-block w-4 text-blue-500 font-bold mr-1">
                                {line.charAt(0)}
                            </span>
                        )}
                        {isBullet ? line.substring(1).trim() : line}
                    </li>
                );
            })}
        </ul>
    );
}
