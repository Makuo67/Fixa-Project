'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async getUserLevel(user_id) {
        const response = { status: false, message: '', data: {} };
        try {
            const userProfile = await strapi.query("user-admin-access").findOne({ user_id: user_id });
            if (userProfile) {
                const level = await strapi.query("users-levels").findOne({ id: userProfile.user_level_id });
                if (level) {
                    response.status = true;
                    response.data = {
                        access_level: userProfile,
                        client_info: userProfile.client,
                        user_level: level.name
                    }
                }
            } else {
                response.message = "User access level not found";
            }
        } catch (error) {
            console.log('error in getUserLevel', error.message);
            response.message = error.message;
        }
        return response;
    },
};
