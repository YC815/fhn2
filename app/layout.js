// app/layout.js
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

export const metadata = {
  metadataBase: new URL("https://your-website-url.com"),
  other: {
    "google-adsense-account": "ca-pub-9993759051139856",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9993759051139856"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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
