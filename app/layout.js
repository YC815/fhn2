// app/layout.js
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  metadataBase: new URL("https://your-website-url.com"),
  other: {
    // Google AdSense相關配置已移除
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Google AdSense腳本已移除 */}
        <ClerkProvider>
          <Providers>
            <NavBar /> {/* 👈 所有頁面都會有這個導覽列 */}
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
