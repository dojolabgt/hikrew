import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(_request: NextRequest) {
    // Note: Since authentication uses localStorage, we cannot fully validate the session here.
    // However, we can add basic checks or headers if needed in the future.
    // For now, this proxy serves as a placeholder for server-side logic
    // and can be expanded when moving to HTTP-only cookies.

    // Example: Redirect to login if accessing dashboard (if we had cookies)
    // const token = _request.cookies.get('auth_token');
    // if (_request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    //     return NextResponse.redirect(new URL('/login', _request.url));
    // }

    return NextResponse.next();
}

// Also export as default for compatibility
export default proxy;

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};