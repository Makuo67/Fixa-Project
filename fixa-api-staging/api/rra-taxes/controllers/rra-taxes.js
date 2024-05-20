'use strict';
let Validator = require("validatorjs");
const { getWorkerNetAmount } = require("../../payments/services/payments");
const Format = require('response-format');
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async reGenerate(ctx) {
        let response;
        try {
            let rules = {
                declared_month: "required|string",
                project_id: "required|string"
            };
            let validation = new Validator(ctx.request.body, rules);
            const { declared_month, project_id } = ctx.request.body;
            if (validation.passes()) {
                let rra_taxe = await strapi.query("rra-taxes").findOne({ declared_month: declared_month, project_id: project_id });
                let taxes_response = { message: "", rra_taxe: {}, excel_data: [] };
                if (rra_taxe && rra_taxe.id) {
                    let delete_transactions = await strapi.query("new-taxes-transactions").delete({ rra_taxes_id: rra_taxe.id });
                    if (delete_transactions) {
                        let excel_reGenerated = await getWorkerNetAmount(declared_month, project_id, ctx.state.user.id, rra_taxe.id);
                        taxes_response.rra_taxe = excel_reGenerated.rra_taxe;
                        taxes_response.excel_data = utils.transformExcelColumn(excel_reGenerated.excel_data);
                        taxes_response.message = excel_reGenerated.message;
                    }
                    response = Format.success("Taxes generated successufuly", taxes_response);
                } else {
                    response = Format.badRequest('Month not found', []);
                }

            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
            }
        } catch (error) {
            console.log("Error generate taxes ", error.message);
            ctx.response.status = 500;
            response = Format.internalError(error.message, []);
        }
        return response;
    },
    async generateTaxes(ctx) {
        let response;
        try {
            let rules = {
                declared_month: "required|string",
                project_id: "required|string"
            };
            let validation = new Validator(ctx.request.body, rules);
            const { declared_month, project_id } = ctx.request.body;
            if (validation.passes()) {
                const isTaxedAllowed = utils.canYouDoDeclaration(declared_month);
                if (isTaxedAllowed.status) {
                    const taxes_response = {
                        message: "",
                        progress: "",
                        taxes: [
                            { taxe_type: "permanent", is_data_available: false, rra_taxe: { total_worker: 0, total_gross: 0 }, excel_data: [] },
                            { taxe_type: "casual", is_data_available: false, rra_taxe: { total_worker: 0, total_gross: 0 }, excel_data: [] }
                        ]
                    };
                    const taxes_dates = utils.getStartEndDateTaxes(declared_month);
                    const getPaymentType = await strapi.query("payment-types").findOne({ type_name: "payroll" });
                    if (getPaymentType) {
                        const count_payments = await strapi.query("payments").count({ start_date_gte: taxes_dates.start_date, end_date_lte: taxes_dates.end_date, payment_types_id: getPaymentType.id, project_id: project_id, _limit: -1 });
                        if (count_payments >= 1) {
                            let message_taxes = "";
                            const allowed_taxes = await whichTaxesAllowed(project_id);
                            if (allowed_taxes.permanent && allowed_taxes.casual) { // permanent and casual are active
                                taxes_response.taxes[0].is_data_available = true;
                                taxes_response.taxes[1].is_data_available = true;
                                const rra_taxes = await strapi.query("rra-taxes").find({ declared_month: declared_month, project_id: project_id, _sort: "created_at:desc" });
                                if (rra_taxes && rra_taxes.length >= 2) {
                                    if (rra_taxes[0].status === "pending" || rra_taxes[1].status === "pending") { // Here the taxes are still being calculated
                                        taxes_response.progress = "pending";
                                        message_taxes = 'Your taxes are currently being calculated. Your data will be available shortly.';
                                    } else if (rra_taxes[0].status === "started" || rra_taxes[1].status === "started") { // Here the taxes are just created
                                        taxes_response.progress = "started";
                                        message_taxes = 'Your taxes are currently being calculated. Your data will be available shortly.';
                                    } else if (rra_taxes[0].status === "finished" || rra_taxes[1].status === "finished") { // Here the taxes are available
                                        const permanent = rra_taxes.find((item) => item.worker_type === "permanent");
                                        const casual = rra_taxes.find((item) => item.worker_type === "casual");
                                        if (permanent && casual) {
                                            const taxe_transaction_permanents = await strapi.query("new-taxes-transactions").find({ rra_taxes_id: permanent.id, _limit: -1 });
                                            const taxe_transaction_casuals = await strapi.query("new-taxes-transactions").find({ rra_taxes_id: casual.id, _limit: -1 });
                                            taxes_response.progress = "finished";
                                            if (taxe_transaction_permanents.length >= 1 || taxe_transaction_casuals.length >= 1) {
                                                taxes_response.taxes[0].rra_taxe = { total_worker: permanent.total_worker, total_gross: permanent.total_gross };
                                                taxes_response.taxes[0].excel_data = utils.transformExcelColumn(taxe_transaction_permanents, "permanent");
                                                taxes_response.taxes[1].rra_taxe = { total_worker: casual.total_worker, total_gross: casual.total_gross };
                                                taxes_response.taxes[1].excel_data = utils.transformExcelColumn(taxe_transaction_casuals, "casual");
                                                message_taxes = 'Your tax information is now available for download.';
                                            } else {
                                                message_taxes = 'Tax annexure not generated';
                                            }
                                        } else {
                                            message_taxes = 'Tax annexure not generated';
                                        }
                                    }
                                } else {
                                    const rra_generate_permanent = await strapi.query("rra-taxes").create({ status: 'started', declared_month: declared_month, project_id: project_id, worker_type: "permanent" });
                                    const rra_generate_casual = await strapi.query("rra-taxes").create({ status: 'started', declared_month: declared_month, project_id: project_id, worker_type: "casual" });
                                    if (rra_generate_permanent && rra_generate_casual) {
                                        taxes_response.progress = "started";
                                        message_taxes = "We have begun the process of generating your taxes. Please note that it may take some time. You are welcome to return later to check if the process has been completed.";
                                        getWorkerNetAmount(declared_month, project_id, ctx.state.user.id, { permanent_id: rra_generate_permanent.id, casual_id: rra_generate_casual.id }, "permanent_casual");
                                    }
                                }
                                response = Format.success(message_taxes, taxes_response);
                            } else if (allowed_taxes.permanent && !allowed_taxes.casual) { // permanent is active
                                taxes_response.taxes[0].is_data_available = true;
                                const rra_taxe = await strapi.query("rra-taxes").findOne({ declared_month: declared_month, project_id: project_id, worker_type: "permanent", _sort: "created_at:desc" });
                                if (rra_taxe && rra_taxe.status === "pending") { // Here the taxes are still being calculated
                                    taxes_response.progress = "pending";
                                    message_taxes = 'Your taxes are currently being calculated. Your data will be available shortly.';
                                } else if (rra_taxe && rra_taxe.status === "finished") { // Here the taxes are available
                                    const taxe_transactions = await strapi.query("new-taxes-transactions").find({ rra_taxes_id: rra_taxe.id, _limit: -1 });
                                    taxes_response.progress = "finished";
                                    if (taxe_transactions.length >= 1) {
                                        taxes_response.taxes[0].rra_taxe = { total_worker: rra_taxe.total_worker, total_gross: rra_taxe.total_gross };
                                        taxes_response.taxes[0].excel_data = utils.transformExcelColumn(taxe_transactions, "permanent");
                                        message_taxes = 'Your tax information is now available for download.';
                                    } else {
                                        message_taxes = 'Tax annexure not generated';
                                    }
                                } else if (rra_taxe && rra_taxe.status === "started") { // Here the taxes are just created
                                    taxes_response.progress = "started";
                                    message_taxes = 'Your taxes are currently being calculated. Your data will be available shortly.';
                                } else { // we just initiate the taxes
                                    const rra_generate = await strapi.query("rra-taxes").create({ status: 'started', declared_month: declared_month, project_id: project_id, worker_type: "permanent" });
                                    if (rra_generate) {
                                        taxes_response.progress = "started";
                                        message_taxes = "We have begun the process of generating your taxes. Please note that it may take some time. You are welcome to return later to check if the process has been completed.";
                                        getWorkerNetAmount(declared_month, project_id, ctx.state.user.id, rra_generate.id, "permanent");
                                    }
                                }
                                response = Format.success(message_taxes, taxes_response);
                            } else if (!allowed_taxes.permanent && allowed_taxes.casual) { // casual is active
                                taxes_response.taxes[1].is_data_available = true;
                                const rra_taxe = await strapi.query("rra-taxes").findOne({ declared_month: declared_month, project_id: project_id, worker_type: "casual", _sort: "created_at:desc" });
                                if (rra_taxe && rra_taxe.status === "pending") { // Here the taxes are still being calculated
                                    taxes_response.progress = "pending";
                                    message_taxes = 'Your taxes are currently being calculated. Your data will be available shortly.';
                                } else if (rra_taxe && rra_taxe.status === "finished") { // Here the taxes are available
                                    const taxe_transactions = await strapi.query("new-taxes-transactions").find({ rra_taxes_id: rra_taxe.id, _limit: -1 });
                                    taxes_response.progress = "finished";
                                    if (taxe_transactions.length >= 1) {
                                        taxes_response.taxes[1].rra_taxe = { total_worker: rra_taxe.total_worker, total_gross: rra_taxe.total_gross };
                                        taxes_response.taxes[1].excel_data = utils.transformExcelColumn(taxe_transactions, "casual");
                                        message_taxes = 'Your tax information is now available for download.';
                                    } else {
                                        message_taxes = 'Tax annexure not generated';
                                    }
                                } else if (rra_taxe && rra_taxe.status === "started") { // Here the taxes are just created
                                    taxes_response.progress = "started";
                                    message_taxes = 'Your taxes are currently being calculated. Your data will be available shortly.';
                                } else { // we just initiate the taxes
                                    const rra_generate = await strapi.query("rra-taxes").create({ status: 'started', declared_month: declared_month, project_id: project_id, worker_type: "casual" });
                                    if (rra_generate) {
                                        taxes_response.progress = "started";
                                        message_taxes = "We have begun the process of generating your taxes. Please note that it may take some time. You are welcome to return later to check if the process has been completed.";
                                        getWorkerNetAmount(declared_month, project_id, ctx.state.user.id, rra_generate.id, "casual");
                                    }
                                }
                                response = Format.success(message_taxes, taxes_response);
                            } else { // None is active
                                ctx.response.status = 400;
                                message_taxes = "This project does not currently have any active taxes of the 'Casual' or 'Permanent' types.";
                                response = Format.badRequest(message_taxes, [{ progress: "not-found" }]);
                            }
                        } else {
                            ctx.response.status = 400;
                            response = Format.badRequest("This project doesn't have payment within the range you selected", [{ progress: "not-found" }]);
                        }
                    } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("No payment-type found", [{ progress: "not-found" }]);
                    }
                } else {
                    ctx.response.status = 400;
                    response = Format.badRequest(isTaxedAllowed.message, [{ progress: "not-found" }]);
                }
            } else {
                ctx.response.status = 400;
                response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), [{ progress: "not-found" }]);
            }
        } catch (error) {
            console.log("Error generate taxes ", error.message);
            ctx.response.status = 500;
            response = Format.internalError(error.message, [{ progress: "not-found" }]);
        }
        return response;
    },
};

// Is casual allowed
async function whichTaxesAllowed(project_id) {
    let status = { permanent: false, casual: false };
    try {
        let project = await strapi.query('projects').findOne({ id: project_id });
        if (project) {
            if (project.taxes && project.taxes.casual && project.taxes.permanent) {
                status.permanent = true;
                status.casual = true;
            } else if (project.taxes && !project.taxes.casual && project.taxes.permanent) {
                status.permanent = true;
                status.casual = false;
            } else if (project.taxes && project.taxes.casual && !project.taxes.permanent) {
                status.permanent = false;
                status.casual = true;
            } else if (project.taxes && !project.taxes.casual && !project.taxes.permanent) {
                status.permanent = false;
                status.casual = false;
            } else {
                status.permanent = false;
                status.casual = false;
            }
        }
    } catch (error) {
        console.log('error in isCasualWorkerAllowed()', error.message);
        status.permanent = false;
        status.casual = false;
    }
    return status;
}

