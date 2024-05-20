const _ = require('underscore');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async payrollAvailable(ctx) {
        let entities;
        if (ctx.query._q) {
            entities = await strapi.services.project.search(ctx.query);
        } else {
            const { project_id, year } = ctx.query;
            entities = await strapi.query("payroll").find({ year: year, project_id: project_id, _limit: -1 });
        }
        entities = _.filter(entities, function (i) { return parseInt(i.total_shifts) >= 1; });
        return entities;
    },
    async populateTotalWorkers() {
        const payrolls = await strapi.query("payroll").find({ payroll_status_ne: 'invalid', _limit: -1 });
        payrolls.map(async (item) => {
            const run_payrolls =  await strapi.query("payroll-details").find({ payroll_id: item.id, _limit: -1 });
            await strapi.query("payroll").update({id: item.id}, { total_workers: run_payrolls?.length || 0 });
        })
        return { status: "success" }
    }
};
