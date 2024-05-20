'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async sendEmailCustom(from, emails, subject, text, template) {
        const api_key = process.env.MAILGUN_API_KEY;
        const domain = process.env.MAILGUN_DOMAIN;
        const mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });

        let data = {
            from: from,
            to: emails,
            subject: subject,
            template: template,
            "v:text": text,
            "v:subject": subject,
        };

        if (!(
            data.from === "" ||
            data.to.length === 0 ||
            data.template === "" ||
            data.subject === "" ||
            text === ""
        )
        ) {
            mailgun.messages().send(data, function (error, body) {
                if (error) console.log("MailGun Error:", error.message);
            });
        }
    }
};
