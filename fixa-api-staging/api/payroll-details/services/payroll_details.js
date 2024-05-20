"use strict";
const moment = require("moment");
const axios = require("axios");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const MOMO_ACCOUNT_HOLDER_ID_TYPE = process.env.MOMO_ACCOUNT_HOLDER_ID_TYPE;
const MOMO_MSISDN = process.env.MOMO_MSISDN;
const MOMO_CURRENCY = process.env.MOMO_CURRENCY;
const {getMomoToken} = require("../../../config/functions/momotoken");

module.exports = {
  // build payroll
  async buildPayroll(attendance_id, type) {
    // get attendance
    let attendance = await strapi.query("new-attendance").findOne({ id: attendance_id });
    let date_range = dateRange(attendance.date);
    // get payroll_type id
    let payroll_type = await strapi.query("payroll-types").findOne({ name: type });
    // get payroll id
    let time_year = moment(attendance.date).format('YYYY');
    let payroll = await strapi.query("payroll").findOne({ date_range: date_range, project_id: attendance.project_id, year: time_year });

    // build payroll
    if (payroll && payroll_type && payroll.id && payroll_type.id) {
      // get attendance_details
      let attendance_details = await strapi.query("attendance-details").find({ attendance_id: attendance_id });
      for (let index = 0; index < attendance_details.length; index++) {
        // only if worker rate is not null
        if (attendance_details[index].worker_rate_id != null) {
          //  get worker rate
          let worker_rate = await strapi.query("worker-rates").findOne({ id: attendance_details[index].worker_rate_id });
          // check if assigned worker exist in payroll_detail with (payroll_id, assigned_worker_id, project_id)
          let worker_in_payroll_details = await strapi.query("payroll-details").findOne({ project_id: attendance.project_id, payroll_id: payroll.id, assigned_worker_id: attendance_details[index].assigned_worker_id })

          if (worker_in_payroll_details) {
            let current_payroll = await strapi.query("payroll").findOne({ id: payroll.id });
            let id = worker_in_payroll_details.id;

            let payroll_detail_body = {
              total_earnings: parseInt(worker_in_payroll_details.total_earnings) + parseInt(worker_rate.value),
              take_home: parseInt(worker_in_payroll_details.take_home) + parseInt(worker_rate.value),
              total_shifts: parseInt(worker_in_payroll_details.total_shifts) + 1,
            };

            let payroll_body = {
              total_shifts: parseInt(current_payroll.total_shifts) + 1,
              amount: parseInt(current_payroll.amount) + parseInt(worker_rate.value),
              payroll_type_id: payroll_type.id
            };

            await strapi.query("payroll-details").update({ id }, payroll_detail_body);
            await strapi.query("payroll").update({ id: payroll.id }, payroll_body);
          } else {
            // get worker_info
            let new_assigned_worker_info = await strapi.query("new-assigned-workers").findOne({ id: attendance_details[index].assigned_worker_id });
            let worker_info = await strapi.query("service-providers").findOne({ id: new_assigned_worker_info.worker_id });
            let current_payroll = await strapi.query("payroll").findOne({ id: payroll.id });
            if (current_payroll && current_payroll.total_shifts == 0) {
              await strapi.query("payroll").update({ id: current_payroll.id }, { payroll_status: "unpaid" });
            }
            let worker_full_name = `${worker_info.first_name} ${worker_info.last_name}`;
            let worker_phone_number = worker_info.phone_number ? worker_info.phone_number : "no_phone_number";
            // check phone_number momo availability
            let phone_number_momo_availability = await checkPhoneMomoAvailabilty(worker_info.phone_number);

            let payroll_detail_body = {
              worker_name: worker_full_name,
              worker_phone_number: worker_phone_number,
              assigned_worker_id: attendance_details[index].assigned_worker_id,
              payroll_id: payroll.id,
              total_deductions: 0,
              total_earnings: worker_rate.value,
              take_home: worker_rate.value,
              project_id: attendance.project_id,
              momo: phone_number_momo_availability,
              on_hold: false,
              status: "unpaid",
              total_shifts: 1,
              payroll_type_id: payroll_type.id
            };

            let payroll_body = {
              total_shifts: current_payroll.total_shifts + 1,
              total_workers: parseInt(current_payroll.total_workers) + 1,
              amount: parseInt(current_payroll.amount) + parseInt(worker_rate.value),
              payroll_type_id: payroll_type.id
            };

            await strapi.query("payroll-details").create(payroll_detail_body);
            await strapi.query("payroll").update({ id: payroll.id }, payroll_body);
          }
        }

      }
    }
  },
  // constract payroll_response
  async payroll_response(payroll_id, filters) {
    let response;
    // if filter are available
    if (filters) {

      let worker_payroll_details = [];
      const knex = strapi.connections.default;
      let payroll = await strapi.query("payroll").findOne({ id: payroll_id });
      // get deductions_types
      let deductions_types = await strapi.query("deduction-types").find({ project_id: payroll.project_id });
      // get payroll_details_data
      let payroll_details = await strapi.query("payroll-details").find({ payroll_id: payroll_id, project_id: payroll.project_id, ...filters, _limit: -1 });
      // meta_data
      let meta_data = {
        date: payroll.date_range,
        total_shifts: getTotalShifts(payroll_details),
        successful_transactions: payroll.successful_transactions,
        failed_transactions: payroll.failed_transactions,
        total_workers: payroll.total_workers,
        amount_due: payroll.amount,
        project_id: payroll.project_id,
        deductions_types: deductions_types,
        payroll_type_id: payroll.payroll_type_id
      };

      for (let index = 0; index < payroll_details.length; index++) {
        // get worker deductions
        let worker_deductions_sql_raw = `SELECT deduction_amount,title,deduction_type_id, payroll_details_deductions.id FROM payroll_details_deductions LEFT JOIN deduction_types ON payroll_details_deductions.deduction_type_id = deduction_types.id WHERE payroll_details_deductions.assigned_worker_id = ${payroll_details[index].assigned_worker_id} AND payroll_id = ${payroll_id}`;
        // get payroll_details_deductions_data 
        let take_home_increments_data = await strapi.query("take-home-increments").find({ assigned_worker_id: payroll_details[index].assigned_worker_id, payroll_details_id: payroll_details[index].id, _limit: -1 });
        
         // get attendance by range of payroll
         let date_query = {
          date_gte:payroll.start_date,
          date_lte:payroll.end_date,
        };
        let attendances_range = await strapi.query("new-attendance").find(date_query);
        let worker_data_attendance = await getAttendanceWorkerInfo(attendances_range,payroll_details[index].assigned_worker_id);
     
        // get worker_rates and services
        let worker_rates_services_sql_raw = "SELECT" +
          " t1.service_id AS level," +
          " t1.service_id AS service_id," +
          " t2.name AS service_name," +
          " t1.value AS daily_rate," +
          " t3.total_shifts AS days_worked" +
          " FROM worker_rates AS t1" +
          " LEFT JOIN services AS t2 ON t1.service_id = t2.id" +
          " LEFT JOIN payroll_details AS t3 ON t3.assigned_worker_id = t1.assigned_worker_id" +
          " WHERE t1.assigned_worker_id = " + payroll_details[index].assigned_worker_id + " AND t3.payroll_id= " + payroll_id;

        // get worker phone_number, id,assign_worker_id, is_verfied
        let worker_info_sql_raw = ("SELECT" +
          " t2.phone_number AS phone," + //phone_number,
          " t1.worker_id AS worker_id," + //worker_id,
          " t2.is_verified AS momo," + //is_verified,
          " t1.id AS assign_worker_id " + //assign_worker_id,
          " FROM new_assigned_workers AS t1" +
          " LEFT JOIN service_providers AS t2 ON t1.worker_id = t2.id" +
          " WHERE t1.id = " + payroll_details[index].assigned_worker_id);
        let worker_info_id = await strapi.query("new-assigned-workers").findOne({id:payroll_details[index].assigned_worker_id});
        let transaction_status = await strapi.query("instant-payout-transaction-tracks").findOne({ instant_payout_transaction_id: payroll_details[index].id });

        let worker_deductions = await knex.raw(worker_deductions_sql_raw);
        let worker_rates_services = await knex.raw(worker_rates_services_sql_raw);
        let worker_info = await knex.raw(worker_info_sql_raw);
      if(worker_info_id){
        let worker_data = {
          id: payroll_details[index].id,
          worker_name: payroll_details[index].worker_name,
          worker_id: worker_info_id.worker_id,
          worker_phone_number: payroll_details[index].worker_phone_number,
          on_hold: payroll_details[index].on_hold,
          take_home: payroll_details[index].take_home,
          total_shifts: payroll_details[index].total_shifts,
          total_deductions: payroll_details[index].total_deductions,
          total_earnings: payroll_details[index].total_earnings,
          assigned_worker_id: payroll_details[index].assigned_worker_id,
          worker_days_worked :worker_data_attendance,
          momo: payroll_details[index].momo ? payroll_details[index].momo : false,
          deductions: worker_deductions[0],
          additions: getToTalIncrements(take_home_increments_data),
          transaction_status: transaction_status ? transaction_status.status : payroll_details[index].status, // this must be updated from cronjob
          // momo: worker_info[0][0].momo ? true : false,
          transaction_reference_id: payroll_details[index].transaction_reference_id,
          extra: worker_rates_services[0]
        };
        worker_payroll_details.push(worker_data);
      }
      }
      response = {
        payroll_id: payroll_id,
        meta: meta_data,
        table: worker_payroll_details
      };
    }
    // no filters
    else {
      let worker_payroll_details = [];
      const knex = strapi.connections.default;
      let payroll = await strapi.query("payroll").findOne({ id: payroll_id });
      // get deductions_types
      let deductions_types = await strapi.query("deduction-types").find({ project_id: payroll.project_id });
      // get payroll_details_data
      let payroll_details = await strapi.query("payroll-details").find({ payroll_id: payroll_id, project_id: payroll.project_id, _limit: -1 });
      // meta_data
      let meta_data = {
        date: payroll.date_range,
        total_shifts: getTotalShifts(payroll_details),
        successful_transactions: payroll.successful_transactions,
        failed_transactions: payroll.failed_transactions,
        total_workers: payroll.total_workers,
        amount_due: payroll.amount,
        project_id: payroll.project_id,
        deductions_types: deductions_types,
        payroll_type_id: payroll.payroll_type_id
      };


      for (let index = 0; index < payroll_details.length; index++) {
        // get worker deductions
        let worker_deductions_sql_raw = `SELECT deduction_amount,title,deduction_type_id, payroll_details_deductions.id FROM payroll_details_deductions LEFT JOIN deduction_types ON payroll_details_deductions.deduction_type_id = deduction_types.id WHERE payroll_details_deductions.assigned_worker_id = ${payroll_details[index].assigned_worker_id} AND payroll_id = ${payroll_id}`;
        // get payroll_details_deductions_data 
        let take_home_increments_data = await strapi.query("take-home-increments").find({ assigned_worker_id: payroll_details[index].assigned_worker_id, payroll_details_id: payroll_details[index].id, _limit: -1 });
        // get attendance by range of payroll
        let date_query = {
          date_gte:payroll.start_date,
          date_lte:payroll.end_date,
        };
        let attendances_range = await strapi.query("new-attendance").find(date_query);
        let worker_data_attendance = await getAttendanceWorkerInfo(attendances_range,payroll_details[index].assigned_worker_id);
        // console.log("################ start ##############")
        // console.log(worker_data_attendance)
        // console.log("################ End ##############")
        // get worker_rates and services
        let worker_rates_services_sql_raw = "SELECT" +
          " t1.service_id AS level," +
          " t1.id AS service_id," +
          " t2.name AS service_name," +
          " t1.value AS daily_rate," +
          " t3.total_shifts AS days_worked" +
          " FROM worker_rates AS t1" +
          " LEFT JOIN services AS t2 ON t1.service_id = t2.id" +
          " LEFT JOIN payroll_details AS t3 ON t3.assigned_worker_id = t1.assigned_worker_id" +
          " WHERE t1.assigned_worker_id = " + payroll_details[index].assigned_worker_id + " AND t3.payroll_id= " + payroll_id;

        // get worker phone_number, id,assign_worker_id, is_verfied
        let worker_info_sql_raw = ("SELECT" +
          " t2.phone_number AS phone," + //phone_number,
          " t1.worker_id AS worker_id," + //worker_id,
          " t2.is_verified AS momo," + //is_verified,
          " t1.id AS assign_worker_id " + //assign_worker_id,
          " FROM new_assigned_workers AS t1" +
          " LEFT JOIN service_providers AS t2 ON t1.worker_id = t2.id" +
          " WHERE t1.id = " + payroll_details[index].assigned_worker_id);
          let worker_info_id = await strapi.query("new-assigned-workers").findOne({id:payroll_details[index].assigned_worker_id});
        let transaction_status = await strapi.query("instant-payout-transaction-tracks").findOne({ instant_payout_transaction_id: payroll_details[index].id });

        let worker_deductions = await knex.raw(worker_deductions_sql_raw);
        let worker_rates_services = await knex.raw(worker_rates_services_sql_raw);
        let worker_info = await knex.raw(worker_info_sql_raw);
        if(worker_info_id){
          let worker_data = {
            id: payroll_details[index].id,
            worker_name: payroll_details[index].worker_name,
            worker_id: worker_info_id.worker_id,
            worker_phone_number: payroll_details[index].worker_phone_number,
            on_hold: payroll_details[index].on_hold,
            take_home: payroll_details[index].take_home,
            total_shifts: payroll_details[index].total_shifts,
            total_deductions: payroll_details[index].total_deductions,
            total_earnings: payroll_details[index].total_earnings,
            momo: payroll_details[index].momo ? payroll_details[index].momo : false,
            assigned_worker_id: payroll_details[index].assigned_worker_id,
            worker_days_worked :worker_data_attendance,
            deductions: worker_deductions[0],
            additions: getToTalIncrements(take_home_increments_data),
            transaction_status: transaction_status ? transaction_status.status : payroll_details[index].status, // this must be updated from cronjob
            // momo: worker_info[0][0].momo ? true : false,
            transaction_reference_id: payroll_details[index].transaction_reference_id,
            extra: worker_rates_services[0]
          };
          worker_payroll_details.push(worker_data);
        }
      }
      response = {
        payroll_id: payroll_id,
        meta: meta_data,
        table: worker_payroll_details
      };
    }

    return response;
  },

  // check transaction statuses
  async checkTransactionStatus(payroll_id) {
    let payroll_details_worker = await strapi.query("payroll-details").find({ payroll_id: payroll_id, _limit: -1 });
    for (let index = 0; index < payroll_details_worker.length; index++) {
      if (payroll_details_worker[index].status != "successful" && payroll_details_worker[index].on_hold != true) {
        let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
        let payroll_type = await strapi.query("payroll-types").findOne({ id: payroll_details_worker[index].payroll_type_id });
        if (payroll_type) {
          let payout_transaction_tracks = await strapi.query("instant-payout-transaction-tracks").findOne({ id: payroll_details_worker[index].payout_transaction_tracks_id, payroll_type_id: payroll_type.id }).catch((err) => console.log("error in payWorkers", err));
          if (payout_transaction_tracks) {
            await axios
              .get(
                MOMO_URL_DISB +
                "v1_0/transfer/" +
                payout_transaction_tracks.reference_id,
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
              ).then(function (response) {
                strapi.query("payroll-details").update({ id: payroll_details_worker[index].id }, { status: response.data.status.toLowerCase(), error_message: response.data?.reason });
                strapi.query("instant-payout-transaction-tracks").update({ id: payout_transaction_tracks.id }, { status: response.data.status.toLowerCase() });
              })
              .catch(function (error) {
                console.log("error", error.message);
                strapi.query("instant-payout-transaction-tracks").update({ id: payout_transaction_tracks.id }, { status: "404" });
              });
          }
        }
      }
    }
  },

  async createPayrollTable(payroll_id, filters) {
    let payroll = await strapi.query("payroll").findOne({ id: payroll_id });
    const run_payroll = await strapi
      .query("run-payroll")
      .find({ payroll_id, _limit: -1 });

    let deduction_type_entities = await strapi
      .query("deduction-types")
      .find({ project_id: payroll.project_id, is_available: true });
    let deduction_types = deduction_type_entities?.map(({ id, title }) => {
      return {
        id,
        title,
      };
    });

    let response = {
      payroll_id: 0,
      meta: {
        date: "",
        total_transactions: "",
        successful_transactions: 0,
        failed_transactions: 0,
        total_workers: "",
        amount_due: "",
        project_id: 0,
        deduction_types: deduction_types,
      },
      table: [],
    };

    const table_entries = [];

    if (payroll && run_payroll) {
      response.payroll_id = payroll.id;
      response.meta.date = payroll.date_range;
      response.meta.project_id = payroll.project_id;
      response.meta.amount_due = payroll.deducted_amount;
      response.meta.total_transactions = payroll.transaction;
      response.meta.total_workers = payroll.total_workers;
      response.meta.successful_transactions = payroll.successful_transactions;
      response.meta.failed_transactions = payroll.failed_transactions;

      const entities = await strapi
        .query("payroll-details")
        .find({ payroll_id: payroll_id, ...filters, _limit: -1 }, [
          "worker",
          "deductions.deduction_type",
        ]);

      // populate table
      entities.map((entity) => {
        let table_entry = {
          id: 0,
          worker_id: 0,
          worker_name: "",
          phone_number: "",
          total_shifts: 0,
          deductions: [],
          earnings: 0,
          total_deductions: 0,
          deducted_earnings: 0,
          status: "",
          extra: [],
        };
        const extra_info_arr = [];
        const deductions_arr = [];

        // populate table entry
        table_entry.id = entity.id;
        table_entry.worker_id = entity.worker.id;
        table_entry.worker_name =
          entity.worker.first_name + " " + entity.worker.last_name;
        table_entry.phone_number = entity.worker.phone_number;
        table_entry.earnings = parseInt(entity.initial_earnings);
        table_entry.deducted_earnings = parseInt(entity.deducted_earnings);
        table_entry.total_deductions = parseInt(entity.total_deductions);
        table_entry.status = entity.status;
        table_entry.total_shifts = entity.total_shifts;
        table_entry.error_message = entity.error_message;
        table_entry.reference_id = entity.reference_id;
        table_entry.on_hold = entity.on_hold;

        // set deductions
        entity?.deductions.map((deduction) => {
          const deductions_obj = {
            type_id: 0,
            type: "",
            amount: 0,
          };

          deductions_obj.type_id = deduction.deduction_type.id;
          deductions_obj.type = deduction.deduction_type.title;
          deductions_obj.amount = deduction.deduction_amount;
          deductions_arr.push(deductions_obj);
        });

        table_entry.deductions = deductions_arr;

        // get data from run payrolls to calculate extra info
        const my_worker_data = run_payroll.filter(
          (worker) => worker.worker_id == entity.worker.id
        );

        my_worker_data.map((item) => {
          const service_exists = extra_info_arr.find(
            (o) => o.service_name === item.service_name
          );
          if (service_exists) {
            service_exists.days_worked += parseInt(item.days_worked);
          } else {
            const extra_info = {
              service_name: "",
              level: 0,
              days_worked: 0,
              daily_rate: 0,
            };
            extra_info.service_name = item.service_name;
            extra_info.level = item.level || 1;
            extra_info.days_worked = parseInt(item.days_worked);
            extra_info.daily_rate = parseInt(item.earnings);
            extra_info_arr.push(extra_info);
          }
        });

        table_entry.extra = extra_info_arr;

        table_entries.push(table_entry);
      });

      response.table = table_entries;
    }
    return response;
  },
  async singlePayrolWorker(worker_id) {
    const knex = strapi.connections.default;
    let worker_payment_history_sql_raw = `SELECT
    t1.id AS attendance_detail_id,
    t5.date AS attendance_date,
    t4.name AS service_name,
    t7.name AS attendance_shift,
    t3.value AS attendance_daily_rate
    FROM attendance_details AS t1
    LEFT JOIN new_assigned_workers AS t2 ON t2.id = t1.assigned_worker_id
    LEFT JOIN worker_rates AS t3 ON t3.id = t1.worker_rate_id
    LEFT JOIN services AS t4 ON t4.id = t3.service_id
    LEFT JOIN new_attendances AS t5 ON t5.id = t1.attendance_id
    LEFT JOIN attendance_statuses AS t6 ON t6.id = t1.attendance_id
    LEFT JOIN shifts AS t7 ON t7.id = t5.shift_id
    WHERE t1.assigned_worker_id =  ${worker_id}`;
    let worker_payment_history = await knex.raw(worker_payment_history_sql_raw);
    return JSON.stringify(worker_payment_history[0]);
  }
};

