"use client";

import { useState } from "react";

type ShareButtonsProps = {
  title: string;
  url?: string;
};

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const targetUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (!targetUrl) return;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${title} — 정부 지원금 신청 정보`,
          url: targetUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Web Share API가 지원되지 않거나 취소된 경우 클립보드 복사 폴백
    handleCopyLink();
  };

  const handleCopyLink = async () => {
    const targetUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (!targetUrl) return;

    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 복사 실패 시 폴백
      const input = document.createElement("input");
      input.value = targetUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
        aria-label="지원금 정보 지인에게 공유하기"
      >
        <span className="text-sm">💬</span>
        <span>공유하기</span>
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        aria-label="현재 페이지 링크 복사"
      >
        <span className="text-sm">🔗</span>
        <span>{copied ? "링크 복사됨 ✓" : "링크 복사"}</span>
      </button>
    </div>
  );
}
