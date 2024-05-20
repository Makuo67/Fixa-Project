'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        async afterCreate(data) {
            await strapi.plugins['email'].services.email.send({
                to: data.to,
                from: 'willy@fixarwanda.com',
                subject: data.subject,
                text: data.subject,
                html: data.description,
            });
        }
    }
};
