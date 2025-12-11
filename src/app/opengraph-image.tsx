import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "보조금 파인더 - 나에게 딱 맞는 정부 혜택 찾기";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 60,
                    background: "linear-gradient(to bottom right, #eff6ff, #ffffff)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "sans-serif",
                    color: "#1e3a8a",
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span>🇰🇷 Bojo24</span>
                </div>
                <div style={{ fontSize: 30, marginTop: 20, color: "#64748b", fontWeight: 500 }}>
                    AI 기반 맞춤형 보조금 검색 서비스
                </div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
