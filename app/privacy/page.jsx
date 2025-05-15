"use client";

import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import PageContent from "../components/PageContent";

export default function PrivacyPage() {
    return (
        <>
            <NavBar />
            <main className="min-h-screen bg-white dark:bg-zinc-900 pb-24">
                <PageContent pageName="privacy" />
            </main>
            <Footer />
        </>
    );
} 