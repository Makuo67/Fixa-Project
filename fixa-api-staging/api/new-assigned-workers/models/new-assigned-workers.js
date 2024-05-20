'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const { buildWorkForce } = require("../../workforce/services/workforce");

module.exports = {


    lifecycles: {
        async afterCreate(result, data, funcName) {
            switch (funcName) {
                //update workforce on assign worker
                case "assignWorker":
                    let workforce_data = await strapi.query("workforce").findOne({ worker_id: result.worker_id });
                    if (workforce_data) {
                        let worker_rate_body = {};
                        let service_id = workforce_data.trade_id;
                        if (workforce_data.rate_type.toString() === 'negotiated') {
                            worker_rate_body = {
                                service_id: service_id,
                                assigned_worker_id: result.id,
                                value: workforce_data.daily_earnings,
                                rate_type: 'negotiated'
                            }
                        } else {
                            worker_rate_body = {
                                service_id: service_id,
                                assigned_worker_id: result.id,
                                value: workforce_data.daily_earnings,
                                rate_type: 'standard'
                            }
                        }
                        let rate = await strapi.query("rates").findOne({ service_id: worker_rate_body.service_id, project_id: data.project_id });
                        if (rate) {
                            if (typeof rate.maximum_rate != "number") {
                                worker_rate_body.value = 0; // Here we are setting the value to zero
                                await strapi.query("worker-rates").create(worker_rate_body);
                            } else if (parseInt(rate.maximum_rate) < parseInt(workforce_data.daily_earnings)) {//This is to put the maximu as rate if the rate of the person is beyond the actual one we have in the system
                                worker_rate_body.value = rate.maximum_rate;
                                await strapi.query("worker-rates").create(worker_rate_body);
                            } else {
                                await strapi.query("worker-rates").create(worker_rate_body); // Here all is good
                            }
                        } else {
                            await strapi.query("worker-rates").create(worker_rate_body);
                        }
                    }
                    else {
                        console.log(`The worker with assigned worker ID ${result.id} is not in workforce & worker_data`);
                    }
                    break;
                default:
                    return {
                        status: "failed",
                        statusCode: 400,
                        message: "Failed assign Worker",
                    };
            }
        },
        async afterUpdate(result, params, data, funcName) {
            switch (funcName) {
                case "assignWorker":
                    const workforce_data = await strapi.query("workforce").findOne({ worker_id: result.worker_id });
                    if (workforce_data) {
                        let worker_rate_body = {};
                        const service_id = workforce_data.trade_id;
                        if (workforce_data.rate_type.toString() === 'negotiated') {
                            worker_rate_body = {
                                service_id: service_id,
                                assigned_worker_id: result.id,
                                value: workforce_data.daily_earnings,
                                rate_type: 'negotiated'
                            }
                        } else {
                            worker_rate_body = {
                                service_id: service_id,
                                assigned_worker_id: result.id,
                                value: workforce_data.daily_earnings,
                                rate_type: 'standard'
                            }
                        }
                        const rate = await strapi.query("rates").findOne({ service_id: worker_rate_body.service_id, project_id: data.project_id });
                        if (rate) {
                            if (typeof rate.maximum_rate != "number") {
                                worker_rate_body.value = 0; // Here we are setting the value to zero
                                await strapi.query("worker-rates").create(worker_rate_body);
                            } else if (parseInt(rate.maximum_rate) < parseInt(workforce_data.daily_earnings)) {//This is to put the maximu as rate if the rate of the person is beyond the actual one we have in the system
                                worker_rate_body.value = rate.maximum_rate;
                                await strapi.query("worker-rates").create(worker_rate_body);
                            } else {
                                await strapi.query("worker-rates").create(worker_rate_body); // Here all is good
                            }
                        } else {
                            await strapi.query("worker-rates").create(worker_rate_body);
                        }
                    } else {
                        console.log(`The worker with assigned worker ID ${result.id} is not in workforce & worker_data`);
                    }
                    buildWorkForce([{ worker_id: result.worker_id, project_id: result.project_id }]);
                    break;
                default:
                    return {
                        status: "failed",
                        statusCode: 400,
                        message: "Failed update assign Worker",
                    };
            }
        },
    },
};
