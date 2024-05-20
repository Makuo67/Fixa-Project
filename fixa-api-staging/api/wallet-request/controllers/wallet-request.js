'use strict';
const api_key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
let Validator = require("validatorjs");

module.exports = {

    async updateWalletRequest(ctx) {
        let response;
        try {
            let rules = {
                request_id: "required|integer",
                request_status: "required|string",
                wallet_account_number: "required|string",
            }
            let validation = new Validator(ctx.request.body, rules);
            let request_body = ctx.request.body;
            if (validation.passes()) {
                const { request_id, request_status,wallet_account_number,reason } = request_body;
                let wallet_request = await strapi.query('wallet-request').findOne({ id: request_id });
                if (wallet_request) {
                    let company = await strapi.query('companies').findOne({ id: 1 });
                    let payment_method = await strapi.query('payment-methods').findOne({ id: wallet_request.payment_method.id });
                    if (company) {
                        if (request_status === 'approved') {
                            let updated_payment_methods = [];
                            // check if payment is present in company
                            let is_payment_present = false;
                            if (payment_method) {
                                if (company.payment_methods.length > 0) {
                                    let company_payment_ids = company.payment_methods.map((item) => item.payment_method.id.toString());
                                    if (company_payment_ids.includes(wallet_request.payment_method.id.toString())) {
                                        is_payment_present = true;
                                    }
                                    // updated_payment_methods = company.payment_methods.map((item) => {
                                    //     return {
                                    //         payment_method: item.payment_method.id, is_payment_method_active: item.is_payment_method_active
                                    //     }
                                    // });
                                }
                                if (is_payment_present === true) {
                                    // updated_payment_methods.push({
                                    //     payment_method: wallet_request.payment_method.id,
                                    //     is_payment_method_active: true
                                    // });
                                    // await strapi.query('companies').update({ id: 1 }, { payment_methods: updated_payment_methods });
                                    await strapi.query('wallet-request').update({ id: request_id }, { request_status: 'approved',wallet_account_number:wallet_account_number,reason:reason ? reason: '' });
                                    var data = {
                                        from: "info@fixarwanda.com",
                                        to: wallet_request.email,
                                        subject: "Wallet Request Status",
                                        template: "wallet_request_status_updated",
                                        "v:wallet_request_status": `${request_status}`,
                                        "v:agent_name": ``,
                                        "v:current_year": `${utils.getCurrentYear()}`
                                    };
                                    mailgun.messages().send(data);
                                    ctx.response.status = 200;
                                    response = {
                                        status: "success",
                                        data: "Updated successfully",
                                        error: '',
                                        meta: "",
                                    };
                                } else {
                                    ctx.response.status = 400;
                                    response = {
                                        status: "failed",
                                        data: "",
                                        error: 'Payment method available',
                                        meta: "",
                                    };
                                }
                            } else {
                                ctx.response.status = 400;
                                response = {
                                    status: "failed",
                                    data: "",
                                    error: 'Payment method not found',
                                    meta: "",
                                };
                            }
                        }
                        if (request_status === 'declined') {
                            let admin_name = "";
                            let userAdmin = await strapi.query("user", "admin").findOne({ email: wallet_request.email });
                            if(userAdmin){
                                admin_name = `${userAdmin.firstname} ${userAdmin.lastname}`;
                            }
                            // let updated_payment_methods = [];
                            if (payment_method) {
                            //   if (company.payment_methods.length > 0) {
                            //     let company_payment_ids = company.payment_methods.map((item) => item.payment_method.id.toString());
                            //     for (let index = 0; index < company_payment_ids.length; index++) {
                            //         const item = company_payment_ids[index];
                            //         if(item.toString() != wallet_request.payment_method.id.toString()){
                            //             updated_payment_methods.push({
                            //                 payment_method: item,
                            //                 is_payment_method_active: true
                            //               });
                            //         }
                                    
                            //     }
                            //     await strapi.query('companies').update({ id: 1 }, { payment_methods: updated_payment_methods });
                                await strapi.query('wallet-request').update({ id: request_id }, { request_status: 'declined',wallet_account_number:wallet_account_number,reason:reason ?? '' });

                                var data = {
                                    from: "info@fixarwanda.com",
                                    to: wallet_request.email,
                                    subject: "Wallet Request Status",
                                    template: "wallet_request_denied",
                                    "v:name": admin_name,
                                    "v:payment_method": wallet_request.payment_method.name ?? "",
                                    "v:reason": reason ?? "",
                                    "v:current_year": `${utils.getCurrentYear()}`
                                };
                                mailgun.messages().send(data);
                                 ctx.response.status = 200;
                                 response = {
                                   status: "success",
                                   data: 'Updated successfully',
                                   error: '',
                                   meta: "",
                                 };
                              
                            //   }
                            } else {
                              ctx.response.status = 400;
                              response = {
                                status: "failed",
                                data: "",
                                error: 'Payment method not found',
                                meta: "",
                              };
                            }
                            

                        }

                    } else {
                        ctx.response.status = 400;
                        response = {
                            status: "failed",
                            data: "",
                            error: 'Company not found',
                            meta: "",
                        };
                    }
                } else {
                    ctx.response.status = 400;
                    response = {
                        status: "failed",
                        data: "",
                        error: 'Wallet request not found',
                        meta: "",
                    };
                }
            } else {
                ctx.response.status = 400;
                response = {
                    status: "failed",
                    data: "",
                    error: validation.failedRules,
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

    async requestWallet(ctx) {
        let response;
        try {
            let rules = {
                payment_method: "required|integer",
                certificate_link: "required|string"
            }
            let validation = new Validator(ctx.request.body, rules);
            let user = ctx.state.user;
            let request_body = ctx.request.body;
            if (validation.passes()) {
                const { payment_method,  certificate_link, reason } = request_body;
                let wallet_request = await strapi.query('wallet-request').findOne({ payment_method: payment_method});
                let error_messages = [];
                let error_status = false;
                let payment_exist = false;
                if (wallet_request) {
                    const item = wallet_request;
                     if(item.request_status === 'pending' || item.request_status === 'approved'){
                         error_status = true;
                         error_messages.push('Wallet already requested');
                        
                     } 
                     if(item.request_status === 'declined'){
                        payment_exist = true;
                     }
                    
                }

                   if (error_status === false) {
                    if(payment_exist){
                        let wallet_updated = await strapi.query('wallet-request').update({id:wallet_request.id},{ payment_method: payment_method, email: user.email, certificate_link: certificate_link, request_status: 'pending',reason:reason ? reason: '' });
                        // (TODO) notify fixa-superadmin
                        console.log('Send email to super admin');
                        ctx.response.status = 200;
                        response = {
                            status: "success",
                            data: wallet_updated,
                            error: "",
                            meta: "",
                        };
                    }else {
                        let wallet_created = await strapi.query('wallet-request').create({ payment_method: payment_method, email: user.email, certificate_link: certificate_link, request_status: 'pending',reason:reason ? reason: '' });
                        // (TODO) notify fixa-superadmin
                        console.log('Send email to super admin');
                        ctx.response.status = 200;
                        response = {
                            status: "success",
                            data: wallet_created,
                            error: "",
                            meta: "",
                        };
                    }

                } else {
                    ctx.response.status = 401;
                    response = {
                        status: "failed",
                        data: "",
                        error: error_messages,
                        meta: "",
                    };
                }
            } else {
                ctx.response.status = 400;
                response = {
                    status: "failed",
                    data: "",
                    error: validation.failedRules,
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
    }
};
