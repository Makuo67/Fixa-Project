import axios from 'axios';
import {getSpecificCookie} from "../../../../utils/cookies";

export default async function handler(request, response) {
    if (request.method === "GET") {
        const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');
        // console.log("jwtToken body provinces === ", jwtToken);

        try {
            const { country } = request.query;
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/provinces?country=${country}`);
            // console.log("res.data === ", res.data);
            if (res.data) {
                response.status(200).json({
                    status: "success", data: res.data
                });
            } else {
                response.status(200).json({status: "success", message: "No data found"});
            }
        } catch (error) {
            if (error.response.data) {
                response.status(error.response.status).json({
                    status: error.response.status, data: error?.response.data,
                });
            } else {
                response.status(500).json({status: 'failed', message: "Connection error"});
            }
        }
    }
}