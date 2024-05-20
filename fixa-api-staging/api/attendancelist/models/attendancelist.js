'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */


const { buildWorker } = require("../../workforce/services/workforce");

module.exports = {
    lifecycles: {
        async afterCreate(result, data, funcName) {
            switch (funcName) {
                case "createUpdateAttendanceList":
                    let worker_status = await strapi.query("new-assigned-workers").update({ worker_id: result.worker_id, project_id: result.project_id }, { is_active: true }).catch((err) => { console.log(err.message); });
                    if (worker_status) {
                        // await buildWorker(result.worker_id, result.project_id);
                    }
                    break;
                default:
                    return {
                        status: "failed",
                        statusCode: 400,
                        message: "Failed recording attendanceList"
                    }
            }

        },
    },
};
