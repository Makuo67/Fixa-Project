'use strict';
const _ = require('underscore');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    // get quotation by service
     async getQuotationByService(service_id,project_id) {
        var quotations = await strapi.query("quotation").findOne({ project: project_id });
       var quotation =  _.find(quotations.service, s => s.service.id == service_id);

       return quotation;
    }
};
