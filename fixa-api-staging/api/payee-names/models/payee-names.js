'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        async afterCreate(result, data, project_id, others) {
            // if (parseInt(project_id)) {
            //     const knex = strapi.connections.default;
            //     const add_payee_relationship = [{ "project_id": project_id, "payee-name_id": result.id }];
            //     await knex('projects__payee_names').insert(add_payee_relationship);
            // }
        },
    }
};
