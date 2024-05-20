import axios from 'axios';
import {getSpecificCookie} from "../../../utils/cookies";

export default async function handler(request, response) {
    if (request.method === "PUT") {

        const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');
        const currentProject = getSpecificCookie(request.headers.cookie, 'project');
        const requestBody = request.body;
        
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
            const res = await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${currentProject}`, requestBody, config)
            if (res.data) {
                response.status(200).json({status: "success", data: res.data})
            } else {
                response.status(200).json({status: "success", message: "No data found "})
            }
        } catch (error) {
            // console.log("request error === ", error)
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

