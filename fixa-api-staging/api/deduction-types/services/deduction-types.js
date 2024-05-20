"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  // create a deduction type

  async createDeductionType(type_name, project_id) {
    const new_type = await strapi.query("deduction-types").create({ title: type_name, project_id: project_id, is_available: true });
    return new_type;
  },
};
