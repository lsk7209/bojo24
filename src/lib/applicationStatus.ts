export type ApplicationStatusType = "open" | "closing_soon" | "always" | "closed" | "unknown";

export type ApplicationStatus = {
  status: ApplicationStatusType;
  label: string;
  badgeClass: string;
  dDay?: number;
};

/**
 * 공공데이터의 다양한 '신청기간' 문자열을 분석하여 현재 기준 접수 상태를 판별합니다.
 */
export function parseApplicationStatus(
  deadlineText?: string | null,
  referenceDate = new Date()
): ApplicationStatus {
  if (!deadlineText || !deadlineText.trim()) {
    return {
      status: "unknown",
      label: "일정 확인 필요",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const raw = deadlineText.trim();

  // 1. 상시/수시 접수 패턴
  if (/(상시|연중|수시|예산\s*소진)/i.test(raw)) {
    return {
      status: "always",
      label: "상시 접수",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  // 2. 마감/종료 명시 패턴 (단, 날짜 범위가 함께 명시되지 않은 단순 텍스트)
  if (/(마감|종료|완료)/i.test(raw) && !/~\s*\d/.test(raw) && !/\d{4}[.\-년]/.test(raw)) {
    return {
      status: "closed",
      label: "접수 마감",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    };
  }

  // 3. 날짜 추출 (범위 형식 '~' 가 있을 경우 끝 날짜 기준)
  const rangeSplit = raw.split(/~|～/);
  const targetSegment = rangeSplit.length > 1 ? rangeSplit[rangeSplit.length - 1] : raw;

  const dateMatch = targetSegment.match(/(\d{4})[.\-년\s/]+(\d{1,2})[.\-월\s/]+(\d{1,2})/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const day = parseInt(dateMatch[3], 10);

    const endDate = new Date(year, month, day, 23, 59, 59, 999);
    const now = referenceDate;

    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "closed",
        label: "접수 마감",
        badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      };
    }

    if (diffDays <= 7) {
      return {
        status: "closing_soon",
        label: diffDays === 0 ? "오늘 마감" : `마감 임박 (D-${diffDays})`,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
        dDay: diffDays,
      };
    }

    return {
      status: "open",
      label: `접수중 (D-${diffDays})`,
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
      dDay: diffDays,
    };
  }

  return {
    status: "unknown",
    label: "일정 확인 필요",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  };
}
