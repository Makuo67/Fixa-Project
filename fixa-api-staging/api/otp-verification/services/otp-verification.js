"use strict";
const {
  sendSMSToWorker,
} = require("../../service-providers/services/service-providers");

const { sendSMS } = require("../../sms/services/sms")
const { getCompanyStatus } = require("../../companies/services/companies")

const apiInfo = {
  apiKey: process.env.AFRICA_S_TALKING_API_KEY,
  username: process.env.AFRICA_S_TALKING_USERNAME,
}

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async sendSmsCompasationToWorkers(payment, otp_id) {
    let response = {};
    let success = [];
    let failed = [];
    try {
      let worker_phones = [];
      let workers_payroll_tns = await strapi.query("payroll-transactions").find({ payment_id: payment.id, _limit: -1 });
      for (let index = 0; index < workers_payroll_tns.length; index++) {
        const element = workers_payroll_tns[index];
        worker_phones.push({
          phone_number: [element.phone_number],
          message: `${element.worker_name}. Iki gihembwe, mwakoreye ${element.total_earnings}, mukatwa ${element.total_deductions} ayo mwakira ${element.take_home}. Ku bindi bisobanuro mugane ibiro bya FIXA. Murakoze`,
        });
      }
      for (let index = 0; index < worker_phones.length; index++) {
        const senderID = "Fixa";
        let sender = [
          {
            phone_numbers: worker_phones[index].phone_number,
            message: worker_phones[index].message,
          },
        ];
        await sendSMS(sender, apiInfo, senderID);
        success = [];
        failed = [];
      }
    } catch (error) {
      console.log("errorrr", error);
    }
    response = { "success": success, "failed": failed };
    return response;
  },
  async authAdminLogin(email, password) {
    let response = {};
    try {
      const user = await strapi.admin.services.user.findOne({ email });
      if (user && user.isActive) {
        if (user.email) {
          const validatePassword = await strapi.admin.services.auth.validatePassword(password, user.password);
          if (!validatePassword) {
            response = {
              status_code: 400,
              error_message: "Invalid Password",
              data: {}
            };
          } else {
            response = {
              status_code: 200,
              error_message: "",
              data: user
            };
          }
        } else {
          response = {
            status_code: 400,
            error_message: "Please add Email to your account",
            data: {}
          };
        }
      } else {
        response = {
          status_code: 400,
          error_message: "User has no access",
          data: {}
        };
      }
    } catch (error) {
      response = {
        status_code: 400,
        error_message: error.message,
        data: {}
      };
    }
    return response;
  },
  async authAdminLoginToken(email) {
    let response = {};
    try {
      const user = await strapi.admin.services.user.findOne({ email });
      if (user && user.isActive) {
        const user_access = await strapi.query("user-admin-access").findOne({ user_id: user.id });
        const token = await strapi.admin.services.token.createJwtToken(user);
        let login_info = {};
        if (user_access) {
          login_info = { jwt: token, user: user, user_access: user_access.user_access[0], company_status: await getCompanyStatus() };
        } else {
          login_info = { jwt: token, user: user, user_access: {}, company_status: await getCompanyStatus() }
        }
        response = {
          status_code: 200,
          error_message: "",
          data: login_info
        };
      } else {
        response = {
          status_code: 400,
          error_message: "User has no access",
          data: {}
        };
      }
    } catch (error) {
      response = {
        status_code: 400,
        error_message: error.message,
        data: {}
      };
    }
    return response;
  }
};
