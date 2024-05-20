'use strict';

const {getAggregates,getNewAttendanceClient} = require("../../attendance-page/controllers/attendance-page");
const {dashboardMetrics} = require("../../service-providers/controllers/service-providers");


module.exports = {
    lifecycles: {
        async afterCreate(result, data) {
            // console.log("recording attendance ======>");
            // getAggregates({custom:"build_aggregate_for_all_client"});
            // syncAttendanceToRedis();
            // getNewAttendanceClient({custom:"building-client-attendance"});

            // dashboardMetrics({custom:"build_aggregate_for_all_admin_dashboard"});
        }
      },
};

