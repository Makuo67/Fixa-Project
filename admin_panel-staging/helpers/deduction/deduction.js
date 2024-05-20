import localforage from "localforage";
import { retriveAuthTokenFromLocalStorage } from "../auth";
import { notification } from "antd";

export const createOTP = async (phone_number, otp_id) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const headers = {
        "Content-Type": "application/json",
    }
    if (authorization) {
        headers["Authorization"] = authorization
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/otp-verifications/create-otp-deduction`, {
        method: "POST",
        body: JSON.stringify({
            "otp_type_id": otp_id,
            "phone_number": phone_number,
        }),
        headers: headers
    }).then((res) => res.json())
        .catch((err) => {
            console.log("err", err);
        })

    return response;
}

export const verifyDeductionOTP = async (body) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const headers = {
        "Content-Type": "application/json",
    }
    if (authorization) {
        headers["Authorization"] = authorization
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/otp-verifications/verify-otp-deduction`, {
        method: "POST",
        body: JSON.stringify(
            {
                "otp_type_id": 4,
                "otp_pin": body.otp_pin,
                "email": body.email,
                "phone_number": body.phone_number,
                "all_deductions": body.all_deductions,
                "payment_id": body.payment_id,
                "payee_name_id": body.payee_name_id
            }
        ),
        headers: headers
    }).then((res) => res.json())
    return response
}

export const getAllOtpTypes = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/opt-verification-types`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    }).then((res) => res.json())
    return response
}

export const getNetAmountDetails = async (paymentId) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const details = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payroll-transactions/disbursement_details/${paymentId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `${authorization}`,
        },
    }).then((res) => res.json())
    return details
}
export const getNetAmountDetailsPayout = async (paymentId) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const details = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payout-transactions/disbursement_details/${paymentId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `${authorization}`,
        },
    }).then((res) => res.json())
    return details
}

export const getDeductionSummary = async (paymentId) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const details = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payments/deductions-summary/${paymentId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `${authorization}`,
        },
    }).then((res) => res.json())
    return details
}

export const getWorkers = async (payment_id, payee_id) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const headers = {
        "Content-Type": "application/json",
    }
    if (authorization) {
        headers["Authorization"] = authorization
    }
    const workers = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/deductions-transactions/custom/${payment_id}/${payee_id}`, {
        method: "GET",
        headers: headers
    })
        .then((res) => res.json())
    return Promise.resolve(workers)
}

export const getPayeesList = async (project_id) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const headers = {
        "Content-Type": "application/json",
    }
    if (authorization) {
        headers["Authorization"] = authorization
    }
    const payees = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project_id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `${authorization}`,
        }
    })
        .then((res) => res.json())

    return Promise.resolve(payees)
}

export const clearLocalForage = async (id1, id2) => {
    localforage.removeItem(`workerSelected_${id1}_${id2}`).then(() => {
        console.log("Database has been cleared!");
    })
    localforage.removeItem(`workersList_${id1}_${id2}`).then(() => {
        console.log("Database has been cleared!");
    })
    localforage.removeItem(`deductions_${id1}_${id2}`).then(() => {
        console.log("Database has been cleared!");
    })
    localforage.removeItem(`total_deductions_${id1}_${id2}`).then(() => {
        console.log("Database has been cleared!");
    })
}

export const sendEmailLink = async (id, emails) => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/deductions/send-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `${authorization}`,
        },
        body: JSON.stringify({
            payment_id: parseInt(id),
            emails: emails,
        })
    })
        .then((res) => res.json())
        .then((res) => {
            switch (res.status) {
                case 'failed':
                    notification.error({
                        message: "Failed",
                        description: `${res.error.errors.emails[0]}`,
                    })
                    break;
                default:
                    notification.success({
                        message: "Success",
                        description: "Email link sent successfully"
                    })
            }
        })
}