const getAttendanceWorkerInfo = async(attendances,assigned_worker_id)=> {
  let total_sum = [];
  let worker_days = 0;
  let worker_night = 0;
    for (let index = 0; index < attendances.length; index++) {
      if(attendances[index].shift_id === 1){

        let day_attendance = await strapi.query("attendance-details").count({attendance_id:attendances[index].id,assigned_worker_id:assigned_worker_id});
        // let day_attendance = await strapi.query("attendancelist").count({attendance_id:attendances[index].id,assigned_worker_id:assigned_worker_id});
       if(day_attendance)
       { 
        worker_days = worker_days + 1;
        // console.log("###########################start##################");
        // console.log(`here is the days ${worker_days} :: attendance_id ${attendances[index].id} :: ${assigned_worker_id}`)
      }
      }else {
        let night_attendance = await strapi.query("attendance-details").count({attendance_id:attendances[index].id,assigned_worker_id:assigned_worker_id});
        // let night_attendance = await strapi.query("attendancelist").count({attendance_id:attendances[index].id,assigned_worker_id:assigned_worker_id});
    
        if(night_attendance)
        { 
          worker_night =worker_night + 1;
          // console.log(`here is the nightd ${worker_night} :: attendance_id ${attendances[index].id} :: ${assigned_worker_id}`)
          // console.log("###########################End##################");
       }
     
      }
      
    }
    total_sum = [{"shift":"Days","count":worker_days},{"shift":"Nights","count":worker_night}];
    return total_sum;
}

