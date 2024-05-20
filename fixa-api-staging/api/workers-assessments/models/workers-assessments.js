"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(data) {
      let id = data.worker_id;
      // get worker from worker_table
      let worker = await strapi.query("service-providers").findOne({ id: id });
      if (worker) {
        // console.log("worker_found",data)
        let new_assessment_data = [];
        // let prev_assessment_data = worker.assessments;
        // new_assessment_data =[...prev_assessment_data,{"assessment_level":data.assessment_level,"worker_assessment_id":data.id,"assessment_level_rank":data.total_rate,"date":data.date}]
        new_assessment_data = [
          {
            assessment_level: data.assessment_level,
            worker_assessment_id: data.id,
            assessment_level_rank: data.total_rate,
            date: data.date,
          },
        ];
        await strapi
          .query("service-providers")
          .update({ id: id }, { assessments: new_assessment_data });
      }
    },
  },
};
