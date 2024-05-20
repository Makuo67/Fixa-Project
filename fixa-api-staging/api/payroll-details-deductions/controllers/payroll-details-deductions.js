'use strict';
let Validator = require('validatorjs');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
     // create payroll details deduction or update
    async appCreate(ctx){
        let response;
        let rules = {
            'project_id': 'required|integer',
            'payroll_id': 'required|integer',
            'assigned_worker_id': 'required|integer',
        };

        

        let validation = new Validator(ctx.request.body, rules);
        let data = ctx.request.body;
        // console.log("deduction",data);
        if (validation.passes()) {
            for (let index = 0; index < data.deductions.length; index++){
                let payroll_details_worker = await strapi.query("payroll-details").findOne({ payroll_id: data.payroll_id, assigned_worker_id: data.assigned_worker_id });
                let payroll = await strapi.query("payroll").findOne({ id: data.payroll_id });
                // create if,
                if(data.deductions[index].payroll_details_deductions_id == 0){
                    let payroll_deducted_amount = payroll.deducted_amount + data.deductions[index].amount;
                    let payroll_amount = payroll.amount - data.deductions[index].amount;
                    let payroll_detail_deductionn = parseInt(payroll_details_worker.total_deductions) + parseInt(data.deductions[index].amount)
                    let payroll_details_worker_body = {
                        total_deductions: payroll_detail_deductionn,
                        take_home: payroll_details_worker.take_home - data.deductions[index].amount
                    };
                    let payroll_details_deductions_body = {
                        assigned_worker_id: data.assigned_worker_id,
                        payroll_id: data.payroll_id,
                        deduction_amount: data.deductions[index].amount,
                        project_id: data.project_id,
                        deduction_type_id: data.deductions[index].type_id
                    };
                    let payroll_body = {
                        amount: payroll_amount,
                        deducted_amount: payroll_deducted_amount
                    };
                    let id = payroll_details_worker.id;
                    // create deductions
                    await strapi.query("payroll-details-deductions").create(payroll_details_deductions_body);
                    // update deduction in payroll_details worker
                    await strapi.query("payroll-details").update({ id }, payroll_details_worker_body);
                    // update payroll
                    await strapi.query("payroll").update({ id: payroll.id }, payroll_body);
                }
                // update
                else{
                    let deduction_worker = await strapi.query("payroll-details-deductions").findOne({ id: data.deductions[index].payroll_details_deductions_id });
                    let payroll_details_worker = await strapi.query("payroll-details").findOne({ payroll_id: data.payroll_id, assigned_worker_id: data.assigned_worker_id });
                    let payroll = await strapi.query("payroll").findOne({ id: data.payroll_id });
                    if (payroll_details_worker && deduction_worker) {
                        let old_deduction_amount = deduction_worker.deduction_amount;
                        let payroll_details_deduction_amount = (payroll_details_worker.total_deductions - old_deduction_amount) + data.deductions[index].amount;
                        let payroll_details_take_home = (payroll_details_worker.take_home + old_deduction_amount) - data.deductions[index].amount;
                        let payroll_deducted_amount = (parseInt(payroll.deducted_amount) - parseInt(old_deduction_amount)) + parseInt(data.deductions[index].amount);
                        let payroll_amount = (parseInt(payroll.amount) + parseInt(old_deduction_amount)) - parseInt(data.deductions[index].amount);
                        // create deductions
                        await strapi.query("payroll-details-deductions").update({ id: data.deductions[index].payroll_details_deductions_id }, { deduction_amount: data.deductions[index].amount,deduction_type_id:data.deductions[index].type_id });
                        // update deduction in payroll_details worker
                        await strapi.query("payroll-details").update({ id: payroll_details_worker.id }, { total_deductions: payroll_details_deduction_amount, take_home: payroll_details_take_home });
                        // update payroll
                        await strapi.query("payroll").update({ id: payroll.id }, { amount: payroll_amount, deducted_amount: payroll_deducted_amount });
                    }
                }
            }
            response = {
                status: "successfully, completed",
                data: "",
                error: "",
                meta: "",
            };
        }else{
            response = {
                status: "failed",
                data: validation.data,
                error: validation.failedRules,
                meta: validation.rules,
            };
        }
        return response;
    }
};
