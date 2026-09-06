import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tokyo Tower Studio · AI 生成',
  description: '东京塔交互式 3D 结构工作室。旋转、拆解、探索 640 个独立部件。AI 生成的程序化示意模型。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
