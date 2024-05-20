'use strict';
let Validator = require("validatorjs");
const Format = require('response-format');
const utils = require("../../../config/functions/utils");
const moment = require("moment");
const { momoCheckBalance } = require("../../payments/services/payments");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async topUpWalletBalance(ctx) {
        let response;
        try {
            const rules = {
                balance_receipt_link: "required|url"
            }
            const validation = new Validator(ctx.request.body, rules);
            const request_body = ctx.request.body;
            if (validation.passes()) {
                const wallet_top_ups = await strapi.query('wallet-top-up-transactions').find();
                const bank_wallet_contacts = await strapi.query('contact').find({ type: "mtn_wallet_bank_contact", active: true });
                const pending_top_ups = wallet_top_ups.find((item) => item.status === "initiated" || item.status === "processing");
                const payment_methods = await strapi.query("companies").findOne();
                const mtn_payment = payment_methods.payment_methods.find((i) => {
                    return i.payment_method.code_name === "mtn" && i.is_payment_method_active;
                });
                if (bank_wallet_contacts && bank_wallet_contacts.length >= 1) {
                    let recipients_wallet_top_up = bank_wallet_contacts.map((item) => {
                        return { email: item.email, phone_number: item.phone_number }
                    })
                    if (mtn_payment && mtn_payment.payment_method) {
                        if (utils.phoneNumberValidation(ctx.state.user.username)) {
                            if (!(pending_top_ups && pending_top_ups.id >= 1)) {
                                const wallet_info = await strapi.query("wallet-request").findOne({ payment_method: mtn_payment.payment_method.id, request_status: "approved" });
                                if (wallet_info && utils.phoneNumberValidation(wallet_info.wallet_account_number)) {
                                    const momo_balance = await momoCheckBalance();
                                    if (momo_balance.status) {
                                        const harareTimeZone = 'Africa/Harare';
                                        const currentDateInHarare = moment().tz(harareTimeZone);
                                        const formattedDate = currentDateInHarare.format('YYYY-MM-DD HH:mm:ss');
                                        request_body.balance_before_is_loaded = parseInt(momo_balance.data.availableBalance);
                                        request_body.balance_after_is_loaded = request_body.balance_before_is_loaded; // I am removing this because Tafara told us to not consider this for the moment + parseInt(request_body.top_up_balance);
                                        request_body.top_up_email_recipients = recipients_wallet_top_up;
                                        request_body.status = "processing";
                                        request_body.submit_by = `${ctx.state.user.firstname} ${ctx.state.user.lastname}`;
                                        request_body.wallet_top_up_notification_recipients = ctx.state.user.username;
                                        request_body.submition_date = formattedDate;
                                        request_body.wallet_id = wallet_info.wallet_account_number;
                                        const wallet_top_up = await strapi.query('wallet-top-up-transactions').create(request_body);
                                        if (wallet_top_up.id) {
                                            ctx.response.status = 200;
                                            response = Format.success("Wallet Top-Up Initiated. We are pleased to inform you that your request to add funds to your wallet has been successfully processed. Kindly note that the balance will be loaded and approved shortly. An email notification will be sent to you as soon as the process is complete.", []);
                                        } else {
                                            ctx.response.status = 400;
                                            response = Format.badRequest("We are unable to process your request to load the balance onto your Momo account.", []);
                                        }
                                    } else {
                                        ctx.response.status = 404;
                                        response = Format.notFound("We are enable to get the current balance on your momo wallet", []);
                                    }
                                } else {
                                    ctx.response.status = 400;
                                    response = Format.badRequest("Wallet information not complete.", []);
                                }
                            } else {
                                ctx.response.status = 405;
                                response = Format.notAllowed("We are unable to request a Momo wallet top-up while there is another one pending to be loaded.", []);
                            }
                        } else {
                            ctx.response.status = 400;
                            response = Format.badRequest("To perform this action, you need to have a phone number linked to your account. We will send a text message (SMS) to your phone after the operation is approved.", []);
                        }
                    } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("Your company must have MTN Mobile Money as payment method in order to proceed", []);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest("You must have at least one bank contact, before your proceed", []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in topUpWalletBalance", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async getTopUpWalletBalance(ctx) {
        let response;
        try {
            const wallet_top_ups = await strapi.query('wallet-top-up-transactions').find({ _sort: "id:desc" });
            if (wallet_top_ups && wallet_top_ups.length >= 1) {
                ctx.response.status = 200;
                response = Format.success("Successfully loading wallet Top-up transactions list", wallet_top_ups);
            } else {
                ctx.response.status = 404;
                response = Format.notFound("Failed to load wallet Top-up transactions list", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in getTopUpWalletBalance", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    }
};
