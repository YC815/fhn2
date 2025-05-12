// app/layout.js
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
