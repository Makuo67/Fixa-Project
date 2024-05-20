'use strict';
const user_access = require("../../../config/ressources/user_levels.json");
const Format = require('response-format');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getLevelAccess(ctx){
        let response;
        try {
        let level_access = await strapi.query("users-levels").find({ _limit: -1 });
        let accesses = [];
        if (level_access) {
            for (let index = 0; index < level_access.length; index++) {
                const item = level_access[index];
                accesses.push({level:item,access : user_access[item.name]['pages'] ?? []});
            }
        }else {
            accesses.push({level:item,access :[]});
        }
        ctx.response.status = 200;
        response = Format.success(`successfully`, accesses);
        } catch (error) {
            console.log(error);
    ctx.response.status = 500;
      response = Format.internalError(error.message, []);
        }
        return response;
    }
};
