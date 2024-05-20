const axios = require('axios');
const { getMomoToken } = require("../functions/momotoken");
const { getMtnKycs } = require("../../config/functions/third_part_api_functions");
const utils = require("../../config/functions/utils");

module.exports = {
    async checkPhoneNumberIsUnderNames(phone_number, first_name, last_name) {
        const response = { status: false, first_name: "", last_name: "", momo_names: "" };
        try {
            const mtn_kyc = await getMtnKycs(phone_number);
            if (mtn_kyc.status) {
                response.status = true;
                if (last_name === "name_combined") {
                    if (utils.nameValidation(mtn_kyc.data.last_name)) {
                        const combined_names = `${mtn_kyc.data.first_name.trim().toLowerCase()} ${mtn_kyc.data.last_name.trim().toLowerCase()}`;
                        if (!utils.fuzzyMatch(combined_names, first_name.trim().toLowerCase())) {
                            response.first_name = mtn_kyc.data.first_name.trim();
                            response.last_name = mtn_kyc.data.last_name.trim();
                        }
                        response.momo_names = `${mtn_kyc.data.first_name.trim()} ${mtn_kyc.data.last_name.trim()}`;
                    } else {
                        response.first_name = mtn_kyc.data.first_name.trim();
                        response.last_name = "";
                        response.momo_names = mtn_kyc.data.first_name.trim();
                    }
                } else {
                    if (utils.nameValidation(mtn_kyc.data.last_name) && utils.nameValidation(mtn_kyc.data.first_name)) {
                        if (!utils.fuzzyMatch(`${mtn_kyc.data.first_name.trim().toLowerCase()} ${mtn_kyc.data.last_name.trim().toLowerCase()}`, `${first_name.trim().toLowerCase()} ${last_name.trim().toLowerCase()}`)) { //check if the names coming from Fixa is the same as the one coming from MTN 
                            response.first_name = mtn_kyc.data.first_name.trim();
                            response.last_name = mtn_kyc.data.last_name.trim();
                        }
                        response.momo_names = `${mtn_kyc.data.first_name.trim()} ${mtn_kyc.data.last_name.trim()}`;
                    } else if (utils.nameValidation(mtn_kyc.data.last_name) && !utils.nameValidation(mtn_kyc.data.first_name)) {
                        if (!utils.fuzzyMatch(`${mtn_kyc.data.last_name.trim().toLowerCase()}`, `${first_name.trim().toLowerCase()} ${last_name.trim().toLowerCase()}`)) { //check if the names coming from Fixa is the same as the one coming from MTN 
                            response.first_name = "";
                            response.last_name = mtn_kyc.data.last_name.trim();
                        }
                        response.momo_names = `${mtn_kyc.data.last_name.trim()}`;
                    } else if (!utils.nameValidation(mtn_kyc.data.last_name) && utils.nameValidation(mtn_kyc.data.first_name)) {
                        if (!utils.fuzzyMatch(`${mtn_kyc.data.first_name.trim().toLowerCase()} `, `${first_name.trim().toLowerCase()} ${last_name.trim().toLowerCase()}`)) { //check if the names coming from Fixa is the same as the one coming from MTN 
                            response.first_name = mtn_kyc.data.first_name.trim();
                            response.last_name = "";
                        }
                        response.momo_names = `${mtn_kyc.data.first_name.trim()}`;
                    } else {
                        response.first_name = mtn_kyc.data.first_name.trim();
                        response.last_name = "";
                        response.momo_names = mtn_kyc.data.first_name.trim();
                    }
                }
            } else {
                response.status = false;
                response.first_name = first_name;
                response.last_name = last_name;
                response.momo_names = "N/A";
            }
        } catch (error) {
            console.log("error in checkPhoneNumberIsUnderNames", error.message);
            response.status = false;
            response.first_name = first_name;
            response.last_name = last_name;
            response.momo_names = "N/A";
        }
        return response;
    },
    async checkPhoneNumberIsInMomo(phone_number) {
        let response = false;
        try {
            if (utils.phoneNumberValidation(phone_number)) {
                let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
                const url = `${process.env.MOMO_URL_DISB}v1_0/accountholder/msisdn/25${phone_number}/active`;
                const headers = {
                    Accept: "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    Connection: "keep-alive",
                    "Ocp-Apim-Subscription-Key": process.env.MOMO_PRIMARY_KEY,
                    "X-Target-Environment": process.env.MOMO_X_TARGET_ENV,
                    Authorization: `Bearer ${access_token}`,
                };
                const momoResponse = await axios.get(url, { headers: headers });
                if (momoResponse.status === 200) {
                    response = momoResponse.data.result;
                }
            }
        } catch (error) {
            console.log("error in checkPhoneNumberIsInMomo", error.message);
            response = false;
        }
        return response;
    },
};

