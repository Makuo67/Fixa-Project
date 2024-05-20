const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async getFile(ctx) {
    const response = {
      status: 'success',
      status_code: 200,
      data: [],
      errors: [],
      meta: []
    };
    try {
      const spreasheetData = ctx.request.body;
      if(!spreasheetData) {
        response.status = 'failure';
        response.status_code = 503;
        response.errors.push('apispreadsheets.com did call the webhook');
        return response;
      }

      const {
        file_id,
        access_key,
        secret_key,
        file_name
      } = spreasheetData;

      const excelCreated = await strapi.services.excel.create({
        feature: 'payroll-checking',
        file_id,
        access_key,
        secret_key,
        file_name
      });

      response.data = spreasheetData.data

    } catch(error) {
      response.status = 'failure';
      response.status_code = 500;
      response.errors.push('error message: ' + error);
    }

    return response;

  }
};
