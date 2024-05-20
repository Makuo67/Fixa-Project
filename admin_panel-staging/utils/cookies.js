import Cookies from 'js-cookie';

export const getSpecificCookie = (cookieString, cookieName) => {
    if (!cookieString) {
        return ""
    }
    const cookies = cookieString.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
    }, {});
    return cookies[cookieName];
};


// Function to delete a cookie by name
export const deleteNextAuthSessionCookies = (name) => {
    // Loop through cookies
    for (const cookieName in Cookies.get()) {
        // Check if the cookie name matches the specified name or starts with the specified name followed by a dot
        if (cookieName === name || cookieName.startsWith(`${name}.`)) {
            // Remove the cookie
            Cookies.remove(cookieName);
        }
    }
};