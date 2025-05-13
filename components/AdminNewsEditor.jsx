"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImagePlus, Trash2, X, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Split from "react-split";
import { Editor } from "@monaco-editor/react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import { useCallback } from "react";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

function PreviewContent({ content, onClose }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onClose}
          className="fixed top-4 left-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          aria-label="返回編輯"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ node, ...props }) => <h1 {...props} />,
              h2: ({ node, ...props }) => <h2 {...props} />,
              h3: ({ node, ...props }) => <h3 {...props} />,
              h4: ({ node, ...props }) => <h4 {...props} />,
              h5: ({ node, ...props }) => <h5 {...props} />,
              h6: ({ node, ...props }) => <h6 {...props} />,
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  className="rounded shadow max-w-full h-auto my-4 block mx-auto"
                  onError={(e) => {
                    e.target.onerror = null; // 防止循環錯誤
                    e.target.src = "/placeholder.svg"; // 使用占位符圖片
                  }}
                />
              ),
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function NewsEditor({ initialData }) {
  const router = useRouter();
  const newsId = initialData?.id;
  const [cropFile, setCropFile] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showCoverGallery, setShowCoverGallery] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [homeTitle, setHomeTitle] = useState(initialData?.homeTitle || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [selectedTags, setSelectedTags] = useState(initialData?.tags || []);
  const [content, setContent] = useState(initialData?.contentMD || "");
  const [allTags, setAllTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [coverImage, setCoverImage] = useState(
    initialData?.coverImage
      ? {
          id: initialData.coverImage.id,
          url: initialData.coverImage.url,
          path: initialData.coverImage.path,
        }
      : null
  );
  // 初始化參考資料，確保至少有一個空參考
  const [references, setReferences] = useState(
    Array.isArray(initialData?.references) && initialData.references.length > 0
      ? initialData.references
      : [{ id: "", url: "", title: "" }]
  );
  const [copiedStates, setCopiedStates] = useState({});

  const uploadRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((tags) => {
        setAllTags(tags);
        // Filter out already selected tags from the dropdown
        setAllTags((prev) =>
          prev.filter((tag) => !selectedTags.includes(tag.name))
        );
      });

    const loadImages = async () => {
      // declare the inner helper
      async function fetchTags() {
        const res = await fetch("/api/images");
        const data = await res.json();
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setImages(sorted);
      }

      // actually call it
      await fetchTags();
    };

    loadImages();
  }, []);

  async function handleAddTag() {
    if (!newTagName) return;

    // 如果標籤不存在，就呼叫 API 新增
    if (!allTags.some((tag) => tag.name === newTagName)) {
      try {
        const res = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newTagName }),
        });
        if (!res.ok) throw new Error("新增標籤失敗");
        const tag = await res.json();
        setAllTags((prev) => [...prev, tag]);
        setSelectedTags((prev) => [...prev, tag.name]);
        setNewTagName("");
      } catch (error) {
        console.error("新增標籤時發生錯誤", error);
      }
    }
    // 否則直接加入已存在的標籤陣列
    else {
      setSelectedTags((prev) => [...prev, newTagName]);
      setNewTagName("");
    }
  }

  // 只從 selectedTags 移除，不動 allTags 和資料庫
  const handleDeleteGlobalTag = (idOrName) => {
    setSelectedTags((prev) =>
      prev.filter(
        (name) =>
          name !== idOrName &&
          name !== allTags.find((t) => t.id === idOrName)?.name
      )
    );
  };

  const uploadImage = async (file) => {
    try {
      console.group("📤 開始上傳檔案");
      console.log("📄 檔案資訊:", {
        name: file.name,
        size: file.size,
        type: file.type,
        isFile: file instanceof File,
        isBlob: file instanceof Blob,
      });

      // 檢查檔案類型
      if (!file.type.startsWith("image/")) {
        console.error("❌ 不支援的檔案類型:", file.type);
        throw new Error("僅支援圖片檔案 (JPG, PNG, GIF)");
      }

      // 檢查檔案大小 (限制 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        console.error("❌ 檔案大小超過限制:", file.size, "bytes");
        throw new Error("圖片大小不能超過 5MB");
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      if (newsId) formData.append("newsId", newsId);

      console.log("🔄 準備發送上傳請求...");
      console.log("📤 表單資料:", Array.from(formData.entries()));

      try {
        const response = await fetch("/api/images", {
          method: "POST",
          body: formData,
          // 注意：不要手動設置 Content-Type，讓瀏覽器自動設置 boundary
        });

        console.log("✅ 收到伺服器回應，狀態碼:", response.status);
        console.log(
          "📥 回應標頭:",
          Object.fromEntries(response.headers.entries())
        );

        let responseData;
        try {
          responseData = await response.json();
          console.log("📦 回應內容:", responseData);
        } catch (jsonError) {
          console.error("❌ 解析 JSON 回應失敗:", jsonError);
          const text = await response.text();
          console.error("📝 原始回應內容:", text);
          throw new Error(`伺服器回應格式錯誤: ${text.substring(0, 200)}`);
        }

        if (!response.ok) {
          const errorMessage = responseData?.message || "上傳失敗";
          console.error("❌ 上傳失敗:", {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            response: responseData,
          });
          throw new Error(`上傳失敗: ${errorMessage}`);
        }

        console.log("🎉 上傳成功:", responseData);
        const newImage = {
          id: responseData.id,
          url: responseData.url,
          path: responseData.path,
        };

        console.log("🖼️ 新圖片資訊:", newImage);
        setImages((prev) => [newImage, ...prev]);

        // 如果是第一張圖片，自動設為封面
        if (images.length === 0) {
          console.log("🏷️ 設為封面圖片");
          setCoverImage(newImage);
        }

        return newImage;
      } catch (fetchError) {
        console.error("❌ 發送請求時發生錯誤:", fetchError);
        throw new Error(`請求發送失敗: ${fetchError.message}`);
      }
    } catch (error) {
      console.error("❌ 上傳圖片發生錯誤:", {
        error: error,
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      alert(`上傳失敗: ${error.message || "未知錯誤"}`);
      throw error; // 重新拋出錯誤以便上層處理
    } finally {
      setIsUploading(false);
      console.groupEnd();
    }
  };

  const handleFiles = async (files, isCover = false) => {
    try {
      const file = files[0];
      if (!file) return;

      console.log("處理檔案:", file.name, "isCover:", isCover);

      if (isCover) {
        setCropFile(file);
      } else {
        await uploadImage(file);
        // 上傳成功後關閉彈出視窗
        setShowGallery(false);
      }
    } catch (error) {
      console.error("處理檔案時發生錯誤:", error);
      // 錯誤已經在 uploadImage 中處理並顯示給用戶
    }
  };

  const handleImageUpload = async (e, isCover = false) => {
    await handleFiles(e.target.files, isCover);
    // 清空 input 值，讓相同檔案可以重複上傳
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e, isCover = false) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    try {
      const files = e.dataTransfer.files;
      console.log("拖放檔案數量:", files.length);

      if (files && files.length > 0) {
        await handleFiles(files, isCover);
      }
    } catch (error) {
      console.error("處理拖放時發生錯誤:", error);
      alert(`處理檔案時發生錯誤: ${error.message || "未知錯誤"}`);
    }
  };

  const loadImages = async () => {
    // 載入所有圖片
    try {
      const res = await fetch("/api/images");
      const data = await res.json();
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setImages(sorted);
    } catch (error) {
      console.error("載入圖片庫失敗:", error);
    }
  };

  const handleDeleteImage = async (id, e) => {
    // 確保事件不會傳播
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("[刪除圖片] 點擊垃圾桶，圖片 id:", id);
    
    // 直接接著處理圖片刪除，不使用 confirm 對話框

    try {
      console.log("[刪除圖片] 發送 DELETE 請求到 /api/images/" + id);
      const apiUrl = `/api/images/${id}`;
      console.log("[刪除圖片] 完整請求URL:", apiUrl);
      
      // 直接在本地先移除圖片，改善使用者體驗
      const oldImages = [...images];
      setImages(prevImages => prevImages.filter(img => img.id !== id));
      
      try {
        const response = await fetch(apiUrl, { 
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        console.log("[刪除圖片] DELETE 請求回應 status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[刪除圖片] 回應不成功:", errorText);
          throw new Error(`刪除失敗: ${response.status} ${errorText.substring(0, 100)}`);
        }
        
        // 如果刪除的是當前封面圖片，清除封面狀態
        if (coverImage?.id === id) {
          setCoverImage(null);
          console.log("[刪除圖片] 被刪除的是封面，已清除 coverImage 狀態");
        }
        
        console.log("[刪除圖片] 刪除成功");
      } catch (fetchError) {
        console.error("[刪除圖片] 網路請求失敗:", fetchError);
        // 如果 API 失敗，還原圖片清單
        setImages(oldImages);
        throw fetchError;
      }
    } catch (error) {
      console.error("刪除圖片失敗:", error);
      alert("刪除圖片失敗，請稍後再試\n" + (error?.message || ""));
    }
  };

  async function handleSave() {
    try {
      // 表單驗證
      if (!title.trim()) {
        throw new Error("請輸入標題");
      }
      if (!content.trim()) {
        throw new Error("請輸入內容");
      }
      if (!coverImage) {
        const confirmed = confirm("您尚未設置封面圖片，確定要繼續嗎？");
        if (!confirmed) return;
      }

      const payload = {
        title: title.trim(),
        homeTitle: homeTitle.trim() || title.trim(),
        contentMD: content,
        contentHTML: content,
        coverImage: coverImage?.url || null,
        tagNames: Array.isArray(selectedTags) ? selectedTags : [],
        images: images.map((img) => ({
          id: img.id,
          url: img.url,
          path: img.path,
        })),
        references: references
          .filter((ref) => ref.url && ref.url.trim() !== "")
          .map(({ url, title }) => ({
            url: url.trim(),
            title: (title || "").trim(),
          })),
      };

      console.log("Saving with payload:", payload);

      // 使用 PUT 進行更新，POST 進行創建
      const method = newsId ? "PUT" : "POST";
      const url = newsId ? `/api/news/${newsId}` : "/api/news";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Save failed:", responseData);
        throw new Error(
          responseData.error || responseData.message || "儲存失敗"
        );
      }

      // 顯示成功消息並導航
      alert(newsId ? "文章更新成功！" : "文章創建成功！");
      router.push("/admin");
      router.refresh(); // 確保頁面數據是最新的
    } catch (error) {
      console.error("Error saving article:", error);
      alert(`儲存失敗: ${error.message || "未知錯誤"}`);
    }
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 設置 canvas 大小為裁切區域大小
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // 繪製裁切後的圖片
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // 返回 base64 圖片
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleCropComplete = async () => {
    try {
      if (!cropFile || !croppedAreaPixels) return;

      const imageUrl = URL.createObjectURL(cropFile);
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);

      // 上傳裁切後的圖片
      const newImage = await uploadImage(
        new File([croppedImage], cropFile.name, { type: "image/jpeg" })
      );
      if (newImage) {
        setCoverImage(newImage);
      }

      setCropFile(null);
      setCroppedAreaPixels(null);
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error("裁切圖片失敗:", error);
      alert("裁切圖片失敗，請稍後再試");
    }
  };

  const selectImageFromGallery = (image) => {
    setSelectedImage(image);
    setShowGallery(false);
  };

  const selectCoverImageFromGallery = (image) => {
    setCoverImage(image);
    setShowCoverGallery(false);
  };

  return (
    <div className="p-6 space-y-6">
      {showPreview && (
        <PreviewContent
          content={content}
          onClose={() => setShowPreview(false)}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {newsId ? "編輯文章" : "新增文章"}
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            預覽文章
          </Button>
          <Button onClick={handleSave}>儲存文章</Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">標題</Label>
        <Input
          id="title"
          placeholder="輸入標題"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>主頁顯示用圖</Label>
        <div className="flex items-center gap-4">
          {coverImage ? (
            <div className="relative group">
              <img
                src={coverImage.url}
                alt="封面圖片"
                className="w-32 h-32 object-cover rounded-md border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder.svg";
                }}
              />
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="移除封面圖片"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => coverRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4 mr-2" /> 上傳新圖片
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCoverGallery(true)}
            >
              從圖庫選擇
            </Button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, true)}
            />
          </div>
        </div>
      </div>

      {/* 圖片裁切對話框 */}
      <Dialog
        open={!!cropFile}
        onOpenChange={(open) => !open && setCropFile(null)}
      >
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="dark:text-white">裁切圖片</DialogTitle>
          </DialogHeader>
          <div className="relative h-96 w-full">
            {cropFile && (
              <Cropper
                image={URL.createObjectURL(cropFile)}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(croppedArea, croppedAreaPixels) => {
                  onCropComplete(croppedArea, croppedAreaPixels);
                }}
              />
            )}
          </div>
          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                縮放: {Math.round(zoom * 100)}%
              </span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCropFile(null)}>
                取消
              </Button>
              <Button onClick={handleCropComplete} disabled={isUploading}>
                {isUploading ? "處理中..." : "確認裁切"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 封面圖片選擇對話框 */}
      <Dialog open={showCoverGallery} onOpenChange={setShowCoverGallery}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="dark:text-white">選擇主頁顯示用圖</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh] w-full">
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <p>尚無圖片</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 p-4">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`relative group cursor-pointer rounded-md overflow-hidden border-2 ${coverImage?.id === img.id ? "border-blue-500" : "border-transparent"}`}
                      onClick={() => selectCoverImageFromGallery(img)}
                    >
                      <img
                        src={img.url}
                        alt="Gallery"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteImage(img.id, e);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* 圖片庫對話框 */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="dark:text-white">圖片庫</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="all" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">全部圖片</TabsTrigger>
                <TabsTrigger value="upload">上傳新圖片</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[60vh] w-full">
                  {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <p>尚無圖片</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4 p-4">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className={`relative group cursor-pointer rounded-md overflow-hidden border-2 ${
                            selectedImage?.id === img.id
                              ? "border-blue-500"
                              : "border-transparent"
                          }`}
                          onClick={() => selectImageFromGallery(img)}
                        >
                          <img
                            src={img.url}
                            alt="Gallery"
                            className="w-full h-32 object-cover"
                          />
                          <div 
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const markdown = `<img src="${img.url}" width="300"/>`;
                              try {
                                await navigator.clipboard.writeText(markdown);
                                console.log("已複製 Markdown 圖片格式到剪貼簿");
                                setCopiedStates((prev) => ({ ...prev, [img.id]: true }));
                                setTimeout(() => {
                                  setCopiedStates((prev) => ({ ...prev, [img.id]: false }));
                                }, 2000);
                              } catch (err) {
                                console.error("複製失敗:", err);
                              }
                            }}
                          >
                            <div className="bg-black bg-opacity-50 p-2 rounded-full">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                            {copiedStates[img.id] && (
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow animate-fade-in-out z-20">
                                已複製！
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteImage(img.id, e);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="upload" className="flex-1">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={() => uploadRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, false)}
                >
                  <ImagePlus
                    className={`w-12 h-12 mx-auto mb-2 ${
                      isDragging ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`${
                      isDragging
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {isDragging ? "放開以上傳圖片" : "點擊或拖曳圖片到此處上傳"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      isDragging
                        ? "text-blue-400 dark:text-blue-300"
                        : "text-gray-400 dark:text-gray-400"
                    }`}
                  >
                    支援 JPG, PNG 格式
                  </p>
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative">
            <Input
              placeholder="新增標籤"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onFocus={() => setShowTagDropdown(true)}
              onBlur={() => setShowTagDropdown(false)}
            />
            {showTagDropdown && (
              <>
                <div className="dropdown"></div>
                {/* <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-gray-300 rounded-md shadow-lg">
                  {allTags
                    .filter((tag) => !selectedTags.includes(tag.name))
                    .map((filteredTag) => (
                      <div
                        key={filteredTag.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onMouseDown={() =>
                          setSelectedTags([...selectedTags, filteredTag.name])
                        }
                      >
                        {filteredTag.name}
                      </div>
                    ))}
                </div> */}
              </>
            )}
          </div>
          <Button onClick={handleAddTag}>新增</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-1">
              <Button
                variant={
                  selectedTags.includes(tag.name) ? "primary" : "outline"
                }
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
              {selectedTags.includes(tag.name) && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDeleteGlobalTag(tag.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 圖庫區塊 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">圖片庫</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGallery(true)}
          >
            <ImagePlus className="w-4 h-4 mr-2" /> 管理圖片
          </Button>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-4 gap-4 p-2 border rounded-lg dark:border-gray-600">
            {images.slice(0, images.length >= 5 ? 3 : 4).map((img) => (
              <div
                key={img.id}
                className={`relative aspect-square rounded-md overflow-hidden border-2 group ${
                  coverImage?.id === img.id
                    ? "border-blue-500 dark:border-blue-400"
                    : "border-transparent"
                }`}
                onClick={() => setCoverImage(img)}
              >
                <div className="relative w-full h-full">
                  <img
                    src={img.url}
                    alt="Gallery thumbnail"
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      coverImage?.id !== img.id ? "group-hover:blur-sm" : ""
                    }`}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const markdown = `<img src="${img.url}" width="300"/>`;
                      try {
                        await navigator.clipboard.writeText(markdown);
                        console.log("已複製 Markdown 圖片格式到剪貼簿");
                        setCopiedStates((prev) => ({ ...prev, [img.id]: true }));
                        setTimeout(() => {
                          setCopiedStates((prev) => ({ ...prev, [img.id]: false }));
                        }, 2000);
                      } catch (err) {
                        console.error("複製失敗:", err);
                      }
                    }}
                  >
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      {copiedStates[img.id] ? (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow animate-fade-in-out z-20">
                          已複製！
                        </span>
                      ) : null}
                      <div
                        className={`absolute transition-all duration-300 ${
                          copiedStates[img.id]
                            ? "opacity-0 scale-75"
                            : "opacity-100"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </div>
                      <div
                        className={`absolute transition-all duration-300 ${
                          copiedStates[img.id]
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-75"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#4ade80"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteImage(img.id, e);
                  }}
                  className="absolute top-1 right-1 bg-red-500 dark:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(images.length >= 5 || images.length === 0) && (
              <div
                className={`aspect-square flex items-center justify-center ${
                  images.length === 0
                    ? "bg-transparent"
                    : "bg-gray-100 dark:bg-gray-700"
                } rounded-md cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600`}
                onClick={() => setShowGallery(true)}
              >
                <div className="text-center">
                  {images.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold dark:text-white">
                        +{images.length - 3}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        查看更多
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        點擊上傳圖片
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
            onClick={() => setShowGallery(true)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, true)}
          >
            <ImagePlus
              className={`w-8 h-8 mx-auto mb-2 ${
                isDragging ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <p
              className={`${
                isDragging
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {isDragging ? "放開以上傳圖片" : "點擊上傳圖片"}
            </p>
            <p
              className={`text-sm mt-1 ${
                isDragging
                  ? "text-blue-400 dark:text-blue-300"
                  : "text-gray-400 dark:text-gray-400"
              }`}
            >
              支援 JPG, PNG 格式
            </p>
          </div>
        )}
      </div>

      <Split
        sizes={[60, 40]}
        minSize={0}
        gutterSize={8}
        className="flex h-[70vh] mt-4"
      >
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
            <style jsx global>{`
              .prose h1 {
                font-size: 2.5rem;
                line-height: 1.2;
                margin-top: 1.5em;
                margin-bottom: 0.8em;
              }
              .prose h2 {
                font-size: 2rem;
                line-height: 1.25;
                margin-top: 1.3em;
                margin-bottom: 0.7em;
              }
              .prose h3 {
                font-size: 1.75rem;
                line-height: 1.3;
                margin-top: 1.2em;
                margin-bottom: 0.6em;
              }
              .prose h4 {
                font-size: 1.5rem;
                line-height: 1.35;
                margin-top: 1.1em;
                margin-bottom: 0.5em;
              }
              .prose h5 {
                font-size: 1.25rem;
                line-height: 1.4;
                margin-top: 1em;
                margin-bottom: 0.4em;
              }
              .prose h6 {
                font-size: 1rem;
                line-height: 1.5;
                margin-top: 0.9em;
                margin-bottom: 0.3em;
              }
              .prose hr {
                margin-top: 2em;
                margin-bottom: 2em;
              }
            `}</style>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => <h1 {...props} />,
                h2: ({ node, ...props }) => <h2 {...props} />,
                h3: ({ node, ...props }) => <h3 {...props} />,
                h4: ({ node, ...props }) => <h4 {...props} />,
                h5: ({ node, ...props }) => <h5 {...props} />,
                h6: ({ node, ...props }) => <h6 {...props} />,
                img: ({ node, ...props }) => {
                  // 使用 span 替代 div，因為 div 不能是 p 的子元素
                  return (
                    <span className="block my-4">
                      <img
                        {...props}
                        className="mx-auto rounded shadow max-w-full h-auto"
                      />
                    </span>
                  );
                },
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
        </div>
      </Split>

      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8 mb-8">
        <h3 className="text-xl font-semibold mb-6">參考資料</h3>
        <div className="space-y-4">
          {references.map((ref, idx) => (
            <div key={ref.id || idx} className="flex items-start gap-2 group">
              <div className="mt-2 w-6 flex-shrink-0">{idx + 1}.</div>
              <div className="flex-1 flex items-start gap-2">
                <input
                  type="text"
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                  placeholder="參考資料網址"
                  value={ref.url || ""}
                  onChange={(e) => {
                    const newRefs = [...references];
                    newRefs[idx] = { ...newRefs[idx], url: e.target.value };
                    setReferences(newRefs);
                  }}
                />
                <input
                  type="text"
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                  placeholder="參考資料標題 (選填)"
                  value={ref.title || ""}
                  onChange={(e) => {
                    const newRefs = [...references];
                    newRefs[idx] = { ...newRefs[idx], title: e.target.value };
                    setReferences(newRefs);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const newRefs = references.filter((_, i) => i !== idx);
                    setReferences(newRefs);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() =>
              setReferences([...references, { id: "", url: "", title: "" }])
            }
          >
            新增參考資料
          </Button>
        </div>
      </div>
    </div>
  );
}

// 使用 export 宣告 CoverImageCropModal 組件
export function CoverImageCropModal({ file, onCancel, onCropped }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleCropSave() {
    const croppedBlob = await getCroppedImg(file, croppedAreaPixels);
    const fd = new FormData();
    fd.append("file", croppedBlob, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/images");
    xhr.onload = () => {
      if (xhr.status === 200) {
        const img = JSON.parse(xhr.responseText);
        onCropped(img);
      }
    };
    xhr.send(fd);
  }

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
          <Button onClick={onCancel} variant="secondary">
            取消
          </Button>
          <Button onClick={handleCropSave}>儲存裁切</Button>
        </div>
      </div>
    </Dialog>
  );
}
