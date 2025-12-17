/**
 * 환경 변수 디버깅용 API 엔드포인트
 * 프로덕션에서 환경 변수가 제대로 설정되었는지 확인
 */
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const allowedIds = process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS 
    ? process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS.split(",").map(id => id.trim())
    : [];
  
  const isAllowed = allowedIds.includes("305000000283");
  
  return NextResponse.json({
    geminiApiKey: process.env.GEMINI_API_KEY ? "✅ 설정됨" : "❌ 설정 안 됨",
    geminiEnhancementAllowedIds: process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS || "❌ 설정 안 됨",
    allowedIdsArray: allowedIds,
    isBenefitAllowed: isAllowed,
    benefitId: "305000000283",
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

