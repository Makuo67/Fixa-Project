'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const _ = require("underscore");
const moment = require("moment");

const { sanitizeEntity } = require("strapi-utils");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();

module.exports = {
    async webStats(ctx) {
        let response;

        try {
            let fixaStats = {
                total_workers: 0,
                total_shifts: 0,
                total_payments: 0,
            }
            let project = -1;
            let year = -1;
            let month = -1;
            // data from redis
            const getcachedresults = await redisClient.get(`${process.env.COMPANY_TITLE.split(' ').join('_')}-admin-dashboard-aggregates-${project}-${year}-${month}-${moment(new Date()).format("YYYY-MM-DD")}`);
            if (getcachedresults) {
                const data = JSON.parse(getcachedresults);
                fixaStats.total_workers = data.data.total_workers;
                fixaStats.total_shifts = data.data.total_shifts;
            }
            // Fetching the closed payments only
            const payments = await strapi.services.payments.find({ status: "closed", _limit: -1 })
            const paymentsSanitized = sanitizeEntity(payments, { model: strapi.models.payments });

            paymentsSanitized.forEach(payment => {
                fixaStats.total_payments += parseFloat(payment.total_amount);
            });
            ctx.response.status = 200;
            response = {
                status_code: 200,
                error_message: {},
                data: fixaStats,
            };

        } catch (error) {
            console.log("error in web stats", error.message);
            ctx.response.status = 400;
            response = {
                status_code: 400,
                error_message: 'Error in web stats',
                data: {},
            };
        }

        return response;
    },
};
