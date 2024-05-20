'use strict';
const utils = require("../../../config/functions/utils");
const { checkPhoneNumberIsInMomo, checkPhoneNumberIsUnderNames } = require("../../../config/functions/rssb_functions");
const { kremikAccountHolderValidation } = require("../../../config/functions/third_part_api_functions");
const kremit_banks = require('../../../config/ressources/kremit_banks.json');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async accountVerification(payment_method_code, account_number_requirements, is_nid_valid) {
        const response = { status: false, message: '', data: {} };
        try {
            let verification_result_account_name = "";
            let verification_result_boolean = "nothing";
            let verification_result_desc = "";
            if (payment_method_code === "MTN") {
                if (utils.phoneNumberValidation(account_number_requirements.account_number)) {
                    const mtn_kyc = await checkPhoneNumberIsUnderNames("25" + account_number_requirements.account_number, account_number_requirements.account_name.first_name, account_number_requirements.account_name.last_name);
                    if (mtn_kyc.status) {
                        const checkifPhoneIsMomo = await checkPhoneNumberIsInMomo(account_number_requirements.account_number);
                        verification_result_account_name = mtn_kyc.momo_names;
                        if (checkifPhoneIsMomo) {
                            if (mtn_kyc.first_name.length === 0 && mtn_kyc.last_name.length === 0) {
                                verification_result_boolean = is_nid_valid ? 'green' : 'blue';
                                verification_result_desc = "Verification successful. This account has been verified by Fixa.";
                            } else {
                                verification_result_boolean = 'red';
                                verification_result_desc = `Verification failed. This account belongs to ${mtn_kyc.first_name} ${mtn_kyc.last_name}`;
                            }
                        } else {
                            verification_result_boolean = 'red';
                            verification_result_desc = "Verification failed. This account is not active."; //This mean the phone number can't receive Money.
                        }
                    } else {
                        verification_result_account_name = "-";
                        verification_result_boolean = 'red';
                        verification_result_desc = "Verification failed. This account is not active."; //We can't find MTN kyc.
                    }
                } else {
                    verification_result_account_name = "-";
                    verification_result_boolean = 'red';
                    verification_result_desc = "Verification failed. This account is not active."; //Invalid phone number.
                }
                response.status = true;
                response.data = {
                    verification_result_account_name: verification_result_account_name,
                    verification_result_boolean: verification_result_boolean,
                    verification_result_desc: verification_result_desc
                };
            } else if (payment_method_code === "kremit") {
                const request_body = {
                    acctno: account_number_requirements.account_number,
                    bankid: account_number_requirements.account_belong_to,
                    accname: account_number_requirements.account_name.first_name
                };
                verification_result_account_name = account_number_requirements.account_name.first_name;
                const kremit_account_validation = await kremikAccountHolderValidation(request_body);
                const accountNumberProvider = kremit_banks.find((item) => parseInt(item.bankid) === parseInt(request_body.bankid)).short_name;
                if (kremit_account_validation.status) {
                    verification_result_boolean = "green";
                    verification_result_desc = "Verification successful. This account has been verified by Fixa.";
                } else {
                    verification_result_boolean = "red";
                    verification_result_desc = `Verification failed. This account belongs to ${verification_result_account_name}`;
                }

                response.status = true;
                response.data = {
                    verification_result_account_name: verification_result_account_name,
                    verification_result_boolean: verification_result_boolean,
                    verification_result_desc: verification_result_desc,
                    verification_result_holder: accountNumberProvider

                };
            }
        } catch (error) {
            console.log('Error in accountVerification', error.message);
            response.message = error.message;
        }
        return response;
    },
};
