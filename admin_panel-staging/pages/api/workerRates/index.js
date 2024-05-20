import axios from 'axios';
import { getSpecificCookie } from "../../../utils/cookies";

export default async function handler(request, response) {
    if (request.method === "POST") {

        const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');
        const currentProject = getSpecificCookie(request.headers.cookie, 'project');
        const payload = await request.body;
        const { authorization } = await request.headers;
        const reqToken = authorization.split(" ")[1];

        if (!currentProject) {
            response(400).json({ status: "failed", message: 'Invalid request body' });
        }
        const newPaylaod = payload.map((item, index) => {
            return {
                ...item,
                project_id: currentProject
            }
        })

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken ? jwtToken : reqToken}`,
            }
        };
        if (!newPaylaod) {
            response(400).json({ status: "failed", message: 'Invalid request body' });
        }

        try {
            // console.log("jwtToken body worker rates === ", authorization, authorization.split(" ")[1])
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rates/many`,
                newPaylaod,
                config)
            if (res.data) {
                response.status(201).json({ status: "success", data: res.data })
            } else {
                response.status(200).json({ status: "success", message: "No data found " })
            }
        } catch (error) {
            // console.log("jwtToken body worker rates === ", error.response.data )
            console.log("ERROR ()", error.response.data)
            if (error.response.data) {
                response.status(error.response.status).json({ status: "failed", data: error?.response.data });
            } else {
                response.status(500).json({
                    status: "error", message: "Connection error"
                });
            }
        }
    }
}

