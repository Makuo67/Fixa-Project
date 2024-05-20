'use strict';
const { v4: uuid } = require("uuid");
const { createExternalPayrollDeduction } = require('../../deductions/services/deductions');
const _ = require("underscore");
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async getTransactions(payment_id, status, payment_method_id) {
        let all_workers_to_pay = [];
        let workers_to_pay = [];
        if (status === "unpaid") {
            all_workers_to_pay = await strapi
                .query("deductions-transactions")
                .find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1 });
            workers_to_pay = all_workers_to_pay.filter((worker) => {
                if (worker.status === "unpaid") {
                    worker.amount = worker.amount;
                    worker.account_number = worker.account_number;
                    // worker.account_number = checkMoMoPhoneNumber(worker.account_number);
                    worker.reference_id = uuid();
                    worker.payment_type_name = "deduction";
                    return worker;
                }
            });
        } else {
            all_workers_to_pay = await strapi
                .query("deductions-transactions")
                .find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1, status: "failed" });
            let workersUnpaid = await strapi.query("deductions-transactions").find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1, status: "unpaid" });
            if (workersUnpaid.length > 0) {
                workers_to_pay = workersUnpaid.filter((worker) => {
                    if (worker.status === "unpaid") {
                        worker.amount = worker.amount;
                        worker.account_number = worker.account_number;
                        worker.reference_id = uuid();
                        worker.payment_type_name = "deduction";
                        return worker;
                    }
                });
            }
            if (all_workers_to_pay.length > 0) {
                for (let index = 0; index < all_workers_to_pay.length; index++) {
                    let payroll_transaction = await strapi
                        .query("payment-transaction-tracks")
                        .findOne({
                            payroll_payout_transaction_id: all_workers_to_pay[index].id,
                            payments_id: payment_id,
                            is_deduction: true,
                            _sort: "created_at:DESC"
                        });
                    if (payroll_transaction && payroll_transaction.status.toLowerCase() === "failed") {
                        workers_to_pay.push({
                            ...all_workers_to_pay[index],
                            amount: all_workers_to_pay[index].amount,
                            account_number: all_workers_to_pay[index].account_number,
                            reference_id: uuid(),
                            payment_type_name: "deduction"
                        });
                        await strapi.query("payment-transaction-tracks").update(
                            { id: payroll_transaction.id },
                            {
                                is_rerun: true,
                            }
                        )
                    }
                }
            }
        }
        return workers_to_pay;
    },
    // create deduction transaction after send emails
    async createDeductionTransactions(payee, payment_id, external_link) {
        let deduction_transaction = await strapi.query("deductions-transactions").findOne({ payment_id: payment_id, payee_name_id: payee.id })
        if (!deduction_transaction) {
            const payee_id = payee.id;
            const payee_names = payee.names;
            const payee_phone_number = payee.phone_number;
            const payment_method = payee.payment_methods.find((item) => item.is_active).provider;
            const payment_method_id = payee.payment_methods.find((item) => item.is_active).payment_method.id;
            const account_number = payee.payment_methods.find((item) => item.is_active).account_number;
            const account_verified = payee.payment_methods.find((item) => item.is_active).is_verfied;
            const account_verified_desc = payee.payment_methods.find((item) => item.is_active).account_verified_desc;
            await strapi.query("deductions-transactions").create({
                amount: 0,
                payee_name: payee_names,
                phone_number: payee_phone_number,
                payment_id: payment_id,
                status: 'email_sent',
                payee_name_id: payee_id,
                external_link: external_link,
                payment_method: payment_method,
                payment_method_id: payment_method_id,
                account_number: account_number,
                account_verified: account_verified,
                account_verified_desc: account_verified_desc
            });
        }
    },

    async updateDeductionTransactionWithPayrollWorkersOTP(phone_number, passed_deductions, payment_id, payee_name_id) {
        let response;
        try {
            // check if payee-names exist
            const payees = await strapi.query("payee-names").find({ _limit: -1 });
            const payment_deductions = await strapi.query("deductions").find({ payment_id: payment_id, _limit: -1 });
            const payee_name = await strapi.query("payee-names").findOne({ phone_number: phone_number, id: payee_name_id });
            if (payee_name) {
                const deductions_transaction = await strapi.query("deductions-transactions").findOne({ payment_id: payment_id, status: "email_sent", payee_name_id: payee_name_id });
                const all_deductions = utils.removeDuplicatesByProperty(passed_deductions, "assigned_worker_id"); //To remove duplicate
                if (deductions_transaction && all_deductions.length >= 1) {
                    let total_amount = 0;
                    for (let index = 0; index < all_deductions.length; index++) {
                        const payroll_transaction = await strapi.query("payroll-transactions").findOne({ id: all_deductions[index].payroll_transaction_id });
                        if (payroll_transaction) {
                            let worker_total_deduction = _.reduce(all_deductions[index].deductions,
                                (sum, item) => {
                                    if (parseInt(item.amount) < 0) {
                                        return sum;
                                    }
                                    return sum + parseInt(item.amount);
                                }, 0);

                            const balanceAvailable = calculateWorkerRestaurantBalance(all_deductions[index].assigned_worker_id, payroll_transaction.payment_id, payroll_transaction.take_home, payee_name, payees, payment_deductions);
                            if (worker_total_deduction >= balanceAvailable) { // when Money to be removed is more than what is remaining in the account. we should use money that are available
                                worker_total_deduction = balanceAvailable;
                            }
                            if (parseInt(worker_total_deduction) <= balanceAvailable && (parseInt(worker_total_deduction) >= 0)) {
                                if ((parseInt(worker_total_deduction) <= parseInt(payroll_transaction.take_home)) && (parseInt(worker_total_deduction) < balanceAvailable)) {
                                    total_amount += worker_total_deduction;
                                    let obj = {
                                        assigned_worker_id: all_deductions[index].assigned_worker_id,
                                        payroll_transaction_id: all_deductions[index].payroll_transaction_id,
                                        project_id: all_deductions[index].project_id,
                                        deductions: all_deductions[index].deductions,
                                        payee_name_id: payee_name_id
                                    };
                                    await createExternalPayrollDeduction(obj);
                                } else {
                                    total_amount += balanceAvailable;
                                    if (all_deductions[index].deductions[0]) {
                                        let obj = {
                                            assigned_worker_id: all_deductions[index].assigned_worker_id,
                                            payroll_transaction_id: all_deductions[index].payroll_transaction_id,
                                            project_id: all_deductions[index].project_id,
                                            deductions: [{ "type_id": all_deductions[index].deductions[0]['type_id'], amount: balanceAvailable }],
                                            payee_name_id: payee_name_id
                                        };
                                        await createExternalPayrollDeduction(obj);
                                    }
                                }
                            }
                        }
                    }

                    const deductions_transaction_update = await strapi.query("deductions-transactions").update({ id: deductions_transaction.id }, { status: "unpaid", amount: total_amount });
                    if (deductions_transaction_update) {
                        response = {
                            status: "success",
                            data: deductions_transaction_update,
                            error: "",
                            meta: "",
                        };
                    }
                } else {
                    response = {
                        status: "failed",
                        data: "",
                        error: "Invalid deductions transaction",
                        meta: "",
                    };
                }
            } else {
                response = {
                    status: "failed",
                    data: "",
                    error: "Invalid payee",
                    meta: "",
                };
            }

        } catch (error) {
            console.log("erro catch updateDeductionTransactionWithPayrollWorkers ", error.message);
        }
        return response;
    },

    /**
     * @function getWorkerRestaurantBalance
     * @description This function returns the restaurant balance of a worker
     * @param {number} assigned_worker_id - The assigned worker ID of the worker
     * @param {number} payment_id - The ID of the payment
     * @param {string} take_home - The take home value of the worker
     * @returns {number} - The restaurant balance of the worker
     */
    getWorkerRestaurantBalance(assigned_worker_id, payment_id, take_home, payee, payees, payment_deductions) {
        return calculateWorkerRestaurantBalance(assigned_worker_id, payment_id, take_home, payee, payees, payment_deductions);
    }
};

