"use strict";
const { getWorkerApp, getWorkerWeb, sendSMSToWorker, unAssignWorker, assignWorker, nidNumberPreprocess, getWorkerInfoFromRssb, workerRegistration, saveBulkTemporaryWorkerRegistration, verifyBulkWorkers } = require("../services/service-providers");
const { calculateAdminDashboardAgreegate } = require("../../workforce/services/workforce");
const { parseMultipartData, logger } = require("strapi-utils");
const { faker } = require("@faker-js/faker");
const moment = require("moment");
const _ = require("underscore");
let Validator = require("validatorjs");
const axios = require("axios");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();
const utils = require("../../../config/functions/utils");
const { accountVerification } = require("../../payment-methods/services/payment-methods");
const { getUserLevel } = require("../../user-admin-access/services/user-admin-access");
const Format = require('response-format');
/**
 * Read the documenkremikAccountHolderValidationtation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async isPhoneNumberIsInMomo(ctx) {
    let response = {
      status: "failed",
      data: ""
    };
    try {
      const { phone } = ctx.params;
      let dataResponse = await checkPhoneNumberIsInMomo(phone);
      response = {
        status: "success",
        data: dataResponse
      };
    } catch (error) {
      console.log('error in isPhoneNumberIsInMomo()', error.message);
    }
    return response;
  },

  async updateSingleWorkerRegistration(ctx) {
    let response;
    let errors = [];
    let error_status = false;
    let isForeigner = false;
    const { id } = ctx.params;
    try {
      const request_body = ctx.request.body;
      let personal_contacts = {};
      let gender = "";
      let emergency_contacts = [];
      let payment_methods = [];
      let workerAssigned = {};
      const worker = await strapi.query("service-providers").findOne({ id: id });
      if (worker) {
        isForeigner = (worker.country && worker.country.country_name.toLowerCase() != 'rwanda') ? true : false
        if (request_body.personal_contacts) {
          if (request_body.personal_contacts.phone_number) {
            let phone_number_exist = false;
            const phoneValid = utils.phoneNumberValidation(request_body.personal_contacts.phone_number);
            const workerPhoneNumberExist = await strapi.query("service-providers").find({ phone_number: request_body.personal_contacts.phone_number });
            for (let index = 0; index < workerPhoneNumberExist.length; index++) {
              const item = workerPhoneNumberExist[index];
              if (item.id.toString() != id.toString()) {
                phone_number_exist = true
              }
            }
            if (phone_number_exist) {
              error_status = true;
              errors.push("Phone number exist");
            }
            if (request_body.personal_contacts.email && request_body.personal_contacts.email.length > 0) {
              let email_exist = false;
              const workerEmailExist = await strapi.query("service-providers").find({ email: request_body.personal_contacts.email });
              for (let index = 0; index < workerEmailExist.length; index++) {
                const item = workerEmailExist[index];
                if (item.id.toString() != id.toString()) {
                  email_exist = true
                }
              }
              if (email_exist) {
                error_status = true;
                errors.push("Email exist");
              }
            }
            if (phoneValid === false) {
              error_status = true;
              errors.push("phone is not valid");
            }
            personal_contacts.phone_number = request_body.personal_contacts.phone_number;
          }
          if (request_body.personal_contacts.email) {
            const emailValid = utils.validateEmail(request_body.personal_contacts.email);
            if (emailValid) {
              personal_contacts.email = request_body.personal_contacts.email;
            } else {
              error_status = true;
              errors.push("email is not valid");
            }

          }
          if (request_body.personal_contacts.district_id) {
            const district = await strapi.query("district").findOne({ id: request_body.personal_contacts.district_id });
            if (district) {
              personal_contacts.district_residence = district.id;
              personal_contacts.district = district.name;
            } else {
              error_status = true;
              errors.push("distrct is not found");
            }
          }

        }
        if (request_body.gender && request_body.gender.toString().length > 0) {
          if (request_body.gender.toString().toLowerCase() != 'male' && request_body.gender.toString().toLowerCase() != 'female') {
            error_status = true;
            errors.push(`Gender must be male or female`);
          } else {
            gender = request_body.gender;
          }
        }
        if (request_body.emergency_contacts && request_body.emergency_contacts.length > 0) {
          for (let index = 0; index < request_body.emergency_contacts.length; index++) {
            const element = request_body.emergency_contacts[index];
            element.worker_id = id;
            if (element.phone_number) {
              const phoneValid = utils.phoneNumberValidation(element.phone_number);
              if (phoneValid === false) {
                error_status = true;
                errors.push("next of kin phone_number is not valid");
              }
            } else {
              error_status = true;
              errors.push("next of kin phone_number is not valid");
            }
            if (element.relation) {
              let next_of_kin_relation = await strapi.query('next-of-kin-relations').findOne({ id: element.relation });
              if (!next_of_kin_relation) {
                error_status = true;
                errors.push("next of kin relation is not valid");
              }
            } else {
              error_status = true;
              errors.push("next of kin relation is not valid");
            }
            emergency_contacts.push(element);
          }
        }
        if (request_body.trades_services) {
          workerAssigned = await strapi.query("new-assigned-workers").findOne({ worker_id: id, project_id: 0 });
          if (workerAssigned) {
            const element = request_body.trades_services;
            let service = await strapi.query('services').findOne({ id: element.service_id });
            if (!service) {
              error_status = true;
              errors.push(`service with id ${element.service_id} not found`);
            }

            if (!element.hasOwnProperty('daily_rate') || utils.isNumeric(element.daily_rate) === false) {
              error_status = true;
              errors.push(`Daily rate is not valid `);
            }
          } else {
            error_status = true;
            errors.push(`Worker Assignment not found `);
          }
        }

        if (request_body.payment_methods && request_body.payment_methods.length > 0) {
          let number_of_default_payment_method = 0;
          for (let index = 0; index < request_body.payment_methods.length; index++) {
            const element = request_body.payment_methods[index];
            if (element.is_active) {
              number_of_default_payment_method = number_of_default_payment_method + 1;
            }
            let payment_method = await strapi.query('payment-methods').findOne({ id: element.payment_method_id });
            if (!payment_method) {
              error_status = true;
              errors.push(`payment_method with id ${element.payment_method_id} not found`);
            }
            if (!element.hasOwnProperty('account_number') || !element.account_number) {
              error_status = true;
              errors.push(`Account number is required`);
            }
            if (!element.hasOwnProperty('account_name')) {
              error_status = true;
              errors.push(`Account name is required `);
            }
            payment_methods.push(element);
          }
          if (number_of_default_payment_method === 0) {
            error_status = true;
            errors.push(`Please choose at least one default payment`);
          }

          if (number_of_default_payment_method >= 2) {
            error_status = true;
            errors.push(`We can't allow more than one default payment`);
          }

        }

        if (error_status === false) {
          if (Object.keys(personal_contacts).length != 0) {
            let is_rwandan = false;
            if (utils.nidValidation(worker.nid_number)) {
              is_rwandan = (worker.is_rssb_verified === "green") ? true : false;
            }
            const momo_verification = await accountVerification("MTN", { account_number: personal_contacts.phone_number, account_name: { first_name: worker.first_name, last_name: worker.last_name }, account_belong_to: "MTN" }, is_rwandan);
            if (momo_verification.status) {
              personal_contacts.is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
              personal_contacts.is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
            }
            await strapi.query("service-providers").update({ id: id }, { ...personal_contacts });
          }
          if (emergency_contacts.length != 0) {
            await strapi.query("service-providers").update({ id: id }, { next_of_kin: emergency_contacts });
          }
          if (gender.toString().toLowerCase() === 'male' || gender.toString().toLowerCase() === 'female') {
            await strapi.query("service-providers").update({ id: id }, { gender: gender.toString().toLowerCase() })
          }

          if (payment_methods.length != 0) {
            let paymentsMethods = [];
            for (let index = 0; index < payment_methods.length; index++) {
              const element = payment_methods[index];
              let accountNumberVerification = 'nothing';
              let accountNumberProvider = '';
              let accountNumberAccountVerifiedDesc = '';
              let accountNameAccount = '';
              let payment_method_id = element.payment_method_id;
              const payment_method = await strapi.query("payment-methods").findOne({ id: element.payment_method_id });
              if (payment_method) {
                const already_verified_account = worker.payment_methods.find(item => item.account_number === element.account_number && item.is_verified === "green");
                if (!already_verified_account) {
                  if (payment_method.code_name === "mtn" && (element.account_number.startsWith('078') || element.account_number.startsWith('079'))) { // check for MTN
                    accountNumberProvider = 'MTN';
                    let is_rwandan = false;
                    if (utils.nidValidation(worker.nid_number)) {
                      is_rwandan = (worker.is_rssb_verified === "green") ? true : false;
                    }
                    const momo_verification = await accountVerification("MTN", { account_number: element.account_number, account_name: { first_name: worker.first_name, last_name: worker.last_name }, account_belong_to: "MTN" }, is_rwandan);
                    if (momo_verification.status) {
                      accountNumberVerification = momo_verification.data.verification_result_boolean;
                      accountNumberAccountVerifiedDesc = momo_verification.data.verification_result_desc;
                      accountNameAccount = momo_verification.data.verification_result_account_name;
                    }
                  } else if (payment_method.code_name === "airtel" && element.account_number.startsWith('073') || element.account_number.startsWith('072')) {  // check for airtel
                    accountNumberProvider = 'AIRTEL';
                  } else { // any number here is taken as bank account
                    if (element.payment_method_adjacent_id) {
                      const kremit_verification = await accountVerification("kremit", { account_number: element.account_number, account_name: { first_name: element.account_name, last_name: "name_combined" }, account_belong_to: element.payment_method_adjacent_id }, true);
                      if (kremit_verification.status) {
                        accountNumberVerification = kremit_verification.data.verification_result_boolean;
                        accountNumberAccountVerifiedDesc = kremit_verification.data.verification_result_desc;
                        accountNumberProvider = kremit_verification.data.verification_result_holder;
                        accountNameAccount = kremit_verification.data.verification_result_account_name;
                      }
                    }
                  }
                } else {
                  const already_in_account = worker.payment_methods.find(item => item.account_number === element.account_number);
                  accountNumberProvider = already_in_account.provider;
                  accountNumberVerification = already_in_account.is_verified;
                  accountNumberAccountVerifiedDesc = already_in_account.account_verified_desc;
                  accountNameAccount = already_in_account.account_name;
                }
              }
              paymentsMethods.push({
                ...element,
                is_verified: accountNumberVerification,
                provider: accountNumberProvider,
                account_verified_desc: accountNumberAccountVerifiedDesc,
                payment_method: payment_method_id,
                account_name: accountNameAccount,
                worker_id: id
              });

            }
            await strapi.query("service-providers").update({ id: id }, { payment_methods: paymentsMethods });
          }

          if (request_body.trades_services) {
            const entryWorkerRates = {
              assigned_worker_id: workerAssigned.id,
              service_id: request_body.trades_services.service_id,
              rate_type: request_body.trades_services.daily_rate ? "negotiated" : "standard",
              value: request_body.trades_services.daily_rate ? request_body.trades_services.daily_rate : 0,
            };
            await strapi.query("worker-rates").create(entryWorkerRates);
          }
          const workerUpdated = await strapi.query("service-providers").findOne({ id: id });

          ctx.response.status = 200;
          response = {
            status: "success",
            data: workerUpdated,
            error: "",
            meta: "",
          };

        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: {},
            error: errors,
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "worker not found",
          meta: "",
        };
      }

    } catch (error) {
      console.log('error updateSingleWorkerRegistration()', error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },

  async singleWorkerRegistration(ctx) {
    let response;
    let errors = [];
    let error_status = false;
    try {

      let rules = {
        first_name: "required|string",
        last_name: "required|string",
        nid_number: "required|string",
        date_of_birth: "required|string",
        gender: "required|string",
        country: "required|integer",
        worker_id: "required|integer"
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      let body_data = {};
      if (validation.passes()) {
        const getAge = moment().diff(request_body.date_of_birth, "years");
        const getNid = await strapi.query("service-providers").findOne({ nid_number: request_body.nid_number });
        const country = await strapi.query("countries").findOne({ id: request_body.country });
        if (parseInt(request_body.worker_id.toString()) === 0) {
          if (getNid) {
            error_status = true;
            errors.push("NID number already exists");
          }

          if (getAge < 18) {
            error_status = true;
            errors.push("must have atleast 18 years");
          }

          if (!country) {
            error_status = true;
            errors.push(`Country with id ${request_body.country} does not exist`);
          }
          if (error_status === false) {
            body_data.first_name = request_body.first_name;
            body_data.last_name = request_body.last_name;
            body_data.nid_number = request_body.nid_number;
            body_data.date_of_birth = request_body.date_of_birth;
            body_data.gender = request_body.gender;
            body_data.phone_numbers_masked = request_body.phone_numbers_masked ?? [];
            body_data.country = request_body.country;
            let response_data = await workerRegistration(body_data, "start");
            ctx.response.status = response_data.status === 'failed' ? 400 : 200;
            response = {
              status: response_data.status,
              data: response_data.data,
              error: response_data.message,
              message: "worker created successfully",
              meta: "",
            };
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: {},
              error: errors,
              meta: "",
            };
          }
        } else {
          let workerToUpdate = await strapi.query("service-providers").findOne({ id: request_body.worker_id });
          if (!workerToUpdate) {
            error_status = true;
            errors.push("worker not found");
          }
          if (getAge < 18) {
            error_status = true;
            errors.push("must have atleast 18 years");
          }
          if (!country) {
            error_status = true;
            errors.push(`Country with id ${request_body.country} does not exist`);
          }

          if (error_status === false) {
            if (country.country_name.toLowerCase() === 'rwanda') {
              await strapi.query("service-providers").update({ id: workerToUpdate.id }, { gender: request_body.gender });
            } else {
              await strapi.query("service-providers").update({ id: workerToUpdate.id }, { date_of_birth: request_body.date_of_birth, first_name: request_body.first_name, last_name: request_body.last_name, nid_number: request_body.nid_number, country: request_body.country, gender: request_body.gender });
            }
            let workerUpdated = await strapi.query("service-providers").findOne({ id: request_body.worker_id });
            ctx.response.status = 200;
            response = {
              status: 'success',
              data: workerUpdated,
              error: "",
              message: "worker created successfully",
              meta: "",
            };
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: {},
              error: errors,
              meta: "",
            };
          }
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validation.errors.errors,
          meta: "",
        };
      }
    } catch (error) {
      console.log('error singleWorkerRegistration()', error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },

  async workerRegistration(ctx) {
    let response = {
      status: "",
      data: {},
      error: [],
      meta: "",
    };;
    let errors = [];
    let error_status = false;
    try {
      let rules = {
        nid_number: "required|string",
        first_name: "required|string",
        last_name: "required|string",
        gender: "required|string",
        country: "required|integer",
        date_of_birth: "required|string",
        services: "required|integer",
        daily_rate: "required|string"
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        const getAge = moment().diff(request_body.date_of_birth, "years");
        if (request_body?.default_phone_number) {
          const getPhone = await strapi.query("service-providers").findOne({ phone_number: request_body.default_phone_number });
          const phoneValid = utils.phoneNumberValidation(request_body.default_phone_number);
          if (phoneValid === false) {
            error_status = true;
            errors.push("phone is not valid");
          }
          if (getPhone) {
            error_status = true;
            errors.push("phone number already exists");
          }
        }

        const getNid = await strapi.query("service-providers").findOne({ nid_number: request_body.nid_number });

        if (getNid) {
          error_status = true;
          errors.push("NID number already exists");
        }

        if (getAge < 18) {
          error_status = true;
          errors.push("must have atleast 18 years");
        }

        if (error_status === false) {
          let response_data = await workerRegistration(request_body, "registerWorker");
          ctx.response.status = response_data.status === 'failed' ? 400 : 200;
          response = {
            status: response_data.status,
            data: response_data.data,
            error: response_data.message,
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: {},
            error: errors,
            meta: "",
          };
        }
      } else {
        let message = [];
        if (validation.errors.errors) {
          for (const property in validation.errors.errors) {
            message.push(validation.errors.errors[property][0]);
          }
        }
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: message,
          meta: "",
        };
      }
    } catch (error) {
      console.log('error workerRegistration()', error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  /**
   * Retrieves worker information from the RSSB API by national ID number.
   * @param {Object} ctx - The Strapi context object
   *  @returns {Object} response - The API response
   */
  async nidRssbWorkerInformation(ctx) {
    let response;
    try {
      let rules = {
        nid_number: "required|string|min:16|max:16"
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        const getNid = await strapi.query("service-providers").findOne({ nid_number: request_body.nid_number });
        if (!getNid) {
          let response_data = await getWorkerInfoFromRssb(request_body.nid_number);
          ctx.response.status = response_data.status === 'failed' ? 400 : 200;
          response = {
            status: response_data.status,
            data: response_data.data,
            error: response_data.message,
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "A worker with this NID already exist in our DB",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validation.errors,
          meta: "",
        };
      }
    } catch (error) {
      console.log('error idRssbVerification()', error.message);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async rssbApiTesting(ctx) {
    let response;
    try {
      const { status, url, method, data, token, request_type } =
        ctx.request.body;
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      if (method.toString() === "POST" && request_type.toString() === "auth") {
        let response_url = await axios.post(url, data);
        ctx.response.status = 200;
        response = {
          status: "success",
          data: response_url.data,
          rssb_status: response_url.status,
          error: "",
          meta: "",
        };
      } else if (
        method.toString() === "GET" &&
        request_type.toString() === "get-phone-number"
      ) {
        let response_url = await axios.get(url, config);
        ctx.response.status = 200;
        response = {
          status: "success",
          data: response_url.data,
          rssb_status: response_url.status,
          error: "",
          meta: "",
        };
      } else if (
        method.toString() === "POST" &&
        request_type.toString() === "register-worker"
      ) {
        let response_url = await axios.post(url, data, config);
        ctx.response.status = 200;
        response = {
          status: "success",
          data: response_url.data,
          rssb_status: response_url.status,
          error: "",
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch rssbApiTesting() ======> ", error.message);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async generateExcel(ctx) {
    const data = [];
    const services = ["plumbing", "helper", "carpentry", "mason", "steelfixer"];
    const phoneVerification = [true, false];
    const districts = ["Nyarugenge", "Nyagatare"];
    for (var i = 0; i <= 1000; i++) {
      var serviceIndex = Math.floor(Math.random() * services.length);
      var districtIndex = Math.floor(Math.random() * districts.length);
      var phoneVerificationIndex = Math.floor(
        Math.random() * phoneVerification.length
      );
      data.push({
        gender: `${faker.name.sex().toUpperCase()}`,
        service: services[serviceIndex],
        district: districts[districtIndex],
        idNumber: faker.phone.number("19#############"),
        lastName: faker.name.lastName(),
        firstName: faker.name.firstName(),
        is_verified: phoneVerification[phoneVerificationIndex],
        phoneNumber: faker.phone.number("078#######"),
        date_of_birth: moment(
          faker.date.between("1962-01-01", "2000-01-01")
        ).format("YYYY-MM-DD"),
        daily_earnings: faker.datatype.number({ min: 2000, max: 8000 }),
      });
    }
    return data;
  },
  async dashboardMetrics(ctx) {
    try {
      const response = {
        status_code: 200,
        status: "failed",
        data: {
          total_workers: 0,
          total_shifts: 0,
          total_day_shifts: 0,
          total_night_shifts: 0,
          active_workers: 0,
          active_male_workers: 0,
          active_female_workers: 0,
          total_project: 0,
          total_active_project: 0,
          total_inactive_project: 0,
          graph_total_workers_by_services: {},
          graph_total_workers_by_projects: {},
          graph_shift: {},
        },
        errors: [],
        meta: [],
      };
      const rules = {
        project: "required",
        year: "required",
        month: "required",
        redis: "required"
      };
      const ttlInSeconds = process.env.REDIS_KEY_EXPIRATION;

      const validation = new Validator(ctx.request.body, rules);
      if (!validation.passes()) {
        response.status = "failed";
        response.errors.push(validation.failedRules);
        response.meta.push(validation.rules);
        return ctx.badRequest(response);
      } else {
        const { project, year, month } = ctx.request.body;
        const user_level = await getUserLevel(ctx.state.user.id);
        let client = "";
        if (user_level.status) {
          if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
            client = user_level.data.client_info.id
          } else if (user_level.data.user_level === "level_1") {
            client = "all";
          } else {
            client = -1;
          }
          const getcachedresults = await redisClient.get(`${process.env.COMPANY_TITLE.split(' ').join('_')}-admin-dashboard-aggregates-${project}-${year}-${month}-${client}-${moment(new Date()).format("YYYY-MM-DD")}`);
          const { redis } = ctx.request.body;
          if (getcachedresults && redis) {
            return JSON.parse(getcachedresults);
          }
          const answer = await calculateAdminDashboardAgreegate(project, year, month, client);
          response.data.total_workers = answer.total_workers;
          response.data.total_shifts = answer.total_shifts;
          response.data.total_day_shifts = answer.total_day_shifts;
          response.data.total_night_shifts = answer.total_night_shifts;
          response.data.active_workers = answer.active_workers;
          response.data.active_male_workers = answer.active_male_workers;
          response.data.active_female_workers = answer.active_female_workers;
          response.data.total_project = answer.total_project;
          response.data.total_active_project = answer.total_active_project;
          response.data.total_inactive_project = answer.total_inactive_project;
          response.data.graph_total_workers_by_services = answer.graph_total_workers_by_services;
          response.data.graph_total_workers_by_projects = answer.graph_total_workers_by_projects;
          response.data.graph_shift = answer.graph_shift;
          response.status = "success";
          await redisClient.set(`${process.env.COMPANY_TITLE.split(' ').join('_')}-admin-dashboard-aggregates-${project}-${year}-${month}-${client}-${moment(new Date()).format("YYYY-MM-DD")}`, JSON.stringify(response));
          await redisClient.expire(`${process.env.COMPANY_TITLE.split(' ').join('_')}-admin-dashboard-aggregates-${project}-${year}-${month}-${client}-${moment(new Date()).format("YYYY-MM-DD")}`, ttlInSeconds);
          return response;
        }
      }
    } catch (error) {
      console.log("Error happend in dashboardMetrics() ", error);
      let response_error = {
        status_code: 200,
        status: "failed",
        data: {},
        errors: [],
        meta: [],
      };
      response_error.errors.push(error.message);
      return response_error;
    }
  },
  async computeWorkersInfo(ctx) {
    const knex = strapi.connections.default;
    // get all workers
    let all_workers_sql_raw = `SELECT
                                        t1.id,
                                        t1.first_name,
                                        t1.last_name,
                                        t1.nid_number,
                                        t3.assigned_worker_id,
                                        t5.name AS service_name,
                                        COUNT(*) AS total_shifts,
                                        SUM(t4.value) AS total_earned
                                        FROM service_providers AS t1
                                        INNER JOIN new_assigned_workers AS t2 ON t1.id = t2.worker_id
                                        INNER JOIN attendance_details AS t3 ON t2.id = t3.assigned_worker_id
                                        INNER JOIN worker_rates AS t4 ON t2.id = t4.assigned_worker_id
                                        INNER JOIN services AS t5 ON t4.service_id = t5.id
                                        GROUP BY t3.assigned_worker_id
                                        `;
    var all_workers_query = await knex.raw(all_workers_sql_raw);
    return all_workers_query[0];
    // get assigned worker
  },
  async ussdTest(ctx) {
    // body
    const { sessionId, serviceCode, phoneNumber, text } = ctx.request.body;
    let response = "";
    if (text === "") {
      // this is the first request
      response = `CON what would you like to check ?
      1. My Account
      2. My phone number`;
    } else if (text === "1") {
      response = `CON Choose account information you want to view
      1. Account Number
      2. Account balance`;
    } else if (text === "2") {
      response = `END Your phone number is 0786494863`;
    } else if (text === "1*1") {
      const accountNumber = "AC100101";
      response = `END Your account number is ${accountNumber}`;
    } else if (text === "1*2") {
      const balance = "KES 10,000";

      response = `END Your balance is ${balance}`;
    }
    return response;
  },
  async listWorkforce(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: {
        list: [],
      },
      errors: [],
      meta: { pagination: { count: 0 } },
    };
    try {
      let entities;
      const queries = ctx.query;
      if (!queries._sort) {
        queries._sort = "updated_at:desc";
      }
      if (queries.search) {
        queries._q = queries.search;
        delete queries.search;
      }
      if (queries._q) {
        entities = await strapi.services.workforce.search(queries);
        response.meta.pagination.count = await strapi.services.workforce.countSearch(queries);
        response.data.list = entities;
      } else {
        let project_ids = [];
        let search_query = {};
        const user_level = await getUserLevel(ctx.state.user.id);
        if (user_level.status) {
          if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
            const projects = await strapi.query("projects").find({ client_id: user_level.data.client_info.id });
            project_ids = projects.map((item) => {
              return item.id
            });
          } else if (user_level.data.user_level === "level_1") {
            const projects = await strapi.query("projects").find({ _limit: -1 });
            project_ids = projects.map((item) => {
              return item.id;
            });
          } else {
            project_ids = [];
          }

          if (project_ids.length >= 1) {
            if (queries.project_id) {
              search_query = queries;
            } else {
              if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
                search_query = { ...queries, project_id: project_ids };
              } else {
                search_query = { ...queries, project_id: [...project_ids, 0] };
              }

            }
          } else {
            search_query = queries;
          }

          let passed_query_knex = "";
          let query_knex = "";
          if (project_ids.length >= 1) {
            if (queries.project_id) {
              query_knex += `project_id= ${queries.project_id} `;
            } else {
              for (let i = 0; i < project_ids.length; i++) {
                if (project_ids.length - 1 === i) {
                  query_knex += `project_id= ${project_ids[i]} `;
                } else {
                  query_knex += `project_id= ${project_ids[i]} OR `;
                }
              }
            }
            if (query_knex === "") {
              passed_query_knex = "";
            } else {
              passed_query_knex = ` AND ${query_knex}`;
            }
          } else {
            passed_query_knex = "";
          }

          const workforce_data = await strapi.query("workforce").find(search_query);
          if (workforce_data) {
            response.meta.pagination.count = workforce_data.length;
            response.data.list = workforce_data;
          } else {
            response.status_code = 400;
            response.status = "failure";
          }
        } else {
          response.status_code = 400;
          response.status = "failure";
        }
      }
    } catch (error) {
      console.log("Error happend in listWorkforce function ", error.message);
      response.status_code = 400;
      response.status = "failure";
      response.errors.push(error.message);
    }
    return response;
  },
  async getWorkforce(ctx) {
    let response = {
      status_code: 200,
      status: "success",
      aggregates: {
        total_worker: 0,
        total_active: 0,
        total_new_worker: 0,
        total_assessed: 0
      },
      export: [],
      list: [],
      errors: [],
      meta: {
        pagination: {
          pageSize: 0,
          total: 0
        }
      },
    };
    try {
      let entities;
      let client = "";
      let project_ids = [];
      let search_query = {};
      const user_level = await getUserLevel(ctx.state.user.id);
      if (user_level.status) {
        const queries = ctx.query;
        if (!queries._sort) {
          queries._sort = "updated_at:desc";
        }
        if (queries.search) {
          queries._q = queries.search;
          delete queries.search;
        }
        if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
          const projects = await strapi.query("projects").find({ client_id: user_level.data.client_info.id });
          project_ids = projects.map((item) => {
            return item.id
          });
          client = user_level.data.client_info.id
        } else if (user_level.data.user_level === "level_1") {
          const projects = await strapi.query("projects").find({ _limit: -1 });
          project_ids = projects.map((item) => {
            return item.id;
          });
          client = "all";
        } else {
          project_ids = [];
          client = -1;
        }

        if (project_ids.length >= 1) {
          if (queries.project_id) {
            search_query = queries;
          } else {
            if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
              search_query = { ...queries, project_id: project_ids };
            } else {
              search_query = { ...queries, project_id: [...project_ids, 0] };
            }
          }
        } else {
          search_query = queries;
        }

        let passed_query_knex = "";
        let query_knex = "";
        if (project_ids.length >= 1) {
          if (queries.project_id) {
            if (Array.isArray(queries.project_id)) {
              for (let i = 0; i < queries.project_id.length; i++) {
                if (queries.project_id.length - 1 === i) {
                  query_knex += `project_id= ${queries.project_id[i]} `;
                } else {
                  query_knex += `project_id= ${queries.project_id[i]} OR `;
                }
              }
            } else {
              query_knex += `project_id= ${queries.project_id} `;
            }
          } else {
            for (let i = 0; i < project_ids.length; i++) {
              if (project_ids.length - 1 === i) {
                query_knex += `project_id= ${project_ids[i]} `;
              } else {
                query_knex += `project_id= ${project_ids[i]} OR `;
              }
            }
          }
          if (query_knex === "") {
            passed_query_knex = "";
          } else {
            passed_query_knex = ` AND ${query_knex}`;
          }
        } else {
          passed_query_knex = "";
        }
        delete search_query.attendance;
        if (queries._q) {
          entities = await strapi.services.workforce.search(search_query);
          response.meta.pagination.pageSize = await strapi.services.workforce.countSearch(search_query);
          response.meta.pagination.total = await strapi.services.workforce.countSearch(search_query);
          response.aggregates.total_worker = entities.length;
          response.aggregates.total_assessed = entities.filter((i) => i.is_assessed).length;
          const workforce_data = await calculateWorkForceData(search_query, passed_query_knex, entities);
          response.export = workforce_data.export;
          response.aggregates.total_new_worker = workforce_data.new_workers;
          response.aggregates.total_active = workforce_data.active_workers;
          response.aggregates.total_assessed = workforce_data.total_assessed;
          response.aggregates.total_worker = workforce_data.total_workers;
          response.list = entities;
          ctx.response.status = 200;
          response = Format.success(`workforce list`, response);
        } else {
          const workforces = await strapi.query("workforce").find(search_query);
          if (workforces) {
            response.list = workforces;
            const workforce_data = await calculateWorkForceData(search_query, passed_query_knex, "normal");
            response.export = workforce_data.export;
            response.aggregates.total_worker = workforce_data.total_workers;
            response.aggregates.total_assessed = workforce_data.total_assessed;
            response.aggregates.total_new_worker = workforce_data.new_workers;
            response.aggregates.total_active = workforce_data.active_workers;
            response.meta.pagination.pageSize = workforces.length;
            search_query._limit = "-1";
            search_query._start = "0";
            response.meta.pagination.total = await strapi.query("workforce").count(search_query);
            ctx.response.status = 200;
            response = Format.success(`workforce list`, response);
          } else {
            ctx.response.status = 400;
            response = Format.badRequest("Error in calculation the aggregates", []);
          }
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest("This user doesn't have level", []);
      }
    } catch (error) {
      console.log("Error happend in getWorkforce function ", error.message);
      response.status_code = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },

  async appFindOne(ctx) {
    let response;
    const { id } = ctx.params;
    const { project_id } = ctx.query;

    // check if worker exist under params id
    let worker = await strapi.query("service-providers").findOne({ id });
    // if, yes retreive and return worker info
    if (worker) {
      let data = await getWorkerApp(id, project_id);
      if (data.status === "success") {
        response = {
          status: "success",
          message: "worker found",
          status_code: 200,
          data: data.data,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          message: data.message,
          status_code: 400,
          data: [],
          error: "",
          meta: "",
        };
      }
    }
    // if, no return no worker
    else {
      response = {
        status: "failed",
        message: "worker not found",
        status_code: 400,
        data: [],
        error: "",
        meta: "",
      };
    }
    return response;
  },
  async appFindOneWeb(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      const worker = await strapi.query("service-providers").findOne({ id: id });
      if (worker) {
        const data = await getWorkerWeb(id, ctx.state.user.id);
        if (data) {
          response = {
            status: "success",
            message: "worker found",
            status_code: 200,
            data: data,
            error: "",
            meta: "",
          };
        } else {
          response = {
            status: "failed",
            message: "worker not found because the project doens't exist",
            status_code: 400,
            data: [],
            error: "",
            meta: "",
          };
        }
      }
      else {
        response = {
          status: "failed",
          message: "worker not found",
          status_code: 400,
          data: [],
          error: "",
          meta: "",
        };
      }
    } catch (error) {
      console.log('Error in appFindOneWeb ', error.message);
      response = {
        status: "failed",
        message: `${error.message}`,
        status_code: 400,
        data: [],
        error: "",
        meta: "",
      };
    }
    return response;
  },
  async sendSMS(ctx) {
    let response = {
      status: "success",
      message: "",
      status_code: 200,
      data: [],
      error: "",
      meta: "",
    };
    try {
      const { worker_phones, message } = ctx.request.body;
      await sendSMSToWorker(worker_phones, message);
    } catch (error) {
      response = {
        status: "error",
        message: `${error}`,
        status_code: 500,
        data: [],
        error: "",
        meta: "",
      };
    }
    return response;
  },
  async assignWorkerToProject(ctx) {
    let response = {
      status: "failed",
      message: "",
      status_code: 200,
      data: [],
      error: "",
      meta: "",
    };
    try {
      const { worker_ids, project_id } = ctx.request.body;
      const assignworkerResponse = await assignWorker(worker_ids, project_id, ctx.state.user.id);
      if (assignworkerResponse) {
        response.status = "success";
        response.message = "worker assigned successful";
        response.status_code = 201;
      }
    } catch (error) {
      console.log("error assign worker :: ", error.message);
      response.error = "Error Happened";
    }
    return response;
  },
  async verifyWorker(ctx) {
    let response = {
      status: "failed",
      message: "",
      status_code: 200,
      data: [],
      error: "",
      meta: "",
    };
    const { worker_id, is_verified } = ctx.request.body;
    // check if worker exist
    let worker = await strapi
      .query("service-providers")
      .findOne({ id: worker_id });
    if (worker) {
      // verify worker
      await strapi
        .query("service-providers")
        .update({ id: worker_id }, { is_verified: is_verified });
      response = {
        status: "Success",
        message: "Worker updated successfully",
        status_code: 200,
        data: [],
        error: "",
        meta: "",
      };
    } else {
      response = {
        status: "Failed",
        message: "Worker not found",
        status_code: 404,
        data: [],
        error: "",
        meta: "",
      };
    }

    return response;
  },
  async unAssignWorkerToProject(ctx) {
    const response = {
      status: "failed",
      message: "",
      status_code: 200,
      data: [],
      error: "",
      meta: "",
    };
    const { worker_ids, project_id } = ctx.request.body;
    response.status = "success";
    response.message = "worker unassigned successful";
    response.status_code = 200;
    unAssignWorker(worker_ids, project_id);
    return response;
  },
  async getWorkerPaymentHistory(ctx) {
    let response = {
      status: "success",
      message: "",
      status_code: 200,
      data: {
        statistics: {
          shift: [{ day: 240, night: 54 }],
          project: 2,
          total_deduction: 10000,
          total_earnings: 200000,
        },
        history: [
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
          {
            date: "2020/09/01",
            total: { id: 1, name: "day" },
            project: { id: 2, name: "Inyange plant" },
            supervisor: { id: 15, name: "welcome" },
            service: { id: 1, name: "helper" },
            service: 500,
            totat_payed: 2000,
          },
        ],
      },
      error: "",
      meta: "",
    };
    return response;
  },
  async testPhone(ctx) {
    const invalid_phone = "0791252478";
    const valid_phone = "0785485889";
    const result =
      await strapi.services.service_providers.momoValidatePhoneNumber(
        valid_phone
      );
    return result;
  },
  async registerWorker(ctx) {
    let errors = [];
    let response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: errors,
      meta: [],
    };
    let error_status = false;

    // validating NID
    Validator.register('nid_validation', function (value, requirement, attribute) {
      // Check if the value is not empty
      if (!value) {
        return false;
      }
      // Check if it's a string and has 16 numeric characters
      const isNumeric = /^\d{16}$/.test(value);
      // Check if it matches the format AK0487474
      const isFormatted = /^[A-Za-z]+\d+$/.test(value);
      // Return true if either condition is met
      return isNumeric || isFormatted;
    }, 'The :attribute value is not valid.');

    try {
      let rules = {
        first_name: "required|string",
        last_name: "required|string",
        nid_number: "required|nid_validation",
        phone_number: "required|string|min:10|max:10",
        gender: "required|string",
        date_of_birth: "required|string",
        district: "required|string",
        services: "required|integer",
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const getAge = moment().diff(ctx.request.body.date_of_birth, "years");
        const getPhone = await strapi.query("service-providers").findOne({ phone_number: ctx.request.body.phone_number });
        const getNid = await strapi.query("service-providers").findOne({ nid_number: ctx.request.body.nid_number });

        if (getPhone) {
          error_status = true;
          errors.push("phone number already exists");
          response.status_code = 400;
          response.status = "failed";
        }

        if (getNid) {
          error_status = true;
          errors.push("NID number already exists");
          response.status_code = 400;
          response.status = "failed";
        }

        if (getAge < 18) {
          error_status = true;
          errors.push("must have atleast 18 years");
          response.status_code = 400;
          response.status = "failed";
        }

        if (error_status === false) {
          let entity = await strapi.query("service-providers").create(ctx.request.body, "registerWorker");
          if (entity) {
            response.status = "success";
            response.status_code = 201;
          }
        }
      } else {
        let firstValue = Object.values(validation.errors.all())[0];
        // ctx.response.status = 400;
        errors.push(`${firstValue}`);
        response.status_code = 400;
        response.status = "failed";
      }
    } catch (error) {
      ctx.response.status = 500;
      errors.push(error.message);
      response.status_code = 400;
      response.status = "failed";
    }
    return response;
  },
  async oldRegisterWorker(ctx) {
    let workerData = ctx.request.body;
    let entity;

    let errors = [];

    let response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: errors,
      meta: [],
    };

    // Check empty body
    if (Object.keys(workerData).length === 0) {
      return ctx.badRequest("Missing data in your request");
    } else {
      // && check if a service exists in services
      const serviceExists = async (serviceId) => {
        const getService = await strapi.query("services").findOne({ id: serviceId });
        if (getService) return getService;
        return false;
      };
      // && check if it is not already registered
      const phoneExists = async (phone) => {
        const getPhone = await strapi.query("service-providers").findOne({ phone_number: phone });

        if (getPhone) return getPhone;
        return false;
      };

      // check if NID number is no already registered
      const nidExists = async (nid) => {
        if (Number(nid)) {
          const getNid = await strapi.query("service-providers").findOne({ nid_number: nid });
          if (getNid) return getNid;
          return false;
        } else {
          // errors.push("NID number must contain numbers only");
          response.status_code = 400;
          response.status = "failed";
        }
      };

      //check age is > 22
      const checkAge = async (dob) => {
        const getAge = moment().diff(dob, "years");

        if (getAge < 18) return true;
        return false;
      };

      // if (workerData.daily_rate <= 0) {
      //   return ctx.badRequest("Missing daily rate");
      // }
      // No service, no registration
      if (!workerData.services) {
        return ctx.badRequest("Missing service");
      }
      // check if Identification numbers are 16 && if it valid
      if (workerData.nid_number.toString().length != 16) {
        return ctx.badRequest("Invalid identification number");
      }
      // Check if phone number is valid
      if (workerData.phone_number.toString().length != 10) {
        return ctx.badRequest("Phone number should be 10 characters");
      }

      const validNid = await checkNidValidity(workerData.nid_number);
      const validPhone = utils.phoneNumberValidation(workerData.phone_number);
      const getPhone = await phoneExists(workerData.phone_number);
      const getService = await serviceExists(workerData.services);
      const getNid = await nidExists(workerData.nid_number);
      const getAge = await checkAge(workerData.date_of_birth);

      if (!getService) {
        errors.push("Service does not exist");
        response.status_code = 400;
        response.status = "failed";
        // return ctx.notFound("Service does not exist");
      }
      if (validPhone === false) {
        errors.push("invalid phone number");
        response.status_code = 400;
        response.status = "failed";
        // return ctx.conflict("phone number already exists!");
      }
      if (getPhone) {
        errors.push("phone number already exists");
        response.status_code = 400;
        response.status = "failed";
        // return ctx.conflict("phone number already exists!");
      }
      if (validNid === false) {
        errors.push("Invalid NID number");
        response.status_code = 400;
        response.status = "failed";
        // return ctx.conflict("NID number already exists");
      }
      if (getNid) {
        errors.push("NID number already exists");
        response.status_code = 400;
        response.status = "failed";
        // return ctx.conflict("NID number already exists");
      }
      if (getAge) {
        errors.push("must have atleast 18 years");
        response.status_code = 400;
        response.status = "failed";
        // return ctx.badRequest(`must have atleast 22 years`);
      } else if (
        getAge === false &&
        getNid === false &&
        getPhone === false &&
        getService &&
        validPhone === true &&
        validNid === true
      ) {
        /** Registering new single worker (lifecycles)
         *
         * Save worker in workers table
         * Save registered worker in new_assigned_worker with worker_id, project_id=0, worker_rate_id, is_active=false
         * Save entered daily rate into worker_rates table with assigned_worker_id, service_id_value
         *
         */
        entity = await strapi
          .query("service-providers")
          .create(workerData, "registerWorker");

        response.status = "success";
        response.status_code = 201;
        // return {
        //   status: "success",
        //   statusCode: 201,
        //   message: "Worker successfully created!",
        // };
      }
    }
    return response;
  },
  async registerTempExcel(ctx) {
    let response;
    let results;

    try {
      const { data, file_id, file_name } = ctx.request.body;
      // console.log('BODY ===>', data, file_id, file_name)
      if (data && file_id && file_name) {
        // save data to temporary table
        results = await saveWorkersTempExcel(data, file_id, file_name);
        // console.log("Results ===", results)
        if (results.error) {
          ctx.response.status = 400;
          response = {
            status: "failed",
            status_code: 400,
            data: [],
            error: results.message,
            meta: "",
          };
        } else if (results.total_workers == 0) {
          ctx.response.status = 200;
          response = {
            status: "No new registered Workers.",
            status_code: 200,
            data: results,
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 200;
          response = {
            status: "Workers successfully uploaded.",
            status_code: 200,
            data: results,
            error: "",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        return {
          status: "Failed",
          status_code: 400,
          data: [],
          error: "Missing required data",
          meta: "",
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "Failed",
        status_code: 500,
        data: [],
        error: `${error} due to invalid format data, please verify worker data`,
        meta: "",
      };
    }
    return response;
  },
  async bulkRegistration(ctx) {
    let response;
    try {
      const rules = {
        file_id: "required|string",
        file_name: "required|string",
        data: "required|array",
        services: "array"
      };
      const validation = new Validator(ctx.request.body, rules);
      const request_body = ctx.request.body;
      if (validation.passes()) {
        const { data, file_name, file_id, services } = request_body;
        ctx.response.status = 200;
        response = Format.success(`starting registering in temp worker`, []);
        saveBulkTemporaryWorkerRegistration(data, file_name, file_id, services, ctx.state.user.id);
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      ctx.response.status = 500;
      console.log("error in bulkRegistration", error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async saveTempExcel(ctx) {
    let response;
    try {
      const temp_data = await strapi.query("temp-workers-table").find({ _limit: -1 });
      if (temp_data) {
        const temp_data_to_save = temp_data.filter((x) => !x.phone_number_exist && !x.first_name_error && !x.last_name_error && !x.nid_exist);
        if (temp_data_to_save.length >= 1) {
          ctx.response.status = 200;
          response = Format.success(`workers successfuly registered`, []);
          verifyBulkWorkers(temp_data, "live", ctx.state.user.id);
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("No valid worker found", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest("No valid worker found", []);
      }
    } catch (error) {
      ctx.response.status = 500;
      console.log("error in saveTempExcel", error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async updateWorker(ctx) {
    const { id } = ctx.params;
    let entity;
    let response = {
      status: "failed",
      message: "",
      status_code: 200,
      data: [],
      error: "",
      meta: "",
    };
    try {
      if (ctx.is("multipart")) {
        const { data, files } = parseMultipartData(ctx);
        entity = await strapi.query("service-providers").update({ id }, data, { files });
      } else {
        const get_updating_worker = await strapi.query("service-providers").findOne({ id: id });
        if (get_updating_worker) {
          if (utils.phoneNumberValidation(ctx.request.body.phone_number) && get_updating_worker.is_momo_verified_and_rssb !== "green") {
            const phoneValid = utils.phoneNumberValidation(ctx.request.body.phone_number);
            if (!phoneValid) {
              ctx.response.status = 400;
              response.status_code = 400;
              response.message = "phone is not valid";
              return response;
            } else {
              const worker = await strapi.query("service-providers").findOne({ phone_number: ctx.request.body.phone_number });
              if (worker) {
                if (parseInt(worker.id) != parseInt(id)) {
                  ctx.response.status = 400;
                  response.status_code = 400;
                  response.message = "Phone number already exist";
                  return response;
                } else {
                  if (utils.nidValidation(worker.nid_number)) { //Rwandan
                    if (worker.is_rssb_verified !== "green") {
                      const rssb_info = await getWorkerInfoFromRssb(worker.nid_number);
                      if (rssb_info.status == "success") {
                        ctx.request.body.is_rssb_verified = "green";
                        ctx.request.body.last_name = rssb_info.data.lastName;
                        ctx.request.body.first_name = rssb_info.data.firstName;
                        ctx.request.body.date_of_birth = moment(rssb_info.data.dateOfBirth, 'DD/MM/YYYY').format("YYYY-MM-DD");
                        const momo_verification = await accountVerification("MTN", { account_number: worker.phone_number, account_name: { first_name: rssb_info.data.firstName, last_name: rssb_info.data.lastName }, account_belong_to: "MTN" }, true);
                        if (momo_verification.status) {
                          ctx.request.body.is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
                          ctx.request.body.is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
                        }
                      } else {
                        ctx.request.body.is_rssb_verified = "nothing";
                      }
                    } else {
                      const momo_verification = await accountVerification("MTN", { account_number: worker.phone_number, account_name: { first_name: worker.first_name, last_name: worker.last_name }, account_belong_to: "MTN" }, false);
                      if (momo_verification.status) {
                        ctx.request.body.is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
                        ctx.request.body.is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
                      }
                    }
                  } else { //Foreigner
                    ctx.request.body.is_rssb_verified = "nothing";
                    const momo_verification = await accountVerification("MTN", { account_number: worker.phone_number, account_name: { first_name: worker.first_name, last_name: worker.last_name }, account_belong_to: "MTN" }, false);
                    if (momo_verification.status) {
                      ctx.request.body.is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
                      ctx.request.body.is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
                    }
                  }
                }
              } else {
                const momo_verification = await accountVerification("MTN", { account_number: ctx.request.body.phone_number, account_name: { first_name: "", last_name: "" }, account_belong_to: "MTN" }, false);
                if (momo_verification.status) {
                  ctx.request.body.is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
                  ctx.request.body.is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
                }
              }
            }
          }

          //Editing nid_number
          if (utils.nidValidation(ctx.request.body.nid_number) && get_updating_worker.is_rssb_verified !== "green") {
            const worker = await strapi.query("service-providers").findOne({ nid_number: ctx.request.body.nid_number });
            if (worker) {
              if (parseInt(worker.id) != parseInt(id)) {
                ctx.response.status = 400;
                response.status_code = 400;
                response.message = "National Id number already exist";
                return response;
              } else {
                const rssb_info = await getWorkerInfoFromRssb(worker.nid_number);
                if (rssb_info.status == "success") {
                  ctx.request.body.is_rssb_verified = "green";
                  ctx.request.body.last_name = rssb_info.data.lastName;
                  ctx.request.body.first_name = rssb_info.data.firstName;
                  ctx.request.body.date_of_birth = moment(rssb_info.data.dateOfBirth, 'DD/MM/YYYY').format("YYYY-MM-DD");
                  const momo_verification = await accountVerification("MTN", { account_number: worker.phone_number, account_name: { first_name: rssb_info.data.firstName, last_name: rssb_info.data.lastName }, account_belong_to: "MTN" }, true);
                  if (momo_verification.status) {
                    ctx.request.body.is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
                    ctx.request.body.is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
                  }
                } else {
                  ctx.request.body.is_rssb_verified = "nothing";
                  const momo_verification = await accountVerification("MTN", { account_number: worker.phone_number, account_name: { first_name: worker.first_name, last_name: worker.last_name }, account_belong_to: "MTN" }, false);
                  if (momo_verification.status) {
                    ctx.request.body.is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
                    ctx.request.body.is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
                  }
                }
              }
            } else {
              const rssb_info = await getWorkerInfoFromRssb(ctx.request.body.nid_number);
              if (rssb_info.status == "success") {
                ctx.request.body.is_rssb_verified = "green";
                ctx.request.body.last_name = rssb_info.data.lastName;
                ctx.request.body.first_name = rssb_info.data.firstName;
                ctx.request.body.date_of_birth = moment(rssb_info.data.dateOfBirth, 'DD/MM/YYYY').format("YYYY-MM-DD");
              } else {
                ctx.request.body.is_rssb_verified = "nothing";
              }
            }
          }
          const services = ctx.request.body.services;
          if (services) {
            for (let index = 0; index < services.length; index++) {
              if (services[index].daily_rate && services[index].daily_rate.toString() != "0") {
                const new_assigned_worker = await strapi.query("new-assigned-workers").findOne({ id: services[index].assigned_worker_id });
                const rate = await strapi.query("rates").findOne({ project_id: new_assigned_worker.project_id, service_id: services[index].id });
                if (rate) {
                  if (parseInt(services[index].daily_rate) <= parseInt(rate.maximum_rate)) {
                    response.status = "success";
                    response.message = "Worker rate saved successful";
                    await strapi.query("worker-rates").create({ service_id: services[index].id, assigned_worker_id: services[index].assigned_worker_id, value: services[index].daily_rate, rate_type: "negotiated", });
                  } else {
                    response.status_code = 204;
                    response.message = "You cannot set worker earnings greater than the maximum rate: RWF " + rate.maximum_rate;
                    break;
                  }
                } else {
                  const project_rates = await strapi.query("rates").find({ project_id: new_assigned_worker.project_id });
                  let existing_project_rates = [];
                  if (project_rates.length >= 1) {
                    existing_project_rates = _.map(project_rates, (item) => {
                      return { service_id: item.service_id, maximum_rate: item.maximum_rate };
                    });
                    if (!existing_project_rates.some(obj => parseInt(obj.service_id) === parseInt(services[index].id))) {
                      existing_project_rates.push({ service_id: services[index].id, maximum_rate: services[index].daily_rate });
                    }
                  } else {
                    existing_project_rates = [{ service_id: services[index].id, maximum_rate: services[index].daily_rate }];
                  }
                  for (let z = 0; z < existing_project_rates.length; z++) {
                    const rate_to_add_exist = await strapi.query("rates").findOne({ project_id: new_assigned_worker.project_id, service_id: existing_project_rates[z].service_id });
                    if (!rate_to_add_exist) {
                      await strapi.query("rates").create({ project_id: new_assigned_worker.project_id, service_id: existing_project_rates[z].service_id, maximum_rate: existing_project_rates[z].maximum_rate, status: true, default_rate: 0, advanced_rate: 0, intermediate_rate: 0, beginner_rate: 0 });
                    }
                  }

                  await strapi.query("worker-rates").create({ service_id: services[index].id, assigned_worker_id: services[index].assigned_worker_id, value: services[index].daily_rate, rate_type: "negotiated" });
                  response.message = "Worker rate saved successful.";
                  response.status = "success";
                }
              } else {
                let assigned_worker = await strapi.query("new-assigned-workers").findOne({ id: services[index].assigned_worker_id });
                if (assigned_worker) {
                  let project = await strapi.query("projects").findOne({ id: assigned_worker.project_id });
                  if (project) {
                    let project_rate = await strapi.query("rates").findOne({ project_id: project.id, service_id: services[index].id, });
                    if (project_rate) {
                      let worker_assessment = await strapi.query("workers-assessments").findOne({ service_id: services[index].id, worker_id: assigned_worker.worker_id });
                      if (worker_assessment) {
                        let mean_score = worker_assessment.mean_score;
                        switch (true) {
                          case mean_score >= 0 && mean_score <= 50: // beginner
                            await strapi.query("worker-rates").create({ rate_type: "standard", service_id: services[index].id, assigned_worker_id: assigned_worker.id, value: project_rate.beginner_rate, });
                            break;
                          case mean_score >= 51 && mean_score <= 79: // intermediate
                            await strapi.query("worker-rates").create({ rate_type: "standard", service_id: services[index].id, assigned_worker_id: assigned_worker.id, value: project_rate.intermediate_rate, });
                            break;
                          case mean_score >= 80 && mean_score <= 100: //advanced
                            await strapi.query("worker-rates").create({ rate_type: "standard", service_id: services[index].id, assigned_worker_id: assigned_worker.id, value: project_rate.advanced_rate, });
                            break;
                          default:
                            break;
                        }
                      } else {
                        await strapi.query("worker-rates").create({ rate_type: "standard", service_id: services[index].id, assigned_worker_id: assigned_worker.id, value: project_rate.beginner_rate, });
                      }
                    }
                  }
                  response.message = "Worker rate saved successful";
                  response.status = "success";
                }
              }
            }
          }
          if (ctx.request.body.next_of_kin) {
            ctx.request.body.next_of_kin = [
              {
                "name": `${ctx.request.body.next_of_kin.first_name} ${ctx.request.body.next_of_kin.last_name}`,
                "worker_id": id,
                "phone_number": ctx.request.body.next_of_kin.phone_number,
              }
            ]
          }
          entity = await strapi.query("service-providers").update({ id }, ctx.request.body);
        } else {
          response = {
            status: "Failed",
            status_code: 400,
            error: "We can't find this worker",
            meta: "",
          };
        }
      }
      response.data = entity;
    } catch (error) {
      console.log("ERROR IN updateWorker ", error.message);
      response = {
        status: "Failed",
        status_code: 400,
        error: "ERROR during update worker " + error.message,
        meta: "",
      };
    }
    return response;
  },
  async guessGender(ctx) {
    let response = {
      status: "failed",
      message: "",
      status_code: 200,
      data: [],
      error: "",
      meta: "",
    };
    const all_workers = await strapi.query("service-providers").find({ _limit: -1 });
    const filtered_workers = _.reject(all_workers, (item) => {
      return item.gender && (item.gender.toLowerCase() === "male" || item.gender.toLowerCase() === "female");
    });

    if (filtered_workers) {
      console.log(`================== we are going to try finding gender of ${filtered_workers.length} workers ========================`);
      for (let index = 0; index < filtered_workers.length; index++) {
        setTimeout(async function () {
          let my_url = "";
          if (filtered_workers[index].first_name.includes(" ") && filtered_workers[index].first_name.split(" ")[1] !== "") {
            my_url = "https://gender-api.com/get?name=" + filtered_workers[index].first_name.split(" ")[1] + "&key=ZJToRtWat2KxQ58UYxtst3aREKYb33ghJ7AD";
          } else {
            if (filtered_workers[index].last_name !== "") {
              my_url = "https://gender-api.com/get?name=" + filtered_workers[index].last_name + "&key=ZJToRtWat2KxQ58UYxtst3aREKYb33ghJ7AD";
            }
          }
          if (utils.isValidURL(my_url)) {
            await axios({ method: "get", url: my_url })
              .then(async (resp) => {
                let count = index + 1;
                console.log(`${count}. worker with id ${filtered_workers[index].id} has been found and ther gender is ${resp.data.gender}`);
                const my_gender = (resp.data.gender === "unknown") ? "male" : resp.data.gender;
                await strapi.query("service-providers").update({ id: filtered_workers[index].id }, { gender: my_gender });
              })
              .catch((error) => {
                console.log("ERROR:", error.message);
              });
          }

        }, 10000);
      }
      response = {
        status: "Success",
        message: "Workers updated successfully",
        status_code: 200,
        data: [],
        error: "",
        meta: "",
      };
    } else {
      response = {
        status: "Failed",
        message: "Workers not found",
        status_code: 404,
        data: [],
        error: "",
        meta: "",
      };
    }
    return response;
  },
};

// check if phone_number_exist
const phoneNumberExist = async (phone_number) => {
  let status = false;
  const phone = await strapi.query("service-providers").findOne({ phone_number: phone_number.toString() });
  const temp_phone = await strapi.query("temp-workers-table").findOne({ phone_number: phone_number.toString() });
  if ((phone && phone_number.length > 0) || temp_phone) {
    status = true;
  } else {
    status = false;
  }
  return status;
};
// check if service exist
const serviceExist = async (service_name) => {
  let status = false;
  const service = await strapi.query("services").findOne({ name: service_name.toLowerCase() });
  if (service) {
    status = true;
  } else {
    status = false;
  }
  return status;
};
// get serviceID
const getServiceID = async (service_name) => {
  let service_id = 0;
  const service = await strapi.query("services").findOne({ name: service_name.toLowerCase() });
  if (service) {
    service_id = service.id;
  } else {
    service_id = 0;
  }
  return service_id;
};
const nidNumberExist = async (nid_number) => {
  let status = false;
  const nid = await nidNumberPreprocess(nid_number);
  if (nid && nid.toString().length > 0) {
    const nid_provider = await strapi.query("service-providers").findOne({ nid_number: nid.toString() });
    const nid_temp = await strapi.query("temp-workers-table").findOne({ nid_number: nid.toString() });
    if (nid_provider || nid_temp) {
      status = true;
    } else {
      status = false;
    }
  }
  return status;
};
const saveWorkersTempExcel = async (data, file_id, file_name) => {
  const fileInfo = {
    file_name: file_name,
    file_id: file_id,
    total_workers: 0,
    error: false,
    message: "",
    errorInfo: "",
  };

  try {
    if (!data || !file_id || !file_name) {
      for (let index = 0; index < data.length; index++) {
        let phone_number_is_verified = false;
        let phone_number_exist = false;
        let service_available = false;
        let service_ID = 0;
        let first_name_error = true;
        let last_name_error = true;
        let valid_nid = false;
        let nid_exist = false;
        let valid_daily_earnings = false;
        phone_number_is_verified = utils.phoneNumberValidation(utils.format_phone_number(data[index].phoneNumber));
        phone_number_exist = await phoneNumberExist(utils.format_phone_number(data[index].phoneNumber));
        service_available = await serviceExist(data[index].service);
        service_ID = await getServiceID(data[index].service);
        first_name_error = !utils.nameValidation(data[index].firstName);
        last_name_error = !utils.nameValidation(data[index].lastName);
        valid_nid = await checkNidValidity(data[index].idNumber);
        nid_exist = await nidNumberExist(data[index].idNumber);
        valid_daily_earnings = utils.dailyEarningsValidation(data[index].daily_earnings);
        const processedNidNumber = await nidNumberPreprocess(data[index].idNumber);
        let worker = {
          first_name: data[index].firstName,
          last_name: data[index].lastName,
          phone_number: utils.format_phone_number(data[index].phoneNumber),
          nid_number: processedNidNumber ? processedNidNumber : 0,
          service: data[index].service,
          daily_earnings: data[index].daily_earnings ? data[index].daily_earnings : 0,
          gender: data[index].gender,
          date_of_birth: utils.format_dob(data[index].date_of_birth),
          is_verified: data[index].is_verified,
          district: data[index].district,
          phone_number_verified: phone_number_is_verified,
          phone_number_exist: phone_number_exist,
          service_available: service_available,
          project_id: 0,
          is_active: false,
          service_id: service_ID,
          file_name: file_name,
          first_name_error: first_name_error,
          last_name_error: last_name_error,
          valid_nid: valid_nid,
          nid_exist: nid_exist,
          valid_daily_earnings: valid_daily_earnings,
          file_id: file_id,
        };

        nextWorker = { ...worker };

        const existingWorker = await strapi.query("temp-workers-table").findOne({
          phone_number: worker.phone_number,
          first_name: worker.first_name,
          last_name: worker.last_name,
          nid_number: worker.nid_number
        });

        if (existingWorker) {
          continue; // Skip to the next iteration
        }
        await strapi.query("temp-workers-table").create(worker);
        fileInfo.total_workers = fileInfo.total_workers + 1;
      }
      return fileInfo;
    }
  } catch (error) {
    fileInfo.error = true;
    console.log("error in saveWorkersTempExcel", error.message);
  }
};

/* Function to save workers without errors */

async function calculateWorkForceData(workforce_query, passed_query_knex, result) {
  global.all_workforces = (global.all_workforces && await strapi.query("workforce").count({ _limit: -1 }) === global.all_workforces.length) ? global.all_workforces : await strapi.query("workforce").find({ _limit: -1 });
  let final_filtered_workforce_data = [];
  if (result === "normal") {
    final_filtered_workforce_data = filterData(global.all_workforces, workforce_query);
  } else {
    const filtered_workforce = filterData(global.all_workforces, workforce_query);
    for (let i = 0; i < filtered_workforce.length; i++) {
      const founded_worker = result.find((f) => parseInt(f.worker_id) === parseInt(filtered_workforce[i].worker_id));
      if (founded_worker) {
        final_filtered_workforce_data.push(filtered_workforce[i]);
      }
    }
  }

  const created_updated_end = moment().format('YYYY-MM-DD');
  const created_updated_start = utils.getDateOneMonthAgo(created_updated_end);
  const knex = strapi.connections.default;
  const attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE attendance_date >= "${created_updated_start}" AND attendance_date <= "${created_updated_end}" ${passed_query_knex}`);
  let shifts = attendancelists[0].map((entity) => {
    return {
      id: entity.id,
      shift_id: entity.shift_id,
      attendance_date: entity.attendance_date,
      service: entity.service,
      worker_id: entity.worker_id,
      gender: entity.gender,
      project_id: entity.project_id
    };
  });
  shifts = shifts.filter(item => new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end));
  let newWorkerCount = 0;
  for (var i = 0; i < final_filtered_workforce_data.length; i++) {
    if (final_filtered_workforce_data[i].date_onboarded) {
      const then = new Date(final_filtered_workforce_data[i].date_onboarded);
      const now = new Date();
      const msBetweenDates = Math.abs(then.getTime() - now.getTime());
      const daysBetweenDates = msBetweenDates / (24 * 60 * 60 * 1000);
      if (daysBetweenDates < 30) {
        newWorkerCount = newWorkerCount + 1;
      }
    }
  }
  const shift_worker_duplicate_removed = utils.removeDuplicatesByWorkerId(shifts);
  let filtered_worker = [];
  for (let w = 0; w < shift_worker_duplicate_removed.length; w++) {
    const founded_worker = final_filtered_workforce_data.find((f) => parseInt(f.worker_id) === parseInt(shift_worker_duplicate_removed[w].worker_id));
    if (founded_worker) {
      filtered_worker.push(shift_worker_duplicate_removed[w]);
    }
  }

  return {
    export: final_filtered_workforce_data.map((obj) => {
      const { id, names, phone_number, national_id, trade, project_name, daily_earnings } = obj;
      return { id, names, phone_number, national_id, trade, project_name, daily_earnings };
    }),
    active_workers: filtered_worker.length,
    total_workers: final_filtered_workforce_data.length,
    new_workers: newWorkerCount,
    total_assessed: final_filtered_workforce_data.filter((i) => i.is_assessed).length
  };
}

function filterData(dataArray, filters) {
  return dataArray.filter((item) => {
    for (let key in filters) {
      if (key === "_limit" || key === "_start" || key === "_sort" || key === "_q") {
        continue;
      }
      const filterValue = filters[key];
      if (endsWithLteOrGte(key)) {
        key = key.replace(/_(lte|gte)$/, '');
      }
      const itemValue = item[key];

      if (itemValue === undefined || !isValueMatching(itemValue, filterValue, key, filters)) {
        return false;
      }
    }
    return true;
  });
}
function isValueMatching(itemValue, filterValue, key, filters) {
  //service, project, district
  if (key === "project_id" || key === "trade_id" || key === "district") {
    if (Array.isArray(filterValue)) {
      return filterValue.some((filterItem) => isEqual(itemValue, filterItem));
    }
    return isEqual(itemValue, filterValue);
  }
  //gte and lte
  if (key === "date_onboarded") {
    return new Date(filters.date_onboarded_lte) >= new Date(itemValue) && new Date(filters.date_onboarded_gte) <= new Date(itemValue);
  }

  if (key === "last_attendance") {
    return new Date(filters.last_attendance_lte) >= new Date(itemValue) && new Date(filters.last_attendance_gte) <= new Date(itemValue);
  }

  if (key === "daily_earnings") {
    return parseInt(filters.daily_earnings_lte) >= parseInt(itemValue) && parseInt(filters.daily_earnings_gte) <= parseInt(itemValue);
  }

  return isEqual(itemValue, filterValue);
}

function isEqual(value1, value2) {
  return String(value1).toLowerCase() === String(value2).toLowerCase();
}

function endsWithLteOrGte(string) {
  return string.endsWith('lte') || string.endsWith('gte');
}




