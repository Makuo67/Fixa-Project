"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const _ = require("underscore");
const { checkIfPaymentExist } = require("../../payments/services/payments");
const { updateOnAttendace, createOnAttendace } = require("../../payroll-transactions/services/payroll-transactions");
const { saveAttendanceData } = require("../../new-attendance-list/services/new-attendance-list");
const { calculateAdminDashboardAgreegate } = require("../../workforce/services/workforce");
const utils = require("../../../config/functions/utils");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();
const moment = require("moment");
module.exports = {
  async getWorkerIds(assigned_worker_ids) {
    let worker_ids = [];
    if (assigned_worker_ids && assigned_worker_ids.length > 0) {
      for (let index = 0; index < assigned_worker_ids.length; index++) {

        const element = assigned_worker_ids[index].assigned_worker_id;

        const w_ids = await strapi.query("new-assigned-workers").find({ id: element, _limit: -1 });
        const ids = _.pluck(w_ids, "worker_id")

        if (ids && ids.length > 0) {
          worker_ids.push(_.pluck(w_ids, "worker_id")[0])
        }
      }
    }
    return worker_ids;
  },
  async updateWorkerIdService() {
    let workerforces_data = await strapi.query("workforce").find({ _limit: -1 });
    let workers_data = await strapi.query("service-providers").find({ _limit: -1 });
    let workers_not_found = [];
    let workers_found = [];
    for (let index = 0; index < workerforces_data.length; index++) {
      const item = workerforces_data[index];
      let worker_ids_found = workers_data.filter((itemx) => {
        if (item.worker_id.toString() === itemx.id.toString()) {
          return itemx;
        }
      });
      if (worker_ids_found.length === 0) {
        workers_not_found.push({ "phone_number": item.phone_number, "worker_id_not_found": item.worker_id.toString() })
      }
    }

    for (let index = 0; index < workers_not_found.length; index++) {
      const item = workers_not_found[index];
      let worker = await strapi.query("service-providers").findOne({ "phone_number": item.phone_number, _sort: "created_at:DESC" });
      if (worker) {
        workers_found.push({ "worker_id": worker.id, "worker_id_not_found": item['worker_id_not_found'] })
      }
    }

    for (let index = 0; index < workers_found.length; index++) {
      const item = workers_found[index];
      let assigned_worker = await strapi.query("new-assigned-workers").find({ "worker_id": item['worker_id_not_found'] });
      if (assigned_worker.length > 0) {
        await strapi.query("new-assigned-workers").update({ "worker_id": item['worker_id_not_found'] }, { "worker_id": item['worker_id'] });
        await strapi.query("attendancelist").update({ "worker_id": item['worker_id_not_found'] }, { "worker_id": item['worker_id'] });
        await strapi.query("worker-profile").update({ "worker_id": item['worker_id_not_found'] }, { "worker_id": item['worker_id'] });
      }
    }
  },
  async createUpdateAttendanceDetails(attendance_id, data, redis_mode, mode) {
    const { workers_assigned, project_id } = data;
    for (let index = 0; index < workers_assigned.length; index++) {
      const assigned_worker_id = workers_assigned[index];
      let obj1 = { attendance_id: attendance_id, assigned_worker_id: assigned_worker_id }; //attendance filter why "worker_rate_id: null"?
      let obj2 = { id: assigned_worker_id, project_id: project_id }; //assigned worker filter
      let obj3 = { assigned_worker_id, _sort: "created_at:DESC" }; //worker-rates filter
      const attendance = await strapi.query("new-attendance").findOne({ id: attendance_id });
      const attendance_details = await strapi.query("attendance-details").findOne(obj1);
      const assigned_worker = await strapi.query("new-assigned-workers").findOne(obj2);
      const last_worker_rate = await strapi.query("worker-rates").findOne(obj3);

      if (!attendance_details) {
        if (assigned_worker) {
          const worker_rate_info = await strapi.query("worker-rates").findOne({ assigned_worker_id: assigned_worker.id });
          if (worker_rate_info) {
            if (last_worker_rate) {
              obj1.worker_rate_id = last_worker_rate.id;
              obj1.worker_service_id = last_worker_rate.service_id;
              let worker_attendance_details_resp = await strapi.query("attendance-details").create(obj1, "createUpdateAttendanceDetails");
              let working_time = worker_attendance_details_resp.working_time.toString() === 'half' ? true : false;
              // update payroll if it exist
              let payment = await checkIfPaymentExist(attendance.date, project_id, assigned_worker_id);
              if (payment.status !== 404) {
                if (payment.status_payment === "unpaid") {
                  if (payment.status === 200) {
                    await updateOnAttendace(last_worker_rate.value, payment.payment_id, payment.payroll_transaction_id, attendance.shift_id, working_time);
                  } else if (payment.status === 201) {
                    await createOnAttendace(last_worker_rate.value, payment.payment_id, assigned_worker_id, last_worker_rate.service_id, attendance.shift_id);
                  }
                }
              }
            } else {
              console.log(`INFO: we will not create this attendance details because, we can't find worker-rates info with the new_assigned_id:: ${assigned_worker_id}`);
            }
          } else {
            console.log(`INFO: we will not create this attendance details because, we can't find worker services info with worker_id:: ${assigned_worker.worker_id}`);
          }
        } else {
          console.log(`INFO: we will not create this attendance details because, we can't find new-assigned-workers info with the project_id:: ${project_id} and new_assigned_id:: ${assigned_worker_id}`);
        }
      } else {
        console.log(`INFO: we will not create this attendance details because, this attendance-details already exist with the attendance_id:: ${attendance_id} and new_assigned_id:: ${assigned_worker_id}`);
      }
    }
    await saveAttendanceData(attendance_id, redis_mode);
    // await redisAttendance(attendance_id, redis_mode, workers_assigned.length);
    const analytics = await calculateAdminDashboardAgreegate(-1, -1, -1);
    if (analytics) {
      const project = -1;
      const year = -1;
      const month = -1;
      const ttlInSeconds = process.env.REDIS_KEY_EXPIRATION;
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

      response.data.total_workers = analytics.total_workers;
      response.data.total_shifts = analytics.total_shifts;
      response.data.total_day_shifts = analytics.total_day_shifts;
      response.data.total_night_shifts = analytics.total_night_shifts;
      response.data.active_workers = analytics.active_workers;
      response.data.active_male_workers = analytics.active_male_workers;
      response.data.active_female_workers = analytics.active_female_workers;
      response.data.total_project = analytics.total_project;
      response.data.total_active_project = analytics.total_active_project;
      response.data.total_inactive_project = analytics.total_inactive_project;
      response.data.graph_total_workers_by_services = analytics.graph_total_workers_by_services;
      response.data.graph_total_workers_by_projects = analytics.graph_total_workers_by_projects;
      response.data.graph_shift = analytics.graph_shift;
      response.status = "success";
      await redisClient.set(`${process.env.COMPANY_TITLE.split(' ').join('_')}-admin-dashboard-aggregates-${project}-${year}-${month}-${moment(new Date()).format("YYYY-MM-DD")}`, JSON.stringify(response));
      await redisClient.expire(`${process.env.COMPANY_TITLE.split(' ').join('_')}-admin-dashboard-aggregates-${project}-${year}-${month}-${moment(new Date()).format("YYYY-MM-DD")}`, ttlInSeconds);
    }
  },
  async getWorkerRates(attendances) {
    let workers = [];
    let attendances_workers = [];
    for (let index = 0; index < attendances.length; index++) {
      let shift_obj = utils.getShift(attendances[index]);
      if (
        attendances_workers.length === 0 ||
        !attendances_workers.includes(attendances[index].worker_id)
      ) {
        attendances_workers.push(attendances[index].worker_id);
        workers.push({
          total_amount: (shift_obj.day_shifts + shift_obj.night_shifts) * attendances[index].daily_rate,
          service_name: attendances[index].service,
          service_id: attendances[index].service_id,
          worker_id: attendances[index].worker_id,
          phone_number: attendances[index].phone_number,
          first_name: attendances[index].first_name,
          last_name: attendances[index].last_name,
          daily_rate: attendances[index].daily_rate,
          day_shifts: shift_obj.day_shifts,
          night_shifts: shift_obj.night_shifts
        });
      } else {
        workers = getdata(workers, attendances[index]);
      }
    }
    return workers;
  },
  async getAttendance(ids) {
    let attendance_details_list = null;
    let error_in_attendance = [];
    if (ids.length == 2) { // // This happens when in a day we have two shifts
      const attendance_details_1 = await strapi.query("attendance-details").find({ attendance_id: ids[0] });
      if (attendance_details_1 && attendance_details_1.length > 0) {
        for (let index = 0; index < attendance_details_1.length; index++) { //first shift
          const new_attendances_1 = await strapi.query("new-attendance").findOne({ id: attendance_details_1[index].attendance_id });
          if (new_attendances_1) {
            let new_assigned_workers_1 = await strapi.query("new-assigned-workers").findOne({ id: attendance_details_1[index].assigned_worker_id });
            if (new_assigned_workers_1) {
              let service_providers_1 = await strapi.query("service-providers").findOne({ id: new_assigned_workers_1.worker_id });
              if (service_providers_1) {
                let worker_rates_1 = await strapi.query("worker-rates").findOne({ assigned_worker_id: attendance_details_1[index].assigned_worker_id, service_id: attendance_details_1[index].worker_service_id });
                if (worker_rates_1) {
                  let services_1 = await strapi.query("services").findOne({ id: attendance_details_1[index].worker_service_id });
                  if (services_1) {
                    let projects_1 = await strapi.query("projects").findOne({ id: new_assigned_workers_1.project_id });
                    if (projects_1) {
                      let attendance_statuses_1 = await strapi.query("attendance-status").findOne({ attendance_id: new_attendances_1.id });
                      if (attendance_statuses_1) {
                        let shifts_1 = await strapi.query("shifts").findOne({ id: new_attendances_1.shift_id });
                        if (shifts_1) {
                          attendance_details_1[index].assigned_worker_id = attendance_details_1[index].assigned_worker_id;
                          attendance_details_1[index].worker_service_id = attendance_details_1[index].worker_service_id;
                          attendance_details_1[index].attendance_id = attendance_details_1[index].attendance_id;
                          attendance_details_1[index].shift_status = attendance_details_1[index].working_time;
                          attendance_details_1[index].attendance_detail_id = attendance_details_1[index].id;
                          attendance_details_1[index].firstname = service_providers_1.first_name;
                          attendance_details_1[index].lastname = service_providers_1.last_name;
                          attendance_details_1[index].nid_number = service_providers_1.nid_number;
                          attendance_details_1[index].worker_id = service_providers_1.id;
                          attendance_details_1[index].is_verified = service_providers_1.is_verified;
                          attendance_details_1[index].phone = service_providers_1.phone_number;
                          attendance_details_1[index].service = services_1.name;
                          attendance_details_1[index].attendance_status = attendance_statuses_1.status;
                          attendance_details_1[index].shift_name = shifts_1.name;
                          attendance_details_1[index].rate = worker_rates_1.value;
                          let workers_assessments = await strapi.query("workers-assessments").findOne({ worker_id: service_providers_1.id, service_id: attendance_details_1[index].worker_service_id });
                          if (workers_assessments) {
                            attendance_details_1[index].mean = workers_assessments.mean_score;
                          } else {
                            attendance_details_1[index].mean = 0;
                          }
                        } else {
                          console.log("INFO: we can't find shifts_1 with shift_id:: " + new_attendances_1.shift_id);
                          error_in_attendance.push("INFO: we can't find shifts_1 with shift_id:: " + new_attendances_1.shift_id);
                        }
                      } else {
                        console.log("INFO: we can't find attendance-status_1 with attendance_id:: " + new_attendances_1.id);
                        error_in_attendance.push("INFO: we can't find attendance-status_1 with attendance_id:: " + new_attendances_1.id);
                      }
                    } else {
                      console.log("INFO: we can't find projects_1 with project_id:: " + new_assigned_workers_1.project_id);
                      error_in_attendance.push("INFO: we can't find projects_1 with project_id:: " + new_assigned_workers_1.project_id);
                    }
                  } else {
                    console.log("INFO: we can't find services_1 with service_id:: " + attendance_details_1[index].worker_service_id);
                    error_in_attendance.push("INFO: we can't find services_1 with service_id:: " + attendance_details_1[index].worker_service_id);
                  }
                } else {
                  console.log(`INFO: we can't find worker-rates_1 with assigned_worker_id:: ${attendance_details_1[index].assigned_worker_id}  AND service_id:: ${attendance_details_1[index].worker_service_id}`);
                  error_in_attendance.push(`INFO: we can't find worker-rates_1 with assigned_worker_id:: ${attendance_details_1[index].assigned_worker_id}  AND service_id:: ${attendance_details_1[index].worker_service_id}`);
                }
              } else {
                console.log("INFO: we can't find service-providers_1 with worker_id:: " + new_assigned_workers_1.worker_id);
                error_in_attendance.push("INFO: we can't find service-providers_1 with worker_id:: " + new_assigned_workers_1.worker_id);
              }
            } else {
              console.log("INFO: we can't find new-assigned-workers_1 with assigned_worker_id:: " + attendance_details_1[index].assigned_worker_id);
              error_in_attendance.push("INFO: we can't find new-assigned-workers_1 with assigned_worker_id:: " + attendance_details_1[index].assigned_worker_id);
            }
          } else {
            console.log("INFO: we can't find new-attendance_1 with attendance_id:: " + attendance_details_1[index].attendance_id);
            error_in_attendance.push("INFO: we can't find new-attendance_1 with attendance_id:: " + attendance_details_1[index].attendance_id);
          }
        }
      } else {
        console.log("INFO: No attendance-details for attendance_id:: " + ids[0]);
        error_in_attendance.push("INFO: No attendance-details for attendance_id:: " + ids[0]);
      }

      const attendance_details_2 = await strapi.query("attendance-details").find({ attendance_id: ids[1] });
      if (attendance_details_2 && attendance_details_2.length > 0) {
        for (let index = 0; index < attendance_details_2.length; index++) {  //second shift
          const new_attendances_2 = await strapi.query("new-attendance").findOne({ id: attendance_details_2[index].attendance_id });
          if (new_attendances_2) {
            let new_assigned_workers_2 = await strapi.query("new-assigned-workers").findOne({ id: attendance_details_2[index].assigned_worker_id });
            if (new_assigned_workers_2) {
              let service_providers_2 = await strapi.query("service-providers").findOne({ id: new_assigned_workers_2.worker_id });
              if (service_providers_2) {
                let worker_rates_2 = await strapi.query("worker-rates").findOne({ assigned_worker_id: attendance_details_2[index].assigned_worker_id, service_id: attendance_details_2[index].worker_service_id });
                if (worker_rates_2) {
                  let services_2 = await strapi.query("services").findOne({ id: attendance_details_2[index].worker_service_id });
                  if (services_2) {
                    let projects_2 = await strapi.query("projects").findOne({ id: new_assigned_workers_2.project_id });
                    if (projects_2) {
                      let attendance_statuses_2 = await strapi.query("attendance-status").findOne({ attendance_id: new_attendances_2.id });
                      if (attendance_statuses_2) {
                        let shifts_2 = await strapi.query("shifts").findOne({ id: new_attendances_2.shift_id });
                        if (shifts_2) {
                          attendance_details_2[index].assigned_worker_id = attendance_details_2[index].assigned_worker_id;
                          attendance_details_2[index].worker_service_id = attendance_details_2[index].worker_service_id;
                          attendance_details_2[index].attendance_id = attendance_details_2[index].attendance_id;
                          attendance_details_2[index].shift_status = attendance_details_2[index].working_time;
                          attendance_details_2[index].attendance_detail_id = attendance_details_2[index].id;
                          attendance_details_2[index].firstname = service_providers_2.first_name;
                          attendance_details_2[index].lastname = service_providers_2.last_name;
                          attendance_details_2[index].nid_number = service_providers_2.nid_number;
                          attendance_details_2[index].worker_id = service_providers_2.id;
                          attendance_details_2[index].is_verified = service_providers_2.is_verified;
                          attendance_details_2[index].phone = service_providers_2.phone_number;
                          attendance_details_2[index].service = services_2.name;
                          attendance_details_2[index].attendance_status = attendance_statuses_2.status;
                          attendance_details_2[index].shift_name = shifts_2.name;
                          attendance_details_2[index].rate = worker_rates_2.value;
                          let workers_assessments = await strapi.query("workers-assessments").findOne({ worker_id: service_providers_2.id, service_id: attendance_details_2[index].worker_service_id });
                          if (workers_assessments) {
                            attendance_details_2[index].mean = workers_assessments.mean_score;
                          } else {
                            attendance_details_2[index].mean = 0;
                          }
                        } else {
                          console.log("INFO: we can't find shifts_2 with shift_id:: " + new_attendances_2.shift_id);
                          error_in_attendance.push("INFO: we can't find shifts_2 with shift_id:: " + new_attendances_2.shift_id);
                        }
                      } else {
                        console.log("INFO: we can't find attendance-status_2 with attendance_id:: " + new_attendances_2.id);
                        error_in_attendance.push("INFO: we can't find attendance-status_2 with attendance_id:: " + new_attendances_2.id);
                      }
                    } else {
                      console.log("INFO: we can't find projects_2 with project_id:: " + new_assigned_workers_2.project_id);
                      error_in_attendance.push("INFO: we can't find projects_2 with project_id:: " + new_assigned_workers_2.project_id);
                    }
                  } else {
                    console.log("INFO: we can't find services_2 with service_id:: " + attendance_details_2[index].worker_service_id);
                    error_in_attendance.push("INFO: we can't find services_2 with service_id:: " + attendance_details_2[index].worker_service_id);
                  }
                } else {
                  console.log(`INFO: we can't find worker-rates_2 with assigned_worker_id:: ${attendance_details_2[index].assigned_worker_id}  AND service_id:: ${attendance_details_2[index].worker_service_id}`);
                  error_in_attendance.push(`INFO: we can't find worker-rates_2 with assigned_worker_id:: ${attendance_details_2[index].assigned_worker_id}  AND service_id:: ${attendance_details_2[index].worker_service_id}`);
                }
              } else {
                console.log("INFO: we can't find service-providers_2 with worker_id:: " + new_assigned_workers_2.worker_id);
                error_in_attendance.push("INFO: we can't find service-providers_2 with worker_id:: " + new_assigned_workers_2.worker_id);
              }
            } else {
              console.log("INFO: we can't find new-assigned-workers_2 with assigned_worker_id:: " + attendance_details_2[index].assigned_worker_id);
              error_in_attendance.push("INFO: we can't find new-assigned-workers_2 with assigned_worker_id:: " + attendance_details_2[index].assigned_worker_id);
            }
          } else {
            console.log("INFO: we can't find new-attendance_2 with attendance_id:: " + attendance_details_2[index].attendance_id);
            error_in_attendance.push("INFO: we can't find new-attendance_2 with attendance_id:: " + attendance_details_2[index].attendance_id);
          }
        }
      } else {
        console.log("INFO: No new-attendance_1 for attendance_id:: " + ids[1]);
        error_in_attendance.push("INFO: No new-attendance_1 for attendance_id:: " + ids[1]);
      }

      attendance_details_list = attendance_details_1.concat(attendance_details_2);
    }
    if (ids.length == 1) { // This happens when in a day we have one shift
      let attendance_details = await strapi.query("attendance-details").find({ attendance_id: ids[0] });
      if (attendance_details) {
        for (let index = 0; index < attendance_details.length; index++) {
          let new_attendances = await strapi.query("new-attendance").findOne({ id: attendance_details[index].attendance_id });
          if (new_attendances) {
            let new_assigned_workers = await strapi.query("new-assigned-workers").findOne({ id: attendance_details[index].assigned_worker_id });
            if (new_assigned_workers) {
              let service_providers = await strapi.query("service-providers").findOne({ id: new_assigned_workers.worker_id });
              if (service_providers) {
                let worker_rates = await strapi.query("worker-rates").findOne({ assigned_worker_id: attendance_details[index].assigned_worker_id, service_id: attendance_details[index].worker_service_id, _sort: "created_at:DESC" });
                if (worker_rates) {
                  let services = await strapi.query("services").findOne({ id: attendance_details[index].worker_service_id });
                  if (services) {
                    let projects = await strapi.query("projects").findOne({ id: new_assigned_workers.project_id });
                    if (projects) {
                      let attendance_statuses = await strapi.query("attendance-status").findOne({ attendance_id: new_attendances.id });
                      if (attendance_statuses) {
                        let shifts = await strapi.query("shifts").findOne({ id: new_attendances.shift_id });
                        if (shifts) {
                          attendance_details[index].assigned_worker_id = attendance_details[index].assigned_worker_id;
                          attendance_details[index].worker_service_id = attendance_details[index].worker_service_id;
                          attendance_details[index].attendance_id = attendance_details[index].attendance_id;
                          attendance_details[index].shift_status = attendance_details[index].working_time;
                          attendance_details[index].attendance_detail_id = attendance_details[index].id;
                          attendance_details[index].firstname = service_providers.first_name;
                          attendance_details[index].lastname = service_providers.last_name;
                          attendance_details[index].nid_number = service_providers.nid_number;
                          attendance_details[index].worker_id = service_providers.id;
                          attendance_details[index].is_verified = service_providers.is_verified;
                          attendance_details[index].phone = service_providers.phone_number;
                          attendance_details[index].service = services.name;
                          attendance_details[index].attendance_status = attendance_statuses.status;
                          attendance_details[index].shift_name = shifts.name;
                          attendance_details[index].rate = worker_rates.value;
                          let workers_assessments = await strapi.query("workers-assessments").findOne({ worker_id: service_providers.id, service_id: attendance_details[index].worker_service_id });
                          if (workers_assessments) {
                            attendance_details[index].mean = workers_assessments.mean_score;
                          } else {
                            attendance_details[index].mean = 0;
                          }
                        } else {
                          console.log("INFO: we can't find shifts with shift_id:: " + new_attendances.shift_id);
                          error_in_attendance.push("INFO: we can't find shifts with shift_id:: " + new_attendances.shift_id);
                        }
                      } else {
                        console.log("INFO: we can't find attendance-status with attendance_id:: " + new_attendances.id);
                        error_in_attendance.push("INFO: we can't find attendance-status with attendance_id:: " + new_attendances.id);
                      }
                    } else {
                      console.log("INFO: we can't find projects with project_id:: " + new_assigned_workers.project_id);
                      error_in_attendance.push("INFO: we can't find projects with project_id:: " + new_assigned_workers.project_id);
                    }
                  } else {
                    console.log("INFO: we can't find services with service_id:: " + attendance_details[index].worker_service_id);
                    error_in_attendance.push("INFO: we can't find services with service_id:: " + attendance_details[index].worker_service_id);
                  }
                } else {
                  console.log(`INFO: we can't find worker-rates with assigned_worker_id:: ${attendance_details[index].assigned_worker_id}  AND service_id:: ${attendance_details[index].worker_service_id}`);
                  error_in_attendance.push(`INFO: we can't find worker-rates with assigned_worker_id:: ${attendance_details[index].assigned_worker_id}  AND service_id:: ${attendance_details[index].worker_service_id}`);
                }
              } else {
                console.log("INFO: we can't find service-providers with worker_id:: " + new_assigned_workers.worker_id);
                error_in_attendance.push("INFO: we can't find service-providers with worker_id:: " + new_assigned_workers.worker_id);
              }
            } else {
              console.log("INFO: we can't find new-assigned-workers with assigned_worker_id:: " + attendance_details[index].assigned_worker_id);
              error_in_attendance.push("INFO: we can't find new-assigned-workers with assigned_worker_id:: " + attendance_details[index].assigned_worker_id);
            }
          } else {
            console.log("INFO: we can't find new-attendance with attendance_id:: " + attendance_details[index].attendance_id);
            error_in_attendance.push("INFO: we can't find new-attendance with attendance_id:: " + attendance_details[index].attendance_id);
          }
        }
      } else {
        console.log("INFO: No new-attendance for attendance_id:: " + ids[0]);
        error_in_attendance.push("INFO: No new-attendance for attendance_id:: " + ids[0]);
      }
      attendance_details_list = attendance_details;
    }
    attendance_details_list.map((data) => {
      delete data['published_at'];
      delete data['created_by'];
      delete data['updated_by'];
      delete data['created_at'];
      delete data['updated_at'];
      delete data['working_time'];
      delete data['id'];
      return data;
    });
    if (error_in_attendance.length === 0) {
      return JSON.stringify(attendance_details_list);
    } else {
      return JSON.stringify({ error: true, message: error_in_attendance });
    }

  },
  async getAttendanceMobile(attendance_ids) {
    const knex = strapi.connections.default;
    let workers_assessments = await strapi.query("workers-assessments").find({ _limit: -1 });
    let attendance_list = [];
    let attendace_sql_raw = `SELECT
    t1.assigned_worker_id,
    t1.working_time AS shift_status,
    t1.attendance_id,
    t1.worker_service_id,
    t3.name AS shift_name,
    t1.id AS attendance_details_id,
    t5.first_name AS firstname,
    t5.last_name AS lastname,
    t5.id AS worker_id,
    t5.phone_number AS phone,
    t5.nid_number,
    t5.is_verified,
    t1.worker_rate_id,
    t6.value AS rate,
    t7.name AS service,
    t8.status AS attendance_status
    FROM attendance_details AS t1
    LEFT JOIN new_attendances AS t2 ON t1.attendance_id = t2.id
    LEFT JOIN shifts AS t3 ON t2.shift_id = t3.id
    LEFT JOIN new_assigned_workers AS t4 on t1.assigned_worker_id = t4.id
    LEFT JOIN service_providers AS t5 on t4.worker_id = t5.id
    LEFT JOIN worker_rates AS t6 on t1.worker_rate_id = t6.id
    LEFT JOIN services AS t7 on t1.worker_service_id = t7.id
    LEFT JOIN attendance_statuses AS t8 on t1.attendance_id = t8.attendance_id
    WHERE t1.attendance_id IN (${attendance_ids})
    `;
    let attendance_data = await knex.raw(attendace_sql_raw);
    for (let index = 0; index < attendance_data[0].length; index++) {
      const worker_assessments_data = getWorkerAssessment(workers_assessments, attendance_data[0][index]["worker_id"]);
      attendance_data[0][index].mean = worker_assessments_data.mean_score
      attendance_list.push(attendance_data[0][index])
    }
    return attendance_list;
  },
};

