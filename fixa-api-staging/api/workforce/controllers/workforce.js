"use strict";
const moment = require("moment");
const { workerBuild, getWorkerDays } = require("../services/workforce");
const { getWorkerInfoFromRssb } = require("../../service-providers/services/service-providers");
const { registerWorkersToRssbService } = require("../../new-attendance/services/new-attendance");
let Validator = require('validatorjs');
const _ = require('underscore');
const Format = require('response-format');
const utils = require("../../../config/functions/utils");
const { accountVerification } = require("../../payment-methods/services/payment-methods");
const { getUserLevel } = require("../../user-admin-access/services/user-admin-access");
const { verifyBulkWorkers } = require("../../service-providers/services/service-providers");
module.exports = {
  async getWorkersClaim(ctx) { //TODO lcdamy
    let response = [];
    try {
      let all_workers = await strapi.query("workforce").find(ctx.query);

      if (all_workers.length > 0) {
        let all_workers_ids = all_workers.map((item) => item.worker_id);
        if (all_workers_ids.length > 0) {
          let all_service_providers = await strapi.query("service-providers").find({ id: all_workers_ids, _limit: -1 });
          if (all_service_providers.length > 0) {
            for (let index = 0; index < all_workers.length; index++) {
              const item = all_workers[index];
              let worker_payment_methods = all_service_providers.filter(itemWorker => {
                if (itemWorker.id.toString() === item.worker_id.toString()) {
                  return itemWorker;
                }
              });
              if (worker_payment_methods.length > 0) {

                response.push({ ...item, payment_methods: worker_payment_methods[0].payment_methods });
              } else {
                response.push({ ...item, payment_methods: [] });
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('error in getWorkersClaim ', error.message);
    }
    return response;
  },
  async workerTaxes(ctx) {
    const knex = strapi.connections.default;
    let response;
    let rules = {
      'start_date': 'required|string',
      'end_date': 'required|string',
      'project_id': 'required|integer',
    };
    try {
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let all_attendances = [];
        let attendance_sql_raw = "";
        if (request_body.project_id.toString() != '0') {
          let all_attendances = await strapi.query("new-attendance").find({
            date_gte: request_body.start_date,
            date_lte: request_body.end_date,
            _limit: -1,
            project_id: request_body.project_id,
          });
          let attendance_ids_all = all_attendances.map((item) => item.id);

          attendance_sql_raw = `SELECT
        t3.worker_id,
        t1.date,
        t4.first_name,
        t4.last_name
        FROM new_attendances AS t1
        LEFT JOIN attendance_details AS t2 ON t1.id = t2.attendance_id
        LEFT JOIN new_assigned_workers AS t3 on t2.assigned_worker_id = t3.id
        LEFT JOIN service_providers AS t4 on t3.worker_id = t4.id
        WHERE t1.id IN (${attendance_ids_all})
        `;
        } else {
          let all_attendances = await strapi.query("new-attendance").find({
            date_gte: request_body.start_date,
            date_lte: request_body.end_date,
            _limit: -1,
          });
          let attendance_ids_all = all_attendances.map((item) => item.id);
          attendance_sql_raw = `SELECT
        t3.worker_id,
        t1.date,
        t4.first_name,
        t4.last_name
        FROM new_attendances AS t1
        LEFT JOIN attendance_details AS t2 ON t1.id = t2.attendance_id
        LEFT JOIN new_assigned_workers AS t3 on t2.assigned_worker_id = t3.id
        LEFT JOIN service_providers AS t4 on t3.worker_id = t4.id
        WHERE t1.id IN (${attendance_ids_all})
        `;
        }
        let attendance_data = await knex.raw(attendance_sql_raw);
        let attendance_details_worker = attendance_data;
        console.log('attendance found ', attendance_details_worker[0].length);
        const workersListFilteredDates = new Map();
        attendance_details_worker[0].forEach((obj) => {
          const { worker_id, date, first_name, last_name } = obj;
          let new_date = moment(date, 'DD/MM/YYYY').format("YYYY-MM-DD");
          if (!workersListFilteredDates.has(worker_id)) {
            workersListFilteredDates.set(worker_id, new Map());
          }

          const datesMap = workersListFilteredDates.get(worker_id);
          if (!datesMap.has(new_date)) {
            datesMap.set(new_date, true);
          }

        });
        console.log('workersListFilteredDates found ', workersListFilteredDates.size);
        workersListFilteredDates.forEach((datesMap, worker_id) => {
          const datesCount = datesMap.size;
          all_attendances.push({ "worker_id": worker_id, "date_count": datesCount });
        });

        const payment_transactions_worker_ids = new Map();
        let payments = [];
        if (request_body.project_id.toString() != '0') {
          payments = await strapi.query('payments').find({ project_id: request_body.project_id, _limit: -1 });
        } else {
          payments = await strapi.query('payments').find({ _limit: -1 });

        }
        if (payments.length !== 0) {
          let payments_ids = payments.map((item) => item.id);
          let payment_transactions = await strapi.query('payroll-transactions').find({ payment_id: payments_ids, _limit: -1 });
          payment_transactions.forEach((obj) => {
            const { worker_id, worker_name } = obj;
            payment_transactions_worker_ids.set(worker_id, worker_name);
          })
        }
        let workers = [];
        console.log('all_attendances found ', all_attendances.length, "---", all_attendances[0]);
        all_attendances.forEach((obj) => {
          const id = `${obj.worker_id}`;
          if (!isNaN(id)) {
            if (payment_transactions_worker_ids.has(obj.worker_id.toString())) {

              const workerPayroll = payment_transactions_worker_ids.get(id);
              if (workerPayroll) {
                workers.push({ name: workerPayroll, worker_id: obj.worker_id, number_of_days: obj.date_count })
              }
            }
          }
        })
        console.log('workers found ', workers.length);
        const final_payment_transactions_worker_ids = new Map();
        let payment_workers = [];
        let payment_workers_ids = [];
        let payroll_transactions_workers = [];
        if (request_body.project_id.toString() != '0') {
          payment_workers = await strapi.query('payments').find({ start_date_gte: '2023-11-01', start_date_lte: '2023-11-30', project_id: request_body.project_id, _limit: -1 });
          payment_workers_ids = payment_workers.map((item) => item.id);
        } else {
          payment_workers = await strapi.query('payments').find({ start_date_gte: '2023-11-01', start_date_lte: '2023-11-30', _limit: -1 });
          payment_workers_ids = payment_workers.map((item) => item.id);
        }
        let final_workers = [];
        if (payment_workers_ids.length > 0) {
          payroll_transactions_workers = await strapi.query('payroll-transactions').find({ payment_id: payment_workers_ids, _limit: -1 });
        }
        console.log('Transactions ', payment_workers_ids.length, payroll_transactions_workers.length);
        for (let index = 0; index < workers.length; index++) {
          const element = workers[index];
          const idd = `${element.worker_id}`;
          if (!isNaN(idd)) {
            let worker_transaction = payroll_transactions_workers.filter((item) => {
              const iddd = `${item.worker_id}`;
              if (iddd === element.worker_id.toString()) {
                return item;
              }
            });
            let sum = 0;
            if (worker_transaction.length > 0) {
              sum = worker_transaction.reduce((sum, item) => {
                return sum + parseInt(item.take_home);
              }, 0);
            }
            // if (parseInt(element.number_of_days.toString()) >= parseInt(process.env.DEFAULT_WORKING_DAYS.toString())) {
            final_workers.push({ ...element, total_amount_november: sum });
            // }
          }
        }
        ctx.response.status = 200;
        response = {
          status: "success",
          data: final_workers,
          error: ""
        };
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validation.failedRules
        };
      }
    } catch (error) {
      console.log('error in workerTaxes', error.message);
      ctx.response.status = 400;
      response = {
        status: "failed",
        error: error.message,
        data: {}
      }
    }
    return response;
  },
  async verifyWorkerInDashBoard(ctx) {
    let response = {
      status: "failed",
      message: "",
      data: {}
    };
    try {
      const knex = strapi.connections.default;
      let assigned_workers_sql_raw = "SELECT worker_id FROM new_assigned_workers WHERE project_id >=1";
      let attendancelist_workers_sql_raw = "SELECT worker_id FROM attendancelists";
      let assigned_workers_query = await knex.raw(assigned_workers_sql_raw);
      let attendancelist_workers_query = await knex.raw(attendancelist_workers_sql_raw);
      if ((assigned_workers_query[0].length >= 1) && (attendancelist_workers_query[0].length >= 1)) {
        response.status = "success";
        response.message = "data found";
        let new_assigned_workers_data = _.uniq(_.map(assigned_workers_query[0], i => i.worker_id));
        let attendancelists_data = _.uniq(_.map(attendancelist_workers_query[0], i => i.worker_id));
        let new_assigned_workers_sorted = new_assigned_workers_data.sort(compareNumbers);
        let attendancelists_sorted = attendancelists_data.sort(compareNumbers);

        let answer = [];
        for (let x = 0; x < new_assigned_workers_sorted.length; x++) {
          let is_id_in = _.find(attendancelists_sorted, num => new_assigned_workers_sorted[x] == num)
          if (!is_id_in) {
            answer.push(new_assigned_workers_sorted[x]);
          }
        }
        response.data = {
          new_assigneds: _.size(new_assigned_workers_sorted),
          attendance_lists: _.size(attendancelists_sorted),
          worker_that_exist_in_assigned_but_not_attendance: answer,
          worker_that_exist_in_assigned_but_not_attendance_count: answer.length,
        };
      } else {
        response.message = "No data found";
        response.data = {};
      }
    } catch (error) {
      console.log("Error happened in activateRateType()", error.message);
    }
    return response;
  },
  async rssbWorkersRegistration(ctx) {
    let response;
    try {
      let rules = {
        worker_ids: "required|array"
      };

      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { worker_ids } = ctx.request.body;
        if (worker_ids.length > 0) {
          registerWorkersToRssbService(worker_ids);
          ctx.response.status = 200;
          response = {
            message: "Starting creating RSSB code"
          }
        } else {
          ctx.response.status = 400;
          response = {
            message: "Empty worker ids"
          }
        }

      } else {
        ctx.response.status = 400;
        response = {
          message: "Body not validated"
        }
      }
    } catch (error) {
      ctx.response.status = 500;
      console.log("Error happened in activateRateType()", error.message);
      response = {
        message: error.message
      }
    }
    return response;
  },
  async checkPermanentWorkers(ctx) {
    let response = { status: "failed", data: [] };
    const { worker_ids, project_id } = ctx.request.body;
    let data = [];
    if (worker_ids.length > 0) {
      if (project_id) {
        data = await getWorkerDays(worker_ids, project_id);
      } else {
        data = await getWorkerDays(worker_ids)
      }
      response.status = 'success';
      response.data = data;
    }
    return response
  },
  async activateRateType(ctx) {
    let response = {
      status_code: 200,
      status: "success",
      message: "",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      let rules = {
        workforce_data: "required|array", // {"assigned_worker_id":0,"service_id":0}
        rate_type: "required|string",
      };

      let validation = new Validator(ctx.request.body, rules);

      if (validation.passes()) {
        const { workforce_data, rate_type } = ctx.request.body;

        // check rate type
        if (rate_type === 'standard') {
          for (let index = 0; index < workforce_data.length; index++) {
            const item = workforce_data[index];
            let assigned_worker = await strapi.query("new-assigned-workers").findOne({ id: item.assigned_worker_id });
            if (assigned_worker) {
              let project = await strapi.query("projects").findOne({ id: assigned_worker.project_id });

              if (project) {
                // find projet rates
                let project_rate = await strapi.query("rates").findOne({ project_id: project.id, service_id: item.service_id });
                if (project_rate) {
                  let worker_assessment = await strapi.query("workers-assessments").findOne({ service_id: item.service_id, worker_id: assigned_worker.worker_id });
                  if (worker_assessment) {
                    let mean_score = worker_assessment.mean_score;
                    switch (true) {
                      case mean_score >= 0 && mean_score <= 50: // beginner
                        await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.beginner_rate });

                        break;
                      case mean_score >= 51 && mean_score <= 79: // intermediate
                        await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.intermediate_rate });

                        break;
                      case mean_score >= 80 && mean_score <= 100: //advanced
                        await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.advanced_rate });

                        break;
                      default:
                        break;
                    }
                  } else {
                    await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.beginner_rate });
                  }

                }
              }

            }

          }
        } else if (rate_type === 'negotiated') {
          for (let index = 0; index < workforce_data.length; index++) {
            const item = workforce_data[index];
            let worker_rate = await strapi.query("worker-rates").findOne({ service_id: item.service_id, assigned_worker_id: item.assigned_worker_id, rate_type: rate_type, _sort: 'created_at:DESC' });
            if (worker_rate) {
              await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: item.assigned_worker_id, value: worker_rate.value });
            } else {
              // get project
              let assigned_worker = await strapi.query("new-assigned-workers").findOne({ id: item.assigned_worker_id });
              if (assigned_worker) {
                let project = await strapi.query("projects").findOne({ id: assigned_worker.project_id });
                if (project) {
                  let project_rate = await strapi.query("rates").findOne({ project_id: project.id, service_id: item.service_id });
                  if (project_rate) {
                    let worker_assessment = await strapi.query("workers-assessments").findOne({ service_id: item.service_id, worker_id: assigned_worker.worker_id });
                    if (worker_assessment) {
                      let mean_score = worker_assessment.mean_score;
                      switch (true) {
                        case mean_score >= 0 && mean_score <= 50: // beginner
                          await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.beginner_rate });

                          break;
                        case mean_score >= 51 && mean_score <= 79: // intermediate
                          await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.intermediate_rate });

                          break;
                        case mean_score >= 80 && mean_score <= 100: //advanced
                          await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.advanced_rate });

                          break;
                        default:
                          break;
                      }
                    } else {
                      await strapi.query("worker-rates").create({ rate_type: rate_type, service_id: item.service_id, assigned_worker_id: assigned_worker.id, value: project_rate.beginner_rate });
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        ctx.response.status = 400;
        let firstValue = Object.values(validation.errors.all())[0];
        console.log("Error happened in activateRateType()", error.message);
        response.errors.push(`${firstValue}`)
        response.status_code = 400;
        response.status = "failure";
      }

    } catch (error) {
      console.log("Error happened in activateRateType()", error.message);
      response.errors.push(`${error.message}`);
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }
    return response;
  },
  async workForceBuild(ctx) {
    let response;
    const rules = {
      workers_to_build: 'required'
    };
    let build_response = [];

    try {
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { workers_to_build } = ctx.request.body;
        for (let index = 0; index < workers_to_build.length; index++) {
          const worker_build = await workerBuild(workers_to_build[index].worker_id, workers_to_build[index].project_id);
          build_response.push(worker_build);
        }
        response = {
          status: "Success",
          data: build_response,
          errors: "workers_to_build received",
          meta: [],
        };
      } else {
        response = {
          status: "failed",
          data: build_response,
          errors: "workers_to_build required",
          meta: [],
        };
      }

    } catch (error) {
      response = {
        status: "failed",
        data: build_response,
        errors: error.message,
        meta: [],
      };
    }
    return response;
  },
  /** 
   * Function that performs workforce verification by 
   * checking worker details against external APIs like RSSB and Momo.
   * Performs workforce verification by checking worker details against external RSSB and Momo APIs.
   * This function queries the database to get workers that need to be verified, 
   * then loops through each one to call the getWorkerInfoFromRssb API. If the call is successful,
   *  it updates the worker details from the response.
   * @returns {Object} The API response. 
  */
  async rssbMomoWorkforceVerification(ctx) {
    const response = {
      status: "failed",
      data: {},
      errors: "",
      meta: [],
    };
    try {
      const knex = strapi.connections.default;
      const workers_to_build_raw = "SELECT id,nid_number,phone_number,first_name,last_name FROM service_providers"; // You can change this if you want to check all the worker in the system. (where is_momo_verified_and_rssb_desc is NULL or is_momo_verified_and_rssb_desc='')
      const workers_to_build_query = await knex.raw(workers_to_build_raw);
      console.log(`*************** We are going to search the payment method of ${workers_to_build_query[0].length} workers **************`);
      for (let index = 0; index < workers_to_build_query[0].length; index++) {
        // update worker
        let result_is_rssb_verified = "nothing";
        let firstname = "";
        let lastname = "";
        let dob = null;
        let result_is_momo_verified_and_rssb = "red";
        let result_is_momo_verified_and_rssb_desc = "";
        let momo_account_name = "";
        let use_rssb = false;
        if (workers_to_build_query[0][index] && workers_to_build_query[0][index].nid_number && utils.nidValidation(workers_to_build_query[0][index].nid_number)) { //Rwanda
          momo_account_name = `${workers_to_build_query[0][index].first_name} ${workers_to_build_query[0][index].last_name}`;
          const worker_build_rssb = await getWorkerInfoFromRssb(workers_to_build_query[0][index].nid_number);
          if (worker_build_rssb.status === "success") {
            use_rssb = true;
            result_is_rssb_verified = "green";
            firstname = worker_build_rssb.data.firstName;
            lastname = worker_build_rssb.data.lastName;
            dob = moment(worker_build_rssb.data.dateOfBirth, 'DD/MM/YYYY').format("YYYY-MM-DD");
            const momo_verification = await accountVerification("MTN", { account_number: workers_to_build_query[0][index].phone_number, account_name: { first_name: firstname, last_name: lastname }, account_belong_to: "MTN" }, true);
            if (momo_verification.status) {
              result_is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
              result_is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
              momo_account_name = momo_verification.data.verification_result_account_name;
            }
          } else {
            const momo_verification = await accountVerification("MTN", { account_number: workers_to_build_query[0][index].phone_number, account_name: { first_name: workers_to_build_query[0][index].first_name, last_name: workers_to_build_query[0][index].last_name }, account_belong_to: "MTN" }, false);
            if (momo_verification.status) {
              result_is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
              result_is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
              momo_account_name = momo_verification.data.verification_result_account_name;
            }
          }
        } else {// foreigner
          result_is_rssb_verified = "nothing";
          const momo_verification = await accountVerification("MTN", { account_number: workers_to_build_query[0][index].phone_number, account_name: { first_name: workers_to_build_query[0][index].first_name, last_name: workers_to_build_query[0][index].last_name }, account_belong_to: "MTN" }, false);
          if (momo_verification.status) {
            result_is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
            result_is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
            momo_account_name = momo_verification.data.verification_result_account_name;
          }
        }

        const mtn_default_payment = { payment_method: 1, is_active: true, provider: "MTN" };
        mtn_default_payment.account_name = momo_account_name;
        if (utils.phoneNumberValidation(workers_to_build_query[0][index].phone_number)) {
          mtn_default_payment.account_number = workers_to_build_query[0][index].phone_number;
          mtn_default_payment.is_verified = result_is_momo_verified_and_rssb;
          mtn_default_payment.account_verified_desc = result_is_momo_verified_and_rssb_desc;
        } else {
          mtn_default_payment.account_number = "";
          mtn_default_payment.is_verified = "nothing";
          mtn_default_payment.account_verified_desc = "";
        }
        mtn_default_payment.worker_id = workers_to_build_query[0][index].id;
        if (use_rssb) {
          await strapi.query("service-providers").update({ id: workers_to_build_query[0][index].id }, { is_rssb_verified: result_is_rssb_verified, is_momo_verified_and_rssb: result_is_momo_verified_and_rssb, is_momo_verified_and_rssb_desc: result_is_momo_verified_and_rssb_desc, firstname: firstname, lastname: lastname, date_of_birth: dob, payment_methods: [mtn_default_payment] });
        } else {
          await strapi.query("service-providers").update({ id: workers_to_build_query[0][index].id }, { is_rssb_verified: result_is_rssb_verified, is_momo_verified_and_rssb: result_is_momo_verified_and_rssb, is_momo_verified_and_rssb_desc: result_is_momo_verified_and_rssb_desc, payment_methods: [mtn_default_payment] });
        }
        let count = index + 1;
        console.log(`${count}. Updated worker with id ${workers_to_build_query[0][index].id} after checking rssb and momo account holder`);
      }
      response.status = "success";
    } catch (error) {
      response.errors = error.message;
    }
    return response;
  },
  async buildWorkforce(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      runWorkforceBuild();
    } catch (error) {
      console.log("Error happend in /workforce/buildWorkforce() ", error);
      response.status_code = 400;
      response.status = "failure";
      response.errors.push(error);
    }
    return response;
  },
  async exportWorkforce(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      let entity;
      let queries = ctx.query;
      queries._sort = "updated_at:desc";
      queries._limit = -1;

      delete queries.current_page;
      delete queries._currentpage;
      delete queries._start;

      let project_ids = [];
      const user_level = await getUserLevel(ctx.state.user.id);
      if (user_level.status) {
        if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
          const projects = await strapi.query("projects").find({ client_id: user_level.data.client_info.id });
          project_ids = projects.map((item) => {
            return item.id
          });
        } else if (user_level.data.user_level === "level_1") {
          project_ids = [];
        } else {
          project_ids = [];
        }

        if (project_ids.length >= 1) {
          queries = { ...queries, project_id: project_ids };
        } else {
          queries = queries;
        }

        if (queries.hasOwnProperty("search")) {
          let new_queries = { _q: queries.search, ...queries };
          delete new_queries.search;
          entity = await strapi.query("workforce").search(new_queries);
        } else {
          entity = await strapi.query("workforce").find(queries);
        }
        response.data = entity;
      }
    } catch (error) {
      console.log("error in exportWorkforce ", error.message);
      response.status_code = 400;
      response.status = "failure";
      response.errors.push(error);
    }
    return response;
  },
  async verifyWorkerInWorkforce(ctx) {
    let response;
    try {
      const workers = await strapi.query('service-providers').find({ _limit: -1 });
      const workforces = await strapi.query('workforce').find({ _limit: -1 });
      const valid_worker_phone = workforces.filter((item) => utils.phoneNumberValidation(item.phone_number));
      let worker_with_not_active = [];
      for (let i = 0; i < valid_worker_phone.length; i++) {
        if (utils.isValidObject(valid_worker_phone[i].default_payment_method)) {
          if (valid_worker_phone[i].default_payment_method.is_verified === "blue" && valid_worker_phone[i].is_rssb_verified === "green") {
            const worker = workers.find((x) => parseInt(x.id) === parseInt(valid_worker_phone[i].worker_id));
            worker_with_not_active.push(worker);
          }
        }
      }
      const worker_to_verify = worker_with_not_active.map((item) => {
        item.worker_id = item.id;
        return item;
      });
      const phone_to_remove = ["0799253415", "0794455522", "0792858441", "0792622496", "0792257177", "0791603010", "079154993.", "0791548817", "0790218779", "0790200542", "0789295753", "0789126100", "078898541.", "0788593212", "0786923666", "0786063812", "0784799361", "0784442553", "0782864795", "0781769365", "0781630708", "0781237464", "0780845749", "07806172298", "0726288058", "0780982026"];
      let cleaned_worker_to_verify = [];
      for (let x = 0; x < worker_to_verify.length; x++) {
        const is_phone_found = phone_to_remove.find((z) => z === worker_to_verify[x].phone_number);
        if (!is_phone_found) {
          cleaned_worker_to_verify.push(worker_to_verify[x]);
        }
      }

      ctx.response.status = 200;
      response = Format.success(`Going to verify ${worker_to_verify.length} workers`, worker_to_verify);
      verifyBulkWorkers(cleaned_worker_to_verify, "background");
    } catch (error) {
      ctx.response.status = 500;
      console.log("error in verifyWorkerInWorkforce", error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  }
};

function compareNumbers(a, b) {
  return a - b;
}

const runWorkforceBuild = async () => {
  try {
    /**
     * TO DO
     * For every workers, add info
     */
    const workers = await strapi.query("service-providers").find({ _limit: -1 });
    console.log(`********** STARTING BUILDING WORKFORCE OF ${workers.length} WORKERS **************`);
    for (var i = 0; i < workers.length; i++) {
      const assignedWorker = await strapi.services["new-assigned-workers"].findOne({ worker_id: workers[i].id, _sort: "created_at:DESC" });
      const worker = await strapi.services["service-providers"].findOne({ id: workers[i].id });

      let isActive = false;
      let isAssessed = false;
      let projectId = 0;
      let projectName = "-";
      let workerRate = {};
      let project = {};
      let trade = {};
      let attendanceDetail = {};
      let assigned_worker_id = 0;
      let rate_type = "";
      let default_payment_method = {};
      if (assignedWorker) {
        isActive = assignedWorker.is_active;
        assigned_worker_id = assignedWorker.id;
        project = await strapi.services["projects"].findOne({ id: assignedWorker.project_id, });
        if (project) {
          projectName = project.name;
          projectId = project.id;
        }
        workerRate = await strapi.services["worker-rates"].findOne({ assigned_worker_id: assignedWorker.id, _sort: "created_at:DESC", });
        if (workerRate) {
          trade = await strapi.services["services"].findOne({ id: workerRate.service_id, });
          rate_type = workerRate.rate_type;
        } else {
          rate_type = "negotiated"; //Todo Normaly a worker who has registered should come with a default rate and this would not cause any issue, but we will come to it.
        }
        attendanceDetail = await strapi.services["attendance-details"].findOne({ assigned_worker_id: assignedWorker.id, _sort: "created_at:DESC" });
      }

      if (worker) {
        isAssessed = worker.assessments?.length > 0 ? true : false;
      }

      let workforceCountry = "";
      if (utils.nidValidation(workers[i].nid_number)) {
        workforceCountry = "Rwanda";
      } else if (workers[i]?.country?.country_name) {
        workforceCountry = workers[i]?.country?.country_name;
      } else {
        workforceCountry = "-";
      }
      if (workers[i].payment_methods.length >= 1) {
        default_payment_method = workers[i].payment_methods.find(item => {
          if (item.is_active) {
            return item;
          }
        });
      }
      const workforce = {
        assigned_worker_id: assigned_worker_id,
        rate_type: rate_type,
        worker_id: workers[i].id,
        names: `${workers[i].first_name} ${workers[i].last_name}`,
        phone_number: workers[i].phone_number,
        is_phone_number_verified: workers[i].is_verified ? workers[i].is_verified : false,
        national_id: workers[i].nid_number,
        is_active: isActive,
        is_assessed: isAssessed,
        last_attendance: attendanceDetail && attendanceDetail.created_at ? moment(attendanceDetail.created_at).format("YYYY-MM-DD") : null,
        assigned: projectId === 0 ? false : true,
        project_id: projectId,
        project_name: projectName,
        daily_earnings: workerRate && workerRate.value ? workerRate.value : 0,
        trade_id: trade && trade.id ? trade.id : 0,
        trade: trade && trade.name ? trade.name : "-",
        district: workers[i].district,
        province: workers[i].province,
        gender: workers[i].gender,
        date_onboarded: moment(workers[i].created_at).format("YYYY-MM-DD hh:mm:ss"),
        is_rssb_verified: (workers[i].is_rssb_verified === "blue") ? "nothing" : workers[i].is_rssb_verified,
        is_momo_verified_and_rssb: workers[i].is_momo_verified_and_rssb,
        is_momo_verified_and_rssb_desc: workers[i].is_momo_verified_and_rssb_desc,
        country: workforceCountry,
        default_payment_method: default_payment_method
      };

      const workforceEntry = await strapi.services['workforce'].findOne({ worker_id: workers[i].id });
      if (!workforceEntry) {
        await strapi.services['workforce'].create(workforce);
        console.log("INFO: Saved workforce for worker id::", workers[i].id);
      } else {
        await strapi.services['workforce'].update({ id: workforceEntry.id }, workforce);
        console.log("INFO: Updated workforce for worker id::", workers[i].id);
      }
    }
  } catch (error) {
    console.log("Error happend in runWorkforceBuild() ", error);
  }
};
