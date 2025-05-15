'use client';

import { SignIn } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // 如果用戶已經登入，則重定向到管理頁面
  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/admin');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            管理員登入
          </h2>
        </div>
        <div className="mt-8">
          <SignIn
            path="/admin/login"
            routing="path"
            signUpUrl="/admin/sign-up"
            appearance={{
              elements: {
                card: 'shadow-lg rounded-2xl',
                headerTitle: 'text-2xl font-bold',
                headerSubtitle: 'text-sm text-gray-600 dark:text-gray-300',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                footerActionLink: 'text-blue-600 hover:text-blue-800',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
