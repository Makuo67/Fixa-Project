import { getSpecificCookie } from '../../../../../utils/cookies';
import axios from 'axios';

/* ===== GET new title ====== */
export default async function handler(request, response) {
    const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');

    // Token is required
    if (request.method === 'POST') {
        const requestBody = request.body;

        if (!requestBody ) {
            response.status(400).json({
                message: 'Invalid request body', error: 'Invalid request body', status: 'failed'
            });
        }
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        try {
            const responseApi = await axios.post(
                `${baseUrl}/titles`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                    }
                }

            )
            response.status(200).json({ data: responseApi.data, status: 'success' });

        } catch (error) {
            if (error.response.status === 401) {
                response.status(401).json({
                    status: "fail",
                    code: error.response.status,
                    message: 'You are not authenticated',
                    error: error.response,
                });

            } else if (error.response.status === 400) {

                response.status(400).json({
                    status: "failed",
                    code: error.response.status,
                    data: error
                });

            } else {
                response.status(400).json({
                    status: "error",
                    // code: error.response.status,
                    message: `Error fetching data from API ${baseUrl}/titles`,
                    error: error.response,
                });

            }
        }

    } else if (request.method === 'GET') {
        // GET request
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        try {

            const results = await axios.get(
                `${baseUrl}/titles`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                }
            });
            response.status(200).json({
                status: "success",
                code: 200,
                data: results.data
            });

        } catch (error) {
            if (error.response.status === 401) {
                response.status(401).json({
                    status: "fail",
                    code: error.response.status,
                    message: "Make sure you are authenticated",
                    error: error.response,
                });

            } else if (error.response.status === 400) {
                response.status(400).json({
                    status: "failed",
                    code: error.response.status,
                    data: error
                });

            } else {
                response.status(400).json({
                    status: "error",
                    code: error.response.status,
                    message: `Error fetching data from API ${baseUrl}/titles`,
                    error: error.response,
                });

            }
        }
    }
}
