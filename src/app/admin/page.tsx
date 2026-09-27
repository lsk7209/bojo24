"use client";

import { useState } from "react";
import { generateSinglePost, getDashboardStats, saveHeadScript, getHeadScript, loginAdmin, logoutAdmin } from "./actions";
import { Card, Button, Badge } from "@components/ui";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<"dashboard" | "content" | "settings">("dashboard");
    const [loading, setLoading] = useState(false);

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [headScript, setHeadScript] = useState("");
    const [logs, setLogs] = useState<string[]>([]);

    const checkAuth = async () => {
        const res = await loginAdmin(password);
        if (res.success) {
            setPassword("");
            setIsAuthorized(true);
            loadAllData();
        } else {
            alert(res.message);
        }
    };

    const loadAllData = async () => {
        try {
            const [s, hs] = await Promise.all([getDashboardStats(), getHeadScript()]);
            setStats(s);
            setHeadScript(hs);
        } catch {
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            setIsAuthorized(false);
        }
    };

    const handleLogout = async () => {
        await logoutAdmin();
        setIsAuthorized(false);
    };

    const handleGenerate = async () => {
        setLoading(true);
        setLogs(prev => ["생성 시작...", ...prev]);
        try {
            const res = await generateSinglePost();
            setLogs(prev => [res.success ? `✅ ${res.message}` : `❌ ${res.message}`, ...prev]);
            loadAllData();
        } catch {
            setLogs(prev => [`❌ 세션이 만료되었습니다.`, ...prev]);
            setIsAuthorized(false);
        }
        setLoading(false);
    };

    const handleSaveScript = async () => {
        try {
            const res = await saveHeadScript(headScript);
            alert(res.message);
        } catch {
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            setIsAuthorized(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
                <Card className="w-full max-w-sm p-8 space-y-4 shadow-xl">
                    <h1 className="text-2xl font-bold text-center">🔐 관리자 접속</h1>
                    <input
                        type="password"
                        className="w-full p-3 border rounded-lg"
                        placeholder="비밀번호 입력"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAuth()}
                    />
                    <Button className="w-full" onClick={checkAuth}>접속하기</Button>
                </Card>
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-6xl p-4 sm:p-8 space-y-8 pb-20">
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-800">Admin Console</h1>
                <div className="flex gap-2">
                    <Button variant={activeTab === "dashboard" ? "primary" : "ghost"} onClick={() => setActiveTab("dashboard")}>대시보드</Button>
                    <Button variant={activeTab === "settings" ? "primary" : "ghost"} onClick={() => setActiveTab("settings")}>설정관리</Button>
                    <Button variant="ghost" onClick={handleLogout} className="text-red-500">로그아웃</Button>
                </div>
            </header>

            {/* 1. 대시보드 탭 */}
            {activeTab === "dashboard" && stats && (
                <div className="space-y-6">
                    {/* 요약 카드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-blue-50 border-blue-100 p-6">
                            <div className="text-sm font-bold text-blue-600">총 혜택 데이터</div>
                            <div className="text-3xl font-black text-slate-900">{stats.overview.benefits}</div>
                        </Card>
                        <Card className="bg-green-50 border-green-100 p-6">
                            <div className="text-sm font-bold text-green-600">발행된 포스팅</div>
                            <div className="text-3xl font-black text-slate-900">{stats.overview.posts}</div>
                        </Card>
                        <Card className="bg-purple-50 border-purple-100 p-6">
                            <div className="text-sm font-bold text-purple-600">누적 조회수 (Sample)</div>
                            <div className="text-3xl font-black text-slate-900">{stats.overview.totalViews}</div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 방문자 추이 */}
                        <Card>
                            <h3 className="text-lg font-bold mb-4">📈 일별 방문 추이 (최근 7일)</h3>
                            <div className="space-y-2">
                                {stats.dailyVisits.map(([date, count]: any) => (
                                    <div key={date} className="flex items-center gap-2 text-sm">
                                        <span className="w-24 text-slate-500">{date}</span>
                                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                            <div style={{ width: `${Math.min(count * 5, 100)}%` }} className="h-full bg-blue-500 rounded-full" />
                                        </div>
                                        <span className="font-bold w-10 text-right">{count}</span>
                                    </div>
                                ))}
                                {stats.dailyVisits.length === 0 && <div className="text-slate-400 py-4">데이터가 없습니다.</div>}
                            </div>
                        </Card>

                        {/* 인기 페이지 */}
                        <Card>
                            <h3 className="text-lg font-bold mb-4">🔥 인기 콘텐츠 TOP 10</h3>
                            <ul className="space-y-2 text-sm">
                                {stats.topPages.map(([path, count]: any, idx: number) => (
                                    <li key={path} className="flex justify-between items-center py-1 border-b last:border-0 border-slate-50">
                                        <span className="truncate flex-1 pr-4">
                                            <span className="inline-block w-6 text-slate-400 font-mono">{idx + 1}.</span>
                                            {path}
                                        </span>
                                        <Badge>{count} view</Badge>
                                    </li>
                                ))}
                                {stats.topPages.length === 0 && <div className="text-slate-400 py-4">데이터가 없습니다.</div>}
                            </ul>
                        </Card>
                    </div>

                    {/* 액션 */}
                    <Card className="bg-slate-50">
                        <h3 className="text-lg font-bold mb-2">⚡ 빠른 작업</h3>
                        <div className="flex gap-2">
                            <Button onClick={handleGenerate} disabled={loading}>
                                {loading ? "생성 중..." : "AI 블로그 포스팅 1건 발행"}
                            </Button>
                        </div>
                        {/* 로그 뷰어 */}
                        <div className="mt-4 p-3 bg-slate-900 text-green-400 text-xs font-mono rounded h-32 overflow-y-auto">
                            {logs.map((L, i) => <div key={i}>{L}</div>)}
                            {logs.length === 0 && <span className="text-slate-600">System Ready...</span>}
                        </div>
                    </Card>
                </div>
            )}

            {/* 2. 설정 탭 */}
            {activeTab === "settings" && (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold mb-2">HTML Head 스크립트 관리</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            &lt;head&gt; 태그 내에 삽입할 스크립트를 입력하세요. (예: Google Analytics, 네이버 소유권 확인 등)
                            <br />
                            <span className="text-red-500">주의: 잘못된 스크립트 입력 시 사이트가 깨질 수 있습니다.</span>
                        </p>
                        <textarea
                            className="w-full h-64 p-4 font-mono text-sm border rounded bg-slate-50 focus:bg-white transition-colors"
                            value={headScript}
                            onChange={(e) => setHeadScript(e.target.value)}
                            placeholder='<script>...</script>'
                        />
                        <div className="mt-4 flex justify-end">
                            <Button variant="primary" onClick={handleSaveScript}>변경사항 저장</Button>
                        </div>
                    </Card>
                </div>
            )}
        </main>
    );
}
