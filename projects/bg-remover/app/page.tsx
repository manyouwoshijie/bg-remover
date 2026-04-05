"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginReason, setLoginReason] = useState<'guest_limit' | 'credits_empty'>('guest_limit');
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
        let errCode = '';
        try {
          const errData = await response.json() as { error?: string; code?: string };
          errMsg = errData.error || errMsg;
          errCode = errData.code || '';
        } catch (e) { }

        // 额度/登录相关错误 → 弹出登录引导
        if (errCode === 'GUEST_LIMIT_REACHED') {
          setLoginReason('guest_limit');
          setShowLoginModal(true);
          setOriginalUrl(null);
          setFile(null);
          return;
        }
        if (errCode === 'INSUFFICIENT_CREDITS') {
          setLoginReason('credits_empty');
          setShowLoginModal(true);
          setOriginalUrl(null);
          setFile(null);
          return;
        }

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
            <p className="text-xs text-gray-400 mt-6">支持 JPG / PNG / WebP，最大 12MB · 游客免费试用 2 次</p>
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

      {/* Login Modal — 额度用完时弹出 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center">
            <div className="text-5xl mb-4">
              {loginReason === 'guest_limit' ? '🎉' : '⚡️'}
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">
              {loginReason === 'guest_limit' ? '免费次数已用完' : '额度已用完'}
            </h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              {loginReason === 'guest_limit'
                ? '游客可免费试用 2 次。登录即可获得 3 次永久额度，注册完全免费！'
                : '你的额度已用完。升级套餐或购买次数包继续使用。'}
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google 登录，立即获得 3 次额度
            </button>
            {loginReason === 'credits_empty' && (
              <a
                href="/pricing"
                className="w-full block px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 transition font-medium mb-3 text-sm"
              >
                查看套餐 →
              </a>
            )}
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              暂不登录
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
