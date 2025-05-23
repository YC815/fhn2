// app/providers.jsx
"use client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
        </ThemeProvider>
    );
}
