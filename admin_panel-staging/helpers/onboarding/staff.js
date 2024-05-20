import { retriveAuthTokenFromLocalStorage, userAccess } from "../auth";
import fixaAPI from "../api";
import { notification } from "antd";

/* ======= Invite staff members ====== */
export const inviteStaffMembers = async (requestBody) => {
    let response = [];
    try {
        const authorization = await retriveAuthTokenFromLocalStorage();

        const results = await fixaAPI.post('user-admin-accesses/invite_staff_members',
            requestBody,
            {
                headers: { authorization },
            }
        );
        response = {
            data: results.data,
        }

    } catch (e) {
        console.log("Error in inviting staff ===>", e);
        response = e.response?.data;
    }
    return response;
};

/* ======= Create title ====== */
export const createJobPosition = async (requestBody) => {
    let response = [];
    try {
        const authorization = await retriveAuthTokenFromLocalStorage();

        const results = await fixaAPI.post('titles',
            requestBody,
            {
                headers: { authorization },
            }

        );
        response = {
            status: 'success',
            data: results.data
        };
    } catch (e) {
        console.log("Error in creating title ===>", e);
        response = {
            status: 'success',
            data: []
        };
    }
    return response;
};

/* ======= get titles ====== */
export const getJobPositions = async () => {
    let response = [];
    try {
        const authorization = await retriveAuthTokenFromLocalStorage();

        const results = await fixaAPI.get('titles',
            {
                headers: { authorization },
            });


        response = results.data;
    } catch (e) {
        console.log("Error in getting titles ===>", e);
        response = []
    }
    return response;
};

/* ======= Check user existance ====== */
/**
 * Check if the user exists based on the provided email.
 *
 * @param {string} email - The email of the user to check existence for.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the user exists.
 */
export const checkUserExistance = async (body) => {
    let response = [];
    try {
        const results = await fixaAPI.post('user-admin-accesses/check_staff_email', body);
        response = results?.data?.data;
    } catch (e) {
        console.log("Error in getting titles ===>", e);
        notification.error({
            message: 'Error',
            description: 'Unable to check this email.'
        })
        response = []
    }
    return response;
};

