const axios = require('axios');
const THIRD_PART_URL = process.env.THIRD_PART_URL
const THIRD_PART_KEY = process.env.THIRD_PART_KEY
const utils = require("../functions/utils");
module.exports = {
    // get mtn kycs
    async getMtnKycs(phoneNumber) {
        let response = { status: false, message: '', data: {} };
        try {
            const responseMTNKyc = await axios.get(THIRD_PART_URL + 'mtn/get-kyc-information/' + phoneNumber, {
                headers: {
                    'api-key': THIRD_PART_KEY,
                }
            });
            if (responseMTNKyc.status === 200) {
                response = { status: true, message: 'success', data: responseMTNKyc.data.data };
            } else {
                response = { status: false, message: responseMTNKyc.data.message, data: {} };
            }
        } catch (error) {
            console.log('error in getMtnKycs()', error.message);
            response.message = error.message;
        }
        return response;
    },

    // get rss kycs
    async getRssbKycs(idNumber) {
        let response = { status: false, message: '', data: {} };
        try {
            const responseRSSBKyc = await axios.get(THIRD_PART_URL + 'rssb/get-kyc-information/' + idNumber, {
                headers: {
                    'api-key': THIRD_PART_KEY,
                }
            });
            if (responseRSSBKyc.status === 200) {
                response = { status: true, message: 'success', data: responseRSSBKyc.data.data };
            } else {
                response = { status: false, message: responseRSSBKyc.data.message, data: {} };
            }
        } catch (error) {
            console.log('error in getRssbKycs()', error.message);
            response.message = error.message;
        }
        return response;
    },

    // generating rssb code
    async generateRssbCode(passed_data) {
        let response = { status: false, message: '', data: {} };
        try {
            let transformed_body = { idNumber: passed_data.nationalId, maskedPhoneNumberId: passed_data.maskedPhoneNumberId }
            let responseGenerateCode = await axios.post(THIRD_PART_URL + 'rssb/generate-rssb-code', transformed_body, {
                headers: {
                    'api-key': THIRD_PART_KEY,
                }
            });
            if (responseGenerateCode.status === 200) {
                response = { status: true, message: 'success', data: responseGenerateCode.data.data };
            } else {
                response = { status: false, message: responseGenerateCode.data.message, data: {} };
            }
        } catch (error) {
            console.log('error in generateRssbCode()', error.message);
            if (error.message.toLowerCase() === 'request failed with status code 404') {
                response = { status: true, message: error.message, data: { rssbNumber: "Not-found" } };
            } else if (error.message.toLowerCase() === 'request failed with status code 504') {
                response = { status: true, message: error.message, data: { rssbNumber: "Timed-out" } };
            } else if (error.message.toLowerCase() === 'request failed with status code 400') {
                response = { status: true, message: error.message, data: { rssbNumber: "Bad-request" } };
            } else {
                response = { status: false, message: error.message, data: { rssbNumber: "" } };
            }
            response.message = error.message;
        }
        return response;
    },

    // get Kremit balance
    async kremitBalance() {

    },
    // Account holder validation
    async kremikAccountHolderValidation(data) {
        let response = { status: false, message: '', data: {} };
        try {
            const refid = utils.generateRandomNumber(10);
            const responseKremitValidation = await axios.post(THIRD_PART_URL + 'kremit/account-validation', { ...data, action: "accvalidate", refid: refid }, {
                headers: {
                    'api-key': THIRD_PART_KEY,
                }
            });
            if (responseKremitValidation.data.status) {
                response = { status: true, message: 'success', data: responseKremitValidation.data.data };
            } else {
                response = { status: false, message: responseKremitValidation.data.message, data: {} };
            }
        } catch (error) {
            console.log('error in kremikAccountHolderValidation()', error.message);
            response.message = error.message;
        }
        return response;
    },
    // Transfer Request
    async kremikTransferRequest(data) {
        let response = { status: false, message: '', data: {} };
        try {
            const refid = utils.generateRandomNumber(10);
            const responseKremitTransferRequest = await axios.post(THIRD_PART_URL + 'kremit/transfer-request', { ...data, action: "transfer", refid: refid, description: "Fixa's Salary", currency: "RWF" }, {
                headers: {
                    'api-key': THIRD_PART_KEY,
                }
            });
            if (responseKremitTransferRequest.status === 200) {
                response = { status: true, message: 'success', data: responseKremitTransferRequest.data.data };
            } else {
                response = { status: false, message: responseKremitTransferRequest.data.message, data: {} };
            }
        } catch (error) {
            console.log('error in kremikTransferRequest()', error.message);
            response.message = error.message;
        }
        return response;
    },
    // Transaction status
    async kremikCheckTransactionStatus(data) {
        let response = { status: false, message: '', data: {} };
        try {
            const responseKremitTransferRequest = await axios.post(THIRD_PART_URL + 'kremit/transfer-status', { ...data, action: "checkstatus" }, {
                headers: {
                    'api-key': THIRD_PART_KEY,
                }
            });
            if (responseKremitTransferRequest.status === 200) {
                response = { status: true, message: 'success', data: responseKremitTransferRequest.data.data };
            } else {
                response = { status: false, message: responseKremitTransferRequest.data.message, data: {} };
            }
        } catch (error) {
            console.log('error in kremikCheckTransactionStatus()', error.message);
            response.message = error.message;
        }
        return response;
    },
}