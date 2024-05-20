"use strict";
const axios = require("axios");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterUpdate(data) {
      // console.log("after update data", data);
      /**
       * Check if project has been created and send email
       * to admins.
       * Check if project has been created and send email
       * to user.~
       */

      if (data.status == "approved_by_client") {
        // console.log("quotation has been approved", data);
        // try {
        //   /**
        //    * Find admin users with the editor role
        //    * Get their emails
        //    * Send notification emails to them
        //    */
        //   data.jobs.forEach(async(job) => {
        //     const response = await axios({
        //       method: "PUT",
        //       headers: {
        //         "Content-Type": "application/json;charset=UTF-8",
        //         Accept: "application/json, text/plain, */*",
        //       },
        //       url: `${process.env.API_URL}/jobs/${job?.id}`,
        //       data: {
        //         status: "ongoing",
        //       },
        //     });
        //     console.log("Jobs has been updated", response);
        //   });
        // } catch (err) {
        //   console.log("error", err);
        // }
      }
    },
  },
};