function calculateWorkerRestaurantBalance(assigned_worker_id, payment_id, take_home, payee, payees, payment_deductions) {
    let restaurantBalance = 0;
    try {
        if (!(isNaN(assigned_worker_id) || isNaN(payment_id) || (typeof take_home !== 'string'))) {
            // const payee = await strapi.query("payee-names").findOne({ id: payee_id });
            if (payee) {
                const is_custom_deduction = _.find(_.uniq(_.map(payee.deduction_types, i => i.is_custom)), is_custom => is_custom);
                if (is_custom_deduction) {
                    restaurantBalance = parseInt(take_home);
                    return restaurantBalance;
                }
                // find deductions of worker
                const workerDeductions = payment_deductions.filter((item_deduction) => parseInt(item_deduction.assigned_worker_id) === parseInt(assigned_worker_id));
                // const workerDeductions = await strapi.query("deductions").find({ assigned_worker_id: assigned_worker_id, payment_id: payment_id });
                const externalWorkerDeductions = workerDeductions.length >= 1 ? workerDeductions.filter(deduction => parseInt(deduction.payee_name_id) > 0) : [];
                let deduction_without_custom_type = [];
                for (let x = 0; x < externalWorkerDeductions.length; x++) {
                    const payee_without_custom_type = payees.find(item_payee => item_payee.id === externalWorkerDeductions[x].payee_name_id);
                    // let payee_without_custom_type = await strapi.query("payee-names").findOne({ id: externalWorkerDeductions[x].payee_name_id });
                    const is_custom_deduction_ = _.find(_.uniq(_.map(payee_without_custom_type.deduction_types, i => i.is_custom)), is_custom => is_custom);
                    if (!is_custom_deduction_) {
                        deduction_without_custom_type.push(externalWorkerDeductions[x]);
                    }
                }

                const totalExternalWorkerDeductions = deduction_without_custom_type.reduce(
                    (acc, curr) => {
                        if (parseInt(curr.deduction_amount) < 0) {
                            return acc;
                        }
                        return acc + parseInt(curr.deduction_amount)
                    }, 0);

                // If totalExternalWorkerDeductions is in range of 0-15k
                if (totalExternalWorkerDeductions < 15000) {
                    // if take_home is more than 15K
                    if (parseInt(take_home) >= 15000) {
                        restaurantBalance = 15000 - totalExternalWorkerDeductions;
                    } else {
                        restaurantBalance = parseInt(take_home);
                    }
                } else {
                    restaurantBalance = 0;
                }
            }
        }
    } catch (error) {
        console.log("error catch calculateWorker Restaurant Balance", error.message);
    }
    return restaurantBalance;
}
