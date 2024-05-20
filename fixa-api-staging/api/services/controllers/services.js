'use strict';
const _ = require('underscore');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async ratesServices(ctx) {
        const { id, type } = ctx.params;
        let services = await strapi.query("services").find({ _limit: -1 });
        if (type === "rates") {
            services = _.map(services, (index) => { return { id: index.id, name: index.name } });
        } else {
            let rates = await strapi.query("rates").find({ project_id: id, _limit: -1 });
            services = _.map(rates, (index) => {
                return { id: index.service_id, name: _.find(services, (s) => { return parseInt(s.id) === parseInt(index.service_id); }) ? _.find(services, (s) => { return parseInt(s.id) === parseInt(index.service_id); }).name : "" }
            });
            services = _.filter(services, (s) => { return s.name != ""; });
        }
        return services;
    },
};
