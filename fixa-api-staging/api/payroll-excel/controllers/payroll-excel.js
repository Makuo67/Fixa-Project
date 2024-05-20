'use strict';
const axios = require('axios');
const { v4: uuid } = require('uuid');
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const MOMO_MSISDN = process.env.MOMO_MSISDN;
const MOMO_CURRENCY = process.env.MOMO_CURRENCY;
const {getMomoToken} = require("../../../config/functions/momotoken");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async updateEntry(ctx) {
        let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
        let response = {
            status: "failed",
            statusCode: 400,
            data: access_token,
            error: "",
            meta: ""
        }
        const { payroll_id } = ctx.request.body;
        const payroll_excel_table = await strapi.query("payroll-excel").find({ payroll_id: payroll_id, _limit: -1 });
        if (payroll_excel_table) {
            let total_money = 0;
            for (let x = 0; x < payroll_excel_table.length; x++) {
                if (parseInt(payroll_excel_table[x].total_earnings) >= 1) {
                    // console.log("positive Money", payroll_excel_table[x].total_earnings);
                    total_money += parseInt(payroll_excel_table[x].total_earnings);
                } else {
                    console.log("Negative Money", payroll_excel_table[x].total_earnings);
                }
                await axios.get(MOMO_URL_DISB + "v1_0/accountholder/msisdn/250" + payroll_excel_table[x].momo_acount.split(" ")[1] + "/active", {
                    headers: {
                        'Content-Length': 0,
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Ocp-Apim-Subscription-Key': MOMO_PRIMARY_KEY,
                        'X-Target-Environment': MOMO_X_TARGET_ENV,
                        'Authorization': `Bearer ${access_token}`
                    }
                }).then(function (response) {
                    strapi.query("payroll-excel").update({ id: payroll_excel_table[x].id }, { payroll_id: payroll_id, reference_id: uuid(), momo_status: response.data.result });
                    // console.log("success", response.data.result)
                }).catch(function (error) {
                    console.log("error", error.message)
                });
            }
            response.meta = total_money;
            response.status = "success";
            response.statusCode = 200;
            response.data = access_token;
        }
        return response;
    },
    async payWorkers(ctx) {
        let response = {
            status: "failed",
            statusCode: 400,
            data: null,
            error: "",
            meta: ""
        }
        const { payroll_id } = ctx.request.body;
        const payroll_excel_table = await strapi.query("payroll-excel").find({ payroll_id: payroll_id, _limit: -1 });
        if (payroll_excel_table) {
            let count_ = 0;
            for (let x = 0; x < payroll_excel_table.length; x++) {
                let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
                if (parseInt(payroll_excel_table[x].total_earnings) >= 1 && payroll_excel_table[x].momo_status == true && payroll_excel_table[x].transaction_status != "successful" && payroll_excel_table[x].transaction_status != "pending") {
                    await axios.post(MOMO_URL_DISB + "v1_0/transfer", {
                        amount: `${parseFloat(payroll_excel_table[x].total_earnings.replace(/,/g, ''))}`,
                        currency: MOMO_CURRENCY,
                        externalId: Math.floor(Math.random() * 10000),
                        payee: {
                            partyIdType: MOMO_MSISDN,
                            partyId: "250" + payroll_excel_table[x].momo_acount.split(" ")[1]
                        },
                        payerMessage: "pay",
                        payeeNote: "enjoy"
                    }, {
                        headers: {
                            'Accept': '*/*',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive',
                            'Ocp-Apim-Subscription-Key': MOMO_PRIMARY_KEY,
                            'X-Target-Environment': MOMO_X_TARGET_ENV,
                            'X-Reference-Id': payroll_excel_table[x].reference_id,
                            'Authorization': `Bearer ${access_token}`
                        }
                    }).then(function (response) {
                        strapi.query("payroll-excel").update({ id: payroll_excel_table[x].id }, { transaction_status: "initiated" });
                        count_ = count_ + 1;
                        console.log("current iteration :: " + count_ + " Paid :: " + payroll_excel_table[x].total_earnings + " to :: " + payroll_excel_table[x].momo_acount.split(" ")[1]);
                    }).catch(function (error) {
                        console.log("error", error.message)
                    });
                }
            }
            response.status = "success"
            response.statusCode = 200;
            response.data = "ok";
        }
        return response;
    },
    async checkStatus(ctx) {
        let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
        let response = {
            status: "failed",
            statusCode: 400,
            data: access_token,
            error: "",
            meta: ""
        }
        const { payroll_id } = ctx.request.body;
        const payroll_excel_table = await strapi.query("payroll-excel").find({ payroll_id: payroll_id, _limit: -1 });
        if (payroll_excel_table) {
            for (let x = 0; x < payroll_excel_table.length; x++) {
                if (payroll_excel_table[x].transaction_status != "successful" && parseInt(payroll_excel_table[x].total_earnings) >= 1) {
                    await axios.get(MOMO_URL_DISB + "v1_0/transfer/" + payroll_excel_table[x].reference_id, {
                        headers: {
                            'Content-Length': 0,
                            'Accept': '*/*',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive',
                            'Ocp-Apim-Subscription-Key': MOMO_PRIMARY_KEY,
                            'X-Target-Environment': MOMO_X_TARGET_ENV,
                            'Authorization': `Bearer ${access_token}`
                        }
                    }).then(function (response) {
                        strapi.query("payroll-excel").update({ id: payroll_excel_table[x].id }, { transaction_status: response.data.status.toLowerCase() });
                        console.log("status :: " + response.data.status + " for :: " + payroll_excel_table[x].momo_acount);
                    }).catch(function (error) {
                        console.log("error", error.message)
                    });
                }
            }
            response.status = "success"
            response.statusCode = 200;
            response.data = access_token;
        }
        return response;
    },
    async regenarateUUID(ctx) {
        let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
        let response = {
            status: "failed",
            statusCode: 400,
            data: access_token,
            error: "",
            meta: ""
        }
        const { payroll_id } = ctx.request.body;
        const payroll_excel_table = await strapi.query("payroll-excel").find({ payroll_id: payroll_id, transaction_status: "failed", _limit: -1 });
        if (payroll_excel_table) {
            for (let x = 0; x < payroll_excel_table.length; x++) {
                if (payroll_excel_table[x].transaction_status == "failed" && parseInt(payroll_excel_table[x].total_earnings) >= 1) {
                    console.log("generate uuid for :: " + payroll_excel_table[x].momo_acount);
                    strapi.query("payroll-excel").update({ id: payroll_excel_table[x].id }, { payroll_id: payroll_id, reference_id: uuid() });
                }
            }
            response.meta = null;
            response.status = "success"
            response.statusCode = 200;
            response.data = access_token;
        }
        return response;
    },
};
