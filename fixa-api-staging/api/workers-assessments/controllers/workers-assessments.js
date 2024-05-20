"use strict";
const { sanitizeEntity } = require("strapi-utils");
let Validator = require("validatorjs");
const _ = require("underscore");

module.exports = {
    /**
     * Create instant payout entry.
     *
     * @return {Object}
     */

    async customCreate(ctx) {
        const response = {
            status_code: 200,
            status: "success",
            message: "",
            data: [],
            errors: [],
            meta: [],
        };
        try {
            let rules = {
                worker_id: "required|integer",
                assessment_level: "required|integer",
                project_id: "required|integer",
                service_id: "required|integer",
                mean_score: "required|integer"
            };
            let validation = new Validator(ctx.request.body, rules);
            if (validation.passes()) {
                const { project_id, service_id, worker_id, mean_score } = ctx.request.body;
                let worker = await strapi.query("service-providers").findOne({ id: worker_id });
                let project_rate = await strapi.query("rates").findOne({ project_id, service_id });
                // let is_service_okay = _.find(worker.services, (s) => { return s.id === service_id; });
                let assigned_worker = await strapi.query("new-assigned-workers").findOne({ project_id, worker_id });
                if (worker) {
                    // if (is_service_okay) {
                    if (project_rate) {
                        if (assigned_worker) {
                            let worker_assessment = await strapi.query("workers-assessments").findOne({ service_id, worker_id });
                            if (!worker_assessment) {
                                await strapi.query("workers-assessments").create(ctx.request.body);
                                response.message = "Assessed successfuly created";
                            } else {
                                await strapi.query("workers-assessments").update({ id: worker_assessment.id }, ctx.request.body);
                                response.message = "Assessed successfuly updated";
                            }
                            // switch (true) {
                            //     case mean_score >= 0 && mean_score <= 50: // beginner
                            //         let worker_rate_beginner = await strapi.query("worker-rates").create({ service_id: service_id, assigned_worker_id: assigned_worker.id, value: project_rate.beginner_rate });
                            //         if (worker_rate_beginner) {
                            //             response.message = "Assessed successfuly created";
                            //         } else {
                            //             response.message = "failed because we can't create the worker rates";
                            //             response.status = "failed";
                            //         }
                            //         break;
                            //     case mean_score >= 51 && mean_score <= 79: // intermediate
                            //         let worker_rate_intermediate = await strapi.query("worker-rates").create({ service_id: service_id, assigned_worker_id: assigned_worker.id, value: project_rate.intermediate_rate });
                            //         if (worker_rate_intermediate) {
                            //             response.message = "Assessed successfuly created";
                            //         } else {
                            //             response.message = "failed because we can't create the worker rates";
                            //             response.status = "failed";
                            //         }
                            //         break;
                            //     case mean_score >= 80 && mean_score <= 100: //advanced
                            //         let worker_rate_advanced = await strapi.query("worker-rates").create({ service_id: service_id, assigned_worker_id: assigned_worker.id, value: project_rate.advanced_rate });
                            //         if (worker_rate_advanced) {
                            //             response.message = "Assessed successfuly created";
                            //         } else {
                            //             response.message = "failed because we can't create the worker rates";
                            //             response.status = "failed";
                            //         }
                            //         break;
                            //     default:
                            //         break;
                            // }
                        } else {
                            response.message = "This worker is not assigned to the project provided";
                            response.status = "failed";
                        }
                    } else {
                        response.message = "project doesn't have the rate provided";
                        response.status = "failed";
                    }
                    // } else {
                    //     response.message = "worker doesn't have the service provided";
                    //     response.status = "failed";
                    // }
                } else {
                    response.message = "worker not found";
                    response.status = "failed";
                }

            } else {
                response = {
                    status: "failed",
                    data: validation.data,
                    error: validation.failedRules,
                    meta: validation.rules,
                };
            }
        } catch (error) {
            console.log("Error happened in createPayout()", error);
            response.errors.push("Technical issue: Sorry we were not able to create this assessment.");
            ctx.response.status = 500;
            response.status_code = 500;
            response.status = "failure";
        }
        return response;
    },
};

