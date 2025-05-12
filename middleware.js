import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 定義需要保護的路由
const isProtectedRoute = createRouteMatcher([
  '/admin',
  '/admin/(.*)',
  '/api/admin/(.*)'
]);

// 定義公開路由
const isPublicRoute = (pathname) => {
  const publicPaths = [
    '/',
    '/admin/login(.*)',  // 更新為匹配所有 /admin/login 下的路由
    '/admin/sign-up(.*)',
    '/api/(.*)'
  ];
  return publicPaths.some(path => 
    path.includes('(.*)') 
      ? new RegExp(`^${path.replace('(.*)', '.*')}$`).test(pathname)
      : pathname === path
  );
};

// 管理員電子郵件白名單
const ADMIN_EMAILS = [
  'yushun@fhn.com',  // 替換為你的管理員電子郵件
  'admin@example.com',  // 可以添加多個管理員電子郵件
];

// 檢查是否為管理員
async function isUserAdmin(userId, req) {
  console.log('=== 開始檢查管理員權限 ===');
  console.log('用戶 ID:', userId);
  
  try {
    // 檢查環境變數
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('錯誤: CLERK_SECRET_KEY 未設置');
      return false;
    }

    console.log('正在從 Clerk API 獲取用戶資訊...');
    const response = await fetch(
      `https://api.clerk.com/v1/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('從 Clerk 獲取用戶資訊失敗:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return false;
    }

    const user = await response.json();
    console.log('獲取到的用戶資訊:', JSON.stringify(user, null, 2));
    
    const userEmail = user.email_addresses?.find(e => e.id === user.primary_email_address_id)?.email_address;
    console.log('提取的用戶郵件:', userEmail);
    
    if (!userEmail) {
      console.log('錯誤: 找不到用戶郵件');
      return false;
    }

    console.log('管理員白名單:', ADMIN_EMAILS);
    console.log('檢查郵件是否存在於白名單中...');
    
    const isAdmin = ADMIN_EMAILS.includes(userEmail);
    console.log('=== 檢查結果 ===');
    console.log('用戶郵件:', userEmail);
    console.log('是否為管理員:', isAdmin);
    console.log('================');
    
    return isAdmin;
  } catch (error) {
    console.error('檢查管理員權限時出錯:', {
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  console.log('\n=== 請求開始 ===');
  console.log('請求路徑:', pathname);
  
  // 如果是公開路由，直接放行
  if (isPublicRoute(pathname)) {
    console.log('這是公開路由，直接放行');
    return;
  }
  
  console.log('這是受保護路由，進行權限檢查');
  
  // 如果是受保護路由，檢查登入狀態和管理員權限
  if (isProtectedRoute(req)) {
    console.log('路徑匹配受保護路由規則');
    
    // 檢查是否已登入
    const session = auth();
    console.log('會話資訊:', {
      userId: session.userId,
      sessionId: session.id
    });
    
    if (!session.userId) {
      console.log('用戶未登入，重定向到登入頁面');
      const signInUrl = new URL('/admin/login', req.url);
      return Response.redirect(signInUrl);
    }
    
    console.log('用戶已登入，開始檢查管理員權限...');
    
    // 檢查是否為管理員
    const isAdmin = await isUserAdmin(session.userId, req);
    
    if (!isAdmin) {
      console.log('權限不足，拒絕訪問');
      const url = new URL('/', req.url);
      return Response.redirect(url);
    }
    
    console.log('管理員驗證通過，允許訪問');
    
    // 如果是管理員，繼續執行請求
    session.protect();
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
