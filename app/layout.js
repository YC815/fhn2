// app/layout.js
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>
        <Providers>
          <NavBar /> {/* 👈 所有頁面都會有這個導覽列 */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
