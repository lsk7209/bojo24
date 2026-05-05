"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Badge } from "@components/ui";
import type { BenefitListItem } from "./benefit-list-types";

const hasPublicSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 클라이언트 사이드 Supabase 클라이언트 생성
const getClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

type BenefitListClientProps = {
  initialBenefits: BenefitListItem[];
  initialSearchParams: {
    q?: string;
    category?: string;
  };
};

const ITEMS_PER_PAGE = 30;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
};

export function BenefitListClient({ initialBenefits, initialSearchParams }: BenefitListClientProps) {
  const [benefits, setBenefits] = useState<BenefitListItem[]>(initialBenefits);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    hasPublicSupabaseEnv && initialBenefits.length === ITEMS_PER_PAGE
  );
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !hasPublicSupabaseEnv) return;

    setLoading(true);
    try {
      const supabase = getClient();
      const nextPage = page + 1;
      const offset = nextPage * ITEMS_PER_PAGE;

      const query = supabase
        .from("benefits")
        .select("id, name, category, governing_org, last_updated_at")
        .order("last_updated_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      // 검색어 필터
      if (initialSearchParams.q) {
        query.ilike("name", `%${initialSearchParams.q}%`);
      }

      // 카테고리 필터
      if (initialSearchParams.category && initialSearchParams.category !== "all") {
        query.eq("category", initialSearchParams.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setBenefits((prev) => [...prev, ...data]);
        setPage(nextPage);
        setHasMore(data.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, initialSearchParams]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((item) => (
          <Link
            key={item.id}
            href={`/benefit/${encodeURIComponent(item.category || "기타")}/${encodeURIComponent(item.id)}`}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-blue-300"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <Badge tone="muted">{item.category || "기타"}</Badge>
              </div>
              <h3 className="line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {item.name}
              </h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                {item.governing_org || "기관 정보 없음"}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">
                {formatDate(item.last_updated_at)} 업데이트
              </span>
              <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                자세히 보기 →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasMore && (
        <div ref={observerTarget} className="py-8 text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
              <span>더 많은 지원금을 불러오는 중...</span>
            </div>
          ) : (
            <div className="h-20"></div>
          )}
        </div>
      )}

      {/* 더 이상 데이터가 없을 때 */}
      {!hasMore && benefits.length > ITEMS_PER_PAGE && (
        <div className="py-8 text-center text-slate-500">
          <p>모든 지원금을 불러왔습니다. ({benefits.length}개)</p>
        </div>
      )}
    </>
  );
}

