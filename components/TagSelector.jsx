import { useState, useMemo } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

const ALL_TAGS = [
    "科技", "社會", "政治", "媒體",
    "AI", "未來", "開放資料", "趨勢"
];

export function TagSelector({ onChange }) {
    const [selectedTags, setSelectedTags] = useState([]);
    const availableTags = useMemo(
        () => ALL_TAGS.filter(tag => !selectedTags.includes(tag)),
        [selectedTags]
    );

    const addTag = (tag) => {
        const next = [...selectedTags, tag];
        setSelectedTags(next);
        onChange?.(next);
    };

    const removeTag = (tag) => {
        const next = selectedTags.filter(t => t !== tag);
        setSelectedTags(next);
        onChange?.(next);
    };

    return (
        <div className="flex items-center flex-wrap gap-2">
            <span className="font-medium">標籤</span>

            {selectedTags.map(tag => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center space-x-1"
                >
                    <span>#{tag}</span>
                    <button
                        onClick={() => removeTag(tag)}
                        className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
            ))}

            <Popover>
                <PopoverTrigger asChild>
                    <button className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600">
                        <Plus className="w-3 h-3" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                    <Command>
                        <CommandInput placeholder="搜尋或選擇 Tag..." />
                        <CommandList>
                            {availableTags.map(tag => (
                                <CommandItem key={tag} onSelect={() => addTag(tag)}>
                                    {tag}
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
