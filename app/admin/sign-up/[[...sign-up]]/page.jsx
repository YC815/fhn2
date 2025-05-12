'use client';

import { SignUp } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // 如果用戶已經登入，則重定向到管理頁面
  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/admin');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return null; // 或者加載指示器
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            註冊管理員帳號
          </h2>
        </div>
        <div className="mt-8">
          <SignUp 
            path="/admin/sign-up" 
            routing="path"
            signInUrl="/admin/login"
            appearance={{
              elements: {
                card: 'shadow-lg rounded-2xl',
                headerTitle: 'text-2xl font-bold',
                headerSubtitle: 'text-sm text-gray-600',
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
