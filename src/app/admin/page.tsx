"use client";

import { useState, useEffect } from "react";
import { generateSinglePost, getStats } from "./actions";
import { Card, Button } from "@components/ui";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({ benefits: 0, posts: 0 });

    const checkAuth = () => {
        // 클라이언트 측 간단 체크 (실제 보안은 서버 액션에서 수행됨)
        // 여기선 UI 진입만 막는 용도
        if (password === "admin1234") { // 데모용 비밀번호
            setIsAuthorized(true);
            loadStats();
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    };

    const loadStats = async () => {
        const s = await getStats();
        setStats(s);
    };

    const handleGenerate = async () => {
        setLoading(true);
        setLogs((prev) => ["생성 요청 중...", ...prev]);

        const res = await generateSinglePost(password);

        if (res.success) {
            setLogs((prev) => [`✅ ${res.message}`, ...prev]);
            loadStats(); // 통계 갱신
        } else {
            setLogs((prev) => [`❌ 실패: ${res.message}`, ...prev]);
        }
        setLoading(false);
    };

    if (!isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100">
                <Card className="w-full max-w-sm p-8 space-y-4">
                    <h1 className="text-2xl font-bold text-center">관리자 접속</h1>
                    <input
                        type="password"
                        className="w-full p-2 border rounded"
                        placeholder="비밀번호 입력 (admin1234)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAuth()}
                    />
                    <Button className="w-full" onClick={checkAuth}>
                        접속하기
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-4xl p-8 space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">🛠️ Admin Dashboard</h1>
                <Button variant="ghost" onClick={() => setIsAuthorized(false)}>로그아웃</Button>
            </header>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <div className="text-sm text-blue-600 font-bold">전체 데이터</div>
                    <div className="text-3xl font-bold text-blue-900">{stats.benefits.toLocaleString()}건</div>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <div className="text-sm text-green-600 font-bold">발행된 포스팅</div>
                    <div className="text-3xl font-bold text-green-900">{stats.posts.toLocaleString()}건</div>
                </Card>
            </div>

            {/* 액션 패널 */}
            <Card className="space-y-4">
                <h2 className="text-xl font-bold">🤖 AI 블로그 생성</h2>
                <p className="text-slate-600 text-sm">
                    버튼을 누르면 현재 데이터 중 하나를 랜덤으로 골라 SEO 최적화된 블로그 글을 발행합니다.
                </p>
                <div className="flex gap-4">
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={loading ? "opacity-50" : ""}
                    >
                        {loading ? "생성 중..." : "🚀 글 1개 생성하기"}
                    </Button>
                </div>
            </Card>

            {/* 로그 패널 */}
            <Card className="bg-slate-900 text-slate-100 min-h-[300px] font-mono text-sm p-4 overflow-y-auto">
                <div className="text-slate-400 mb-2">--- System Logs ---</div>
                {logs.length === 0 && <div className="text-slate-600">대기 중...</div>}
                {logs.map((log, i) => (
                    <div key={i} className="py-1 border-b border-slate-800 last:border-0">
                        {log}
                    </div>
                ))}
            </Card>
        </main>
    );
}
