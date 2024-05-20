const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const pusher_env = process.env.PUSHER_ATTENDANCE_CHANNEL;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const MOMO_MSISDN = process.env.MOMO_MSISDN;
const MOMO_CURRENCY = process.env.MOMO_CURRENCY;
const axios = require("axios");
const { getMomoToken } = require("../functions/momotoken");

module.exports = {
    async makePaymentWithMtn(payee) {
        let response;
        try {
             // get momo token
             let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
            const pathname = MOMO_URL_DISB + "v1_0/transfer";
            const headers = {
                Accept: "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                Connection: "keep-alive",
                "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
                "X-Target-Environment": MOMO_X_TARGET_ENV,
                "X-Reference-Id": payee.reference_id,
                Authorization: `Bearer ${access_token}`,
            };
            const body = {
                amount: payee.amount,
                currency: MOMO_CURRENCY,
                externalId: Math.floor(Math.random() * 10000),
                payee: {
                    partyIdType: MOMO_MSISDN,
                    partyId: "25" + payee.account_number,
                },
                payerMessage: "paying by Fixa platform",
                payeeNote: "payment from Fixa",
            };
           

            let response_payment = await axios.post(pathname, body, { headers: headers });

            if (response_payment.status === 202) {
                response = {
                    status: 'success',
                    data: "",
                    error: ""
                }
            } else {
                response = {
                    status: 'failed',
                    data: "",
                    error: ""
                }
            }

        } catch (error) {
            console.log('Error in makePaymentWithMtn() ',error.message);
            response = {
                status: 'failed',
                data: "",
                error: error.message
            }
        }
        return response;
    },

    async checkMtnTransactionStatus(payment_transaction_track) {
        let response;
        try {
            let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
            const pathname = MOMO_URL_DISB + "v1_0/transfer/";
            const headers = {
                "Content-Length": 0,
                Accept: "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                Connection: "keep-alive",
                "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
                "X-Target-Environment": MOMO_X_TARGET_ENV,
                Authorization: `Bearer ${access_token}`,
            };

            let response_payment = await axios.get(pathname + payment_transaction_track.reference_id, {headers: headers});
             response = {
                status: 'success',
                data: response_payment.data,
                message: ''

            }

        } catch (error) {
            response = {
                status: 'failed',
                data: "",
                message: error.message

            }
        }
        return response;
    }
}

