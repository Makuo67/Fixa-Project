import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const sessionApiRoute = "/api/session";
const ironSecret = process.env.IRON_SESSION_SECRET;

export const sessionOptions = {
    password: ironSecret,
    cookieName: "adm-pl_session",
    cookieOptions: {
        secure: true,
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
    },
    ttl: 7 * 24 * 60 * 60 + 60, // add an extra minute
};

export const defaultSession = {
    firtname: '',
    lastname: '',
    token: '',
    isLoggedIn: false,
};

async function fetchJson(
    input, init) {
    return fetch(input, {
        headers: {
            accept: "application/json",
            "content-type": "application/json",
        },
        ...init,
    }).then((res) => res.json());
}

function doLogin(url, user) {
    return fetchJson(url, {
        method: "POST",
        body: JSON.stringify(user),
    });
}

// logout to clear session
function doLogout(url) {
    return fetchJson(url, {
        method: "DELETE",
    });
}

export default function useSession() {
    const { data: session, isLoading } = useSWR(
        sessionApiRoute,
        fetchJson,
        {
            fallbackData: [],
        },
    );

    const { trigger: userLogin } = useSWRMutation(sessionApiRoute, doLogin, {
        // the login route already provides the updated information, no need to revalidate
        revalidate: false,
    });
    const { trigger: userLogout } = useSWRMutation(sessionApiRoute, doLogout);

    return { session, userLogout, userLogin, isLoading };
}
