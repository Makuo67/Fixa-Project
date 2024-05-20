"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

// Set your app credentials
const credentials = {
  apiKey: process.env.AFRICA_S_TALKING_API_KEY,
  username: process.env.AFRICA_S_TALKING_USERNAME,
};

// Initialize the SDK
const AfricasTalking = require("africastalking")(credentials);

const sms = AfricasTalking.SMS;

const sendMessage = (recipients_contacts, message, author) => {
  const options = {
    // Set the numbers you want to send to in international format
    to: recipients_contacts?recipients_contacts:process.env.AFRICA_S_TALKING_DEFAULT_PHONE,
    // Set your message
    message: message?message:process.env.AFRICA_S_TALKING_DEFAULT_MESSAGE,
    // Set your shortCode or senderId
    // from: "FIXA",
  };

  // That’s it, hit send and we’ll take care of the rest
  sms.send(options).then(console.log).catch(console.log);
};

//  sendMessage();

module.exports = {
  lifecycles: {
    async afterCreate(data) {
      /**
       * Check if user has selected workers or supervisors
       * If true get contacts of selected workers/supervisors
       * Send SMS to all those contacts
       * If no recipients have been selected do nothing 😑
       */
      let recipients_contacts = [];
      if (data.supervisors.length > 0 || data.workers.length > 0) {
        let new_text = data.chats.slice(-1).pop();
        let author = new_text.author?.username;
        let message = new_text.message;

        if (data.supervisors.length > 0) {
          data.supervisors.forEach((supervisor) => {
            recipients_contacts.push("+25".concat(supervisor.username));
            // console.log("====updated contacts array", recipients_contacts);
          });
          // sendMessage(recipients_contacts);
        }

        if (data.workers.length > 0) {
          data.workers.forEach((worker) => {
            recipients_contacts.push("+25".concat(worker.phone_number));
            // console.log("====updated contacts array", recipients_contacts);
          });
        }
        if (
          message !== null &&
          message !== "" &&
          typeof message !== "undefined"
        ) {
          sendMessage(recipients_contacts, message, author);
        }
        return;
      }
    },

    async afterUpdate(data) {
      /**
       * Check if user has selected workers or supervisors
       * If true get contacts of selected workers/supervisors
       * Send SMS to all those contacts
       * If no recipients have been selected do nothing 😑
       */
      let recipients_contacts = [];
      if (data.supervisors.length > 0 || data.workers.length > 0) {
        let new_text = data.chats.slice(-1).pop();
        let author = new_text.author?.username;
        let message = new_text.message;

        if (data.supervisors.length > 0) {
          data.supervisors.forEach((supervisor) => {
            recipients_contacts.push("+25".concat(supervisor.username));
            // console.log("====updated contacts array", recipients_contacts);
          });
          // sendMessage(recipients_contacts);
        }

        if (data.workers.length > 0) {
          data.workers.forEach((worker) => {
            recipients_contacts.push("+25".concat(worker.phone_number));
            // console.log("====updated contacts array", recipients_contacts);
          });
        }
        sendMessage(recipients_contacts, message, author);
        return;
      }
    },
  },
};