function getWorkerAssessment(workers_assessments, worker_id) {
  let response;
  let worker_assessments = workers_assessments.filter((item) => {
    if (item && item.worker_id && worker_id && (item.worker_id.toString() === worker_id.toString())) {
      return item;
    }
  });
  if (worker_assessments.length > 0) {
    const worker_data = worker_assessments.pop();
    response = { found: true, mean_score: worker_data.mean_score }
  } else {
    response = { found: true, mean_score: 0 }
  }
  return response;
}
function getdata(arrayObjcts, obj) {
  let data = [];
  for (let index = 0; index < arrayObjcts.length; index++) {
    let shift_obj = utils.getShift(obj);
    if (arrayObjcts[index].worker_id === obj.worker_id) {
      let total_amount = ((arrayObjcts[index].day_shifts + shift_obj.day_shifts) + (arrayObjcts[index].night_shifts + shift_obj.night_shifts)) * arrayObjcts[index].daily_rate;
      data.push({
        total_amount: total_amount,
        daily_rate: arrayObjcts[index].daily_rate,
        phone_number: arrayObjcts[index].phone_number,
        worker_id: arrayObjcts[index].worker_id,
        service_name: arrayObjcts[index].service_name,
        service_id: arrayObjcts[index].service_id,
        day_shifts: arrayObjcts[index].day_shifts + shift_obj.day_shifts,
        night_shifts: arrayObjcts[index].night_shifts + shift_obj.night_shifts,
        first_name: arrayObjcts[index].first_name,
        last_name: arrayObjcts[index].last_name,
      });
    } else {
      data.push({
        total_amount: arrayObjcts[index].total_amount,
        daily_rate: arrayObjcts[index].daily_rate,
        phone_number: arrayObjcts[index].phone_number,
        worker_id: arrayObjcts[index].worker_id,
        service_name: arrayObjcts[index].service_name,
        service_id: arrayObjcts[index].service_id,
        day_shifts: arrayObjcts[index].day_shifts,
        night_shifts: arrayObjcts[index].night_shifts,
        first_name: arrayObjcts[index].first_name,
        last_name: arrayObjcts[index].last_name
      });
    }
  }
  return data;
}