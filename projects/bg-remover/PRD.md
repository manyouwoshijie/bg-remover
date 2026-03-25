# Image Background Remover — MVP 需求文档

**版本:** v1.0 | **日期:** 2026-03-25 | **状态:** 草稿

---

## 一、产品概述

| 项目 | 内容 |
|------|------|
| 产品名称 | Image Background Remover |
| 产品定位 | 轻量级在线抠图工具，一键去除图片背景 |
| 核心价值 | 零门槛、无需注册、秒出结果 |
| 技术路线 | Cloudflare Pages + Pages Functions + Remove.bg API |

---

## 二、目标用户与使用场景

**目标用户**
- 电商卖家：快速处理商品主图，生成白底图
- 设计师：快速处理素材，节省抠图时间
- 普通用户：头像、证件照背景处理

**典型场景**

用户拿到一张商品照，想要白底图发淘宝，打开网站 → 上传 → 3秒得到透明 PNG → 下载使用。

---

## 三、MVP 范围界定

### ✅ In Scope（本期做）
- 单张图片上传（拖拽 + 点击）
- 调用 Remove.bg API 去除背景
- 原图 / 结果图左右对比预览
- 下载透明背景 PNG
- 错误提示（文件过大、格式不支持、API 失败）
- 移动端适配（响应式布局）

### ❌ Out of Scope（本期不做）
- 用户注册 / 登录 / 历史记录
- 批量处理
- 自定义替换背景（颜色 / 图片）
- 图片存储 / 云端保存
- 付费墙 / 配额限制
- 多语言

---

## 四、功能需求

### 4.1 上传模块

| 需求项 | 说明 |
|--------|------|
| 支持格式 | JPG、PNG、WebP |
| 最大文件 | 12MB（Remove.bg 限制） |
| 上传方式 | 拖拽到 Drop Zone 或点击选择文件 |
| 前端校验 | 格式不符 → 提示错误；超大文件 → 提示压缩 |
| 上传后行为 | 立即显示原图预览，进入 Loading 状态 |

### 4.2 处理模块

| 需求项 | 说明 |
|--------|------|
| 处理方式 | 前端 POST 到 /api/remove，Worker 转发至 Remove.bg |
| 内存处理 | 图片全程在内存中流转，不落盘、不存储 |
| 超时处理 | 请求超过 30s 视为失败，返回错误提示 |
| API Key 安全 | Key 存储在 Cloudflare 环境变量（Secret），前端不可见 |

### 4.3 结果展示模块

| 需求项 | 说明 |
|--------|------|
| 展示方式 | 左：原图；右：透明背景结果（棋盘格底纹表示透明） |
| 结果图格式 | PNG（含透明通道） |

### 4.4 下载模块

| 需求项 | 说明 |
|--------|------|
| 下载文件名 | result.png |
| 下载方式 | 浏览器原生下载，无跳转 |

### 4.5 错误处理

| 错误类型 | 用户提示 |
|----------|----------|
| 文件格式错误 | "请上传 JPG / PNG / WebP 格式图片" |
| 文件过大 | "文件超过 12MB，请压缩后重试" |
| Remove.bg API 失败 | "处理失败，请稍后重试" |
| 网络超时 | "请求超时，请检查网络后重试" |
| API 额度耗尽 | "服务繁忙，请稍后重试"（不暴露具体原因） |

---

## 五、非功能需求

| 指标 | 目标值 |
|------|--------|
| 首屏加载 | < 1.5s（Cloudflare CDN 全球加速） |
| 图片处理响应 | < 5s（正常网络，< 5MB 图片） |
| 可用性 | 跟随 Cloudflare SLA（99.9%+） |
| 安全 | HTTPS 强制；API Key 不暴露前端；无用户数据留存 |
| 移动适配 | 支持 375px 以上屏幕宽度 |

---

## 六、技术架构

```
用户浏览器
    │  HTTPS
    ▼
Cloudflare Pages（静态前端）
  index.html / style.css / app.js
    │  POST /api/remove (multipart/form-data)
    ▼
Cloudflare Pages Functions（Worker）
  functions/api/remove.js
    │  POST https://api.remove.bg/v1.0/removebg
    │  Header: X-Api-Key: $REMOVE_BG_API_KEY (Secret)
    ▼
Remove.bg API
    │  返回透明 PNG（二进制流）
    ▼
Worker → 直接流式返回给浏览器
（全程无存储，内存处理）
```

---

## 七、API 规范

### POST /api/remove

**Request**
```
Content-Type: multipart/form-data
image: <File>   必填，图片文件
```

**Response — 成功 (200)**
```
Content-Type: image/png
Content-Disposition: attachment; filename="result.png"
<binary PNG data>
```

**Response — 失败**
```json
{ "error": "No image provided" }          // 400
{ "error": "Image too large (max 12MB)" } // 413
{ "error": "Processing failed" }          // 500
```

---

## 八、UI/UX 规格

### 页面流转
```
[上传区] → 选择文件 → [Loading] → [结果页]
                                      │
                                 [重新上传] → 回到 [上传区]
```

### 视觉规范

| 元素 | 规格 |
|------|------|
| 主色 | #0071e3 |
| 背景色 | #f5f5f7 |
| 字体 | 系统默认 sans-serif |
| 透明背景表示 | 棋盘格，格子 20×20px |
| 圆角 | 统一 12px |
| 最大内容宽度 | 720px，居中 |

---

## 九、验收标准

| # | 场景 | 预期结果 |
|---|------|----------|
| 1 | 上传合法 JPG（< 12MB） | 成功返回透明 PNG，可下载 |
| 2 | 上传非图片文件 | 前端拦截，提示格式错误 |
| 3 | 上传超过 12MB 图片 | 前端拦截，提示文件过大 |
| 4 | Remove.bg API 返回错误 | 页面显示"处理失败，请稍后重试" |
| 5 | 移动端（375px）访问 | 布局正常，可正常上传下载 |
| 6 | 查看 Network 请求 | 找不到 API Key，仅见 /api/remove 请求 |
| 7 | 处理完成后刷新页面 | 无任何图片数据残留（无存储） |

---

## 十、上线计划

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| Day 1 | 搭建项目结构，完成 Worker API | 1天 |
| Day 2 | 完成前端页面，本地联调 | 1天 |
| Day 3 | 部署 Cloudflare，配置 Secret，验收测试 | 1天 |

---

## 十一、后续迭代方向（Post-MVP）

- 自定义替换背景（纯色 / 自定义图片）
- 批量上传处理
- 用量统计 + 配额限制（接入付费）
- 用户账号体系
- 多语言支持（EN / ZH）
