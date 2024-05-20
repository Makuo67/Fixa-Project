"use strict";
const moment = require("moment");
const _ = require("underscore");
const BUILD_WORKER_FORCE_URL = process.env.BUILD_WORKER_FORCE_URL;
const axios = require("axios");
const utils = require("../../../config/functions/utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {

  async getWorkerDays(workers_ids, project_id, end_date) {
    const knex = strapi.connections.default;
    let workers_response = [];
    for (let index = 0; index < workers_ids.length; index++) {
      const item = workers_ids[index];
      let assigned_worker = [];
      if (project_id && project_id.toString() != '0') {
        assigned_worker = await strapi.query("new-assigned-workers").find({ "worker_id": item, project_id: project_id });
      } else {
        assigned_worker = await strapi.query("new-assigned-workers").find({ "worker_id": item });
      }

      if (assigned_worker.length > 0) {
        let starting_date = "";
        if (process.env.RSSB_START_DATE && moment(process.env.RSSB_START_DATE).isValid() && end_date) {
          starting_date = `t2.date >= "${process.env.RSSB_START_DATE}" AND t2.date <= "${end_date}" AND`;
        }
        let assigned_worker_ids = assigned_worker.map((itemx) => itemx.id);
        let attendace_sql_raw = `SELECT
        t2.date,
        t4.phone_number,
        t4.nid_number,
        t4.first_name,
        t4.last_name,
        t4.date_of_birth,
        t4.rssb_code,
        t5.name
        FROM attendance_details AS t1
        LEFT JOIN new_attendances AS t2 ON t1.attendance_id = t2.id
        LEFT JOIN new_assigned_workers AS t3 on t1.assigned_worker_id = t3.id
        LEFT JOIN service_providers AS t4 on t3.worker_id = t4.id
        LEFT JOIN shifts AS t5 on t2.shift_id = t5.id
        WHERE ${starting_date} t1.assigned_worker_id IN (${assigned_worker_ids})
        `;
        let attendance_data = await knex.raw(attendace_sql_raw);
        let attendance_details_worker = attendance_data[0];
        if (attendance_details_worker.length > 0) {
          const uniqueArray = [];
          // const seenIds = new Set();
          const seenIds = [];
          for (let index = 0; index < attendance_details_worker.length; index++) {
            const obj = attendance_details_worker[index];
            let dateAttendance = moment(obj.date).format('YYYY-MM-DD')
            if (!seenIds.includes(dateAttendance)) {
              seenIds.push(dateAttendance);
              uniqueArray.push(obj);
            }
          }
          workers_response.push({
            "worker_id": item,
            "working_days": uniqueArray.length,
            "phone_number": uniqueArray[0].phone_number,
            "nid_number": uniqueArray[0].nid_number,
            "first_name": uniqueArray[0].first_name,
            "last_name": uniqueArray[0].last_name,
            "date_of_birth": uniqueArray[0].date_of_birth,
            "rssbCode": uniqueArray[0].rssb_code
          });
        } else {
          workers_response.push({ "worker_id": item, "working_days": 0, "phone_number": "", "nid_number": "" });
        }
      } else {
        workers_response.push({ "worker_id": item, "working_days": 0, "phone_number": "", "nid_number": "" });
      }
    }
    return workers_response;
  },
  async workerBuild(worker_id, project_id) {
    let response = {};
    try {
      const worker = await strapi.query("service-providers").findOne({ id: worker_id });
      if (worker && parseInt(project_id) >= 0) {
        let default_payment_method = {};
        if (worker.payment_methods.length >= 1) {
          default_payment_method = worker.payment_methods.find(item => {
            if (item.is_active) {
              return item;
            }
          });
        }
        const isAssessed = worker.assessments?.length > 0 ? true : false;
        const workeforce_worker = await strapi.query("workforce").findOne({ worker_id: worker_id });
        let workforceCountry = "";
        if (utils.nidValidation(worker.nid_number)) {
          workforceCountry = "Rwanda";
        } else if (worker?.country?.country_name) {
          workforceCountry = worker?.country?.country_name;
        } else {
          workforceCountry = "-";
        }
        if (workeforce_worker) {
          let assigned_worker = await strapi.query("new-assigned-workers").findOne({ worker_id: worker_id, project_id: project_id, _sort: 'created_at:DESC' });
          if (assigned_worker) {
            let project = await strapi.query("projects").findOne({ id: project_id });
            let worker_rate = await strapi.query("worker-rates").findOne({ assigned_worker_id: assigned_worker.id, _sort: 'created_at:DESC' });
            if (worker_rate) {
              let worker_attendance_detail = await strapi.query("attendance-details").findOne({ assigned_worker_id: assigned_worker.id, _sort: 'created_at:DESC' });
              let service = await strapi.query("services").findOne({ id: worker_rate.service_id });
              let workforce = {};
              if (worker_attendance_detail) {
                let attendance = await strapi.services['worker-profile'].getWorkerAttendance(worker_id, moment(worker.created_at), moment(worker_attendance_detail.created_at));
                workforce = {
                  assigned_worker_id: assigned_worker.id,
                  worker_id: worker_id,
                  phone_number: worker.phone_number,
                  is_phone_number_verified: worker.is_verified ? worker.is_verified : false,
                  national_id: worker.nid_number,
                  is_active: assigned_worker.is_active,
                  is_assessed: isAssessed,
                  last_attendance: moment(worker_attendance_detail.created_at).format('YYYY-MM-DD'),
                  assigned: project ? true : false,
                  project_id: project ? project.id : 0,
                  project_name: project ? project.name : "",
                  daily_earnings: worker_rate ? worker_rate.value : 0,
                  trade_id: service ? service.id : 0,
                  trade: service ? service.name : "",
                  district: worker.district,
                  province: worker.province,
                  gender: worker.gender,
                  names: `${worker.first_name} ${worker.last_name}`,
                  date_onboarded: moment(worker.created_at).format('YYYY-MM-DD'),
                  rate_type: worker_rate.rate_type,
                  attendance: attendance,
                  is_rssb_verified: worker.is_rssb_verified,
                  is_momo_verified_and_rssb: worker.is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc: worker.is_momo_verified_and_rssb_desc,
                  country: workforceCountry,
                  default_payment_method: default_payment_method
                }
              } else {
                workforce = {
                  assigned_worker_id: assigned_worker.id,
                  worker_id: worker_id,
                  phone_number: worker.phone_number,
                  is_phone_number_verified: worker.is_verified ? worker.is_verified : false,
                  national_id: worker.nid_number,
                  is_active: assigned_worker.is_active,
                  is_assessed: isAssessed,
                  assigned: project ? true : false,
                  project_id: project ? project.id : 0,
                  project_name: project ? project.name : "",
                  daily_earnings: worker_rate ? worker_rate.value : 0,
                  trade_id: service ? service.id : 0,
                  trade: service ? service.name : "",
                  district: worker.district,
                  province: worker.province,
                  gender: worker.gender,
                  names: `${worker.first_name} ${worker.last_name}`,
                  rate_type: worker_rate.rate_type,
                  date_onboarded: moment(worker.created_at).format('YYYY-MM-DD'),
                  is_rssb_verified: worker.is_rssb_verified,
                  is_momo_verified_and_rssb: worker.is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc: worker.is_momo_verified_and_rssb_desc,
                  country: workforceCountry,
                  default_payment_method: default_payment_method
                }
              }
              await strapi.query("workforce").update({ id: workeforce_worker.id }, workforce);
              console.log("workforce update for worker_id ::", worker_id);
              response = {
                status: 'Success',
                message: `Worker with id ${worker_id} workforce updated`
              }
            } else {
              let workforce = {};
              workforce = {
                assigned_worker_id: assigned_worker.id,
                worker_id: worker_id,
                phone_number: worker.phone_number,
                is_phone_number_verified: worker.is_verified ? worker.is_verified : false,
                national_id: worker.nid_number,
                is_active: assigned_worker.is_active,
                is_assessed: isAssessed,
                assigned: project ? true : false,
                project_id: project ? project.id : 0,
                project_name: project ? project.name : "",
                daily_earnings: 0,
                trade_id: 0,
                trade: "",
                district: worker.district,
                province: worker.province,
                gender: worker.gender,
                names: `${worker.first_name} ${worker.last_name}`,
                rate_type: "",
                date_onboarded: moment(worker.created_at).format('YYYY-MM-DD'),
                is_rssb_verified: worker.is_rssb_verified,
                is_momo_verified_and_rssb: worker.is_momo_verified_and_rssb,
                is_momo_verified_and_rssb_desc: worker.is_momo_verified_and_rssb_desc,
                country: workforceCountry,
                default_payment_method: default_payment_method
              }
              await strapi.query("workforce").update({ id: workeforce_worker.id }, workforce);
              console.log("workforce update for worker_id ::", worker_id);
              response = {
                status: 'Success',
                message: `Worker with id ${worker_id} workforce updated`
              }
            }
          }
        } else {
          let assigned_worker = await strapi.query("new-assigned-workers").findOne({ worker_id: worker_id, project_id: project_id, _sort: 'created_at:DESC' });
          if (assigned_worker) {
            let project;
            if (project_id.toString() !== '0') {
              project = await strapi.query("projects").findOne({ id: project_id });
            }
            let worker_rate = await strapi.query("worker-rates").findOne({ assigned_worker_id: assigned_worker.id, _sort: 'created_at:DESC' });
            if (worker_rate) {
              let service = await strapi.query("services").findOne({ id: worker_rate.service_id });
              let worker_attendance_detail = await strapi.query("attendance-details").findOne({ assigned_worker_id: assigned_worker.id, _sort: 'created_at:DESC' });
              let workforce = {};
              if (worker_attendance_detail) {
                let attendance = await strapi.services['worker-profile'].getWorkerAttendance(worker_id, moment(worker.created_at), moment(worker_attendance_detail.created_at));
                workforce = {
                  assigned_worker_id: assigned_worker.id,
                  worker_id: worker_id,
                  phone_number: worker.phone_number,
                  is_phone_number_verified: worker.is_verified ? worker.is_verified : false,
                  national_id: worker.nid_number,
                  is_active: assigned_worker.is_active,
                  is_assessed: isAssessed,
                  last_attendance: moment(worker_attendance_detail.created_at).format('YYYY-MM-DD'),
                  assigned: project ? true : false,
                  project_id: project ? project.id : 0,
                  project_name: project ? project.name : "",
                  daily_earnings: worker_rate ? worker_rate.value : 0,
                  trade_id: service ? service.id : 0,
                  trade: service ? service.name : "",
                  district: worker.district,
                  province: worker.province,
                  gender: worker.gender,
                  names: `${worker.first_name} ${worker.last_name}`,
                  rate_type: worker_rate.rate_type,
                  date_onboarded: moment(worker.created_at).format('YYYY-MM-DD'),
                  attendance: attendance,
                  is_rssb_verified: worker.is_rssb_verified,
                  is_momo_verified_and_rssb: worker.is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc: worker.is_momo_verified_and_rssb_desc,
                  country: workforceCountry,
                  default_payment_method: default_payment_method
                }
              } else {
                workforce = {
                  assigned_worker_id: assigned_worker.id,
                  worker_id: worker_id,
                  phone_number: worker.phone_number,
                  is_phone_number_verified: worker.is_verified ? worker.is_verified : false,
                  national_id: worker.nid_number,
                  is_active: assigned_worker.is_active,
                  is_assessed: isAssessed,
                  assigned: project ? true : false,
                  project_id: project ? project.id : 0,
                  project_name: project ? project.name : "",
                  daily_earnings: worker_rate ? worker_rate.value : 0,
                  trade_id: service ? service.id : 0,
                  trade: service ? service.name : "",
                  district: worker.district,
                  province: worker.province,
                  gender: worker.gender,
                  names: `${worker.first_name} ${worker.last_name}`,
                  rate_type: worker_rate.rate_type,
                  date_onboarded: moment(worker.created_at).format('YYYY-MM-DD'),
                  is_rssb_verified: worker.is_rssb_verified,
                  is_momo_verified_and_rssb: worker.is_momo_verified_and_rssb,
                  is_momo_verified_and_rssb_desc: worker.is_momo_verified_and_rssb_desc,
                  country: workforceCountry,
                  default_payment_method: default_payment_method
                }
              }
              await strapi.query("workforce").create(workforce);
              console.log("workforce create for worker_id ::", worker_id);
              response = {
                status: 'Success',
                message: `Worker with id ${worker_id} workforce created`
              }
            } else {
              let workforce = {};
              workforce = {
                assigned_worker_id: assigned_worker.id,
                worker_id: worker_id,
                phone_number: worker.phone_number,
                is_phone_number_verified: worker.is_verified ? worker.is_verified : false,
                national_id: worker.nid_number,
                is_active: assigned_worker.is_active,
                is_assessed: isAssessed,
                assigned: project ? true : false,
                project_id: project ? project.id : 0,
                project_name: project ? project.name : "",
                daily_earnings: 0,
                trade_id: 0,
                trade: "",
                district: worker.district,
                province: worker.province,
                gender: worker.gender,
                names: `${worker.first_name} ${worker.last_name}`,
                rate_type: "",
                date_onboarded: moment(worker.created_at).format('YYYY-MM-DD'),
                is_rssb_verified: worker.is_rssb_verified,
                is_momo_verified_and_rssb: worker.is_momo_verified_and_rssb,
                is_momo_verified_and_rssb_desc: worker.is_momo_verified_and_rssb_desc,
                country: workforceCountry,
                default_payment_method: default_payment_method
              }
              await strapi.query("workforce").create(workforce);
              console.log("workforce create for worker_id ::", worker_id);
              response = {
                status: 'Success',
                message: `Worker with id ${worker_id} workforce created`
              }
            }
          }
        }
      }
      else {
        response = {
          status: 'failed',
          message: `Worker with id ${worker_id} not found or project is undefined`
        }
      }
    } catch (error) {
      console.log("Error in workerBuild ", error.message);
    }
    return response;
  },
  async buildWorker(worker_id, project_id) {
    try {
      /**
       * TO DO
       * 1. CHECK IF USER IS 
       */
      // console.log('now running service for ', worker_id);

      const worker = await strapi.services["service-providers"].findOne({ id: worker_id });
      if (!worker) {
        return;
      }
      const assignedWorker = await strapi.services["new-assigned-workers"].findOne({ worker_id: worker.id, project_id: project_id, _sort: "created_at:DESC", });
      let workerRate = null;
      let project = null;
      let trade = null;
      let attendanceDetail = null;
      let workforceCountry = "";
      const isAssessed = worker.assessments?.length > 0 ? true : false;
      if (utils.nidValidation(worker.nid_number)) {
        workforceCountry = "Rwanda";
      } else if (worker.country?.country_name) {
        workforceCountry = worker.country?.country_name;
      } else {
        workforceCountry = "-";
      }
      let default_payment_method = {};
      if (worker.payment_methods.length >= 1) {
        default_payment_method = worker.payment_methods.find(item => {
          if (item.is_active) {
            return item;
          }
        });
      }
      let workforce = {
        worker_id: worker_id,
        names: `${worker.first_name} ${worker.last_name}`,
        phone_number: worker.phone_number,
        is_phone_number_verified: worker.is_verified ? worker.is_verified : false,
        national_id: worker.nid_number,
        district: worker.district,
        province: worker.province,
        date_onboarded: moment(worker.created_at).format("YYYY-MM-DD"),
        project_id: project_id,
        is_rssb_verified: worker.is_rssb_verified,
        is_momo_verified_and_rssb: worker.is_momo_verified_and_rssb,
        is_momo_verified_and_rssb_desc: worker.is_momo_verified_and_rssb_desc,
        country: workforceCountry,
        default_payment_method: default_payment_method,
        is_assessed: isAssessed
      };
      if (assignedWorker) {
        workforce.is_active = assignedWorker.is_active;
        project = await strapi.services["projects"].findOne({ id: assignedWorker.project_id, });
        if (project) {
          workforce.project_name = project.name;
          workforce.project_id = project.id;
          workforce.assigned = true;
        } else {
          workforce.project_id = 0; // because we need to see the profile on adminPanel if the person doens't project
          workforce.assigned = false;
        }
        workerRate = await strapi.services["worker-rates"].findOne({ assigned_worker_id: assignedWorker.id, _sort: "created_at:DESC", });
        if (workerRate) {
          workforce.daily_earnings = workerRate.value;
          trade = await strapi.services["services"].findOne({ id: workerRate.service_id, });
          if (trade) {
            workforce.trade_id = trade.id;
            workforce.trade = trade.name;
          }
        }
        attendanceDetail = await strapi.services["attendance-details"].findOne({ assigned_worker_id: assignedWorker.id, _sort: "created_at:DESC", });
        if (attendanceDetail) {
          workforce.last_attendance = moment(attendanceDetail.created_at).format("YYYY-MM-DD");
        }
      }

      let workforceEntry = await strapi.services.workforce.findOne({ worker_id: worker.id, });
      if (workforceEntry) {
        await strapi.query("workforce").update({ id: workforceEntry.id }, workforce, "buildWorker");
      } else {
        await strapi.query("workforce").create(workforce, "buildWorker");
      }
    } catch (error) {
      console.log("Error happened in /api/workforce/services/buildWorker() ", error.message);
    }
  },
  async buildWorkForce(workers_to_build) {
    let response = {};
    try {
      await buildWorkerForce(BUILD_WORKER_FORCE_URL, workers_to_build);
      response = {
        status: "success",
        message: "Building Worforce",
      };
    } catch (error) {
      response = {
        status: "failed",
        message: error.message,
      };
    }
    return response;
  },
  async calculateAdminDashboardAgreegate(project, year, month, client) {
    try {
      let projects;
      let project_ids;
      let services;
      let choosen_context = 0;
      let graphTotalWorkersByServices;
      let graphTotalWorkersByProjects;
      let graphLine;
      let graphShift = [];
      let totalworkers = 0;
      let activeworkers = 0;
      let totalshifts = 0;
      let shifts;
      let totalDay = 0;
      let totalNight = 0;
      let totalactiveMaleWorker = 0;
      let totalactiveFemaleWorker = 0;
      let totalactiveWorker = 0;
      let totalProject = 0;
      let totalActiveProject = 0;
      let totalInactiveProject = 0;
      const allMonths = [
        { label: "Jan", month: "01" },
        { label: "Feb", month: "02" },
        { label: "Mar", month: "03" },
        { label: "Apr", month: "04" },
        { label: "May", month: "05" },
        { label: "Jun", month: "06" },
        { label: "Jul", month: "07" },
        { label: "Aug", month: "08" },
        { label: "Sep", month: "09" },
        { label: "Oct", month: "10" },
        { label: "Nov", month: "11" },
        { label: "Dec", month: "12" },
      ];
      const allYears = utils.giveMeAllYears(2022);
      let today_month_day = moment(new Date()).format("DD/MM");
      services = await strapi.query("services").find({ _limit: -1 });
      if (project === -1) {
        //All projects
        let query_project = {};
        if (parseInt(client) >= 1) {
          query_project = { _limit: -1, client_id: client };
        } else if (client === "all") {
          query_project = { _limit: -1 };
        } else {
          query_project = { _limit: -1, client_id: 0 };
        }

        projects = await strapi.query("projects").find(query_project);
        project_ids = projects.map((item) => {
          return item.id
        });

        let passed_query_knex = "";
        let query_knex = "";
        if (project_ids.length >= 1) {
          for (let i = 0; i < project_ids.length; i++) {
            if (project_ids.length - 1 === i) {
              query_knex += `project_id= ${project_ids[i]} `;
            } else {
              query_knex += `project_id= ${project_ids[i]} OR `;
            }
          }
          if (query_knex === "") {
            passed_query_knex = "";
          } else {
            if (year === -1) {
              passed_query_knex = ` WHERE ${query_knex}`;
            } else {
              passed_query_knex = ` AND ${query_knex}`;
            }
          }
        } else {
          if (year === -1) {
            passed_query_knex = ` WHERE project_id= -1`;
          } else {
            passed_query_knex = ` AND project_id= -1`;
          }
        }

        if (year === -1) {
          //All time
          choosen_context = 1;
          const knex = strapi.connections.default;
          var attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists ${passed_query_knex}`);
          shifts = attendancelists[0].map((entity) => {
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
        } else {
          //Specific year
          if (month === -1) {
            //All year
            choosen_context = 2;
            const created_updated_start = moment(new Date(year + "-01-01")).format('YYYY-MM-DD');
            const created_updated_end = moment(new Date(year + "-12-31")).format('YYYY-MM-DD');
            if (created_updated_start && created_updated_end) {
              const knex = strapi.connections.default;
              var attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE attendance_date >= "${created_updated_start}" AND attendance_date <= "${created_updated_end}" ${passed_query_knex}`);
              shifts = attendancelists[0].map((entity) => {
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
              shifts = shifts.filter((item) => {
                return new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end);
              });
            }
          } else {
            // Specific month
            choosen_context = 3;
            month = moment(month, 'M').format('MM');
            const created_updated_start = moment(new Date(year + "-" + month + "-01")).format('YYYY-MM-DD');
            const created_updated_end = moment(new Date(year + "-" + month + "-" + moment(year + "-" + month, "YYYY-MM").daysInMonth())).format('YYYY-MM-DD');
            if (created_updated_start && created_updated_end) {
              const knex = strapi.connections.default;
              var attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE attendance_date >= "${created_updated_start}" AND attendance_date <= "${created_updated_end}" ${passed_query_knex}`);
              shifts = attendancelists[0].map((entity) => {
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
              shifts = shifts.filter((item) => {
                return new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end);
              });
            }
          }
        }
      } else {
        //Specific project
        let query_project = {};
        if (parseInt(client) >= 1) {
          query_project = { id: project, _limit: -1, client_id: client };
        } else if (client === "all") {
          query_project = { id: project, _limit: -1 };
        } else {
          query_project = { id: project, _limit: -1, client_id: 0 };
        }
        projects = await strapi.query("projects").find(query_project);
        if (year === -1) {
          //All time
          choosen_context = 4;
          shifts = await strapi.query("attendancelist").find({ project_id: project, _limit: -1 });
          const knex = strapi.connections.default;
          var attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE project_id=${project}`);
          shifts = attendancelists[0].map((entity) => {
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
        } else {
          //Specific year
          if (month === -1) {
            //All year
            choosen_context = 5;
            const created_updated_start = year + "-01-01";
            const created_updated_end = year + "-12-31";
            if (created_updated_start && created_updated_end) {
              const knex = strapi.connections.default;
              var attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE attendance_date >= "${created_updated_start}" AND attendance_date <= "${created_updated_end}" AND project_id=${project}`);
              shifts = attendancelists[0].map((entity) => {
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

              shifts = shifts.filter((item) => {
                return new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end);
              });
            }
          } else {
            // Specific month
            choosen_context = 6;
            month = moment(month, 'M').format('MM');
            const created_updated_start = year + "-" + month + "-01";
            const created_updated_end = year + "-" + month + "-" + moment(year + "-" + month, "YYYY-MM").daysInMonth();
            if (created_updated_start && created_updated_end) {
              const knex = strapi.connections.default;
              const attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE attendance_date >= "${created_updated_start}" AND attendance_date <= "${created_updated_end}" AND project_id=${project}`);
              shifts = attendancelists[0].map((entity) => {
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
              shifts = shifts.filter((item) => {
                return new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end);
              });
            }
          }
        }
      }

      let projectInAttendance = _.uniq(_.pluck(shifts, "project_id"));
      let realProject = [];
      for (let x = 0; x < projects.length; x++) {
        for (let y = 0; y < projectInAttendance.length; y++) {
          if (projects[x].id === projectInAttendance[y]) {
            realProject.push({
              id: projects[x].id,
              name: projects[x].name,
              progress_status: projects[x].progress_status,
            });
          }
        }
      }
      //workforce
      totalworkers = _.size(utils.removeDuplicatesByWorkerId(shifts));
      activeworkers = utils.removeDuplicatesByWorkerId(shifts);
      totalactiveWorker = _.size(activeworkers);
      totalactiveMaleWorker = _.size(_.filter(activeworkers, (worker) => (worker.gender?.toLowerCase() === "male") || (worker.gender === undefined || worker.gender === null))); // I have added this undefined and null because some workers did not have a gender when were added in the attendance tha time.
      totalactiveFemaleWorker = _.size(_.filter(activeworkers, (worker) => worker.gender?.toLowerCase() === "female"));
      totalDay = _.size(_.filter(shifts, (shift) => parseInt(shift.shift_id) === 1));
      totalNight = _.size(_.filter(shifts, (shift) => parseInt(shift.shift_id) === 2));
      totalshifts = totalDay + totalNight;
      totalProject = _.size(realProject);
      totalActiveProject = _.size(_.filter(realProject, (project) => project.progress_status === "ongoing"));
      totalInactiveProject = _.size(_.filter(realProject, (project) => project.progress_status != "ongoing"));

      //workforce-pie
      graphTotalWorkersByServices = {
        total: totalworkers,
        data: utils.groupWorker(activeworkers, "service", realProject, services)
      };

      graphTotalWorkersByProjects = {
        total: totalworkers,
        data: utils.groupWorker(activeworkers, "project", realProject, services)
      };

      switch (choosen_context) {
        case 1: // project=-1 , year=-1 , month=-1 :: use yearly allYears
        case 4: // project is selected , year=-1 , month=-1 :: use yearly allYears
          for (let x = 0; x < allYears.length; x++) {
            allYears[x].shifts_filtered_by_year = _.filter(shifts, (s) => {
              return moment(s.attendance_date).format("YYYY-MM-DD").includes(allYears[x].year + "-");
            });
            allYears[x].shifts_filtered_by_year_service_object = _.values(
              _.mapObject(
                _.groupBy(allYears[x].shifts_filtered_by_year, (s) => s.service),
                (val, key) => {
                  return {
                    name: key.replace(/\s/g, "-"),
                    shifts: val.length,
                    year: allYears[x].year,
                    index: parseInt(allYears[x].year),
                  };
                }
              )
            );
            graphShift.push(...allYears[x].shifts_filtered_by_year_service_object);
          }
          let average_year = Math.round(totalshifts / allYears.length);
          for (let index = 0; index < allYears.length; index++) {
            let total_year = _.reduce(
              _.filter(graphShift, (s) => {
                return parseInt(s.year) === parseInt(allYears[index].year);
              }),
              (sum, item) => {
                return sum + item.shifts;
              },
              0
            );
            graphShift.push({
              name: "Total",
              shifts: total_year,
              year: allYears[index].year,
              index: parseInt(allYears[index].year),
            });
          }
          for (let index = 0; index < allYears.length; index++) {
            graphShift.push({
              name: "Average",
              shifts: average_year,
              year: allYears[index].year,
              index: parseInt(allYears[index].year),
            });
          }
          break;
        case 2: // project=-1 , year is selected , month=-1 :: use monthly allMonths
        case 5: // project is selected , year is selected , month=-1 :: use monthly allMonths
          let months_for_average = 12;
          if (parseInt(moment().year()) === parseInt(year)) {
            today_month_day = moment(new Date()).format("DD/MM");
            months_for_average = parseInt(today_month_day.split("/")[1]);
          }
          for (let x = 0; x < allMonths.length; x++) {
            allMonths[x].shifts_filtered_by_month = _.filter(shifts, (s) => {
              return moment(s.attendance_date).format("YYYY-MM-DD").includes("-" + allMonths[x].month + "-");
            });
            allMonths[x].shifts_filtered_by_month_service_object = _.values(
              _.mapObject(
                _.groupBy(allMonths[x].shifts_filtered_by_month, (s) => s.service),
                (val, key) => {
                  return {
                    name: key.replace(/\s/g, "-"),
                    shifts: val.length,
                    month: allMonths[x].label,
                    index: parseInt(allMonths[x].month),
                  };
                }
              )
            );
            graphShift.push(...allMonths[x].shifts_filtered_by_month_service_object);
          }
          let average_month = Math.round(totalshifts / months_for_average);
          for (let index = 0; index < allMonths.length; index++) {
            let total_month = _.reduce(
              _.filter(graphShift, (s) => {
                return s.month === allMonths[index].label;
              }),
              (sum, item) => {
                return sum + item.shifts;
              },
              0
            );
            graphShift.push({
              name: "Total",
              shifts: total_month,
              month: allMonths[index].label,
              index: parseInt(allMonths[index].month),
            });
          }
          for (let index = 0; index < allMonths.length; index++) {
            graphShift.push({
              name: "Average",
              shifts: average_month,
              month: allMonths[index].label,
              index: parseInt(allMonths[index].month),
            });
          }
          graphShift = _.reject(graphShift, (g) => {
            return g.index > months_for_average;
          });
          break;
        case 3: // project=-1 , year is selected , month is selected :: use daily
        case 6: // project is selected , year is selected , month is selected :: use daily
          let allDays = utils.giveMeAllDays(year, month);
          let days_for_average = utils.getDays(year, month);
          if (new Date(year + "-" + month).getMonth() + 1 === new Date().getMonth() + 1) {
            days_for_average = parseInt(today_month_day.split("/")[0]);
          }
          for (let x = 0; x < allDays.length; x++) {
            allDays[x].shifts_filtered_by_day = _.filter(shifts, (s) => {
              return moment(s.attendance_date).format("DD").includes(allDays[x].day);
            });
            allDays[x].shifts_filtered_by_day_service_object = _.values(
              _.mapObject(
                _.groupBy(allDays[x].shifts_filtered_by_day, (s) => s.service),
                (val, key) => {
                  return {
                    name: key.replace(/\s/g, "-"),
                    shifts: val.length,
                    day: allDays[x].day,
                    index: parseInt(allDays[x].day),
                  };
                }
              )
            );
            graphShift.push(...allDays[x].shifts_filtered_by_day_service_object);
          }
          let average_day = Math.round(totalshifts / days_for_average);
          for (let index = 0; index < allDays.length; index++) {
            let total_day = _.reduce(
              _.filter(graphShift, (s) => {
                return parseInt(s.day) === parseInt(allDays[index].day);
              }),
              (sum, item) => {
                return sum + item.shifts;
              },
              0
            );
            graphShift.push({
              name: "Total",
              shifts: total_day,
              day: allDays[index].day,
              index: parseInt(allDays[index].day),
            });
          }
          for (let index = 0; index < allDays.length; index++) {
            graphShift.push({
              name: "Average",
              shifts: average_day,
              day: allDays[index].day,
              index: parseInt(allDays[index].day),
            });
          }
          graphShift = _.reject(graphShift, g => g.index > days_for_average);
          break;
        default:
          // console.log("No line chart, STRANGE!!!!!", choosen_context);
          break;
      }

      graphShift = _.sortBy(graphShift, "index");
      graphLine = {
        total: totalshifts,
        data: graphShift,
      };
      const answer = {};
      answer.total_workers = totalworkers;
      answer.total_shifts = totalshifts;
      answer.total_day_shifts = totalDay;
      answer.total_night_shifts = totalNight;
      answer.active_workers = totalactiveWorker;
      answer.active_male_workers = totalactiveMaleWorker;
      answer.active_female_workers = totalactiveFemaleWorker;
      answer.total_project = totalProject;
      answer.total_active_project = totalActiveProject;
      answer.total_inactive_project = totalInactiveProject;
      answer.graph_total_workers_by_services = graphTotalWorkersByServices;
      answer.graph_total_workers_by_projects = graphTotalWorkersByProjects;
      answer.graph_shift = graphLine;

      return answer;
    } catch (error) {
      console.log("error in calculateAdminDashboardAgreegate", error.message);
    }
  }
};

async function buildWorkerForce(build_url, worker_to_build) {
  try {
    const body = { workers_to_build: worker_to_build };
    await axios.post(build_url, body, {
      headers: {
        "Content-Length": 0,
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
      },
    }).catch(function (error) {
      console.log("error in buildWorkerForce", error.message);
    });

  } catch (err) {
    console.log("axios error", err.message);
  }
}
