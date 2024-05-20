'use strict';
let Validator = require('validatorjs');
const { accountVerification } = require("../../payment-methods/services/payment-methods");
const { getSupplierProjects } = require("../../projects/services/projects");
const Format = require('response-format');
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async addPayee(ctx) {
        let response;
        try {
            const rules = {
                phone: "required|string",
                names: "required|string",
                email: "required|email",
                deduction_type: "required|array",
                payment_methods: "required|array",

            };
            const validation = new Validator(ctx.request.body, rules);
            if (validation.passes()) {
                const { names, phone, email, deduction_type, payment_methods } = ctx.request.body
                const payee_type = await strapi.query("payees").findOne({ payee_type: "Restaurant" });
                if (payee_type) {
                    const number_of_default_payment_method = payment_methods.filter((item) => item.is_active);
                    if (number_of_default_payment_method.length != 0) {
                        if (number_of_default_payment_method.length === 1) {
                            const payee_phone = await strapi.query("payee-names").findOne({ phone_number: phone });
                            if (!payee_phone) {
                                const payee_email = await strapi.query("payee-names").findOne({ email: email });
                                if (!payee_email) {
                                    let paymentsMethods = [];
                                    for (let index = 0; index < payment_methods.length; index++) {
                                        const element = payment_methods[index];
                                        let accountNumberVerification = 'nothing';
                                        let accountNumberProvider = '';
                                        let accountNumberAccountVerifiedDesc = '';
                                        const payment_method_id = element.payment_method_id;
                                        const payment_method = await strapi.query("payment-methods").findOne({ id: element.payment_method_id });
                                        if (payment_method) {
                                            if (payment_method.code_name === "mtn" && (element.account_number.startsWith('078') || element.account_number.startsWith('079'))) { // check for MTN
                                                accountNumberProvider = 'MTN';
                                                const momo_verification = await accountVerification(accountNumberProvider, { account_number: element.account_number, account_name: { first_name: names, last_name: "name_combined" }, account_belong_to: "MTN" }, true);
                                                if (momo_verification.status) {
                                                    accountNumberVerification = momo_verification.data.verification_result_boolean;
                                                    accountNumberAccountVerifiedDesc = momo_verification.data.verification_result_desc;
                                                }
                                            } else if (payment_method.code_name === "airtel" && (element.account_number.startsWith('073') || element.account_number.startsWith('072'))) {  // check for airtel
                                                accountNumberProvider = 'AIRTEL';
                                            } else { // any number here is taken as bank account
                                                if (element.payment_method_adjacent_id && parseInt(element.payment_method_adjacent_id) >= 1) {
                                                    const kremit_verification = await accountVerification("kremit", { account_number: element.account_number, account_name: { first_name: names, last_name: "name_combined" }, account_belong_to: element.payment_method_adjacent_id }, true);
                                                    if (kremit_verification.status) {
                                                        accountNumberVerification = kremit_verification.data.verification_result_boolean;
                                                        accountNumberAccountVerifiedDesc = kremit_verification.data.verification_result_desc;
                                                        accountNumberProvider = kremit_verification.data.verification_result_holder;
                                                    }
                                                }
                                            }
                                            paymentsMethods.push({
                                                ...element,
                                                is_verified: accountNumberVerification,
                                                provider: accountNumberProvider,
                                                account_verified_desc: accountNumberAccountVerifiedDesc,
                                                payment_method: payment_method_id
                                            });
                                        }
                                    }
                                    const payee = await strapi.query("payee-names").create({ payee_type_id: payee_type.id, names: names, phone_number: phone, email: email, deduction_types: deduction_type, payment_methods: paymentsMethods });
                                    if (payee) {
                                        ctx.response.status = 200;
                                        response = Format.success("Payee successful created.", payee);
                                    } else {
                                        ctx.response.status = 400;
                                        response = Format.badRequest("Payee not created", []);
                                    }
                                } else {
                                    ctx.response.status = 400;
                                    response = Format.badRequest(`Payee with email ${email} exist`, []);
                                }
                            } else {
                                ctx.response.status = 400;
                                response = Format.badRequest(`Payee with phone number ${phone} exist`, []);
                            }
                        } else {
                            ctx.response.status = 400;
                            response = Format.badRequest("We can't allow more than one default payment", []);
                        }
                    } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("Please choose at least one default payment", []);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest("Payee type Restaurant not found", []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
            }

        } catch (error) {
            ctx.response.status = 500;
            console.log("error in addPayee", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async getListSuppliers(ctx) {
        let response;
        try {
            const suppliers = await strapi.query("payee-names").find({ _sort: 'isActive:desc' });
            if (suppliers) {
                const knex = strapi.connections.default;
                const sql_query = "SELECT * FROM projects__payee_names";
                const sql_raw_executed = await knex.raw(sql_query);
                const project_payees = sql_raw_executed[0];
                const projects = await strapi.query("projects").find();
                for (let x = 0; x < project_payees.length; x++) {
                    project_payees[x].name = projects.find((item) => parseInt(item.id) === parseInt(project_payees[x].project_id)).name
                }
                for (let i = 0; i < suppliers.length; i++) {
                    suppliers[i].projects = project_payees.filter(item => parseInt(item['payee-name_id']) === parseInt(suppliers[i].id));
                }

                for (let z = 0; z < suppliers.length; z++) {
                    for (let y = 0; y < suppliers[z].projects.length; y++) {
                        suppliers[z].projects[y].id = suppliers[z].projects[y].project_id;
                        delete suppliers[z].projects[y]["payee-name_id"];
                        delete suppliers[z].projects[y]["project_id"];
                    }
                }
                ctx.response.status = 200;
                response = Format.success("Client successful updated.", suppliers);
            } else {
                ctx.response.status = 400;
                response = Format.badRequest("No Supplier found.", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in getListSuppliers", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async getListSupplierByProject(ctx) {
        let response;
        try {
            const { project_id } = ctx.params;
            if (project_id) {
                const project = await strapi.query("projects").findOne({ id: project_id });
                if (project) {
                    const available_payees = await getSupplierProjects(project.id, false);
                    if (available_payees) {
                        ctx.response.status = 200;
                        response = Format.success("Supplier list", available_payees);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest("No project found", []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest("No project_id found", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in getListSupplier", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async addSupplierProject(ctx) {
        let response;
        try {
            const rules = {
                project_id: "required|integer",
                supplier_ids: "required|array"
            };
            const validation = new Validator(ctx.request.body, rules);
            const { project_id } = ctx.params;
            if (project_id) {
                if (validation.passes()) {
                    const project = await strapi.query("projects").findOne({ id: project_id });
                    if (project) {
                        const payees = await strapi.query("payee-names").find({ _limit: -1, isActive: true });
                        if (payees) {
                            let payee_relationships = [];
                            const { supplier_ids, project_id } = ctx.request.body;
                            const knex = strapi.connections.default;
                            const sql_query = `SELECT * FROM projects__payee_names WHERE project_id='${project_id}'`;
                            const sql_raw_executed = await knex.raw(sql_query);
                            const project_payees = sql_raw_executed[0];
                            for (let x = 0; x < supplier_ids.length; x++) {
                                const find_if_payee_is_valid = payees.find(item => item.id === parseInt(supplier_ids[x]));
                                const find_if_payee_relationship_exist = project_payees.find(z => parseInt(z['payee-name_id']) === parseInt(supplier_ids[x]));
                                if (find_if_payee_is_valid && !find_if_payee_relationship_exist) {
                                    payee_relationships.push({ "project_id": project_id, "payee-name_id": supplier_ids[x] });
                                }
                            }
                            if (payee_relationships.length >= 1) {
                                const insert_bean = await knex('projects__payee_names').insert(payee_relationships);
                                ctx.response.status = 200;
                                response = Format.success("Supplier inserted successful.", insert_bean);
                            } else {
                                ctx.response.status = 400;
                                response = Format.badRequest("None of the Supplier provided is actual valid.", supplier_ids);
                            }
                        } else {
                            ctx.response.status = 400;
                            response = Format.badRequest("No Active Supplier found.", []);
                        }
                    } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("No project found.", []);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest("No project_id found.", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in addSupplierProject", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async removeSupplierProject(ctx) {
        let response;
        try {
            const rules = {
                project_id: "required|integer",
                supplier_id: "required|integer"
            };
            const validation = new Validator(ctx.request.body, rules);
            const { project_id } = ctx.params;
            if (project_id) {
                if (validation.passes()) {
                    const project = await strapi.query("projects").findOne({ id: project_id });
                    if (project) {
                        const { supplier_id, project_id } = ctx.request.body;
                        const knex = strapi.connections.default;
                        const delete_bean = await knex('projects__payee_names').del().where({ "project_id": project_id, "payee-name_id": supplier_id });
                        ctx.response.status = 200;
                        response = Format.success("Supplier disassociated successful.", delete_bean);
                    } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("No project found.", []);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest("No project_id found.", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in removeSupplierProject", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async updateSupplier(ctx) {
        let response;
        try {
            const rules = {
                status: "boolean",
                names: "string",
                phone_number: "string",
                payee_type_id: "integer",
                email: "string"
            };
            const validation = new Validator(ctx.request.body, rules);
            const { supplier_id } = ctx.params;
            if (supplier_id) {
                if (validation.passes()) {
                    const supplier = await strapi.query("payee-names").findOne({ id: supplier_id });
                    if (supplier) {
                        const { status, names, phone_number, payee_type_id, email, deduction_type } = ctx.request.body;
                        const body_update = {
                            isActive: status,
                            names: names,
                            phone_number: phone_number,
                            payee_type_id: payee_type_id,
                            email: email,
                            deduction_types: deduction_type
                        };

                        if (typeof status === 'undefined') {
                            delete body_update.isActive;
                        }
                        if (typeof names === 'undefined') {
                            delete body_update.names;
                        }
                        if (typeof phone_number === 'undefined') {
                            delete body_update.phone_number;
                        }
                        if (typeof payee_type_id === 'undefined') {
                            delete body_update.payee_type_id;
                        }
                        if (typeof email === 'undefined') {
                            delete body_update.email;
                        }
                        if (deduction_type === 'undefined') {
                            delete body_update.deduction_types;
                        }

                        const updated_supplier = await strapi.query("payee-names").update({ id: supplier.id }, body_update);
                        if (updated_supplier) {
                            ctx.response.status = 200;
                            response = Format.success("supplier successful updated.", updated_supplier);
                        } else {
                            ctx.response.status = 400;
                            response = Format.badRequest("supplier not updated.", []);
                        }
                    } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("No supplier found.", []);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest("No supplier_id found.", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in updateSupplier", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async deleteSupplier(ctx) {
        let response;
        try {
            const { supplier_id } = ctx.params;
            if (supplier_id) {
                const supplier = await strapi.query("payee-names").findOne({ id: supplier_id });
                if (supplier) {
                    const deleted_supplier = await strapi.query("payee-names").delete({ id: supplier_id });
                    if (deleted_supplier) {
                        ctx.response.status = 200;
                        response = Format.success("supplier deleted successful.", deleted_supplier);
                    } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("supplier not deleted.", []);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest("No supplier found.", []);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest("No supplier_id found.", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in deleteSupplier", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async momoSupplierVerification(ctx) {
        let response;
        try {
            const suppliers = await strapi.query("payee-names").find();
            if (suppliers) {
                console.log(`*************** We are going to search the payment method of ${suppliers.length} payees **************`);
                for (let index = 0; index < suppliers.length; index++) {
                    const mtn_default_payment = {
                        payment_method: 1,
                        is_active: true,
                        provider: "MTN"
                    };
                    mtn_default_payment.account_name = suppliers[index].names;
                    if (utils.phoneNumberValidation(suppliers[index].phone_number)) {
                        const momo_verification = await accountVerification("MTN", { account_number: suppliers[index].phone_number, account_name: { first_name: suppliers[index].names, last_name: "name_combined" }, account_belong_to: "MTN" }, true);
                        if (momo_verification.status) {
                            mtn_default_payment.account_name = momo_verification.data.verification_result_account_name;
                            mtn_default_payment.account_number = suppliers[index].phone_number;
                            mtn_default_payment.is_verified = momo_verification.data.verification_result_boolean;
                            mtn_default_payment.account_verified_desc = momo_verification.data.verification_result_desc;
                        }
                    } else {
                        mtn_default_payment.account_number = "";
                        mtn_default_payment.account_name = suppliers[index].names;
                        mtn_default_payment.is_verified = "nothing";
                        mtn_default_payment.account_verified_desc = "";
                    }
                    mtn_default_payment.worker_id = 0;
                    await strapi.query("payee-names").update({ id: suppliers[index].id }, { payment_methods: [mtn_default_payment] });
                    let count = index + 1;
                    console.log(`${count}. Updated supplier with id ${suppliers[index].id} after checking momo account holder`);
                }
                ctx.response.status = 200;
                response = Format.success("Client successful updated.", suppliers);
            } else {
                ctx.response.status = 400;
                response = Format.badRequest("No Supplier found.", []);
            }
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in momoSupplierVerification", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    }
};
