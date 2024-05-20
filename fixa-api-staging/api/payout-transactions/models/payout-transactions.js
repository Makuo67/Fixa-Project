'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        async afterCreate(result, data, funcName, payment_id) {
            switch (funcName) {
                case "saveCleanPayoutExcel":
                    await strapi.query("temp-payout-pament").delete({ payment_id: payment_id });
                    break;
                default:
                    return {
                        status: "failed",
                        statusCode: 400,
                        message: "Failed recording payees",
                    };
            }
            return {
                status: "success",
                statusCode: 201,
                message: "payees added!",
            };

        }
    }
};
