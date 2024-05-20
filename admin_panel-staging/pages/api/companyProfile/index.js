import axios from 'axios';
import {getSpecificCookie} from "../../../utils/cookies";

export default async function handler(request, response) {
    if (request.method === "POST") {
        const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');
        const requestBody = request.body

        // console.log("jwtToken body company profile === ", jwtToken)

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken ? jwtToken : requestBody.jwtToken}`,
            }
        };
        if (!requestBody) {
            return new Response('Invalid request body');
        }

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies`, requestBody, config)
            if (res.data) {
                response.status(201).json(res.data);
            } else {
                response.status(200).json({message: "No data found"})
            }

        } catch (error) {
            if (error.response.data) {
                response.status(400).json({status: "failed", message: error.response.data.error});
            } else {
                response.status(500).json({
                    status: "error", message: "Connection error"
                });
            }
        }
    }
}
