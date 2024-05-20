import axios from 'axios';
import { decodeBase64 } from '../../../../utils/decodeBase';
import { getSpecificCookie } from '@/utils/cookies';

export default async function handler(request, response) {
    const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');

    // Token is required
    if (request.method === 'POST') {
        const requestBody = await request.body;
        const { authorization } = await request.headers;
        const reqToken = authorization.split(' ')[1];

        if (!requestBody) {
            response.status(400).json({
                message: 'Invalid request body', error: 'Missing request paramaters', status: 'failed'
            });
        }
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        try {
            const responseApi = await axios.post(
                `${baseUrl}/user-admin-accesses/onboarding_invite_staff_members`,
                requestBody,
                {
                    headers: {
                        // 'Authorization': `Bearer ${jwtToken}`,
                        'Authorization': `Bearer ${jwtToken ? jwtToken : reqToken}`,
                    }
                }

            )
            response.status(200).json({ data: responseApi.data });

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
                    data: error?.response?.data,
                });

            } else {
                response.status(400).json({
                    status: "failed",
                    code: error.response.status,
                    message: `Error fetching data from API ${baseUrl}/user-admin-accesses/invite_staff_members`,
                    error: error.response,
                });
            }
        }
    }
}
