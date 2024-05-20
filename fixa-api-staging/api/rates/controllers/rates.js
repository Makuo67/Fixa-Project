'use strict';
let Validator = require("validatorjs");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async createManyRates(ctx) {
    let response;
    try {
      let request_body = ctx.request.body;
      let rules = {
        service_id: "required|integer",
        project_id: "required|integer",
        maximum_rate: "required|integer"
      }

      const validateArray = (data, rules) => {
        const errors = [];

        data.forEach((item, index) => {
          const validation = new Validator(item, rules);

          if (validation.fails()) {
            errors.push({ index, errors: validation.errors.all() });
          }
        });

        return errors.length === 0 ? 'All objects are valid' : errors;
      };

      const validationResults = validateArray(request_body, rules);
      let rate_existing = [];
      if (typeof validationResults === 'string') {
        for (let index = 0; index < request_body.length; index++) {
          const item = request_body[index];
          let rate_exist = await strapi.query("rates").findOne({ project_id: item.project_id, service_id: item.service_id });
          if (rate_exist) {
            rate_existing.push({ item })
          }
        }
        if (rate_existing.length === 0) {
          for (let index = 0; index < request_body.length; index++) {
            const item = request_body[index];
            let rate_to_add_exist = await strapi.query("rates").findOne({ project_id: item.project_id, service_id: item.service_id });
            if (!rate_to_add_exist) {
              await strapi.query("rates").create({ ...item, status: true, "default_rate": 0, "advanced_rate": 0, "intermediate_rate": 0, "beginner_rate": "0" });
            }
          }
          ctx.response.status = 200;
          response = {
            status: "success",
            data: "",
            error: "Rates added successfully",
            meta: "",
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Services rates already added",
            meta: "",
          }
        }

      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validationResults,
          meta: "",
        };
      }

    } catch (error) {
      console.log(error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  }
};
