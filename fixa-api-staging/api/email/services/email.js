'use strict';

const mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });
/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
    send: async (to, from, subject, template, params) => {
        try {
            //const { from, to, subject, template, params } = req.body;
            const errors = [];
            if (!from) {
                errors.push('The from parameter is required');
            }

            if (!to) {
                errors.push('The to parameter is required');
            }

            if (!subject) {
                errors.push('The subject param is required');
            }

            if (!template) {
                errors.push('The action param is required');
            }

            if (errors.length !== 0) {
                res.status(400).send(errors);
            }
            var data = {
                from,
                to,
                subject,
                template
            };
            if (params.length !== 0) {
                for (var i = 0; i < params.length; i++) {
                    const templateVar = `v:${params[i].name}`;
                    data[templateVar] = params[i].value
                }
            }

            const emailSentResponse = await mailgun.messages().send(data);
            return;
        } catch (e) {
            console.log('Function error ' + e.message);
            return;
        }
    }

};