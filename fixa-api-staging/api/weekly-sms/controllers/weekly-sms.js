"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async sendSMS() {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
     /***
     * COMMENT FOR IMPROVEMENTS
     * @DAVID
     * Can you create a different function and add all the functionality in this function so you can call it in the background.
     */

      sendWeeklySMS();
    return response;
  },
};

const sendSMS = async (phone_numbers, message) => {
  const apiInfo = {
    apiKey: process.env.AFRICA_S_TALKING_API_KEY,
    username: process.env.AFRICA_S_TALKING_USERNAME,
  };

  const senderID = "Fixa";

  let recipients = "";


  const sender = [
    {
      phone_numbers: phone_numbers,
      message: message,
    },
  ];

  let sm = await strapi.services.sms.sendSMS(sender, apiInfo, senderID);
  return sm;
};

const sendWeeklySMS = async() => {
  let active_workers_ids = await strapi
  .query("new-assigned-workers")
  .find({ is_active: true });

const workers = [
  {
    worker_name: "David",
    worker_phone_number: "+250781636072",
    total_shifts: 4,
    total_deductions: 500,
    take_home: 7500,
  },
  {
    worker_name: "Florien",
    worker_phone_number: "+250786461106",
    total_shifts: 4,
    total_deductions: 500,
    take_home: 7500,
  },
  {
    worker_name : "Tafara",
    worker_phone_number: "+250791345258",
    total_shifts: 4,
    total_deductions: 500,
    take_home:7500
  },
  {
    worker_name : "Chris",
    worker_phone_number: "+250788439355",
    total_shifts: 4,
    total_deductions: 500,
    take_home:7500
  },
  {
    worker_name : "Jansen",
    worker_phone_number: "+250789468739",
    total_shifts: 4,
    total_deductions: 500,
    take_home:7500
  },
  {
    worker_name : "Stacy",
    worker_phone_number: "+250788594828",
    total_shifts: 4,
    total_deductions: 500,
    take_home:7500
  }
];


const worker_ids = active_workers_ids.map((id) => {
  return id.worker_id;
});

let recipients = [];
for (let x = 0; x < worker_ids.length; x++) {
  for (let y = 0; y < workers.length; y++) {
    if (worker_ids[x] === workers[y].id) {
      recipients.push({
        name: workers[y].first_name,
        phone: workers[y].phone_number,
      });
    }
  }
}

//to use only for testing
const phone_numbers = workers.map((recepient) => {
  return recepient.worker_phone_number;
});


const message = await strapi.query("value-proposition").find({ _limit: 1 });
const message_sent = await sendSMS(phone_numbers, message[0].message);

if (message_sent === "Success")
  response.data.status = "message sent successfully";
}
