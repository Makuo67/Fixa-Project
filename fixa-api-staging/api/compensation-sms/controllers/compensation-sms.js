"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
let moment = require("moment");

module.exports = {
  async sendSMS() {
    const response = {
      status_code: 200,
      status: "Messages sent sucessfully",
      data: [],
      errors: [],
      meta: [],
    };

    /***
     * COMMENT FOR IMPROVEMENTS
     * @DAVID
     * Can you create a different function and add all the functionality in this function so you can call it in the background.
     */
    sendCompensationSMS();
    return response;
  },
};

const getMonthInKinyarwanda = () => {
  var today = new Date();

  var month = new Array();
  month[0] = "Mutarama";
  month[1] = "Gashyantare";
  month[2] = "Werurwe";
  month[3] = "Mata";
  month[4] = "Gicurasi";
  month[5] = "Kamena";
  month[6] = "Nyakanga";
  month[7] = "Kanama";
  month[8] = "Nzeri";
  month[9] = "Ukwakwira";
  month[10] = "Ugushyingo";
  month[11] = "Ukuboza";

  var d = new Date();
  var x = 0;
  x = month[d.getMonth()];
  return x;
};

const getLastDay = () => {
  var today = new Date();

  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const day = lastDay.toString().slice(8, -52);

  return day;
};
const sendSMS = async (recepients) => {
  const apiInfo = {
    apiKey: process.env.AFRICA_S_TALKING_API_KEY,
    username: process.env.AFRICA_S_TALKING_USERNAME,
  };

  const senderID = "Fixa";

  let sm = strapi.services.sms.sendSMS(recepients, apiInfo, senderID);

  return sm;
};

const sendCompensationSMS = async () => {
  //for 10th Nov testing

  const recent_payroll = await strapi.services["payroll"].findOne({
    _sort: "updated_at:DESC",
  });

  let id = recent_payroll[0]?.id;

  var today = new Date();

  const d = new Date(today);
  let day = d.getDay();

  const lastDay = await getLastDay();

  const currentMonth = await getMonthInKinyarwanda();

  const workers = [
    {
      worker_name: "David",
      worker_phone_number: "0781636072",
      total_shifts: 4,
      total_deductions: 500,
      take_home: 7500,
    },
    {
      worker_name: "Florien",
      worker_phone_number: "0786461106",
      total_shifts: 4,
      total_deductions: 500,
      take_home: 7500,
    },
    {
      worker_name : "Tafara",
      worker_phone_number: "0791345258",
      total_shifts: 4,
      total_deductions: 500,
      take_home:7500
    },
    {
      worker_name : "Chris",
      worker_phone_number: "0788439355",
      total_shifts: 4,
      total_deductions: 500,
      take_home:7500
    },
    {
      worker_name : "Jansen",
      worker_phone_number: "0789468739",
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

  let recipients = [];
  for (let x = 0; x < workers.length; x++) {
    const worker_rate = 2000;
    if (day === 10) {
      recipients.push({
        phone_numbers: `+25${workers[x]?.worker_phone_number}`,
        message: `Muraho ${workers[x]?.worker_name}. Ubu butumwa woherejwe na FIXA ni ubukumenyesha ko amafaranga wakoreye \n kuva 1 ${currentMonth} - 15 ${currentMonth}; wakoze iminsi ${workers[x]?.total_shifts}, umushahara w' umunsi ukaba ari \n${worker_rate}. Amafaranga y'ibiryo n'ibikoresho mwakaswe angana na ${workers[x]?.total_deductions}.\n Muzoherezwa amafaranga ${workers[x]?.take_home} kuri 17 ${currentMonth}. \n Niba aya makuru atari yo, musabwe kugera ku biro bya FIXA nyuma y'amasaha y'akazi kugira ngo \n bihindurwe. Murakoze
        `,
      });
    } else {
      recipients.push({
        phone_numbers: `+25${workers[x]?.worker_phone_number}`,
        message: `Muraho ${workers[x]?.worker_name}. Ubu butumwa woherejwe na FIXA ni ubukumenyesha ko amafaranga wakoreye \n kuva 16 ${currentMonth} - ${lastDay} ${currentMonth} wakoze iminsi ${worker_rate}. Amafaranga y'ibiryo n'ibikoresho mwakaswe angana na ${workers[x]?.total_deductions}.\n Muzoherezwa amafaranga ${workers[x]?.take_home} kuri 2 ${currentMonth}. \n Niba aya makuru atari yo, musabwe kugera ku biro bya FIXA nyuma y'amasaha y'akazi kugira ngo \n bihindurwe. Murakoze
        `,
      });
    }
  }

  const message_sent = await sendSMS(recipients);


}
