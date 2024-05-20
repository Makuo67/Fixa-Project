'use strict';
var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
    async afterCreate(result) {
        let companies = await strapi.query("companies").find();
        if (companies.length > 0 && result.email) {
          if (companies[0].email && companies[0].email.length > 0) {
            const emailData = {
              from: `${companies[0].email}`,
              to: [`${result.email}`],
              subject: "Welcome Aboard",
              template: "client_created",
              "v:fixa_website": `https://fixarwanda.com`,
              "v:client_name": result.name ?? "To Fixa"
            };
            mailgun.messages().send(emailData);
          }
        }
    },
}
};
