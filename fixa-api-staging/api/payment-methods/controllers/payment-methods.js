'use strict';
let Validator = require('validatorjs');
const Format = require('response-format');
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async applyDefaultPaymentToWorkers(ctx) {
        let response;
        try {
            const all_workers = await strapi.query("service-providers").find({ _limit: -1 });
            const mtn_default_payment = {
                payment_method: 1,
                is_active: true,
                provider: "MTN"
            }
            const workers = all_workers.filter((i) => utils.phoneNumberValidation(i.phone_number));
            console.log(`********** STARTING UPDATING ${workers.length} WORKERS TO USE MTN AS DEFAULT PAYMENT **************`);
            for (let i = 0; i < workers.length; i++) {
                mtn_default_payment.account_name = `${workers[i].first_name} ${workers[i].last_name}`;
                if (utils.phoneNumberValidation(workers[i].phone_number)) {
                    mtn_default_payment.account_number = workers[i].phone_number;
                    mtn_default_payment.is_verified = workers[i].is_momo_verified_and_rssb;
                    mtn_default_payment.account_verified_desc = workers[i].is_momo_verified_and_rssb_desc;
                } else {
                    mtn_default_payment.account_number = "";
                    mtn_default_payment.is_verified = "nothing";
                    mtn_default_payment.account_verified_desc = "";
                }
                mtn_default_payment.worker_id = workers[i].id;
                const update = await strapi.query("service-providers").update({ id: workers[i].id }, { payment_methods: [mtn_default_payment] });
                if (update) {
                    console.log(`${i + 1}. worker with id:: ${workers[i].id} has been set to MTN as default payment method`);
                }
            }
            ctx.response.status = 200;
            response = Format.success(`Finished make ${workers.length} workers to use MTN as default payment.`, []);
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in applyDefaultPaymentToWorkers", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async applyDefaultPaymentToPayees(ctx) {
        let response;
        try {
            const payees = await strapi.query("payee-names").find({ _limit: -1 });
            const mtn_default_payment = {
                payment_method: 1,
                is_active: true,
                provider: "MTN"
            }
            console.log(`********** STARTING UPDATING ${payees.length} PAYEES TO USE MTN AS DEFAULT PAYMENT **************`);
            for (let i = 0; i < payees.length; i++) {
                mtn_default_payment.account_name = `${payees[i].first_name} ${payees[i].last_name}`;
                if (utils.phoneNumberValidation(payees[i].phone_number)) {
                    mtn_default_payment.account_number = payees[i].phone_number;
                    mtn_default_payment.is_verified = "nothing";
                    mtn_default_payment.account_verified_desc = "";
                } else {
                    mtn_default_payment.account_number = "";
                    mtn_default_payment.is_verified = "nothing";
                    mtn_default_payment.account_verified_desc = "";
                }
                let update = await strapi.query("payee-names").update({ id: payees[i].id }, { payment_methods: [mtn_default_payment] });
                if (update) {
                    console.log(`${i + 1}. payee with id:: ${payees[i].id} has been set to MTN as default payment method`);
                }
            }
            ctx.response.status = 200;
            response = Format.success(`Finished make ${payees.length} payees  to use MTN as default payment.`, []);
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in applyDefaultPaymentToPayees", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async applyDefaultPaymentToWorkersSome(ctx) {
        let response;
        try {
            const rules = {
                worker_ids: "required|array",
            };
            const validation = new Validator(ctx.request.body, rules);
            if (validation.passes()) {
                const { worker_ids } = ctx.request.body;
                const all_workers = await strapi.query("service-providers").find({ id: worker_ids });
                const mtn_default_payment = {
                    payment_method: 1,
                    is_active: true,
                    provider: "MTN"
                }
                const workers = all_workers.filter((i) => utils.phoneNumberValidation(i.phone_number));
                console.log(`********** STARTING UPDATING ${workers.length} WORKERS TO USE MTN AS DEFAULT PAYMENT **************`);
                for (let i = 0; i < workers.length; i++) {
                    mtn_default_payment.account_name = `${workers[i].first_name} ${workers[i].last_name}`;
                    if (utils.phoneNumberValidation(workers[i].phone_number)) {
                        mtn_default_payment.account_number = workers[i].phone_number;
                        mtn_default_payment.is_verified = workers[i].is_momo_verified_and_rssb;
                        mtn_default_payment.account_verified_desc = workers[i].is_momo_verified_and_rssb_desc;
                    } else {
                        mtn_default_payment.account_number = "";
                        mtn_default_payment.is_verified = "nothing";
                        mtn_default_payment.account_verified_desc = "";
                    }
                    mtn_default_payment.worker_id = workers[i].id;
                    const update = await strapi.query("service-providers").update({ id: workers[i].id }, { payment_methods: [mtn_default_payment] });
                    if (update) {
                        console.log(`${i + 1}. worker with id:: ${workers[i].id} has been set to MTN as default payment method`);
                    }
                }
                ctx.response.status = 200;
                response = Format.success(`Finished make ${workers.length} workers to use MTN as default payment.`, []);
            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in applyDefaultPaymentToWorkers", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },

};
