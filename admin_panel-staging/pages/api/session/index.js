import { getIronSession } from "iron-session";
import {
    sessionOptions, defaultSession
} from 'utils/sessionLib';

// login
export default async function handler(request, response) {
    const session = await getIronSession(request, response, sessionOptions);
    if (request.method === "POST") {
        // Destructure arg from request.body
        const { arg } = request.body;
        
        // Accessing jwt and user inside arg
        const { jwt, user, user_info } = arg;

        session.isLoggedIn = true;
        session.token = jwt;
        session.firstname = user_info ? user_info?.first_name : user?.firstname;
        session.lastname = user_info ? user_info?.last_name: user?.lastname;
        await session.save();

        return response.json(session);
    }
    else if (request.method === "GET") {
        if (session.isLoggedIn !== true) {
            return response.json(defaultSession);
        }

        return response.json(session);
    } else if (request.method === "DELETE") {
        session.destroy();

        return response.json(defaultSession);
    }

    return response.status(405).end(`Method ${request.method} Not Allowed`);
}