import axios from 'axios';
import { getSpecificCookie } from '../../../utils/cookies';

export default async function handler(request, response) {

    // GET request
    if (request.method === 'GET') {
        const jwtToken = getSpecificCookie(request.headers.cookie, '_strapi_ad_jwt');

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const results = await axios.get(
                `${baseUrl}/user-admin-accesses/getUserProfile`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                }
            }
            );
            if (results.data) {
                response.status(200).json(results.data);
            } else {
                response.status(200).json({ message: 'No data found' });
            }

        } catch (error) {
            if (error?.response?.data) {
                response.status(error.response.status).json({
                    data: error?.response.data,
                    status: error.response.status,
                });
            } else {
                response.status(500).json({ data: "Connection error", status: 'failed' });
            }
        }
    } else if (request.method === 'POST') {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        // POST request
        const requestBody = request.body;
        // Validate the body
        if (!requestBody.user) {
            response.status(400).json({
                message: 'Invalid request body', error: 'Invalid request body', status: 'failed'
            });
        }

        try {
            let responseApi;
            // for admin
            if (requestBody.is_admin === true) {
                responseApi = await axios.post(
                    `${baseUrl}/user-admin-accesses/register-admin`,
                    requestBody.user
                );
            } else {
                // for other user
                responseApi = await axios.post(
                    `${baseUrl}/user-admin-accesses/staff-member-profile`,
                    requestBody.user
                );

            }
            const results = responseApi.data;
            const jwtToken = await results?.data?.jwt;
            if (results && results?.status === 'success') {
                response.setHeader('Set-Cookie', `_strapi_ad_jwt=${jwtToken}; Path=/; HttpOnly; Expires=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()}`);
                response.status(200).json({ data: responseApi.data });
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                response.status(401).json({
                    status: "fail",
                    code: error.response?.status,
                    message: 'You are not authenticated',
                    error: error.response,
                });

            } else if (error.response?.status === 400) {
                response.status(400).json({
                    status: "failed",
                    code: error.response?.status,
                    message: error.response?.data ? error.response?.data?.email : 'Bad request',
                    data: error.response?.data
                });

            } else if (error.response?.status === 405) {
                response.status(405).json({
                    status: "failed",
                    code: error.response?.status,
                    message: error.response?.data,
                    data: error.response?.data
                });

            } else {
                response?.status(400).json({
                    status: "error",
                    // code: error.response.status,
                    message: "Error fetching data from API",
                    error: error.response,
                    data: error.response?.data
                });
            }
        }
    } else if (request.method === 'PUT') {
        response.setHeader('Set-Cookie', `_strapi_ad_jwt=; Path=/; HttpOnly; Expires=${new Date(0).toUTCString()}`);
        response.setHeader('Set-Cookie', `_invite_admin=; Path=/; HttpOnly; Expires=${new Date(0).toUTCString()}`);
        response.status(200).json({ message: 'Cookies deleted' });
    }
} 
