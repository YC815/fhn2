// components/NavBar.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search, Sun, Moon } from "lucide-react";
import ThemeSwitch from "@/components/ThemeSwitch";
import { usePathname } from "next/navigation";

export function NavBar({ searchTerm = "", onSearchChange = () => { } }) {
    // 使用 usePathname 獲取當前路徑
    const pathname = usePathname();
    // 檢查是否在首頁
    const isHomePage = pathname === "/";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-700">            {/* 左上角 Logo */}
            <Link href="/" className="flex items-center space-x-2">
                <Image
                    src="/favicon.ico"
                    alt="遠望地平線 Logo"
                    width={32}
                    height={32}
                    className="rounded-full"
                />
                <span className="text-xl font-bold whitespace-nowrap hidden sm:inline">遠望地平線</span>
                <span className="text-lg font-bold whitespace-nowrap sm:hidden">遠望</span>
            </Link>

            {/* 右側：搜尋 + 主題切換 */}
            <div className="flex items-center space-x-4">
                {/* 搜尋框 - 只在首頁顯示 */}
                {isHomePage && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <Input
                            placeholder="搜尋新聞..."
                            className="pl-10 w-36 md:w-64"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                )}

                {/* 主題切換 */}
                <ThemeSwitch />
            </div>
        </header>
    );
}
