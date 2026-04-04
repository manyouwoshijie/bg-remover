import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'Background Remover — 一键抠图',
  description: '上传图片，秒级去除背景，免费下载透明 PNG',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