const dateRange = (dateTime) => {
  let date_range = "";
  let time_day = moment(dateTime).format('D');
  let time_month = moment(dateTime).format('MM');
  let time_year = moment(dateTime).format('YYYY');
  let last_day_of_month = new Date(time_year, time_month, 0).getDate();

  if (time_day <= 15) {
    date_range = "1/" + time_month + " - 15/" + time_month
  } else {
    date_range = "16/" + time_month + " - " + last_day_of_month + "/" + time_month
  }
  return date_range;
}

const getTotalShifts = (payroll_details) => {
  let sum = 0;
  for (let index = 0; index < payroll_details.length; index++) {
    sum = sum + parseInt(payroll_details[index].total_shifts);
  }
  return sum;
}

const getToTalIncrements = (take_home_increments_data) => {
  let sum = 0;
  for (let index = 0; index < take_home_increments_data.length; index++) {
    sum = sum + parseInt(take_home_increments_data[index].incremented_amount);
  }
  return sum;
}

// check if phone_number is allowed to receive money in momo
const checkPhoneMomoAvailabilty = async (worker_phone_number) => {
  let status = false;
  let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
  if (worker_phone_number && worker_phone_number.length == 10) {
    let new_worker_phone_number = worker_phone_number.slice(1);
    const response = await axios.get(
      MOMO_URL_DISB +
      "v1_0/accountholder/msisdn/250" +
      new_worker_phone_number +
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
    status = response.data.result;
  }
  return status;
}