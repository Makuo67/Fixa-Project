'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async getAssignedWorkersKnex(){
        const knex = strapi.connections.default;
        var workers =  await knex.raw('SELECT * FROM assigned_workers LEFT JOIN service_providers ON assigned_workers.worker_id = service_providers.id');
        return workers[0];
    },
    async getAssignedWorker(){
        
    }



};
 

