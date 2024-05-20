'use strict';
const { buildQuery, convertRestQueryParams } = require("strapi-utils");
let Validator = require("validatorjs");
const utils = require("../../../config/functions/utils");
const Format = require('response-format');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getTempPayees(ctx) {
        let response;
        try {
            let rules = {
                payment_id: "required|string",
                _start: "required|string",
                _limit: "required|string"
            };
            let validation = new Validator(ctx.request.query, rules);
            if (validation.passes()) {
                const { _start, _limit, table, payment_id } = ctx.request.query;
                let count;
                let final_data;
                const filters = convertRestQueryParams({ _start, _limit, payment_id });
                const countfilters = convertRestQueryParams({ _limit: 1, payment_id });
                const model = strapi.query("temp-payout-pament").model;
                if (table === 'valid') {
                    final_data = await model.query((qb) => { qb.where("is_account_number_exist", false).andWhere("is_account_number_valid", true).andWhere("payment_id", payment_id) }).query(buildQuery({ model, filters })).fetchAll().then((results) => final_data = results.toJSON());
                    count = await model.query((qb) => { qb.where("is_account_number_exist", false).andWhere("is_account_number_valid", true).andWhere("payment_id", payment_id) }).query(buildQuery({ model, countfilters })).count().then((results) => count = results);
                } else if (table === 'invalid') {
                    final_data = await model.query((qb) => { qb.where("is_account_number_exist", true).orWhere("is_account_number_valid", false).andWhere("payment_id", payment_id) }).query(buildQuery({ model, filters })).fetchAll().then((results) => final_data = results.toJSON());
                    count = await model.query((qb) => { qb.where("is_account_number_exist", true).orWhere("is_account_number_valid", false).andWhere("payment_id", payment_id) }).query(buildQuery({ model, countfilters })).count().then((results) => count = results);
                } else {
                    final_data = await strapi.query("temp-payout-pament").find({ _start, _limit, payment_id });
                    count = await strapi.query("temp-payout-pament").count({ payment_id });
                }
                let found_errors = [
                    {
                        count: await strapi.services["temp-payout-pament"].count({ is_account_number_valid: false, payment_id: payment_id }),
                        status: "error",
                        message: "Account number not verified",
                    },
                    {
                        count: await strapi.services["temp-payout-pament"].count({ is_account_number_exist: true, payment_id: payment_id }),
                        status: "error",
                        message: "Account number already exist",
                    },
                ];
                const success_response = {
                    data: {
                        errors: found_errors,
                        payees: final_data,
                    },
                    meta: {
                        pagination: {
                            count
                        },
                    }
                };
                ctx.response.status = 200;
                response = Format.success("success", success_response);
            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
            }
        } catch (error) {
            console.log("error is ", error.message);
            ctx.response.status = 500;
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async saveTempPayoutExcel(ctx) {
        let response;
        try {
            let rules = {
                payment_id: "required|string"
            };
            let validation = new Validator(ctx.params, rules);
            if (validation.passes()) {
                const { payment_id } = ctx.params;
                const temp_data = await strapi.query("temp-payout-pament").find({ payment_id: payment_id, is_account_number_exist: false, is_account_number_valid: true, _limit: -1 });
                if (temp_data && temp_data.length >= 1) {
                    await saveCleanPayoutExcel(temp_data, payment_id);
                    ctx.response.status = 200;
                    response = Format.success("Your Payees has been saved", []);
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest(`We can't find any valid payee.`, []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
            }
        } catch (error) {
            console.log("error is ", error.message);
            ctx.response.status = 500;
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async deleteTempPayout(ctx) {
        let response;
        try {
            let rules = {
                payment_id: "required|string"
            };
            let validation = new Validator(ctx.params, rules);
            if (validation.passes()) {
                const { payment_id } = ctx.params;
                const delete_data = await strapi.query("temp-payout-pament").delete({ payment_id: payment_id });
                if (delete_data) {
                    ctx.response.status = 200;
                    response = Format.success("Your Payees has been deleted", []);
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest(`No payees found in the temporally table with payment_id ${payment_id}`, []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
            }
        } catch (error) {
            console.log("error is ", error.message);
            ctx.response.status = 500;
            response = Format.internalError(error.message, []);
        }
        return response;
    }
};

const saveCleanPayoutExcel = async (data, payment_id) => {
    for (let index = 0; index < data.length; index++) {
        const i = data[index];
        if (!i.is_account_number_exist && i.is_account_number_valid) {
            let payee_type_id = 0;
            const payee_type = await strapi.query("payees").findOne({ payee_type: "Payee" });
            if (payee_type) {
                payee_type_id.id;
            }
            const payout_transaction = {
                payment_id: i.payment_id,
                payee_type_id: payee_type_id,
                payee_name: i.account_name,
                amount: parseInt(i.amount),
                status: "unpaid",
                payee_type_name: i.payee_type,
                worker_id: 0,
                service_name: "",
                account_number: i.account_number,
                payment_method: i.payment_method,
                payment_method_id: i.payment_method_id,
                is_payment_method: i.is_account_verified,
                payment_method_verification_desc: i.account_verification_desc,
                is_editable: true,
                is_bank: (i.payment_method === "kremit") ? true : false
            };
            await strapi.query("payout-transactions").create(payout_transaction, "saveCleanPayoutExcel", payment_id);
        }
    }

    let payments_transactions = await strapi.query("payout-transactions").find({ payment_id: payment_id, _limit: -1 });
    const total_amount = payments_transactions.reduce((sum, item) => {
        return sum + parseInt(item.amount);
    }, 0);
    await strapi.query("payments").update({ id: payment_id }, { total_amount: total_amount, total_payees: payments_transactions.length });
};
