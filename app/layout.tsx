import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "高质量数据集评估平台",
    description:
      "复用原平台操作体系，统一承载数据盘点、数据治理、数据集评估、模型开发与能力评测。",
    openGraph: {
      title: "高质量数据集评估平台",
      description: "数据盘点 · 数据治理 · 数据评估 · 模型开发",
      type: "website",
      locale: "zh_CN",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "高质量数据集评估平台" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "高质量数据集评估平台",
      description: "数据盘点 · 数据治理 · 数据评估 · 模型开发",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
