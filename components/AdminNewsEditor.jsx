"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Split from "react-split";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, Trash2 } from "lucide-react";
import { Editor } from "@monaco-editor/react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { Dialog } from '@/components/ui/dialog';
import { useCallback } from 'react';

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function NewsEditor({ initialData }) {
    const router = useRouter();
    const newsId = initialData?.id;
    const [cropFile, setCropFile] = useState(null);

    const [homeTitle, setHomeTitle] = useState(initialData?.homeTitle || "");
    const [selectedTags, setSelectedTags] = useState(initialData?.tags || []);
    const [content, setContent] = useState(initialData?.contentMD || "");
    const [allTags, setAllTags] = useState([]);
    const [newTagName, setNewTagName] = useState("");
    const [images, setImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [coverImage, setCoverImage] = useState(null);
    const [references, setReferences] = useState([""]);
    const uploadRef = useRef(null);
    const coverRef = useRef(null);

    useEffect(() => {
        fetch("/api/tags").then((res) => res.json()).then(setAllTags);

        const loadImages = async () => {
            const res = await fetch("/api/images");
            const data = await res.json();
            const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setImages(sorted);
        };

        loadImages();
    }, []);

    const handleAddTag = async () => {
        if (!newTagName) return;
        const res = await fetch("/api/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newTagName }),
        });
        if (res.ok) {
            const tag = await res.json();
            setAllTags((prev) => [...prev, tag]);
            setNewTagName("");
        }
    };

    const handleDeleteGlobalTag = async (id) => {
        await fetch(`/api/tags/${id}`, { method: "DELETE" });
        setAllTags((prev) => prev.filter((tag) => tag.id !== id));
        setSelectedTags((prev) => prev.filter((name) => name !== id));
    };

    const handleImageUpload = async (e, isCover = false) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        if (newsId) fd.append("newsId", newsId);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/images");
        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setUploadProgress((ev.loaded / ev.total) * 100);
        };
        xhr.onload = () => {
            if (xhr.status === 200) {
                const img = JSON.parse(xhr.responseText);
                setImages((prev) => [img, ...prev]);
                if (isCover) setCoverImage(img);
            }
            setUploadProgress(0);
        };
        xhr.send(fd);
    };

    const handleDeleteImage = async (id) => {
        const confirmed = confirm("確定要刪除這張圖片嗎？");
        if (!confirmed) return;
        await fetch(`/api/images/${id}`, { method: "DELETE" });
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const handleSave = async () => {
        const payload = {
            homeTitle,
            tags: selectedTags,
            contentMD: content,
            imageIds: images.map((img) => img.id),
            coverImageId: coverImage?.id || null,
            references,
        };
        const method = newsId ? "PATCH" : "POST";
        const url = newsId ? `/api/news/${newsId}` : "/api/news";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        router.push("/admin");
    };
    const [title, setTitle] = useState(initialData?.title || "");

    return (
        <div className="p-6 space-y-6">
            <Input
                placeholder="首頁專用標題"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
            />
            {cropFile && (
                <CoverImageCropModal
                    file={cropFile}
                    onCancel={() => setCropFile(null)}
                    onCropped={(img) => {
                        setCoverImage(img);
                        setCropFile(null);
                    }}
                />
            )}


            <div className="space-y-2">
                <div className="flex gap-2">
                    <Input
                        placeholder="新增標籤"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <Button onClick={handleAddTag}>新增</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-1">
                            <Button
                                variant={selectedTags.includes(tag.name) ? "primary" : "outline"}
                                size="sm"
                                onClick={() =>
                                    setSelectedTags((st) =>
                                        st.includes(tag.name)
                                            ? st.filter((t) => t !== tag.name)
                                            : [...st, tag.name]
                                    )
                                }
                            >
                                #{tag.name}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDeleteGlobalTag(tag.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold">主頁圖片</h3>
                    <label className="cursor-pointer">
                        <ArrowUpIcon className="w-5 h-5" />
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setCropFile(e.target.files[0]);
                                }
                            }}
                        />

                    </label>
                </div>

                {coverImage && (
                    <div className="relative">
                        <img src={coverImage.url} alt="cover" className="w-48 h-48 object-cover rounded shadow" />
                        <button
                            onClick={() => setCoverImage(null)}
                            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full"
                        >
                            <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                    </div>
                )}
            </div>

            <Split sizes={[60, 40]} minSize={0} gutterSize={8} className="flex h-[70vh]">
                <div className="w-full h-full">
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        theme="vs-dark"
                        value={content}
                        onChange={(value) => setContent(value || "")}
                        options={{ lineNumbers: "on", fontSize: 14 }}
                    />
                </div>

                <div className="p-2 overflow-auto">
                    <div className="prose prose-lg prose-slate dark:prose-invert">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                img: ({ node, ...props }) => (
                                    <img {...props} className="max-w-full rounded shadow" />
                                ),
                                a: ({ href, children, ...props }) => {
                                    const isExternal = href && !href.startsWith("/");
                                    return (
                                        <a
                                            href={href}
                                            {...props}
                                            target={isExternal ? "_blank" : undefined}
                                            rel={isExternal ? "noopener noreferrer" : undefined}
                                            className="text-blue-600 underline"
                                        >
                                            {children}
                                        </a>
                                    );
                                },
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>

                    <div className="mt-4 space-y-2">
                        <h4 className="font-bold">參考來源</h4>
                        {references.map((ref, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <div className="mt-2">{idx + 1}.</div>
                                <textarea
                                    className="w-full p-2 border rounded resize-none"
                                    value={ref}
                                    rows={2}
                                    onChange={(e) => {
                                        const newRefs = [...references];
                                        newRefs[idx] = e.target.value;
                                        setReferences(newRefs);
                                    }}
                                />
                            </div>
                        ))}
                        <Button onClick={() => setReferences([...references, ""])}>新增參考</Button>
                    </div>
                </div>
            </Split>

            <div className="text-right">
                <Button onClick={handleSave}>送出</Button>
            </div>
        </div>
    );
}


function CoverImageCropModal({ file, onCancel, onCropped }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleCropSave = async () => {
        const croppedBlob = await getCroppedImg(file, croppedAreaPixels);
        const fd = new FormData();
        fd.append('file', croppedBlob, file.name);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/images");
        xhr.onload = () => {
            if (xhr.status === 200) {
                const img = JSON.parse(xhr.responseText);
                onCropped(img);
            }
        };
        xhr.send(fd);
    };

    const imageUrl = URL.createObjectURL(file);

    return (
        <Dialog open onOpenChange={onCancel}>
            <div className="p-4 w-[90vw] h-[70vh] relative">
                <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1} // 正方形
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                    <Button onClick={onCancel} variant="secondary">取消</Button>
                    <Button onClick={handleCropSave}>儲存裁切</Button>
                </div>
            </div>
        </Dialog>
    );
}