import { getSpecificCookie } from "../../../../utils/cookies";
import axios from "axios";

export default async function handler(request, response) {
    if (request.method === "GET") {
        const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');

        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/countries?_limit=-1&show=true`);
            if (res.data) {
                response.status(200).json({ status: "status", data: res.data })
            } else {
                response.status(200).json({ status: "success", message: 'No data found' });
            }
        } catch (error) {
            console.log("ERROR ()", error.response)
            if (error.response.data) {
                response.status(error.response.status).json({
                    status: error.response.status,
                    data: error?.response.data,
                });
            } else {
                response.status(500).json({ status: 'failed', message: "Connection error" });
            }
        }
    }
}