import { useState, useMemo, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

// 定義本地儲存的 key
const LOCAL_STORAGE_KEY = 'cached-tags';
const LOCAL_STORAGE_TIME_KEY = 'cached-tags-time';

// 快取有效期（毫秒）：5分鐘
const CACHE_TTL = 5 * 60 * 1000;

export function TagSelector({ onChange, className = '' }) {
    const [selectedTags, setSelectedTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 從 API 獲取所有標籤
    const fetchTags = async () => {
        try {
            setError(null);
            setIsLoading(true);

            // 先檢查本地快取
            if (typeof window !== 'undefined') {
                const cachedTags = localStorage.getItem(LOCAL_STORAGE_KEY);
                const cachedTime = localStorage.getItem(LOCAL_STORAGE_TIME_KEY);
                const now = Date.now();

                // 檢查快取是否存在且未過期
                if (cachedTags && cachedTime && now - parseInt(cachedTime) < CACHE_TTL) {
                    console.log("使用本地快取的標籤");
                    const parsedTags = JSON.parse(cachedTags);
                    setAllTags(parsedTags);
                    setIsLoading(false);
                    return;
                }
            }

            // 如果沒有可用的快取，則從API請求
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const apiUrl = `${baseUrl}/api/tags`;
            console.log("請求標籤 API:", apiUrl);

            const data = await fetchWithRetry(apiUrl);
            console.log("API 回傳標籤資料:", data);
            setAllTags(data);

            // 設置本地快取
            if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem(LOCAL_STORAGE_TIME_KEY, Date.now().toString());
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
            setError('無法載入標籤，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const availableTags = useMemo(
        () => allTags.filter(tag => !selectedTags.includes(tag)),
        [allTags, selectedTags]
    );

    const addTag = (tag) => {
        const tagValue = typeof tag === 'object' ? tag.name : tag;
        if (!selectedTags.includes(tagValue)) {
            const next = [...selectedTags, tagValue];
            setSelectedTags(next);
            onChange?.(next);
        }
    };

    const removeTag = (tag) => {
        const next = selectedTags.filter(t => t !== tag);
        setSelectedTags(next);
        onChange?.(next);
    };

    // 手動重新整理標籤的函數
    const refreshTags = () => {
        // 清除本地快取
        if (typeof window !== 'undefined') {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_TIME_KEY);
        }

        // 重新獲取標籤
        setIsLoading(true);
        setError(null);
        fetchTags();
    };

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <div className="flex items-center flex-wrap gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg">
                <span className="font-medium">標籤</span>
                {isLoading ? (
                    <span className="text-sm text-zinc-500">載入中...</span>
                ) : error ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-red-500">{error}</span>
                        <button
                            onClick={() => {
                                setIsLoading(true);
                                setError(null);
                                fetchTags();
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                            重試
                        </button>
                    </div>
                ) : (
                    <>
                        {selectedTags.map((tag, index) => (
                            <Badge
                                key={`selected-${tag}-${index}`}
                                variant="secondary"
                                className="flex items-center space-x-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <span>#{tag}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTag(tag);
                                    }}
                                    className="p-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}

                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-0 bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-700">
                                <Command>
                                    <CommandInput
                                        placeholder="搜尋或選擇 Tag..."
                                        className="border-0 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                                    />
                                    <CommandList>
                                        {availableTags.map((tag, index) => (
                                            <CommandItem
                                                key={tag.id || `tag-${index}`}
                                                onSelect={() => addTag(tag.name || tag)}
                                                className="px-4 py-2 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                {tag.name || tag}
                                            </CommandItem>
                                        ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </>
                )}
            </div>
        </div>
    );
}
