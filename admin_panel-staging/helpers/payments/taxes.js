import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api";
import { notification } from "antd";

export const generateTaxes = async (data) => {
    try {
        const authorization = await retriveAuthTokenFromLocalStorage();

        const response = await fixaAPI.post(`/rra-taxes/generate-taxes`, data, {
            headers: { authorization },
        });
        // console.log("response.data.data =====>", response.data);
        // status started and pending
        if (response?.data?.data?.progress && (response?.data?.data?.progress === 'started' || response?.data?.data?.progress === 'pending')) {
            notification.info({
                message: "Info",
                description: response?.data?.message,
                duration: 10,
            })
        } else if (response?.data?.data?.progress && response?.data?.data?.progress === 'finished' && response?.data?.data?.taxes.length > 0) {
            notification.success({
                message: "Success",
                description: response?.data?.message,
            })
        } else {
            notification.success({
                message: "Success",
                description: response?.data?.message,
            })
        }
        
        return response?.data?.data;
    } catch (error) {
        notification.error({
            message: "Failed",
            description: error?.response?.data?.message,
            duration: 10
        })
        return false
    }
};

export const getTaxesProjects = async () => {
    try {
        const authorization = await retriveAuthTokenFromLocalStorage();

        const response = await fixaAPI.get(`/projects`, {
            headers: { authorization },
        });
        return response.data;
    } catch (error) {
        console.log(error);
        notification.error({
            message: "Failed",
            description: error.message,
        })
        return false
    }
};

