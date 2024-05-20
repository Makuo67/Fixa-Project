'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async addTakeHome(ctx) {
        let data = ctx.request.body;
        let { payroll_details_id, assigned_worker_id, incremented_amount } = data;
        let response;
        // get payroll_details
        let payroll_details_worker = await strapi.query("payroll-details").findOne({ id: payroll_details_id, assigned_worker_id: assigned_worker_id });
        if (payroll_details_worker) {
            let { take_home, payroll_id } = payroll_details_worker;
            let last_increment = await strapi.query("take-home-increments").findOne({ payroll_details_id, assigned_worker_id });
            // insert in take-home-increments table
            if (last_increment) {
                data.initial_take_home = last_increment.initial_take_home; // we will take previous incremented_amount as initial_take_home if last_increment is not null
                await strapi.query("take-home-increments").create(data);
            } else {
                data.initial_take_home = take_home;
                await strapi.query("take-home-increments").create(data); // we will take take_home as initial_take_home if last_increment is null
            }
            // update payroll_details table
            await strapi.query("payroll-details").update({ id: payroll_details_id }, { take_home: parseInt(take_home) + parseInt(incremented_amount) });
            // find payroll table
            let payroll = await strapi.query("payroll").update({ id: payroll_id });
            if (payroll) {
                await strapi.query("payroll").update({ id: payroll_id }, { amount: parseInt(payroll.amount) + parseInt(incremented_amount) });
            }
            response = {
                status: "Successfull, Take home incremented ",
                statusCode: 200,
                data: null,
                error: "",
                meta: "",
            }
        } else {
            response = {
                status: "NOt, found ",
                statusCode: 404,
                data: null,
                error: "",
                meta: "",
            }
        }

        return response;

    }
};
