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
    title: "高质量数据平台｜数据治理、评估与模型工程",
    description:
      "覆盖数据资产、治理生产、数据集评估、模型开发、能力评测与交付部署的一体化工作平台。",
    openGraph: {
      title: "高质量数据平台",
      description: "数据治理 · 模型工程 · 安全交付",
      type: "website",
      locale: "zh_CN",
      images: [{ url: imageUrl, width: 1680, height: 945, alt: "高质量数据平台" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "高质量数据平台",
      description: "数据治理 · 模型工程 · 安全交付",
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
