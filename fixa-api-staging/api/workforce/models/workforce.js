'use strict';

const { saveWorkerProfile } = require("../../worker-profile/services/worker-profile");
const { listWorkforce } = require("../../service-providers/controllers/service-providers");
const moment = require("moment");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        async afterCreate(result, data, funcName) {
            //this following function is there because we need to update redis data for workforce
            switch (funcName) {
                //Create workerprofile of a worker
                case "buildWorker":
                    // worker profile
                    let profile = {};
                    profile.project_id = result.project_id;
                    profile.worker_id = result.worker_id;
                    profile.created_at = moment(result.date_onboarded).format('YYYY-MM-DD');
                    // saveWorkerProfile(profile);
                    break;
                default:
                    return {
                        status: "failed",
                        statusCode: 400,
                        message: "Failed create Worker profile",
                    };
            }
        },
        async afterUpdate(result, params, data, funcName) {
            //this following function is there because we need to update redis data for workforce
            switch (funcName) {
                case "buildWorker":
                    let profile = {};
                    profile.project_id = result.project_id;
                    profile.worker_id = result.worker_id;
                    profile.created_at = moment(result.date_onboarded).format('YYYY-MM-DD');
                    // saveWorkerProfile(profile);
                    break;
                default:
                    return {
                        status: "failed",
                        statusCode: 400,
                        message: "Failed update Worker profile",
                    };
            }

        },
    },
};
