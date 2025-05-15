"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
    return (
        <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* 網站資訊 */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">遠望地平線</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            選讀國際，望向遠方。<br />
                            遠望地平線 Far Horizon News｜讓新聞不只是新聞。
                        </p>
                    </div>

                    {/* 快速連結 */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">快速連結</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    關於我們
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    聯絡我們
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    隱私權政策
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 社群媒體 */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">關注我們</h3>
                        <div className="flex space-x-4">
                            <motion.a
                                href="https://www.facebook.com/share/1BjfcvnKgg/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                </svg>
                            </motion.a>
                            <motion.a
                                href="https://www.instagram.com/farhorizonnews?igsh=eng1ZThsazJlZmRo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 dark:text-zinc-400 group transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="group-hover:fill-[url(#instagram-gradient)]" fill="currentColor" viewBox="0 0 24 24">
                                    <defs>
                                        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#fd5949" />
                                            <stop offset="50%" stopColor="#d6249f" />
                                            <stop offset="100%" stopColor="#285AEB" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </motion.a>
                            <motion.a
                                href="https://www.threads.com/@farhorizonnews?igshid=NTc4MTIwNjQ2YQ=="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    <p>© {new Date().getFullYear()} 遠望地平線 Far Horizon News. 保留所有權利。</p>
                </div>
            </div>
        </footer>
    );
} 