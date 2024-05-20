'use strict';
const utils = require("../../../config/functions/utils");
const api_key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
const { sendSMSToWorker } = require("../../service-providers/services/service-providers");
const request = require('request');
// const temp_file = require("../../../tmp/mq.png");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        async afterCreate(result, data) {
            if (result.id) {
                const recipients = result.top_up_email_recipients.map((item) => {
                    return item.email;
                });
                var data = {
                    from: "info@fixarwanda.com",
                    to: recipients,
                    subject: "Top-up Fixa's Wallet",
                    template: "top_up_wallet_proof_of_payment",
                    "v:wallet_id": `${result.wallet_id}`,
                    "v:agent_name": ``,
                    "v:current_year": `${utils.getCurrentYear()}`,
                    attachment: request(result.balance_receipt_link)
                };
                mailgun.messages().send(data, function (error, body) {
                    if (!error) {
                        strapi.query('wallet-top-up-transactions').update({ id: result.id }, { status: "processing" });
                    }
                });
            }
        },
        async afterUpdate(result, data, passed, new_data) {
            if (new_data && new_data === "loading_balance") {
                const recent_wallet_top_up = await strapi.query('wallet-top-up-transactions').findOne({ _sort: "id:desc" });
                if (recent_wallet_top_up) {
                    const message = `Hello ${recent_wallet_top_up.submit_by}, Your wallet top up of RWF ${recent_wallet_top_up.top_up_balance} was successful`
                    await sendSMSToWorker([recent_wallet_top_up.wallet_top_up_notification_recipients], message);
                }
            }
        }
    },
};
