'use strict';
const { getPayrollWorkerTransactions } = require("../../payroll-transactions/services/payroll-transactions");
const { createExternalPayrollDeduction } = require("../../deductions/services/deductions");
let Validator = require("validatorjs");
const _ = require("underscore");
const { getWorkerRestaurantBalance } = require("../services/deductions-transactions");
var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
/**
/**
* Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
* to customize this controller
*/

module.exports = {
    async getDeductionTransactionWithPayrollWorkers(ctx) {
        let response;
        const { payment_id, payee_name_id } = ctx.params;
        try {
            // get payee
            const payee = await strapi.query("payee-names").findOne({ id: payee_name_id });
            const payees = await strapi.query("payee-names").find({ _limit: -1 });
            if (payee) {
                if (ctx.state.user) {
                    payee.phone_number = ctx.state.user.username;
                    payee.names = `${payee.names} (${ctx.state.user.firstname} ${ctx.state.user.lastname})`
                }
                // get deduction -types
                const all_deductions_types = payee.deduction_types;
                if (all_deductions_types.length > 0) {
                    // check if payment exist under ids
                    const payment = await strapi.query("payments").findOne({ id: payment_id });
                    const deduction_transaction = await strapi.query("deductions-transactions").findOne({ payment_id, payee_name_id });

                    if (payment && deduction_transaction) {
                        const payment_deductions = await strapi.query("deductions").find({ payment_id: payment_id, _limit: -1 });
                        const payroll_transactions = await getPayrollWorkerTransactions(payment);
                        let data = null;
                        // IF email is sent to external deductions
                        if (deduction_transaction.status === "email_sent") {
                            for (let i = 0; i < payroll_transactions[0].workers.length; i++) {
                                const element = payroll_transactions[0].workers[i];
                                element.amount_available_restaurant = getWorkerRestaurantBalance(element.assigned_worker_id, element.payment_id, element.take_home, payee, payees, payment_deductions);
                            }
                            data = {
                                deduction_state: "Not-submitted",
                                workers: payroll_transactions[0].workers,
                                deductions_types: all_deductions_types,
                                payee_info: [payee],
                                payment_info: {
                                    project_name: payroll_transactions[0].project_name,
                                    start_date: payroll_transactions[0].start_date,
                                    end_date: payroll_transactions[0].end_date,
                                    project_id: payroll_transactions[0].project_id,
                                }
                            };
                        } else {
                            let workers_deductions = [];
                            let worker_payroll_transactions = await strapi.query("payroll-transactions").find({ payment_id: payment.id, _limit: -1 });
                            let deductions = await strapi.query("deductions").find({ payment_id, payee_name_id, _limit: -1 });

                            for (let index = 0; index < deductions.length; index++) {
                                const element = deductions[index];
                                let deduction_status = getPayrollTransaction(worker_payroll_transactions, element);
                                if (deduction_status.status === true) {
                                    let new_body = { ...deduction_status.data[0], deduction_amount: element.deduction_amount };
                                    workers_deductions.push(new_body);
                                }
                            }
                            if (deductions) {
                                for (let i = 0; i < workers_deductions.length; i++) {
                                    const element = workers_deductions[i];
                                    element.amount_available_restaurant = getWorkerRestaurantBalance(element.assigned_worker_id, element.payment_id, element.take_home, payee, payees, payment_deductions);
                                }
                                let groupedWorkers = [];
                                if (workers_deductions.length > 0) {
                                    groupedWorkers = Object.values(
                                        workers_deductions.reduce((result, current) => {
                                            const { worker_id, deduction_amount } = current;

                                            if (!result[worker_id]) {
                                                result[worker_id] = { ...current, deduction_amount: 0 };
                                            }
                                            result[worker_id].deduction_amount += deduction_amount;

                                            return result;
                                        }, {})
                                    );
                                }

                                data = {
                                    deduction_state: "submitted",
                                    workers: groupedWorkers,
                                    deductions_types: all_deductions_types,
                                    payee_info: [payee],
                                    payment_info: {
                                        project_name: payroll_transactions[0].project_name,
                                        start_date: payroll_transactions[0].start_date,
                                        end_date: payroll_transactions[0].end_date,
                                        project_id: payroll_transactions[0].project_id,
                                    }
                                };
                            } else {
                                data = [];
                            }
                        }
                        response = {
                            status: "success",
                            data: data,
                            error: "",
                            meta: "",
                        };
                    } else {
                        ctx.response.status = 400;
                        response = {
                            status: "failed",
                            data: "",
                            error: `Payment with ${payment_id} does not exist`,
                            meta: "",
                        };
                    }
                } else {
                    ctx.response.status = 400;
                    response = {
                        status: "failed",
                        data: "",
                        error: "Payee does not have deduction-types",
                        meta: "",
                    };
                }
            } else {
                ctx.response.status = 400;
                response = {
                    status: "failed",
                    data: "",
                    error: "Payee does not exist",
                    meta: "",
                };
            }
        } catch (error) {
            ctx.response.status = 500;
            response = {
                status: "failed",
                data: "",
                error: error.message,
                meta: "",
            };
        }
        return response;
    },
    async updateDeductionTransactionWithPayrollWorkers(ctx) {
        let response;
        try {
            let rules = {
                phone_number: "required|string",
                all_deductions: "array|required",
            };
            let validation = new Validator(ctx.request.body, rules);
            const { phone_number, all_deductions } = ctx.request.body;
            const { payment_id, payee_name_id } = ctx.params;
            if (validation.passes()) {
                // check if payee-names exist
                let payee_name = await strapi.query("payee-names").findOne({ phone_number: phone_number, id: payee_name_id });
                if (payee_name) {
                    let deductions_transaction = await strapi.query("deductions-transactions").findOne({ payment_id: payment_id, status: "email_sent", payee_name_id: payee_name_id });
                    if (deductions_transaction && all_deductions.length >= 1) {
                        let total_amount = 0;
                        for (let index = 0; index < all_deductions.length; index++) {
                            let worker_total_deduction = _.reduce(all_deductions[index].deductions,
                                (sum, item) => {
                                    return sum + item.amount;
                                }, 0);
                            total_amount += worker_total_deduction;
                            let obj = {
                                assigned_worker_id: all_deductions[index].assigned_worker_id,
                                payroll_transaction_id: all_deductions[index].payroll_transaction_id,
                                project_id: all_deductions[index].project_id,
                                deductions: all_deductions[index].deductions,
                                payee_name_id: payee_name_id
                            }
                            await createExternalPayrollDeduction(obj);
                        }

                        let deductions_transaction_update = await strapi.query("deductions-transactions").update({ id: deductions_transaction.id }, { status: "unpaid", amount: total_amount });
                        if (deductions_transaction_update) {
                            let payment = await strapi.query("payments").findOne({ id: payment_id });
                            if (payment) {
                                let userExist = await strapi.query("user", "admin").findOne({ id: payment.done_by });
                                if (userExist) {
                                    const emailData = {
                                        from: "support@fixarwanda.com",
                                        to: [`${userExist.email}`],
                                        subject: `Deductions Submitted`,
                                        template: "deduction-template",
                                        "v:admin_name": `${userExist.firstname ?? ""}`,
                                        "v:supplier_name": `${deductions_transaction.payee_name ?? ""}`,
                                        "v:payroll_title": payment.title ?? "",
                                        "v:year": `${year}`
                                    };
                                    // Send an email to the user.
                                    mailgun.messages().send(emailData);
                                }
                            }
                            response = {
                                status: "success",
                                data: "Deduction transaction Updated successfully",
                                error: "",
                                meta: "",
                            };
                        }
                    } else {
                        ctx.response.status = 400;
                        response = {
                            status: "failed",
                            data: "",
                            error: "Invalid deductions transaction",
                            meta: "",
                        };
                    }
                } else {
                    ctx.response.status = 400;
                    response = {
                        status: "failed",
                        data: "",
                        error: "Invalid payee",
                        meta: "",
                    };
                }
            } else {
                ctx.response.status = 400;
                response = {
                    status: "failed",
                    data: validation.data,
                    error: validation.errors,
                    meta: "",
                };
            }
        } catch (error) {
            console.log("erro catch updateDeductionTransactionWithPayrollWorkers ", error.message);
            ctx.response.status = 500;
            response = {
                status: "failed",
                data: "",
                error: error.message,
                meta: "",
            };
        }
        return response;
    },

};

function getPayrollTransaction(payroll_transactions, deduction) {
    let payroll_transaction = { status: false, data: [] }

    let deduction_response = payroll_transactions.filter(item => (item.assigned_worker_id.toString() === deduction.assigned_worker_id.toString() && item.payment_id.toString() === deduction.payment_id.toString()));
    if (deduction_response.length > 0) {
        payroll_transaction = { status: true, data: deduction_response }
    }
    return payroll_transaction;

}
