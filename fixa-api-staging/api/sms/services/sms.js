const AfricasTalking = require("africastalking");
const utils = require("../../../config/functions/utils");
module.exports = {

  async sendSMS(senders, apiInfo, senderID) {
    let response = {};
    let failed_messages = [];
    let success_messages = [];
    try {
      const africastalking = AfricasTalking({
        apiKey: apiInfo.apiKey,
        username: apiInfo.username,
      });
      for (let index = 0; index < senders.length; index++) {
        const element = senders[index];
        element.phone_numbers = element.phone_numbers.map((phone) => {
          phone = utils.phoneNumberValidationSMS(phone);
          return phone;
        });
        if (
          element?.phone_numbers?.length > 0 &&
          element?.message !== "" &&
          senderID !== ""
        ) {
          var result = await africastalking.SMS.send({
            to: element?.phone_numbers,
            message: element?.message,
            from: senderID,
          });

          const res = result.SMSMessageData;
          if (
            parseInt(res.Recipients[0]?.statusCode) === 101 &&
            res.Recipients[0].status === "Success"
          ) {
            await strapi.query("sms-logs").create({
              message: element?.message,
              receivers: element?.phone_numbers,
              senderID: senderID,
              status: res.Recipients[0].status,
              messageId: res.Recipients[0].messageId,
              statusCode: res.Recipients[0].statusCode,
              cost: res.Recipients[0].cost,
            });
            success_messages.push(...res.Recipients);
          } else {
            failed_messages.push(...res.Recipients);
          }
        }
      }
      response = { "success": success_messages, "failed": failed_messages };
    } catch (error) {
      console.log('sendSMS ', error);
    }

    return response;
  },
};