import { NextResponse } from 'next/server';

const getSpecificCookie = (cookieString, cookieName) => {
    if (!cookieString) {
        return "";
    }
    const cookies = cookieString?.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
    }, {});
    return cookies[cookieName];
};

export async function middleware(req) {
    // handling session
    // const session = await getIronSession(req, res, sessionOptions);

    const { pathname } = req.nextUrl;
    if (pathname === '/payments' || pathname === "/finance") {
        const url = req.nextUrl.clone()
        // return to the finance page
        url.pathname = '/finance/payments'
        return NextResponse.rewrite(url)
    }
    if (pathname === '/taxes') {
        const url = req.nextUrl.clone()
        // return to the finance page
        url.pathname = '/finance/taxes'
        return NextResponse.rewrite(url)
    }
    if (pathname === '/wallet') {
        const url = req.nextUrl.clone()
        // return to the finance page
        url.pathname = '/finance/wallet'
        return NextResponse.rewrite(url)
    }

    if (pathname === '/dashboard') {
        const url = req.nextUrl.clone()
        // return to the root page
        url.pathname = '/'
        return NextResponse.rewrite(url)
    }


    if (pathname == "/onboarding") {
        const jwtToken = req.cookies.get('_strapi_ad_jwt');
        // const inviteToken = req.cookies.get('_invite_admin');

        if (jwtToken === undefined || jwtToken === null || !jwtToken?.startsWith('ey'))
            return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard', '/onboarding', '/finance', '/payments', '/taxes', '/wallet'],
};