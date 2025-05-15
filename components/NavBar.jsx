// components/NavBar.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search, Sun, Moon, Facebook, Instagram, AtSign } from "lucide-react";
import ThemeSwitch from "@/components/ThemeSwitch";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavBar({ searchTerm = "", onSearchChange = () => { } }) {
    // 使用 usePathname 獲取當前路徑
    const pathname = usePathname();
    // 檢查是否在首頁
    const isHomePage = pathname === "/";
    // 控制搜尋框的顯示狀態
    const [showSearch, setShowSearch] = useState(false);
    // 搜尋框參考
    const searchInputRef = useRef(null);
    // 追蹤視窗寬度
    const [isMobile, setIsMobile] = useState(false);
    // 搜尋图标參考
    const searchIconRef = useRef(null);

    // 處理視窗大小變化
    useEffect(() => {
        // 初始化判斷
        setIsMobile(window.innerWidth < 768);

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // 處理點擊搜尋圖標
    const handleSearchIconClick = () => {
        setShowSearch(true);
        // 延遲聚焦到輸入框，等動畫完成
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 300);
    };

    // 處理點擊外部關閉搜尋框
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchInputRef.current &&
                !searchInputRef.current.contains(event.target) &&
                !event.target.closest('.search-icon-container')) {
                setShowSearch(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-700">
            {/* 左上角 Logo */}
            <motion.div
                initial={false}
                animate={{
                    opacity: isMobile && showSearch ? 0 : 1,
                    x: isMobile && showSearch ? -20 : 0,
                    filter: "none" // 確保不會被模糊
                }}
                transition={{ duration: 0.3 }}
                style={{ willChange: "transform" }} // 提示瀏覽器使用硬體加速
            >
                <Link href="/" className="flex items-center space-x-2">
                    <Image
                        src="/favicon.ico"
                        alt="遠望地平線 Logo"
                        width={32}
                        height={32}
                        className="rounded-full"
                        priority={true} // 優先載入圖片
                        style={{
                            transform: "translateZ(0)", // 強制啟用硬體加速
                            backfaceVisibility: "hidden" // 防止3D變換中的模糊
                        }}
                    />
                    <span className="text-xl font-bold whitespace-nowrap hidden sm:inline">遠望地平線</span>
                    <span className="text-lg font-bold whitespace-nowrap sm:hidden">遠望</span>
                </Link>
            </motion.div>

            {/* 右側：搜尋 + 社群媒體圖標 + 主題切換 */}
            <div className="flex items-center space-x-4">
                {/* 搜尋框 - 只在首頁顯示 */}
                {isHomePage && (
                    <div className="relative flex items-center mr-3">
                        {/* 桌面版搜尋框 - 永遠顯示 */}
                        {!isMobile && (
                            <div className="relative flex items-center ml-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 z-10" />
                                <Input
                                    ref={!isMobile ? searchInputRef : null}
                                    placeholder="搜尋新聞..."
                                    className="pl-10 w-36 md:w-64 placeholder:text-zinc-400 border-stone-400 dark:border-stone-600 rounded-full"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </div>
                        )}

                        {/* 手機版搜尋框與動畫 */}
                        {isMobile && (
                            <AnimatePresence mode="wait">
                                {!showSearch ? (
                                    // 步驟1: 只顯示圓形搜尋圖標
                                    <motion.div
                                        key="searchIcon"
                                        className="search-icon-container cursor-pointer flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border border-stone-300 dark:border-stone-600 shadow-sm"
                                        onClick={handleSearchIconClick}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.8,
                                        }}
                                        style={{
                                            willChange: "transform, opacity"
                                        }}
                                    >
                                        <Search className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                                    </motion.div>
                                ) : (
                                    // 步驟2: 展開的搜尋框 - 使用transform代替width
                                    <motion.div
                                        key="searchExpanded"
                                        className="h-9 flex items-center bg-white dark:bg-zinc-800 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 shadow-md"
                                        initial={{
                                            width: "2.25rem",
                                            opacity: 0.9,
                                            scale: 1
                                        }}
                                        animate={{
                                            width: "calc(100vw - 3rem)",
                                            opacity: 1,
                                            scale: 1
                                        }}
                                        exit={{
                                            width: "2.25rem",
                                            opacity: 0,
                                            scale: 1
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                            mass: 0.8
                                        }}
                                        style={{
                                            willChange: "transform, opacity, width"
                                        }}
                                    >
                                        <div className="flex items-center w-full px-3 py-1.5">
                                            <Search className="w-5 h-5 text-zinc-700 dark:text-zinc-300 mr-2 flex-shrink-0" />
                                            <Input
                                                ref={searchInputRef}
                                                placeholder="搜尋新聞..."
                                                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6 placeholder:text-zinc-400"
                                                value={searchTerm}
                                                onChange={(e) => onSearchChange(e.target.value)}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                )}

                {/* 社群媒體圖標 */}
                <motion.div
                    className="flex items-center space-x-3"
                    animate={{
                        opacity: isMobile && showSearch ? 0 : 1,
                        x: isMobile && showSearch ? 30 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ willChange: "transform, opacity" }}
                >
                    <motion.a
                        href="https://www.threads.com/@farhorizonnews?igshid=NTc4MTIwNjQ2YQ=="
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-stone-300 dark:border-stone-600 shadow-sm social-media-button"
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{ willChange: "transform, box-shadow" }}
                    >
                        <AtSign className="w-4 h-4" />
                    </motion.a>
                    <motion.a
                        href="https://www.instagram.com/farhorizonnews?igsh=eng1ZThsazJlZmRo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-stone-300 dark:border-stone-600 shadow-sm social-media-button"
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{ willChange: "transform, box-shadow" }}
                    >
                        <Instagram className="w-4 h-4" />
                    </motion.a>
                    <motion.a
                        href="https://www.facebook.com/share/1BjfcvnKgg/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-stone-300 dark:border-stone-600 shadow-sm social-media-button"
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{ willChange: "transform, box-shadow" }}
                    >
                        <Facebook className="w-4 h-4" />
                    </motion.a>
                </motion.div>

                {/* 主題切換 */}
                <motion.div
                    animate={{
                        opacity: isMobile && showSearch ? 0 : 1,
                        x: isMobile && showSearch ? 30 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ willChange: "transform, opacity" }}
                >
                    <ThemeSwitch />
                </motion.div>
            </div>
        </header>
    );
}
