import Link from "next/link";
import React from "react";

export const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-600">보조24</span>
                    <span className="hidden text-sm font-medium text-slate-600 sm:inline-block">
                        보조24
                    </span>
                </Link>
                <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                    <Link href="/benefit" className="hover:text-blue-600 transition-colors">
                        지원금 찾기
                    </Link>
                    <Link href="/blog" className="hover:text-blue-600 transition-colors">
                        정보마당
                    </Link>
                </nav>
            </div>
        </header>
    );
};

export const Footer = () => {
    return (
        <footer className="border-t border-slate-200 bg-white py-12 text-sm text-slate-500">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <div>
                        <strong className="block text-lg font-bold text-slate-900 mb-2">보조24</strong>
                        <p>대한민국 모든 공공서비스를 쉽고 빠르게 찾아드립니다.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:text-right">
                        <Link href="/privacy" className="hover:text-slate-900">개인정보처리방침</Link>
                        <Link href="/terms" className="hover:text-slate-900">이용약관</Link>
                        <span className="text-xs mt-2">© 2025 보조24. All rights reserved.</span>
                    </div>
                </div>

                {/* AdSense 관련 안내 문구 (검수용) */}
                <div className="mt-8 border-t border-slate-100 pt-8 text-xs text-slate-400">
                    <p className="mb-2">
                        본 사이트는 공공데이터포털의 공공서비스 정보를 활용하여 제공합니다.
                        정확한 정보는 반드시 해당 기관의 공식 웹사이트를 통해 확인하시기 바랍니다.
                    </p>
                </div>
            </div>
        </footer>
    );
};
