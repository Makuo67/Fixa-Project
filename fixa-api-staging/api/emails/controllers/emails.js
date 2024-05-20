"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async sendMail(ctx) {
    var api_key = process.env.MAILGUN_API_KEY;
    var domain = process.env.MAILGUN_DOMAIN;
    var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });

    const { from, emails, subject, text, template } = ctx.request.body;

    var data = {
      from: from,
      to: emails,
      subject: subject,
      template: template,
      "v:text": text,
      "v:subject": subject,
    };

    const response = {
      status: "success",
      statusCode: 200,
      data: data,
      error: "",
      meta: "",
    };

    const apiInfo = {
      apiKey: process.env.AFRICA_S_TALKING_API_KEY,
      username: process.env.AFRICA_S_TALKING_USERNAME,
    };

    var today = new Date();
    var time = formatAMPM(today);

    function formatAMPM(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? "0" + minutes : minutes;
      var time = hours + ":" + minutes + " " + ampm;
      return time;
    }

    const message = {
      title: "Attendance report approved",
      date: "15/09/2022",
      shift: "Day",
      workers: "500",
      submitted_by: "Damascene",
      time: time,
    };

    const post = "client";

    let phonesList = await strapi
      .query("sms-recipients")
      .find({ Position: post, _limit: -1 });

    let recipients = phonesList.map(function (e) {
      if (e.Position == "client") {
        return e.Phone;
      } else {
        return "";
      }
    });

    const sender = [
      {
        phone_numbers: recipients,
        message: `${message.title}\n\nDate: ${message.date} \nShift: ${message.shift} \nWorkers: ${message.workers} \nBy: ${message.submitted_by}  At:  ${message.time}\n\n`,
      },
      {
        phone_numbers: ["+250727380161"],
        message: "Hello florien",
      },
    ];

    const senderID = "Fixa";
    let sm = await strapi.services.sms.sendSMS(sender, apiInfo, senderID);


    if (
      !(
        data.from === "" ||
        data.to.length === 0 ||
        data.template === "" ||
        data.subject === "" ||
        text === ""
      )
    ) {
      mailgun.messages().send(data, function (error, body) {
      });
      return response;
    } else {
      console.log("enter all the variables");
    }
  },
};
