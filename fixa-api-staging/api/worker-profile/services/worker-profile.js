"use strict";
// const {
//   getWorkerHistory,
// } = require("../../service-providers/services/service-providers");
const moment = require("moment");
const BUILD_SAVE_WORKER_PROFILE_URL = process.env.BUILD_SAVE_WORKER_PROFILE_URL;
const BUILD_REMOVE_WORKER_PROFILE_URL = process.env.BUILD_REMOVE_WORKER_PROFILE_URL;
const axios = require("axios");
const { workerBuild } = require("../../workforce/services/workforce");
const _ = require('underscore');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async getAttendanceWorkerInfo(assigned_worker_ids, attendance_ids) {
    const knex = strapi.connections.default;

    let response = [];
    let attendace_sql_raw =
      "SELECT" +
      " t2.date," +
      " t1.working_time," +
      " t4.id AS assigned_worker_id," +
      " t8.id AS project_id," +
      " t8.name AS project_name," +
      " t7.id AS supervisor_id," +
      " t7.first_name AS supervisor_first_name," +
      " t7.last_name AS supervisor_last_name," +
      " t3.id AS shift_id," +
      " t3.name AS shift_name," +
      " t6.id AS service_id," +
      " t6.name AS service_name," +
      " t5.value AS daily_earnings" +
      " FROM attendance_details AS t1" +
      " LEFT JOIN new_attendances AS t2 ON t1.attendance_id = t2.id" +
      " LEFT JOIN shifts AS t3 ON t2.shift_id = t3.id" +
      " LEFT JOIN new_assigned_workers AS t4 on t1.assigned_worker_id = t4.id" +
      " LEFT JOIN worker_rates AS t5 on t1.worker_rate_id = t5.id" +
      " LEFT JOIN services AS t6 on t1.worker_service_id = t6.id" +
      " LEFT JOIN `users-permissions_user` AS t7 on t2.supervisor_id = t7.id" +
      " LEFT JOIN projects AS t8 on t4.project_id = t8.id" +
      ` WHERE t1.attendance_id IN (${attendance_ids}) AND t1.assigned_worker_id IN (${assigned_worker_ids})` +
      " ORDER BY t2.date DESC";

    let attendance_data = await knex.raw(attendace_sql_raw);

    response = attendance_data[0];

    return response;
  },
  async getWorkerAttendance(worker_id, attendance_date_gte, attendance_date_lte) {
    try {
      const total_days = attendance_date_lte.diff(attendance_date_gte, 'days')

      attendance_date_gte = attendance_date_gte.format()
      attendance_date_lte = attendance_date_lte.format()

      const attendance = await strapi.query("attendancelist").find({ worker_id, attendance_date_gte, attendance_date_lte, _limit: -1 });

      const attended = _.chain(attendance)
        .groupBy("attendance_date")
        .size();

      if (total_days <= 0) return 100

      const ratio = attended / total_days
      // console.log(worker_id, attended.value(), total_days)

      return (ratio * 100).toFixed(2)

    } catch (error) {
      console.log(error)
      return -1
    }
  },
  async saveWorkerProfile(worker_ids) {
    // const allworkers = await strapi.query("workforce").find({ _limit: -1 });
    // let workers;
    // if (worker_ids == "all") {
    //   workers = allworkers;
    // } else {
    //   workers = [worker_ids];
    // }
    // for (let i = 0; i < workers.length; i++) {
    //   let histories = [];
    //   if (workers[i].worker_id && workers[i].project_id) {
    //     histories = await getWorkerHistory(workers[i].worker_id);
    //     if (histories && histories.length >= 1) {
    //       histories.map(async (history) => {
    //         try {
    //           let obj = {
    //             date_onboarded: workers[i].created_at
    //               ? moment(workers[i].created_at).format("YYYY-MM-DD")
    //               : null,
    //             project_name:
    //               history && history.project ? history.project : null,
    //             project_id:
    //               history && history.project_id ? history.project_id : null,
    //             trade: history && history.service ? history.service : null,
    //             trade_id:
    //               history && history.service_id ? history.service_id : null,
    //             shift: history && history.shift ? history.shift : null,
    //             shift_id: history && history.shift_id ? history.shift_id : null,
    //             working_date:
    //               history && history.date
    //                 ? moment(history.date).format("YYYY-MM-DD")
    //                 : null,
    //             supervisor_name:
    //               history && history.supervisor ? history.supervisor : null,
    //             supervisor_id:
    //               history && history.supervisor_id
    //                 ? history.supervisor_id
    //                 : null,
    //             daily_earnings:
    //               history && history.daily_earnings
    //                 ? history.daily_earnings
    //                 : null,
    //             worker_id: workers[i].worker_id ? workers[i].worker_id : 0,
    //             attendance_id:
    //               history && history.attendance_id
    //                 ? history.attendance_id
    //                 : null,
    //           };
    //           let filter = {
    //             working_date: moment(history.date).format("YYYY-MM-DD"),
    //             project_id: history.project_id,
    //             shift: history.shift,
    //             worker_id: workers[i].worker_id,
    //             attendance_id: history.attendance_id,
    //           };
    //           let isprofile = await strapi
    //             .query("worker-profile")
    //             .findOne(filter);
    //           if (!isprofile) {
    //             await strapi.query("worker-profile").create(obj);
    //             console.log(
    //               "we are adding a history to a worker with id ",
    //               workers[i].worker_id
    //             );
    //           }
    //         } catch (err) {
    //           console.log(err);
    //         }
    //       });
    //     } else if (histories && histories.length === 0) {
    //       const workeforce = await strapi.services["workforce"].findOne({
    //         worker_id: workers[i].worker_id,
    //       });
    //       const attendancelist = await strapi.services[
    //         "attendancelist"
    //       ].findOne({ worker_id: workers[i].worker_id });
    //       if (workeforce && attendancelist) {
    //         let first_obj = {
    //           date_onboarded: workeforce.date_onboarded
    //             ? moment(workeforce.date_onboarded).format("YYYY-MM-DD")
    //             : null,
    //           project_name: workeforce.project_name,
    //           project_id: workeforce.project_id,
    //           trade: workeforce.trade,
    //           trade_id: workeforce.trade_id,
    //           worker_id: workers[i].worker_id ? workers[i].worker_id : 0,
    //           daily_earnings: attendancelist.daily_rate,
    //           shift: attendancelist.shift,
    //           shift_id: attendancelist.shift_id,
    //           working_date: attendancelist.attendance_date,
    //           supervisor_name: "",
    //           attendance_id: attendancelist.attendance_id,
    //           supervisor_id: attendancelist.supervisor_id,
    //         };
    //         let filter = {
    //           working_date: moment(attendancelist.attendance_date).format(
    //             "YYYY-MM-DD"
    //           ),
    //           project_id: attendancelist.project_id,
    //           shift: attendancelist.shift,
    //           worker_id: workers[i].worker_id,
    //           attendance_id: history.attendance_id,
    //         };
    //         let isprofile = await strapi
    //           .query("worker-profile")
    //           .findOne(filter);
    //         if (!isprofile) {
    //           await strapi.query("worker-profile").create(first_obj);
    //           console.log(
    //             "we are adding a history to a worker with id ",
    //             workers[i].worker_id,
    //             "for the first time"
    //           );
    //         }
    //       }
    //     } else {
    //       console.log("worker history can't be pulled");
    //     }
    //   } else {
    //     console.log(
    //       "we will not do anything because the project with id",
    //       workers[i].project_id,
    //       "doesn't exist or worker id",
    //       workers[i].worker_id,
    //       "does not exist"
    //     );
    //   }
    // }
  },
  async attendanceSaveWorkerProfile(attendance_details_id) {
    let response = {};
    try {
      let data_response = await buildWorkerProfile(BUILD_SAVE_WORKER_PROFILE_URL, attendance_details_id);
      response = {
        status: "success",
        message: "Building Saving Worker Profile"
      }
    } catch (error) {
      response = {
        status: "failed",
        message: error.message
      }
    }
    return response;
  },
  async saveAttendanceWorkerProfile(attendance_details_id) {
    let response = {};
    try {
      // get attendance details
      let attendance_details = await strapi
        .query("attendance-details")
        .findOne({ id: attendance_details_id });
      if (attendance_details) {
        // get attendance
        let attendance = await strapi
          .query("new-attendance")
          .findOne({ id: attendance_details.attendance_id });
        if (attendance) {
          // get new_assign_worker info
          let new_assign_worker = await strapi
            .query("new-assigned-workers")
            .findOne({ id: attendance_details.assigned_worker_id });
          if (new_assign_worker) {
            // get worker_info(service_providers)
            let worker = await strapi
              .query("service-providers")
              .findOne({ id: new_assign_worker.worker_id });
            if (worker) {
              let project = await strapi
                .query("projects")
                .findOne({ id: new_assign_worker.project_id });
              if (project) {
                // check if worker_profile exist
                let worker_profile = await strapi
                  .query("worker-profile")
                  .findOne({
                    project_id: project.id,
                    worker_id: worker.id,
                    attendance_id: attendance.id,
                  });
                // if no create new one
                if (!worker_profile) {
                  let service = await strapi
                    .query("services")
                    .findOne({ id: attendance_details.worker_service_id });
                  if (service) {
                    let worker_rate = await strapi
                      .query("worker-rates")
                      .findOne({ id: attendance_details.worker_rate_id });

                    if (worker_rate) {
                      let created_at = moment(worker.created_at).format(
                        "YYYY-MM-DD"
                      );
                      let shift = await strapi
                        .query("shifts")
                        .findOne({ id: attendance.shift_id });
                      let supervisor = await strapi
                        .query("user", "users-permissions")
                        .findOne({ id: attendance.supervisor_id });
                      let worker_profile_obj = {
                        date_onboarded: created_at,
                        project_name: project.name,
                        project_id: project.id,
                        trade: service.name,
                        trade_id: service.id,
                        working_date: attendance.date,
                        supervisor_name: supervisor
                          ? `${supervisor.first_name} ${supervisor.last_name}`
                          : "",
                        supervisor_id: attendance.supervisor_id,
                        daily_earnings: worker_rate.value,
                        worker_id: worker.id,
                        shift: shift.name,
                        shift_id: attendance.shift_id,
                        attendance_id: attendance.id,
                      };
                      await strapi
                        .query("worker-profile")
                        .create(worker_profile_obj);
                      console.log("workprofile create for worker_id ::", worker.id);
                      // build worforce
                      await workerBuild(worker.id, project.id);
                      response = {
                        status: "success",
                        message: "Worker Profile Updated"
                      }
                    } else {
                      response = {
                        status: "failed",
                        message: `Worker Rate Not Available`,
                      };
                    }
                  } else {
                    response = {
                      status: "failed",
                      message: `Service With id (${attendance_details.worker_service_id}) Not found`,
                    };
                  }
                } else {
                  response = {
                    status: "failed",
                    message: `Worker Profile Already Exist`,
                  };
                }
              } else {
                response = {
                  status: "failed",
                  message: `Project  with id (${new_assign_worker.project_id}) not found`,
                };
              }
            } else {
              response = {
                status: "failed",
                message: `Worker  with id (${new_assign_worker.worker_id}) not found`,
              };
            }
          } else {
            response = {
              status: "failed",
              message: `Assign Worker  with id (${attendance_details.assigned_worker_id}) not found`,
            };
          }
        } else {
          response = {
            status: "failed",
            message: `Attendance  with id (${attendance_details.attendance_id}) not found`,
          };
        }
      } else {
        response = {
          status: "failed",
          message: `Attendance details with id (${attendance_details_id}) not found`,
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        message: error.message,
      };
    }
    return response;
  },
  async removeAttendanceWorkerProfile(attendance_details_id) {
    let response = {};
    try {
      // get attendance details
      let attendance_details = await strapi
        .query("attendance-details")
        .findOne({ id: attendance_details_id });
      if (attendance_details) {
        // get attendance
        let attendance = await strapi
          .query("new-attendance")
          .findOne({ id: attendance_details.attendance_id });
        if (attendance) {
          // get new_assign_worker info
          let new_assign_worker = await strapi
            .query("new-assigned-workers")
            .findOne({ id: attendance_details.assigned_worker_id });
          if (new_assign_worker) {
            // get worker_info(service_providers)
            let worker = await strapi
              .query("service-providers")
              .findOne({ id: new_assign_worker.worker_id });
            if (worker) {
              let project = await strapi
                .query("projects")
                .findOne({ id: new_assign_worker.project_id });
              if (project) {
                // check if worker_profile exist
                let worker_profile = await strapi
                  .query("worker-profile")
                  .findOne({
                    project_id: project.id,
                    worker_id: worker.id,
                    attendance_id: attendance.id,
                  });
                // if yes delete 
                if (worker_profile) {
                  await strapi
                    .query("worker-profile")
                    .delete({ id: worker_profile.id });
                  console.log("workprofile remove for worker_id ::", worker.id);
                  // build worforce
                  await workerBuild(worker.id, project.id);
                  response = {
                    status: "success",
                    message: `Worker Profile Updated`,
                  };
                } else {
                  response = {
                    status: "failed",
                    message: `Worker Profile Does Not Exist`,
                  };
                }
              } else {
                response = {
                  status: "failed",
                  message: `Project  with id (${new_assign_worker.project_id}) not found`,
                };
              }
            } else {
              response = {
                status: "failed",
                message: `Worker  with id (${new_assign_worker.worker_id}) not found`,
              };
            }
          } else {
            response = {
              status: "failed",
              message: `Assign Worker  with id (${attendance_details.assigned_worker_id}) not found`,
            };
          }
        } else {
          response = {
            status: "failed",
            message: `Attendance  with id (${attendance_details.attendance_id}) not found`,
          };
        }
      } else {
        response = {
          status: "failed",
          message: `Attendance details with id (${attendance_details_id}) not found`,
        };
      }
    } catch (error) {
      response = {
        status: "failed"
      }
    }
    return response;
  },
  async getAllWorkerServices(worker_id) {
    // TODO: to be rafactored to use KNEX in queries
    let filtered_worker_services = [];
    let worker_services = [];

    let all_services = await strapi.query("services").find({ _limit: -1 });
    let all_assigned = await strapi.query("new-assigned-workers").find({ worker_id, _sort: 'created_at:DESC', _limit: -1 });
    let current_assigned = await strapi.query("new-assigned-workers").findOne({ worker_id, _sort: 'created_at:DESC' });

    if (current_assigned && all_assigned && all_assigned.length >= 1) {
      let all_assigned_ids = _.map(all_assigned, all => all.id);
      let all_rates = await strapi.query("worker-rates").find({ assigned_worker_id: all_assigned_ids, _sort: 'created_at:DESC' });

      if (all_rates) {
        _.map(all_rates, function (all) {
          const service = _.find(all_services, s => s.id === all.service_id);
          all.service_name = service?.name || 'no service name';
          return all;
        });
      } else {
        console.log("INFO: no worker_rates found with assigned_worker_id::" + all_assigned_ids);
        message.push("INFO: no worker_rates found with assigned_worker_id::" + all_assigned_ids);
      }
      let current_rate = await strapi.query("worker-rates").findOne({ assigned_worker_id: current_assigned.id, _sort: 'created_at:DESC' });
      if (current_rate) {
        const service = _.find(all_services, s => s.id === current_rate.service_id)
        current_rate.service_name = service?.name || 'no service name';
      }

      worker_services = { current: current_rate, all: all_rates };

      let all_services_worker_used = _.map(all_rates, all => all.service_id);
      let uniqueService = [...new Set(all_services_worker_used)];
      filtered_worker_services = _.map(uniqueService, (all) => {
        if(all.toString() != '0'){

        
        let service_name = _.find(all_services, (s) => { return s.id === all; }).name;
        return { service_id: all, name: service_name };
      }
      });
      // console.log("worker_services", worker_services)
      // console.log("filtered_worker_services == >", filtered_worker_services)

    } else {
      console.log(`INFO: no new-assigned-workers found with worker_id::${worker_id} and project_id::${project_id}`);
      message.push(`INFO: no new-assigned-workers found with worker_id::${worker_id} and project_id::${project_id}`);
    }
    return filtered_worker_services;
  }
};

async function buildWorkerProfile(build_url, attendance_details_id) {
  try {
    let response = await axios.get(build_url + attendance_details_id, {
      headers: {
        "Content-Length": 0,
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });
  } catch (err) {
    console.log("axios error", err);
  }
}
