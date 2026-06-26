"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface Props {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary not configured");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "bigpool/products");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

export default function CloudinaryUpload({ images, onChange, maxImages = 5 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining).filter((f) => f.type.startsWith("image/"));
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const urls = await Promise.all(toUpload.map(uploadToCloudinary));
      onChange([...images, ...urls]);
    } catch {
      alert("Upload failed. Check your Cloudinary credentials in .env.local");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [images, onChange, maxImages]);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {images.length < maxImages && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver ? "border-[#0d9488] bg-teal-50" : "border-gray-300 hover:border-[#0d9488] hover:bg-gray-50"
          } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-[#0d9488] mx-auto mb-2 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          )}
          <p className="text-sm font-medium text-gray-700">
            {uploading ? "Uploading…" : "Click or drag & drop images here"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG up to 5MB · {images.length}/{maxImages} uploaded
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  Main
                </span>
              )}
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < maxImages && !uploading && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#0d9488] flex items-center justify-center transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-gray-300" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
