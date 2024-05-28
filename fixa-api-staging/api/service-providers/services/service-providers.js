"use strict";
const axios = require("axios");
const _ = require("underscore");
const moment = require("moment");
const Validator = require("validatorjs");
const utils = require("../../../config/functions/utils");
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const STASH_URL = process.env.AFRICA_S_TALKING_AT_STASH_BALANCE_URL;
const AFRICA_S_TALKING_API_KEY = process.env.AFRICA_S_TALKING_API_KEY;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const { sendSMS } = require("../../sms/services/sms");
const {
  createUpdateAttendance,
} = require("../../new-attendance/services/new-attendance");
const { getProjectList } = require("../../projects/controllers/projects");
const { getMomoToken } = require("../../../config/functions/momotoken");
const {
  getRssbKycs,
} = require("../../../config/functions/third_part_api_functions");
const { getWorkerDays } = require("../../workforce/services/workforce");
const {
  accountVerification,
} = require("../../payment-methods/services/payment-methods");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async workerRegistration(data, mode) {
    let response;
    try {
      // check if country is available
      let country = await strapi
        .query("countries")
        .findOne({ id: data.country });
      if (country) {
        if (country.alpha_2_code.toString().toLowerCase() === "rw") {
          if (utils.nidValidation(data.nid_number)) {
            let is_rssb_verified = false;
            if (
              !data.phone_numbers_masked ||
              data.phone_numbers_masked.length === 0
            ) {
              const responseRsbInformation =
                await module.exports.getWorkerInfoFromRssb(data.nid_number);
              if (responseRsbInformation.status === "success") {
                let new_phone_numbers_masked =
                  responseRsbInformation.data.phoneNumbers.map(
                    (itemx) => itemx.phoneNumber
                  );
                data.phone_numbers_masked = [
                  "[" + new_phone_numbers_masked.join(", ") + "]",
                ];
                data.is_rssb_verified = "green";
                is_rssb_verified = true;
              } else {
                data.default_phone_number = "";
                data.is_rssb_verified = "nothing";
                is_rssb_verified = false;
              }
            } else {
              data.phone_numbers_masked = [
                "[" + data.phone_numbers_masked.join(", ") + "]",
              ];
            }
            const momo_verification = await accountVerification(
              "MTN",
              {
                account_number: data.default_phone_number,
                account_name: {
                  first_name: data.first_name,
                  last_name: data.last_name,
                },
                account_belong_to: "MTN",
              },
              is_rssb_verified
            );
            if (momo_verification.status) {
              data.is_momo_verified_and_rssb =
                momo_verification.data.verification_result_boolean;
              data.is_momo_verified_and_rssb_desc =
                momo_verification.data.verification_result_desc;
            }
            data.phone_number = data.default_phone_number;
            delete data.default_phone_number;
            let new_worker = await strapi
              .query("service-providers")
              .create(data, mode);
            response = {
              status: "success",
              data: new_worker,
              message: "",
            };
          } else {
            response = {
              status: "failed",
              data: {},
              message: "ID must be 16 integers",
            };
          }
        } else {
          data.is_rssb_verified = "nothing";
          const momo_verification = await accountVerification(
            "MTN",
            {
              account_number: data.default_phone_number,
              account_name: {
                first_name: data.first_name,
                last_name: data.last_name,
              },
              account_belong_to: "MTN",
            },
            false
          );
          if (momo_verification.status) {
            data.is_momo_verified_and_rssb =
              momo_verification.data.verification_result_boolean;
            data.is_momo_verified_and_rssb_desc =
              momo_verification.data.verification_result_desc;
          }
          data.phone_number = data.default_phone_number;
          delete data.default_phone_number;
          let new_worker = await strapi
            .query("service-providers")
            .create(data, mode);
          response = {
            status: "success",
            data: new_worker,
            message: "",
          };
        }
      } else {
        response = {
          status: "failed",
          data: {},
          message: "country not found",
        };
      }
    } catch (error) {
      console.log("error in workerRegistration ", error.message);
      response = {
        status: "failed",
        data: {},
        message: error.message,
      };
    }
    return response;
  },
  async getWorkerInfoFromRssb(nid) {
    let response;
    try {
      if (utils.nidValidation(nid)) {
        const responseKycs = await getRssbKycs(nid);
        if (responseKycs.status) {
          response = {
            status: "success",
            data: responseKycs.data,
            message: "",
          };
        } else {
          response = {
            status: "failed",
            data: {},
            message: responseKycs.message,
          };
        }
      } else {
        response = {
          status: "failed",
          data: {},
          message: "National Id not valid",
        };
      }
    } catch (error) {
      console.log("Error in getWorkerInfoFromRssb() ", error.message);
      response = {
        status: "failed",
        data: {},
        message: error.message,
      };
    }
    return response;
  },
  async saveBulkTemporaryWorkerRegistration(
    data,
    file_name,
    file_id,
    services,
    user_id
  ) {
    try {
      const knex = strapi.connections.default;

      if (services.length === 0) {
        const services_raw = "SELECT id,name FROM services";
        const services_query = await knex.raw(services_raw);
        services = services_query[0];
      }

      const workers_raw =
        "SELECT nid_number,phone_number FROM service_providers";
      const workers_query = await knex.raw(workers_raw);
      const workers = workers_query[0];

      const temp_workers_raw =
        "SELECT id,phone_number,nid_number FROM temp_workers_tables";
      const temp_workers_query = await knex.raw(temp_workers_raw);
      const temp_workers = temp_workers_query[0];

      let total_temp_workers = 0;
      for (let index = 0; index < data.length; index++) {
        const workerTemporaryInformation = {};
        const item = data[index];
        total_temp_workers = total_temp_workers + 1;
        if (
          item.phoneNumber &&
          utils.validatePhoneNumber(item.phoneNumber).status
        ) {
          const workerPhoneNumberExist = workers.find(
            (i) =>
              i.phone_number ===
              utils.validatePhoneNumber(item.phoneNumber).phoneNumber
          );
          workerTemporaryInformation.phone_number = utils.validatePhoneNumber(
            item.phoneNumber
          ).phoneNumber;
          workerTemporaryInformation.phone_number_verified = true;
          if (workerPhoneNumberExist) {
            workerTemporaryInformation.phone_number_exist = true;
          } else {
            workerTemporaryInformation.phone_number_exist = false;
          }
        } else {
          workerTemporaryInformation.phone_number = item.phoneNumber;
          workerTemporaryInformation.phone_number_verified = false;
          workerTemporaryInformation.phone_number_exist = false;
        }

        if (utils.nidValidation(item.idNumber)) {
          workerTemporaryInformation.valid_nid = true;
        } else {
          workerTemporaryInformation.valid_nid = true; //just to allow the false NIDA
        }
        const workerIdnumberExist = workers.find(
          (i) =>
            i.nid_number === item.idNumber && utils.nidValidation(item.idNumber)
        );
        if (workerIdnumberExist) {
          workerTemporaryInformation.nid_exist = true;
        } else {
          workerTemporaryInformation.nid_exist = false;
        }

        if (item.names && utils.nameValidation(item.names)) {
          const parsed_names = utils.parseFullnames(item.names);
          if (utils.nameValidation(parsed_names.firstName)) {
            workerTemporaryInformation.first_name_error = false;
          } else {
            workerTemporaryInformation.first_name_error = true;
          }

          if (utils.nameValidation(parsed_names.lastName)) {
            workerTemporaryInformation.last_name_error = false;
          } else {
            workerTemporaryInformation.last_name_error = true;
          }
          workerTemporaryInformation.first_name = parsed_names.firstName;
          workerTemporaryInformation.last_name = parsed_names.lastName;
        } else {
          if (utils.nameValidation(item.firstname)) {
            workerTemporaryInformation.first_name_error = false;
          } else {
            workerTemporaryInformation.first_name_error = true;
          }

          if (utils.nameValidation(item.lastname)) {
            workerTemporaryInformation.last_name_error = false;
          } else {
            workerTemporaryInformation.last_name_error = true;
          }
          workerTemporaryInformation.first_name = item.firstname;
          workerTemporaryInformation.last_name = item.lastname;
        }

        workerTemporaryInformation.project_id = 0;
        workerTemporaryInformation.is_active = false;
        workerTemporaryInformation.file_name = file_name;
        workerTemporaryInformation.file_id = file_id;
        workerTemporaryInformation.nid_number = item.idNumber;
        workerTemporaryInformation.is_rssb_verified = "nothing";

        // check if trade exist and apply validation
        if (item.service) {
          workerTemporaryInformation.service = item.service;
          const service = services.find(
            (itemService) =>
              itemService.name.toString().toLowerCase() ===
              item.service.toString().toLowerCase()
          );
          if (service) {
            workerTemporaryInformation.service_available = true;
            workerTemporaryInformation.service_id = service.id;
          } else {
            workerTemporaryInformation.service_available = false;
            workerTemporaryInformation.service_id = 0;
          }
        } else {
          const no_service = services.find((x) => x.name === "No service");
          if (no_service) {
            workerTemporaryInformation.service_available = true;
            workerTemporaryInformation.service_id = no_service.id;
            workerTemporaryInformation.service = no_service.name;
          }
        }
        // check if rate is valid and apply validation
        if (item.daily_earnings && !isNaN(item.daily_earnings.toString())) {
          workerTemporaryInformation.daily_earnings = item.daily_earnings;
          workerTemporaryInformation.valid_daily_earnings = true;
        } else {
          workerTemporaryInformation.daily_earnings = 0;
          workerTemporaryInformation.valid_daily_earnings = false;
        }
        const temp_info_nid = temp_workers.find(
          (i) => i.nid_number === workerTemporaryInformation.nid_number
        );
        const temp_info_phone = temp_workers.find(
          (i) => i.phone_number === workerTemporaryInformation.phone_number
        );
        if (!temp_info_nid && !temp_info_phone) {
          await strapi
            .query("temp-workers-table")
            .create(workerTemporaryInformation);
        }

        console.log(
          total_temp_workers,
          `temporary-workers-${
            process.env.PUSHER_ATTENDANCE_CHANNEL
          }-${file_id}-${user_id} : ${utils.calculatePercentage(
            total_temp_workers,
            0,
            data.length
          )}`
        );
        utils.eventPublisher(
          `temporary-workers-${process.env.PUSHER_ATTENDANCE_CHANNEL}-${file_id}-${user_id}`,
          {
            entity_id: file_id,
            status: total_temp_workers,
          }
        );
      }
    } catch (error) {
      console.log(
        "Error in saveBulkTemporaryWorkerRegistration()",
        error.message
      );
    }
  },

  // get all assigned workers
  async getAllAssignedWorkersKnex() {
    const knex = strapi.connections.default;
    var workers = await knex.raw(
      "SELECT * FROM new_assigned_workers LEFT JOIN service_providers ON new_assigned_workers.worker_id = service_providers.id LEFT JOIN worker_rates ON new_assigned_workers.worker_rate_id = worker_rates.id"
    );
    return workers[0];
  },
  // check at_stash balance
  async getAtStashBalance() {
    let balance = "";
    const response = await axios.get(STASH_URL, {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        Accept: "application/json",
        apiKey: AFRICA_S_TALKING_API_KEY,
      },
    });
    if (
      response.data.UserData.balance &&
      response.data.UserData.balance.length > 4
    ) {
      balance = response.data.UserData.balance.substring(3);
    }
    return balance;
  },
  // get all assigned workers on all project
  async getProjectAssignedWorkersKnex(project_ids) {
    const knex = strapi.connections.default;
    // all_workers_assigned with active status
    let new_assigned_workers = [];

    let assigned_workers_sql_raw = `
    WITH last_rates AS (
      SELECT *
      FROM worker_rates
      WHERE id IN (
         SELECT MAX(id)
         FROM worker_rates
         GROUP BY assigned_worker_id
 )
 )
    SELECT
    t1.id AS assigned_worker_id,
    t1.worker_id,
    t1.project_id,
    t2.is_verified,
    t2.first_name,
    t2.last_name,
    t2.phone_number,
    t2.nid_number,
    t3.service_id AS services,
    t3.value AS rates
    FROM new_assigned_workers AS t1
    LEFT JOIN service_providers AS t2 ON t2.id = t1.worker_id
    LEFT JOIN last_rates AS t3 on t1.id = t3.assigned_worker_id
    WHERE project_id IN (${project_ids})`;

    var assigned_workers_query = await knex.raw(assigned_workers_sql_raw);
    for (let index = 0; index < assigned_workers_query[0].length; index++) {
      const item = assigned_workers_query[0][index];
      // if(item['first_name'] && item['last_name']){
      item["first_name"] = item["first_name"] ? item["first_name"] : "xxx";
      item["last_name"] = item["last_name"] ? item["last_name"] : "xxx";
      // }
      let service = `[${item["services"]}]`;
      let rate = `[${item["rates"]}]`;

      item["services"] = service;
      item["is_verified"] = "false";
      item["rates"] = rate;
      new_assigned_workers.push(item);
    }

    return new_assigned_workers;
  },
  // get all assigned workers on all project
  async getProjectAssigneOlddWorkersKnex(project_ids) {
    const knex = strapi.connections.default;
    // all_workers_assigned with active status
    let new_assigned_workers = [];

    let assigned_workers_sql_raw = `SELECT
                                        t1.id,
                                        t1.worker_id,
                                        t1.project_id,
                                        t1.is_active,
                                        t2.is_verified
                                        FROM new_assigned_workers AS t1
                                        INNER JOIN service_providers AS t2 ON t2.id = t1.worker_id
                                        WHERE project_id IN (${project_ids})`;
    var assigned_workers_query = await knex.raw(assigned_workers_sql_raw);
    // let assigned_workers = await strapi.query("new-assigned-workers").find({ is_active: true, _limit: -1 });
    let workers = await strapi.query("service-providers").find({ _limit: -1 });
    let worker_rates = await strapi.query("worker-rates").find({ _limit: -1 });

    for (let index = 0; index < assigned_workers_query[0].length; index++) {
      let { id, worker_id, project_id, is_verified } =
        assigned_workers_query[0][index];
      let worker = workers.find((item) => item.id === worker_id);
      new_assigned_workers.push({
        assigned_worker_id: id,
        worker_id: worker_id,
        project_id: project_id,
        is_verified: is_verified == null ? "false" : is_verified.toString(),
        first_name: worker?.first_name,
        last_name: worker?.last_name,
        phone_number: worker?.phone_number,
        nid_number: worker?.nid_number,
        services: `[${getServicesIds(id, worker_rates).toString()}]`,
        rates: `[${getWorkerRateInfo(id, worker_rates).toString()}]`,
      });
    }

    return new_assigned_workers;
  },
  // save a worker
  async saveWorker(
    workerData,
    project_id,
    date,
    supervisor_id,
    shift_id,
    project_rates,
    mode
  ) {
    // Check empty body
    if (Object.keys(workerData).length === 0) {
      console.log("Missing data in your request");
    } else {
      if (workerData.gender <= 0) {
        console.log("Missing gender");
        return;
      }
      // No service, no registration
      if (!workerData.services) {
        console.log("Missing service");
        return;
      }
      // check if Identification numbers are 16 && if it valid
      if (workerData.nid_number.toString().length != 16) {
        console.log("Invalid identification number");
        return;
      }
      // Check if phone number is valid
      if (workerData.phone_number.toString().length != 10) {
        console.log("Phone number should be 10 characters");
        return;
      }
      const getPhone = await phoneExists(workerData.phone_number);
      const checkIdNumberExist = await iDNumberExists(workerData.nid_number);
      const getService = await serviceExists(workerData.services);
      if (!getService) {
        console.log("Service does not exists");
        return;
      }
      // check for phone number too
      if (getPhone && checkIdNumberExist) {
        // 1. get worker using phone_number and id_number
        let worker_existing = await strapi.query("service-providers").findOne({
          phone_number: workerData.phone_number,
          nid_number: workerData.nid_number,
        });
        if (worker_existing) {
          // 2. check if worker is assign on the project
          let worker_project_assign_exist = await strapi
            .query("new-assigned-workers")
            .findOne({ worker_id: worker_existing.id, project_id: project_id });
          // 3. if yes, stop
          if (worker_project_assign_exist) {
            return;
          }
          // 3. if no , proceed to assign the worker on the project and create worker rate and record worker on the attendance
          else {
            const entryAssignedAttendance = {
              worker_id: worker_existing.id,
              project_id: project_id,
              is_active: false,
            };
            await strapi
              .query("new-assigned-workers")
              .create(entryAssignedAttendance)
              .then(async (assigned) => {
                // filtering beginer rates from project_rates
                let rates = project_rates.filter(
                  (item) => item.service_id === workerData.services
                );
                const entryWorkerRates = {
                  assigned_worker_id: assigned.id,
                  service_id: workerData.services,
                  rate_type: workerData.daily_rate ? "negotiated" : "standard",
                  // daily rate from project service
                  value: workerData.daily_rate
                    ? workerData.daily_rate
                    : rates[0].beginner_rate,
                };
                await strapi
                  .query("worker-rates")
                  .create(entryWorkerRates)
                  .then(() => {
                    let attendancebody = {
                      project_id: project_id,
                      date: date,
                      supervisor_id: supervisor_id,
                      shift_id: shift_id,
                      workers_assigned: [assigned.id],
                    };
                    createUpdateAttendance(attendancebody, "attendance");
                  });
              });
          }
        }
      } else {
        let entity = await strapi
          .query("service-providers")
          .create(workerData, "saveWorker", [
            project_id,
            date,
            supervisor_id,
            shift_id,
            project_rates,
          ])
          .then((resp) => {
            // console.log("what is this again", mode, resp);
          })
          .catch((error) => {
            console.log(error.message);
          });

        if (entity) {
          return {
            status: "success",
            statusCode: 201,
            message: "Worker successfully created!",
          };
        }
      }
    }
  },
  async saveWorkerAttendance(
    workerData,
    project_id,
    date,
    supervisor_id,
    shift_id,
    project_rates
  ) {
    let worker_response = {
      status: "failed",
      message: "",
      data: [],
      error: "",
      meta: "",
    };
    try {
      const rules = {
        nid_number: "required|string",
        first_name: "required|string",
        last_name: "required|string",
        gender: "required|string",
        services: "required|integer",
      };

      const validation = new Validator(workerData, rules);
      if (validation.passes()) {
        if (!workerData.country) {
          const rwanda = await strapi
            .query("countries")
            .findOne({ alpha_2_code: "RW" });
          workerData.country = rwanda.id;
        }
        const getPhone = await phoneExists(workerData.phone_number);
        const checkIdNumberExist = await iDNumberExists(workerData.nid_number);
        const getService = await serviceExists(workerData.services);
        if (getService) {
          if (getPhone || checkIdNumberExist) {
            let worker_existing_id = 0;
            let message_worker_exist = "";
            if (getPhone && checkIdNumberExist) {
              message_worker_exist = `The worker you are trying to add while recording this attendance exit under phone number ${workerData.phone_number} and national ID ${workerData.nid_number}`;
              worker_existing_id = getPhone;
            } else if (!getPhone && checkIdNumberExist) {
              message_worker_exist = `The worker you are trying to add while recording this attendance exit under national ID ${workerData.nid_number} exit `;
              worker_existing_id = checkIdNumberExist;
            } else if (getPhone && !checkIdNumberExist) {
              message_worker_exist = `The worker you are trying to add while recording this attendance exit under phone number ${workerData.phone_number} exit `;
              worker_existing_id = getPhone;
            } else {
              message_worker_exist = "";
              worker_existing_id = 0;
            }
            if (parseInt(worker_existing_id) >= 1) {
              const worker_project_assign_exist = await strapi
                .query("new-assigned-workers")
                .findOne({
                  worker_id: worker_existing_id,
                  project_id: project_id,
                });
              if (worker_project_assign_exist) {
                let attendancebody = {
                  project_id: project_id,
                  date: date,
                  supervisor_id: supervisor_id,
                  shift_id: shift_id,
                  workers_assigned: [worker_project_assign_exist.id],
                };
                worker_response.status = "success";
                worker_response.message =
                  "The worker you are trying to add while recording this attendance is already assigned to this project";
                createUpdateAttendance(attendancebody, "attendance");
              } else {
                const entryAssignedAttendance = {
                  worker_id: worker_existing_id,
                  project_id: project_id,
                  is_active: false,
                };
                const assigned_id = await assignWorkerAttendance(
                  entryAssignedAttendance,
                  project_rates,
                  workerData
                );
                if (assigned_id) {
                  let attendancebody = {
                    project_id: project_id,
                    date: date,
                    supervisor_id: supervisor_id,
                    shift_id: shift_id,
                    workers_assigned: [assigned_id],
                  };
                  worker_response.status = "success";
                  worker_response.message =
                    "The worker you are trying to add while recording this attendance exist but we will assign him/her to this project.";
                  createUpdateAttendance(attendancebody, "attendance");
                }
              }
            } else {
              worker_response.message = "worker not found";
            }
          } else {
            let worker_payment_methods = [];
            workerData.is_rssb_verified = "green";
            const momo_verification = await accountVerification(
              "MTN",
              {
                account_number: workerData.phone_number,
                account_name: {
                  first_name: workerData.first_name,
                  last_name: workerData.last_name,
                },
                account_belong_to: "MTN",
              },
              false
            ); // I have any choice here. I can't verify this phone number at this time because the NID information are not available.
            if (momo_verification.status) {
              workerData.is_momo_verified_and_rssb =
                momo_verification.data.verification_result_boolean;
              workerData.is_momo_verified_and_rssb_desc =
                momo_verification.data.verification_result_desc;
            }
            const entity = await strapi
              .query("service-providers")
              .create(workerData, "saveWorker", [
                project_id,
                date,
                supervisor_id,
                shift_id,
                project_rates,
              ]);
            const payment_methods = await strapi
              .query("payment-methods")
              .findOne({ code_name: "mtn" });
            if (
              utils.phoneNumberValidation(workerData.phone_number) &&
              payment_methods
            ) {
              worker_payment_methods.push({
                worker_id: entity.id,
                is_verified: workerData.is_momo_verified_and_rssb,
                provider: "MTN",
                account_verified_desc:
                  workerData.is_momo_verified_and_rssb_desc,
                payment_method: payment_methods.id,
                account_number: workerData.phone_number,
                account_name:
                  momo_verification.data.verification_result_account_name,
                is_active: true,
              });
              await strapi
                .query("service-providers")
                .update(
                  { id: entity.id },
                  { payment_methods: worker_payment_methods }
                );
            }
            if (entity) {
              worker_response.status = "success";
              worker_response.message =
                "Worker successfully created! We will assign and do attendance as well";
            }
          }
        } else {
          worker_response.message =
            "The worker you are trying to add while recording this attendance, the service can't be found, we can't do anything to this worker";
        }
      } else {
        worker_response = {
          status: "failed",
          message: `The worker you are trying to add while recording this attendance doesn't have all the requirement to be registered in the system ${utils.makeStringOfErrorsFromValidation(
            validation.errors.all()
          )}`,
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      console.log("Error in saveWorkerAttendance", error.message);
    }
    return worker_response;
  },
  // get worker-info on Mobile by id
  async getWorkerApp(worker_id, project_id) {
    let message = [];
    let workers_assessments_results = [];
    let worker_services = null;
    let filtered_worker_services = null;
    if ((worker_id, project_id)) {
      const knex = strapi.connections.default;
      let worker_info = await strapi
        .query("service-providers")
        .findOne({ id: worker_id });
      let needed_info = {
        first_name: worker_info.first_name,
        last_name: worker_info.last_name,
        phone_number: worker_info.phone_number,
        nid_number: worker_info.nid_number,
        gender: worker_info.gender,
        date_of_birth: worker_info.date_of_birth,
        rssb_code: worker_info.rssb_code,
        province: worker_info.province,
        district: worker_info.district,
        sector: worker_info.sector,
        created_at: worker_info.created_at,
        is_verified: worker_info.is_verified,
        is_active: null,
      };

      if (needed_info) {
        let workforce = await strapi.query("workforce").findOne({ worker_id });
        if (workforce) {
          needed_info.is_active = workforce.is_active;
        } else {
          console.log(`INFO: no workforce found with worker_id::${worker_id}`);
          message.push(`INFO: no workforce found with worker_id::${worker_id}`);
        }
      }

      let all_services = await strapi.query("services").find();
      let all_assigned = await strapi
        .query("new-assigned-workers")
        .find({ worker_id, project_id, _sort: "created_at:DESC" });
      let current_assigned = await strapi
        .query("new-assigned-workers")
        .findOne({ worker_id, project_id, _sort: "created_at:DESC" });
      if (current_assigned && all_assigned && all_assigned.length >= 1) {
        let all_assigned_ids = _.map(all_assigned, (all) => all.id);
        let all_rates = await strapi.query("worker-rates").find({
          assigned_worker_id: all_assigned_ids,
          _sort: "created_at:DESC",
        });
        if (all_rates) {
          _.map(all_rates, function (all) {
            all.service_name = _.find(
              all_services,
              (s) => s.id === all.service_id
            )
              ? _.find(all_services, (s) => s.id === all.service_id).name
              : "";
            return all;
          });
        } else {
          console.log(
            "INFO: no worker_rates found with assigned_worker_id::" +
              all_assigned_ids
          );
          message.push(
            "INFO: no worker_rates found with assigned_worker_id::" +
              all_assigned_ids
          );
        }
        let current_rate = await strapi.query("worker-rates").findOne({
          assigned_worker_id: current_assigned.id,
          _sort: "created_at:DESC",
        });
        if (current_rate) {
          current_rate.service_name = _.find(
            all_services,
            (s) => s.id === current_rate.service_id
          )
            ? _.find(all_services, (s) => s.id === current_rate.service_id).name
            : "";
        }

        worker_services = { current: current_rate, all: all_rates };

        let all_services_worker_used = _.map(
          all_rates,
          (all) => all.service_id
        );
        let uniqueService = [...new Set(all_services_worker_used)];
        filtered_worker_services = _.map(uniqueService, (all) => {
          let service_name = _.find(all_services, (s) => {
            return s.id === all;
          })
            ? _.find(all_services, (s) => {
                return s.id === all;
              }).name
            : "";
          return { service_id: all, name: service_name };
        });
      } else {
        console.log(
          `INFO: no new-assigned-workers found with worker_id::${worker_id} and project_id::${project_id}`
        );
        message.push(
          `INFO: no new-assigned-workers found with worker_id::${worker_id} and project_id::${project_id}`
        );
      }

      // get qualification and certificates
      var sql_certificates_raw =
        "SELECT * FROM components_education_educations WHERE components_education_educations.worker_id=" +
        worker_id;
      // next of kin
      var sql_next_of_kin_raw =
        "SELECT * FROM components_next_of_kin_next_of_kins WHERE components_next_of_kin_next_of_kins.worker_id=" +
        worker_id;

      if (worker_id) {
        workers_assessments_results = await getAssessmentResult(worker_id);
      }

      // construct worker profile
      var certificates = await knex.raw(sql_certificates_raw);
      var next_of_kin = await knex.raw(sql_next_of_kin_raw);
      let worker = null;
      let last_attendance_data = null;
      let attendance_worker = null;
      if (worker_services && needed_info) {
        let assigned_worker_info = await strapi
          .query("new-assigned-workers")
          .findOne({
            worker_id: worker_id,
            project_id: project_id,
            _sort: "created_at:DESC",
          });
        if (assigned_worker_info) {
          last_attendance_data = await strapi
            .query("attendance-details")
            .findOne({
              assigned_worker_id: assigned_worker_info.id,
              _sort: "created_at:DESC",
            });
          if (last_attendance_data) {
            attendance_worker = await strapi
              .query("new-attendance")
              .findOne({ id: last_attendance_data.attendance_id });
          } else {
            console.log(
              `INFO: we can't get attendance-details with assigned_worker_id:: ${assigned_worker_info.id}`
            );
          }
          worker = {
            worker_information: {
              worker_profile_image_url: "https://via.placeholder.com/600x400",
              worker: [needed_info],
              services: filtered_worker_services,
              worker_rates: worker_services,
              verification: {
                phone_number_is_verified: needed_info.is_verified,
                worker_is_verified: needed_info.is_verified,
                is_worker_active: needed_info.is_active,
              },
              assessments: workers_assessments_results,
              last_attendance: attendance_worker
                ? attendance_worker.date
                : null,
              date_onboarded: needed_info.created_at,
            },
            worker_details: {
              worker: [needed_info],
              next_of_kin: next_of_kin[0],
              certificates: certificates[0],
            },
          };
        } else {
          console.log(
            `INFO: we can't get new-assigned-workers with worker_id:: ${worker_id} AND project_id:: ${project_id}`
          );
          message.push(
            `INFO: we can't get new-assigned-workers with worker_id:: ${worker_id} AND project_id:: ${project_id}`
          );
        }
      }
      if (message.length != 0) {
        return { status: "failed", message: message[0], data: {} };
      } else {
        return { status: "success", message: message, data: worker };
      }
    }
  },
  // get worker-info on Web by id
  async getWorkerWeb(worker_id, user_id) {
    try {
      let worker = null;
      let workers_assessments_results = [];
      let worker_services = null;
      let attendance_worker = null;
      if (worker_id) {
        const work_force = await strapi
          .query("workforce")
          .findOne({ worker_id });
        const passed_object = { state: { user: user_id } };
        const projects = await getProjectList(passed_object);
        const all_services = await strapi.query("services").find();
        const all_assigned = await strapi
          .query("new-assigned-workers")
          .find({ worker_id, _sort: "created_at:DESC" });
        if (all_assigned && all_assigned.length >= 1) {
          const all_assigned_ids = _.map(all_assigned, (all) => {
            return all.id;
          });
          const all_rates = await strapi.query("worker-rates").find({
            assigned_worker_id: all_assigned_ids,
            _sort: "created_at:DESC",
          });
          if (all_rates) {
            _.map(all_rates, function (all) {
              const service = _.find(
                all_services,
                (s) => parseInt(s.id) === parseInt(all.service_id)
              );
              if (service) {
                all.service_name = service.name;
              } else {
                all.service_name = "";
              }
              return all;
            });
          }
          const current_service = _.first(all_rates);
          const others_services = _.filter(all_rates, (s) => {
            return (
              s.service_id != current_service.service_id ||
              s.value != current_service.value
            );
          });
          if (work_force && work_force.assigned_worker_id && current_service) {
            current_service.assigned_worker_id = work_force.assigned_worker_id;
          }
          worker_services = { current: current_service, all: others_services };
        }
        if (worker_services && worker_services.current) {
          const last_attendance = await strapi
            .query("attendance-details")
            .findOne({
              assigned_worker_id: worker_services.current.assigned_worker_id,
              _sort: "created_at:DESC",
            });
          attendance_worker = last_attendance
            ? await strapi
                .query("new-attendance")
                .findOne({ id: last_attendance.attendance_id })
            : null;
        }

        const knex = strapi.connections.default;
        const sql_certificates_raw = `SELECT * FROM components_education_educations WHERE components_education_educations.worker_id=${worker_id}`;
        const sql_next_of_kin_raw = `SELECT * FROM components_next_of_kin_next_of_kins WHERE components_next_of_kin_next_of_kins.worker_id=${worker_id}`;
        const worker_info = await strapi
          .query("service-providers")
          .findOne({ id: worker_id });

        if (worker_id) {
          workers_assessments_results = await getAssessmentResult(worker_id);
        }

        const certificates = await knex.raw(sql_certificates_raw);
        const next_of_kin = await knex.raw(sql_next_of_kin_raw);

        if (worker_info && next_of_kin[0] && certificates[0] && work_force) {
          const needed_info = {
            id: worker_info.id,
            first_name: worker_info.first_name,
            last_name: worker_info.last_name,
            district: worker_info.district,
            sector: worker_info.sector,
            province: worker_info.province,
            address: worker_info.address,
            phone_number: worker_info.phone_number,
            date_of_birth: worker_info.date_of_birth,
            gender: worker_info.gender,
            nid_number: worker_info.nid_number,
            is_active: work_force.is_active,
            rssb_number: worker_info.rssb_code,
          };
          worker = {
            worker_information: {
              worker_profile_image_url: "https://via.placeholder.com/600x400",
              worker: needed_info,
              services: worker_services,
              worker_rates: worker_services,
              verification: {
                phone_number_is_verified: worker_info.is_verified,
                worker_is_verified: worker_info.is_verified,
                is_worker_active: worker_info.is_active,
              },
              assessments: workers_assessments_results,
              last_attendance: {
                date: attendance_worker ? attendance_worker.date : null,
                project_name: attendance_worker
                  ? _.find(
                      projects,
                      (p) =>
                        parseInt(p.id) ===
                        parseInt(attendance_worker.project_id)
                    ).name
                  : null,
              },
              date_onboarded: worker_info.created_at,
            },
            worker_details: {
              next_of_kin: next_of_kin[0],
              certificates: certificates[0],
            },
          };
        }
      }
      return worker;
    } catch (error) {
      console.log("error in getWorkerWeb", error);
      return null;
    }
  },
  async assignWorker(worker_ids, project_id, user_id) {
    const companies = await strapi.query("companies").find();
    if (companies) {
      let total_workers_assigned = 0;
      for (let index = 0; index < worker_ids.length; index++) {
        if (index === 0) {
          console.log(
            "ASSIGNING: ",
            total_workers_assigned,
            `workforce-assigning-status-${
              process.env.PUSHER_ATTENDANCE_CHANNEL
            }-${utils.replaceSpacesWithUnderscores(
              companies[0].company_name
            )}-${user_id}: ${utils.calculatePercentage(
              total_workers_assigned,
              0,
              worker_ids.length
            )}`
          );
          utils.eventPublisher(
            `workforce-assigning-status-${
              process.env.PUSHER_ATTENDANCE_CHANNEL
            }-${utils.replaceSpacesWithUnderscores(
              companies[0].company_name
            )}-${user_id}`,
            {
              entity_id: "workforce",
              action: "Assigning workers in progress",
              status: utils.calculatePercentage(
                total_workers_assigned,
                0,
                worker_ids.length
              ),
              current: total_workers_assigned,
              total: worker_ids.length,
            }
          );
        }

        for (
          let d = new Date(start_date);
          d <= new Date(end_date);
          d.setDate(d.getDate() + 1)
        ) {
          const worker_assigned = await strapi
            .query("new-assigned-workers")
            .findOne({
              worker_id: worker_ids[index],
              project_id: project_id,
            });
          if (!worker_assigned) {
            const assigned_worker = await strapi
              .query("new-assigned-workers")
              .create(
                {
                  worker_id: worker_ids[index],
                  project_id: project_id,
                  is_active: false,
                },
                "assignWorker"
              );
            if (assigned_worker.id) {
              const worker_rate = await strapi
                .query("worker-rates")
                .findOne({ assigned_worker_id: assigned_worker.id });
              if (worker_rate.service_id && worker_rate.value) {
                const project_rates = await strapi
                  .query("rates")
                  .find({ project_id: project_id });
                let existing_project_rates = [];
                if (project_rates.length >= 1) {
                  existing_project_rates = _.map(project_rates, (item) => {
                    return {
                      service_id: item.service_id,
                      maximum_rate: item.maximum_rate,
                    };
                  });
                  if (
                    !existing_project_rates.some(
                      (obj) =>
                        parseInt(obj.service_id) ===
                        parseInt(worker_rate.service_id)
                    )
                  ) {
                    existing_project_rates.push({
                      service_id: worker_rate.service_id,
                      maximum_rate: worker_rate.value,
                    });
                  }
                } else {
                  existing_project_rates = [
                    {
                      service_id: worker_rate.service_id,
                      maximum_rate: worker_rate.value,
                    },
                  ];
                }
                for (let z = 0; z < existing_project_rates.length; z++) {
                  const rate_to_add_exist = await strapi
                    .query("rates")
                    .findOne({
                      project_id: project_id,
                      service_id: existing_project_rates[z].service_id,
                    });
                  if (!rate_to_add_exist) {
                    await strapi.query("rates").create({
                      project_id: project_id,
                      service_id: existing_project_rates[z].service_id,
                      maximum_rate: existing_project_rates[z].maximum_rate,
                      status: true,
                      default_rate: 0,
                      advanced_rate: 0,
                      intermediate_rate: 0,
                      beginner_rate: 0,
                    });
                  }
                }
              }
            }
          } else {
            const allAssigned = await strapi
              .query("new-assigned-workers")
              .find({ worker_id: worker_ids[index], _limit: -1 });
            if (allAssigned && allAssigned.length >= 1) {
              for (let x = 0; x < allAssigned.length; x++) {
                await strapi
                  .query("new-assigned-workers")
                  .update({ id: allAssigned[x].id }, { is_active: false });
              }
              await strapi
                .query("new-assigned-workers")
                .update(
                  { id: worker_assigned.id },
                  { is_active: false, project_id: project_id },
                  "assignWorker"
                );
            }
          }
        }

        total_workers_assigned = total_workers_assigned + 1;
        console.log(
          "ASSIGNING: ",
          total_workers_assigned,
          `workforce-assigning-status-${
            process.env.PUSHER_ATTENDANCE_CHANNEL
          }-${utils.replaceSpacesWithUnderscores(
            companies[0].company_name
          )}-${user_id}: ${utils.calculatePercentage(
            total_workers_assigned,
            0,
            worker_ids.length
          )}`
        );
        utils.eventPublisher(
          `workforce-assigning-status-${
            process.env.PUSHER_ATTENDANCE_CHANNEL
          }-${utils.replaceSpacesWithUnderscores(
            companies[0].company_name
          )}-${user_id}`,
          {
            entity_id: "workforce",
            action: "Assigning workers in progress",
            status: utils.calculatePercentage(
              total_workers_assigned,
              0,
              worker_ids.length
            ),
            current: total_workers_assigned,
            total: worker_ids.length,
          }
        );
        if (total_workers_assigned === worker_ids.length) {
          global.all_workforces = await strapi
            .query("workforce")
            .find({ _limit: -1 });
        }
      }
      return true;
    }
  },
  async unAssignWorker(worker_ids, project_id) {
    for (let index = 0; index < worker_ids.length; index++) {
      const worker_assigned = await strapi
        .query("new-assigned-workers")
        .findOne({ worker_id: worker_ids[index], project_id: project_id });
      if (worker_assigned) {
        const workforce = await strapi
          .query("workforce")
          .findOne({ worker_id: worker_assigned.worker_id });
        if (workforce) {
          const update_workforce = await strapi
            .query("workforce")
            .update(
              { worker_id: worker_assigned.worker_id },
              { is_active: false, project_id: 0 }
            );
          if (update_workforce) {
            await strapi
              .query("new-assigned-workers")
              .delete({ id: worker_assigned.id });
          }
        }
      }
    }
    return true;
  },
  async sendSMSToWorker(worker_phones, message) {
    let response;
    let string_balance = await getAtStashBalancData();
    let balance = parseInt(string_balance);
    if (balance && !isNaN(balance)) {
      let sms_charge =
        worker_phones.length * (parseInt(message.length / 160) + 1) * 10;
      if (sms_charge < balance) {
        const apiInfo = {
          apiKey: process.env.AFRICA_S_TALKING_API_KEY,
          username: process.env.AFRICA_S_TALKING_USERNAME,
        };
        const senderID = "Fixa";
        let sender = [
          {
            phone_numbers: worker_phones,
            message: message ? message : "",
          },
        ];

        let sms = await sendSMS(sender, apiInfo, senderID);
        response = {
          status: "success",
          message: "SMS Sent",
          status_code: 200,
          data: sms,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          message: "Insufficient funds",
          status_code: 403,
          data: [],
          error: "",
          meta: "",
        };
      }
    } else {
      response = {
        status: "error",
        message: "balance not found",
        status_code: 404,
        data: [],
        error: "",
        meta: "",
      };
    }
    return response;
  },

  async momoValidatePhoneNumber(phone_number) {
    let { access_token } = await getMomoToken(
      process.env.MOMO_URL_DISB,
      process.env.MOMO_PRIMARY_KEY
    );
    const result = { is_valid: false };
    //if the number is length of above 8
    if (phone_number.length > 8) {
      const response = await axios.get(
        MOMO_URL_DISB +
          "v1_0/accountholder/msisdn/250" +
          phone_number +
          "/active",
        {
          headers: {
            "Content-Length": 0,
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
            "X-Target-Environment": MOMO_X_TARGET_ENV,
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      result.is_valid = response.data.result;
    } else {
      result.is_valid = false;
    }
    return result;
  },
  async getWorkerHistory(worker_id) {
    try {
      const knex = strapi.connections.default;
      let history = await knex.raw(
        "SELECT" +
          " t3.date AS date," + //date,
          " t5.name AS project, t5.id AS project_id," + // project and Id
          " t6.first_name AS supervisor, t6.id AS supervisor_id," + //supervisor and Id
          " t4.name AS shift, t4.id AS shift_id," + //shift and Id
          " t8.name AS service, t8.id AS service_id," + //service and Id
          " t1.attendance_id AS attendance_id," + //attendance_id and Id
          " t7.value AS daily_earnings" + // earnings
          " FROM new_assigned_workers AS t2" +
          " INNER JOIN attendance_details AS t1 ON t1.assigned_worker_id = t2.id" +
          " LEFT JOIN new_attendances AS t3 ON t1.attendance_id = t3.id" +
          " LEFT JOIN shifts AS t4 ON t3.shift_id = t4.id" +
          " LEFT JOIN projects AS t5 ON t3.project_id = t5.id" +
          " LEFT JOIN `users-permissions_user` AS t6 ON t3.supervisor_id = t6.id" +
          " LEFT JOIN worker_rates AS t7 ON t1.worker_rate_id = t7.id" +
          " LEFT JOIN services AS t8 ON t7.service_id = t8.id" +
          " WHERE t2.worker_id = " +
          worker_id
      );
      return history[0];
    } catch (err) {
      console.log("error to join", err);
    }
  },
  // Function to preprocess the NID number
  async nidNumberPreprocess(nid_number) {
    // Remove spaces in number
    if (nid_number && nid_number.toString().length > 0) {
      return nid_number.toString().replace(/\s/g, "");
    }
  },
  async authenticateWithRssbServerService() {
    /**
     * Authenticate with Rssb server  */
    try {
      const { token, expiration } = await authenticateWithRssbServer();
      return { token, expiration };
    } catch (error) {
      console.error("ERROR IN authenticateWithRssbServer ==>", error);
    }
  },
  // ******** RSSB Registration service **********
  /**
   * This accepts array of objects and register one by one at Rssb
   * @param {*} workers
   * @example [
   *    {
        firstName: "XXXXX",
        lastName: "XXXXX",
        dateOfBirth: "01/01/1920",
        nationalId: '0000000000000000',
        maskedPhoneNumberId: "0000000000000000",
        worker_id: "26"
      },...]
   */
  async workersRssbRegistration(workers) {
    let results = [];
    try {
      for (const worker of workers) {
        const knex = strapi.connections.default;
        const workerRssbCode = await knex("service_providers")
          .select("rssb_code")
          .where({ id: worker.worker_id })
          .first();
        if (!workerRssbCode.rssb_code) {
          results.push(result);
        }
      }
      return results;
    } catch (error) {
      console.error("ERROR IN workersRssbRegistration() ==>", error.message);
    }
  },

  // Function to retrieve all worker nid numbers
  /**
   * Receives attendance worker_ids, with assigned_worker_id
   * check permanent and casual worker
   * @returns RSSB ALL eligible national id
   */
  // TODO: call this after attendance created and getWorkerIds()
  async retrieveWorkerRssbIdNumbers(worker_ids) {
    try {
      const allWorkers = await getWorkerDays(worker_ids);
      const permanentWorkers = allWorkers.filter(
        (item) => item.working_days >= 30
      );
      if (!permanentWorkers || permanentWorkers.length <= 0) {
        throw new Error("No available Workers");
      }
      const allWorkerNids = _.reject(permanentWorkers, function (worker) {
        return _.isNull(worker.nid_number);
      });
      const results = await submitNidToRssb(allWorkerNids);
      verifyWorkers(allWorkerNids, results);
      return results;
    } catch (error) {
      console.log("RETURNING NID ERROR", error);
      throw new Error(error.message || "Invalid NID");
    }
  },

  async verifyBulkWorkers(all_temp_data, mode, user_id) {
    const companies = await strapi.query("companies").find();
    if (companies) {
      let data = [];
      const mtn_default_payment = {
        payment_method: 1,
        is_active: true,
        provider: "MTN",
      };
      if (mode === "live") {
        let total_workers_save = 0;
        const temp_data = all_temp_data.filter(
          (x) =>
            !x.phone_number_exist &&
            !x.first_name_error &&
            !x.last_name_error &&
            x.valid_nid &&
            !x.nid_exist
        );
        console.log(
          `*********** START SAVING ${temp_data.length} WORKERS ********************`
        );
        for (let i = 0; i < temp_data.length; i++) {
          const element = temp_data[i];
          if (!element.service_available) {
            if (utils.nameValidation(element.service)) {
              const knex = strapi.connections.default;
              const services_raw = "SELECT id,name FROM services";
              const services_query = await knex.raw(services_raw);
              const services = services_query[0];
              const is_service_in = services.find(
                (x) => x.name === element.service
              );
              if (!is_service_in) {
                const added_service = await strapi
                  .query("services")
                  .create({ name: element.service });
                if (added_service) {
                  element.service_id = added_service.id;
                  temp_data[i].service_id = added_service.id;
                }
              } else {
                element.service_id = is_service_in.id;
                temp_data[i].service_id = is_service_in.id;
              }
            }
          }
          if (i === 0) {
            console.log(
              total_workers_save,
              ". National_id",
              element.nid_number,
              `workforce-saving-status-${
                process.env.PUSHER_ATTENDANCE_CHANNEL
              }-${utils.replaceSpacesWithUnderscores(
                companies[0].company_name
              )}-${user_id}: ${utils.calculatePercentage(
                total_workers_save,
                0,
                temp_data.length
              )}`
            );
            utils.eventPublisher(
              `workforce-saving-status-${
                process.env.PUSHER_ATTENDANCE_CHANNEL
              }-${utils.replaceSpacesWithUnderscores(
                companies[0].company_name
              )}-${user_id}`,
              {
                entity_id: "workforce",
                action: "Saving workers in progress",
                status: utils.calculatePercentage(
                  total_workers_save,
                  0,
                  temp_data.length
                ),
                current: total_workers_save,
                total: temp_data.length,
              }
            );
          }
          element.services = [temp_data[i].service_id];
          mtn_default_payment.account_name = `${element.first_name} ${element.last_name}`;
          if (utils.phoneNumberValidation(element.phone_number)) {
            mtn_default_payment.account_number = element.phone_number;
            mtn_default_payment.is_verified = "nothing";
            mtn_default_payment.account_verified_desc =
              "This account number is not verified";
          } else {
            mtn_default_payment.account_number = "";
            mtn_default_payment.is_verified = "nothing";
            mtn_default_payment.account_verified_desc =
              "This account number is not verified";
          }
          mtn_default_payment.worker_id = 0;
          if (utils.phoneNumberValidation(element.phone_number)) {
            element.payment_methods = [mtn_default_payment];
          }
          const worker_saved = await strapi
            .query("service-providers")
            .create(element, "saveTempExcel");
          if (worker_saved) {
            total_workers_save = total_workers_save + 1;
            console.log(
              "SAVING: ",
              total_workers_save,
              ". National_id",
              element.nid_number,
              `workforce-saving-status-${
                process.env.PUSHER_ATTENDANCE_CHANNEL
              }-${utils.replaceSpacesWithUnderscores(
                companies[0].company_name
              )}: ${utils.calculatePercentage(
                total_workers_save,
                0,
                temp_data.length
              )}`
            );

            utils.eventPublisher(
              `workforce-saving-status-${
                process.env.PUSHER_ATTENDANCE_CHANNEL
              }-${utils.replaceSpacesWithUnderscores(
                companies[0].company_name
              )}-${user_id}`,
              {
                entity_id: "workforce",
                action: "Saving workers in progress",
                status: utils.calculatePercentage(
                  total_workers_save,
                  0,
                  temp_data.length
                ),
                current: total_workers_save,
                total: temp_data.length,
              }
            );

            element.worker_id = worker_saved.id;
            data.push(element);
          }
        }
      } else {
        data = all_temp_data;
      }
      let total_workers = 0;
      console.log(
        `*********** END ADDING WORKER START VERIFY ${data.length} WORKERS ********************`
      );

      for (let i = 0; i < data.length; i++) {
        if (mode === "live") {
          if (i === 0) {
            utils.eventPublisher(
              `workforce-verification-status-${
                process.env.PUSHER_ATTENDANCE_CHANNEL
              }-${utils.replaceSpacesWithUnderscores(
                companies[0].company_name
              )}-${user_id}`,
              {
                entity_id: "workforce",
                action: "Verification in progress",
                status: utils.calculatePercentage(
                  total_workers,
                  0,
                  data.length
                ),
                current: total_workers,
                total: data.length,
              }
            );
          }
        }
        const rssb_info = await module.exports.getWorkerInfoFromRssb(
          data[i].nid_number
        );
        let is_rssb_verified = null;
        let date_of_birth = null;
        let is_momo_verified_and_rssb = null;
        let is_momo_verified_and_rssb_desc = null;
        if (rssb_info.status === "success") {
          is_rssb_verified = "green";
          date_of_birth = moment(
            rssb_info.data.dateOfBirth,
            "DD/MM/YYYY"
          ).format("YYYY-MM-DD");
          const momo_verification = await accountVerification(
            "MTN",
            {
              account_number: data[i].phone_number,
              account_name: {
                first_name: data[i].first_name,
                last_name: data[i].last_name,
              },
              account_belong_to: "MTN",
            },
            true
          );
          if (momo_verification.status) {
            is_momo_verified_and_rssb =
              momo_verification.data.verification_result_boolean;
            is_momo_verified_and_rssb_desc =
              momo_verification.data.verification_result_desc;
            mtn_default_payment.account_name = `${data[i].first_name} ${data[i].last_name}`;
            if (utils.phoneNumberValidation(data[i].phone_number)) {
              mtn_default_payment.account_number = data[i].phone_number;
              mtn_default_payment.is_verified = is_momo_verified_and_rssb;
              mtn_default_payment.account_verified_desc =
                is_momo_verified_and_rssb_desc;
            } else {
              mtn_default_payment.account_number = "";
              mtn_default_payment.is_verified = "nothing";
              mtn_default_payment.account_verified_desc =
                "This account number is not verified";
            }
            mtn_default_payment.worker_id = data[i].worker_id;
            if (utils.phoneNumberValidation(data[i].phone_number)) {
              await strapi.query("service-providers").update(
                { id: data[i].worker_id },
                {
                  is_rssb_verified: is_rssb_verified,
                  is_momo_verified_and_rssb: is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc:
                    is_momo_verified_and_rssb_desc,
                  date_of_birth: date_of_birth,
                  payment_methods: [mtn_default_payment],
                }
              );
            } else {
              await strapi.query("service-providers").update(
                { id: data[i].worker_id },
                {
                  is_rssb_verified: is_rssb_verified,
                  is_momo_verified_and_rssb: is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc:
                    is_momo_verified_and_rssb_desc,
                  date_of_birth: date_of_birth,
                }
              );
            }
          }
        } else {
          is_rssb_verified = "nothing";
          const momo_verification = await accountVerification(
            "MTN",
            {
              account_number: data[i].phone_number,
              account_name: {
                first_name: data[i].first_name,
                last_name: data[i].last_name,
              },
              account_belong_to: "MTN",
            },
            false
          );
          if (momo_verification.status) {
            is_momo_verified_and_rssb =
              momo_verification.data.verification_result_boolean;
            is_momo_verified_and_rssb_desc =
              momo_verification.data.verification_result_desc;
            mtn_default_payment.account_name = `${data[i].first_name} ${data[i].last_name}`;
            if (utils.phoneNumberValidation(data[i].phone_number)) {
              mtn_default_payment.account_number = data[i].phone_number;
              mtn_default_payment.is_verified = is_momo_verified_and_rssb;
              mtn_default_payment.account_verified_desc =
                is_momo_verified_and_rssb_desc;
            } else {
              mtn_default_payment.account_number = "";
              mtn_default_payment.is_verified = "nothing";
              mtn_default_payment.account_verified_desc =
                "This account number is not verified";
            }
            mtn_default_payment.worker_id = data[i].worker_id;
            if (utils.phoneNumberValidation(data[i].phone_number)) {
              await strapi.query("service-providers").update(
                { id: data[i].worker_id },
                {
                  is_rssb_verified: is_rssb_verified,
                  is_momo_verified_and_rssb: is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc:
                    is_momo_verified_and_rssb_desc,
                  payment_methods: [mtn_default_payment],
                }
              );
            } else {
              await strapi.query("service-providers").update(
                { id: data[i].worker_id },
                {
                  is_rssb_verified: is_rssb_verified,
                  is_momo_verified_and_rssb: is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc:
                    is_momo_verified_and_rssb_desc,
                }
              );
            }
          }
        }
        total_workers = total_workers + 1;
        console.log(
          "VERIFICATION: ",
          total_workers,
          ". National_id",
          data[i].nid_number,
          `workforce-verification-status-${
            process.env.PUSHER_ATTENDANCE_CHANNEL
          }-${utils.replaceSpacesWithUnderscores(
            companies[0].company_name
          )}: ${utils.calculatePercentage(total_workers, 0, data.length)}`
        );
        if (mode === "live") {
          utils.eventPublisher(
            `workforce-verification-status-${
              process.env.PUSHER_ATTENDANCE_CHANNEL
            }-${utils.replaceSpacesWithUnderscores(
              companies[0].company_name
            )}-${user_id}`,
            {
              entity_id: "workforce",
              action: "Verification in progress",
              status: utils.calculatePercentage(total_workers, 0, data.length),
              current: total_workers,
              total: data.length,
            }
          );
        }
      }
    }
  },
};

const getServicesIds = (assigned_worker_id, worker_rates) => {
  let new_worker_rates = [];
  let assign_worker_rates = worker_rates.filter(
    (x) => x.assigned_worker_id == assigned_worker_id
  );
  for (let index = 0; index < assign_worker_rates.length; index++) {
    new_worker_rates.push(assign_worker_rates[index].service_id);
  }
  return new_worker_rates;
};

const getWorkerRateInfo = (assigned_worker_id, worker_rates) => {
  let new_worker_rates = [];
  let assign_worker_rates = worker_rates.filter(
    (x) => x.assigned_worker_id == assigned_worker_id
  );
  for (let index = 0; index < assign_worker_rates.length; index++) {
    new_worker_rates.push(assign_worker_rates[index].value);
  }
  return new_worker_rates;
};
const serviceExists = async (serviceId) => {
  const getService = await strapi.query("services").findOne({ id: serviceId });
  if (getService) {
    return getService;
  } else {
    return false;
  }
};
const phoneExists = async (phone) => {
  if (phone === "") {
    return false;
  } else {
    const getPhone = await strapi
      .query("service-providers")
      .findOne({ phone_number: phone });
    if (getPhone) {
      return getPhone.id;
    } else {
      return false;
    }
  }
};
const assignWorkerAttendance = async (obj, project_rates, workerData) => {
  let id = 0;
  try {
    let assigned = await strapi.query("new-assigned-workers").create(obj);
    if (assigned) {
      let rates = project_rates.filter(
        (item) => item.service_id === workerData.services
      );
      const entryWorkerRates = {
        assigned_worker_id: assigned.id,
        service_id: workerData.services,
        rate_type: workerData.daily_rate ? "negotiated" : "standard",
        value: workerData.daily_rate
          ? workerData.daily_rate
          : rates[0].beginner_rate,
      };
      let worker_rate = await strapi
        .query("worker-rates")
        .create(entryWorkerRates);
      if (worker_rate) {
        id = assigned.id;
      }
    }
  } catch (error) {
    console.log("error in assignWorkerAttendance ", error.message);
  }
  return id;
};
const iDNumberExists = async (idNumber) => {
  const getIdNumber = await strapi
    .query("service-providers")
    .findOne({ nid_number: idNumber });
  if (getIdNumber) {
    return getIdNumber.id;
  } else {
    return false;
  }
};
async function getAtStashBalancData() {
  let balance = "";
  const response = await axios.get(STASH_URL, {
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/json",
      Accept: "application/json",
      apiKey: AFRICA_S_TALKING_API_KEY,
    },
  });
  if (
    response.data.UserData.balance &&
    response.data.UserData.balance.length > 4
  ) {
    balance = response.data.UserData.balance.substring(3);
  }
  return balance;
}
const getAssessmentResult = async (worker_id) => {
  let assessment = [];
  let rate = "";
  let workforce = await strapi.query("workforce").findOne({ worker_id });
  if (workforce) {
    let workers_assessments = await strapi
      .query("workers-assessments")
      .findOne({ worker_id: worker_id, service_id: workforce.trade_id });
    if (workers_assessments) {
      if (
        workers_assessments.mean_score >= 80 &&
        workers_assessments.mean_score <= 100
      ) {
        rate = "advanced";
      } else if (
        workers_assessments.mean_score >= 51 &&
        workers_assessments.mean_score <= 79
      ) {
        rate = "intermediate";
      } else {
        rate = "beginner";
      }
      assessment.push({
        level: workers_assessments.assessment_level,
        rate: rate,
        mean_score: workers_assessments.mean_score,
      });
    }
  }
  return assessment;
};
const submitNidToRssb = async (allWorkerNids) => {
  let response = [];
  try {
    // url
    const rssbUrl = process.env.RSSB_AUTH_URL;
    const { token } = await authenticateWithRssbServer();
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    if (token && rssbUrl) {
      if (allWorkerNids.length > 0) {
        for (const nid of allWorkerNids) {
          try {
            const res = await axios.get(
              `${rssbUrl}employee/${nid?.nid_number}/phone-numbers`,
              config
            );
            if (res && res.data) {
              response.push({
                worker_id: nid.worker_id,
                first_name: res.data?.firstName,
                last_name: res.data?.lastName,
                date_of_birth: res.data?.dateOfBirth,
                nationalId: nid.nid_number,
                maskedPhoneNumberId: res.data?.phoneNumbers[0]?.id,
                phone_numbers: res.data.phoneNumbers,
              });
            }
          } catch (error) {
            console.error("error", error.message);
          }
        }
        return response;
      }
    }
  } catch (error) {
    throw new Error(error.message || "Incomplete NID, No worker found");
  }
};
const verifyWorkers = async (existingWorkers, rssbInformation) => {
  const results = [];
  for (const worker of existingWorkers) {
    for (const rssbWorker of rssbInformation) {
      try {
        if (worker.worker_id === rssbWorker.worker_id) {
          results.push(await verifyWorkerWithRssbInfo(worker, rssbWorker));
          break;
        }
      } catch (error) {
        console.error("Error verifying worker:", error);
      }
    }
  }
  return results;
};
