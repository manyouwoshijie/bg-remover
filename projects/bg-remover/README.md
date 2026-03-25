# bg-remover

一键去除图片背景，基于 Remove.bg API，使用 Next.js + Tailwind CSS 构建，部署在 Cloudflare Pages。

## 技术栈

- **前端**: Next.js 14 (App Router) + Tailwind CSS
- **后端**: Next.js API Routes（Edge Runtime）
- **API**: [Remove.bg](https://remove.bg)
- **部署**: Cloudflare Pages

## 项目结构

```
bg-remover/
├── app/
│   ├── api/remove/route.ts   # Edge API 路由，中转 Remove.bg
│   ├── page.tsx              # 主页面
│   ├── layout.tsx
│   └── globals.css
├── PRD.md                    # MVP 需求文档
├── next.config.ts
└── .env.local.example
```

## 功能

- 拖拽 / 点击上传图片（JPG / PNG / WebP，最大 12MB）
- 原图与结果左右对比预览（棋盘格表示透明区域）
- 一键下载透明背景 PNG
- 全程内存处理，无数据存储
- 移动端响应式适配

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 Remove.bg API Key

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 部署到 Cloudflare Pages

1. 推送代码到 GitHub
2. 进入 [Cloudflare Pages](https://pages.cloudflare.com) → 连接 GitHub 仓库
3. 构建配置：
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
4. 环境变量 → 添加 `REMOVE_BG_API_KEY`
5. 部署完成 🎉

## 获取 Remove.bg API Key

前往 https://remove.bg/api 注册，免费额度 50 次/月。
