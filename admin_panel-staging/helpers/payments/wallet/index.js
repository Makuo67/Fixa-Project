import { notification } from 'antd';
import fixaAPI from '../../api';
import { retriveAuthTokenFromLocalStorage } from '@/helpers/auth';

/* ============== GET ALL TRANSACTIONS ============== */
export const getAllTransactions = async () => {
    let responses = [];
    try {
        let authorization = await retriveAuthTokenFromLocalStorage();
        responses = await fixaAPI.get(`custom/wallet-top-up-transactions/list`, {
            headers: { authorization },
        });
        return responses?.data;
    } catch (err) {
        return responses;
    }
};

/* ============== TOP UP MOMO WALLET ============== */
export const momoTopupRequest = async (payload) => {
    let responses = [];
    try {
        let authorization = await retriveAuthTokenFromLocalStorage();
        responses = await fixaAPI.post(`custom/wallet-top-up-transactions/load`, payload, {
            headers: { authorization },
        });
        notification.success({
            message: "SUCCESS",
            description: responses?.data?.message,
            duration: 5
        });
        return responses?.data;
    } catch (err) {
        if (err?.code === "ERR_NETWORK") {
            notification.warning({
                message: "NETWORK ERROR",
                description: "Connect to a Network and Try again",
            });
        } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
            notification.error({
                message: "BAD REQUEST",
                description: err?.response?.data?.message,
            });
        }
        return responses;
    }
};