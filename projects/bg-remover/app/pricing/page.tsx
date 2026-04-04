import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "定价 | Background Remover",
  description: "选择适合你的套餐，免费注册即送 3 次额度",
};

const plans = [
  {
    name: "免费版",
    price: "¥0",
    period: "",
    credits: "3 次",
    creditNote: "注册赠送，永久有效",
    features: ["JPG / PNG / WebP 支持", "最大 12MB", "透明 PNG 下载", "基础分辨率输出"],
    cta: "免费注册",
    ctaHref: "/api/auth/signin/google",
    highlight: false,
    disabled: false,
  },
  {
    name: "Pro",
    price: "¥19",
    period: "/月",
    credits: "50 次/月",
    creditNote: "每月自动重置",
    features: ["全部免费功能", "高分辨率输出", "优先处理队列", "使用历史记录"],
    cta: "即将上线",
    ctaHref: "#",
    highlight: true,
    disabled: true,
  },
  {
    name: "Pro+",
    price: "¥49",
    period: "/月",
    credits: "200 次/月",
    creditNote: "每月自动重置",
    features: ["全部 Pro 功能", "批量处理", "API 接口访问", "优先客服支持"],
    cta: "即将上线",
    ctaHref: "#",
    highlight: false,
    disabled: true,
  },
];

const packs = [
  { name: "小包", price: "¥9.9", credits: "30 次", unit: "≈¥0.33/次" },
  { name: "大包", price: "¥29", credits: "100 次", unit: "≈¥0.29/次" },
];

const faqs = [
  {
    q: "支持哪些图片格式？",
    a: "支持 JPG、PNG、WebP 格式，单张最大 12MB。",
  },
  {
    q: "处理结果会保存在服务器吗？",
    a: "不会。图片处理完成后立即删除，我们不存储您的任何图片数据。",
  },
  {
    q: "额度怎么计算？",
    a: "每次成功去除背景扣减 1 次额度。处理失败不扣减额度。",
  },
  {
    q: "月套餐的额度会过期吗？",
    a: "月套餐额度每月重置，未用完的额度不累计到下月。一次性额度包永久有效。",
  },
  {
    q: "支持哪些支付方式？",
    a: "即将支持 PayPal、微信支付、支付宝。敬请期待。",
  },
  {
    q: "有企业批量采购方案吗？",
    a: "有，请发邮件至 hi@bgremover.shop 联系我们。",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <a href="/" className="inline-block text-gray-400 hover:text-gray-600 text-sm mb-6">← 返回首页</a>
          <h1 className="text-4xl font-bold mb-4">简单透明的定价</h1>
          <p className="text-gray-500 text-lg">免费注册即送 3 次额度，无需信用卡</p>
        </div>

        {/* 月订阅套餐 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-6 border ${
                plan.highlight
                  ? "border-blue-500 shadow-lg shadow-blue-100 relative"
                  : "border-gray-100 shadow-sm"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  最受欢迎
                </div>
              )}
              <h2 className="text-lg font-semibold mb-1">{plan.name}</h2>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-400 mb-1">{plan.period}</span>
              </div>
              <p className="text-sm text-blue-600 font-medium mb-1">{plan.credits}</p>
              <p className="text-xs text-gray-400 mb-4">{plan.creditNote}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaHref}
                className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  plan.disabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : plan.highlight
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* 一次性额度包 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-12">
          <h2 className="text-lg font-semibold mb-1">一次性额度包</h2>
          <p className="text-sm text-gray-400 mb-4">买了就用，永久有效，灵活充值</p>
          <div className="grid grid-cols-2 gap-4">
            {packs.map((pack) => (
              <div key={pack.name} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{pack.credits}</p>
                  <p className="text-xs text-gray-400">{pack.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{pack.price}</p>
                  <span className="text-xs text-gray-400 line-through">即将上线</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
