import { useState, useMemo, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

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
            const data = await fetchWithRetry('/api/tags');
            setAllTags(data);
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
