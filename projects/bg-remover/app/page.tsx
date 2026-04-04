"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import AuthButton from '@/components/AuthButton';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 12 * 1024 * 1024; // 12MB

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (selectedFile: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('请上传 JPG / PNG / WebP 格式图片');
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError('文件超过 12MB，请压缩后重试');
      return;
    }

    setFile(selectedFile);
    setOriginalUrl(URL.createObjectURL(selectedFile));
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/remove', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errMsg = '处理失败，请稍后重试';
        try {
          const errData = await response.json();
          errMsg = (errData as { error?: string }).error || errMsg;
        } catch (e) { }
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('请求超时，请检查网络后重试');
      } else {
        setError(err.message || '处理失败，请稍后重试');
      }
      setOriginalUrl(null);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans text-gray-900">
      <div className="w-full max-w-3xl flex-1 flex flex-col">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="flex justify-end mb-4">
            <AuthButton />
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Background Remover</h1>
          <p className="text-gray-500 text-lg">上传图片，秒级去除背景，免费下载透明 PNG</p>
        </header>

        {/* Upload State */}
        {!originalUrl && !loading && (
          <div
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer bg-white ${isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-xl font-semibold mb-2">拖拽图片到这里</p>
            <p className="text-gray-400 mb-6">或者</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm">
              选择图片
            </button>
            <p className="text-xs text-gray-400 mt-6">支持 JPG / PNG / WebP，最大 12MB</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
            <div className="animate-spin rounded-full h-14 w-14 border-[4px] border-gray-200 border-t-blue-600 mb-6"></div>
            <p className="text-gray-600 font-medium animate-pulse">正在处理，请稍候...</p>
          </div>
        )}

        {/* Result State */}
        {resultUrl && !loading && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 text-center mb-3">原图</p>
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50">
                  <Image src={originalUrl!} alt="Original" fill className="object-contain" unoptimized />
                </div>
              </div>
              {/* Result */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 text-center mb-3">去除背景后</p>
                <div 
                  className="relative aspect-square w-full rounded-xl overflow-hidden" 
                  style={{ backgroundImage: 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0' }}
                >
                  <Image src={resultUrl} alt="Result" fill className="object-contain" unoptimized />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-2">
              <a 
                href={resultUrl} 
                download="result.png"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm text-center"
              >
                ⬇️ 下载 PNG
              </a>
              <button 
                onClick={reset}
                className="bg-white text-gray-700 border border-gray-300 hover:border-gray-400 font-semibold py-3 px-8 rounded-xl transition-colors text-center"
              >
                重新上传
              </button>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl text-center shadow-sm animate-in fade-in slide-in-from-bottom-2">
            {error}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-400">
          <p>Powered by <a href="https://remove.bg" target="_blank" rel="noreferrer" className="hover:text-gray-600 transition-colors">Remove.bg</a> · Deployed on Cloudflare</p>
        </footer>
      </div>
    </main>
  );
}
