import axios from 'axios';
import {getSpecificCookie} from "../../../utils/cookies";

export default async function handler(request, response) {
    if (request.method === "POST") {

        const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');
        const requestBody = request.body;

        // console.log("jwtToken body create site === ", jwtToken)

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken ? jwtToken : requestBody.jwtToken}`,
            }
        };
        if (!requestBody) {
            response(400).json({status: "failed", message: 'Invalid request body'});
        }

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/create-site`, requestBody, config)
            if (res.data) {
                response.setHeader('Set-Cookie', `project=${res?.data?.data?.project?.id}; Path=/; HttpOnly; max-age=${60 * 60 * 24 * 30}`);
                response.status(201).json({status: "success", data: res.data})
            } else {
                response.status(200).json({status: "success", message: "No data found "})
            }

        } catch (error) {
            if (error.response.data) {
                response.status(error.response.status).json({status: "failed", data: error?.response.data});
            } else {
                response.status(500).json({
                    status: "error", message: "Connection error"
                });
            }
        }
    }
}
