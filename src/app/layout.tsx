import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "حَارِس AI | Hares AI - تحليل ذكي للتطبيقات",
  description: "منصة حَارِس المتقدمة لتحليل تطبيقات Android وشرح النتائج باللغة العربية باستخدام الذكاء الاصطناعي",
  keywords: ["حَارِس", "Hares", "تحليل تطبيقات", "أمن سيبراني", "APK", "ذكاء اصطناعي"],
  authors: [{ name: "Hares AI" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-tajawal), sans-serif' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
