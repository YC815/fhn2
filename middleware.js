import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 定義需要保護的路由
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
]);

// 定義公開路由
const isPublicRoute = (pathname) => {
  const publicPaths = [
    '/',
    '/admin/login',
    '/admin/sign-up(.*)',
    '/api/(.*)'
  ];
  return publicPaths.some(path => 
    path.includes('(.*)') 
      ? new RegExp(`^${path.replace('(.*)', '.*')}$`).test(pathname)
      : pathname === path
  );
};

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;
  
  // 如果是公開路由，直接放行
  if (isPublicRoute(pathname)) {
    return;
  }
  
  // 如果是受保護路由，檢查登入狀態
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

// 確保中間件只在需要時運行
export const config = {
  matcher: [
    '/((?!.+\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
};
