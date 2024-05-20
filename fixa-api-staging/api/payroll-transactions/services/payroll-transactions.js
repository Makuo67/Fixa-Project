"use strict";
const { v4: uuid } = require("uuid");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */


module.exports = {
  async getPayrollWorkerTransactions(payment, queries) {
    const project = await strapi.query("projects").findOne({ id: payment.project_id });

    let sms_status = false;
    let payroll_transactions = [];
    let worker_payroll_transactions = [];
    if (queries) {
      worker_payroll_transactions = await strapi.query("payroll-transactions").find({ payment_id: payment.id, ...queries });
    } else {
      worker_payroll_transactions = await strapi.query("payroll-transactions").find({ payment_id: payment.id, _limit: -1 });
    }
    const deduction_transactions = await strapi.query("deductions-transactions").find({ payment_id: payment.id, _limit: -1 });

    const deductions = await strapi.query("deductions").find({ payment_id: payment.id, _limit: -1 });

    const total_supplier = deduction_transactions.reduce((sum, item) => {
      if (parseInt(item.amount) < 0) {
        return sum;
      }
      return sum + parseInt(item.amount);
    }, 0);

    const worker_earnings = worker_payroll_transactions.reduce((sum, item) => {
      if (parseInt(item.total_earnings) < 0) {
        return sum;
      }
      return sum + parseInt(item.total_earnings);
    }, 0);

    const total_amount = worker_earnings + total_supplier;

    const total_deduction_amount = deductions.reduce(
      (sum, item) => {
        if (parseInt(item.deduction_amount) < 0) {
          return sum;
        }
        return sum + parseInt(item.deduction_amount);
      }, 0);

    const total_take_home = worker_payroll_transactions.reduce((sum, item) => {
      if (parseInt(item.take_home) < 0) {
        return sum;
      }
      return sum + parseInt(item.take_home);
    }, 0);

    const total_earnings = total_take_home + total_supplier;

    const total_night_shifts = worker_payroll_transactions.reduce(
      (sum, item) => {
        return sum + parseInt(item.night_shifts);
      }, 0);

    const total_day_shifts = worker_payroll_transactions.reduce((sum, item) => {
      return sum + parseInt(item.day_shifts);
    }, 0);

    const paid_transactions = worker_payroll_transactions.filter((itemWorker) => {
      if (itemWorker.status === "successful") {
        return itemWorker;
      }
    });

    const failed_transactions = worker_payroll_transactions.filter((itemWorker) => {
      if (itemWorker.status === "failed") {
        return itemWorker;
      }
    });

    const otp_type = await strapi.query("opt-verification-types").findOne({ type_name: "sms" });
    if (otp_type) {
      let otp_verification = await strapi.query("otp-verification").findOne({
        payment_id: payment.id,
        is_sms: true,
        is_verified: true,
        opt_verification_type_id: otp_type.id,
      });
      if (otp_verification) {
        sms_status = true;
      }
    }
    payroll_transactions.push({
      sms_status: sms_status,
      project_name: project.name,
      start_date: payment.start_date,
      end_date: payment.end_date,
      project_id: payment.project_id,
      header: {
        total_workers: worker_payroll_transactions.length,
        total_day_shifts: total_day_shifts,
        total_night_shifts: total_night_shifts,
        total_deductions: total_deduction_amount,
        failed_transactions: failed_transactions.length,
        paid_transactions: paid_transactions.length,
        total_earnings: total_earnings,
        total_amount: total_amount,
      },
      workers: worker_payroll_transactions,
    });

    return payroll_transactions;
  },

  async getPayrollWorkerTransactionsDetails(payroll_transaction) {
    const knex = strapi.connections.default;
    let payment = await strapi
      .query("payments")
      .findOne({ id: payroll_transaction.payment_id });

    let payroll_transactions = {};
    let shifts = [];
    let deductions = [];
    let allShifts = [];
    let payroll_transaction_tracks = await strapi
      .query("payment-transaction-tracks")
      .findOne({
        payments_id: payment.id,
        payroll_payout_transaction_id: payroll_transaction.id,
        _sort: "created_at:DESC"
      });

    if (payment) {
      let all_attendances = await strapi.query("new-attendance").find({
        date_gte: payment.start_date,
        date_lte: payment.end_date,
        _limit: -1,
        project_id: payment.project_id,
      });
      let all_attendances_ids = all_attendances.map((item) => item.id);
      let attendances_json = await getPayrollAttendanceTransactions(
        all_attendances_ids,
        payroll_transaction.assigned_worker_id
      );
      let attendances = JSON.parse(attendances_json);
      // let attendances = await strapi.query("attendancelist").find({
      //   attendance_date_gte: payment.start_date,
      //   attendance_date_lte: payment.end_date,
      //   assigned_worker_id: payroll_transaction.assigned_worker_id,
      //   _limit: -1,
      //   project_id: payment.project_id,
      // });
      for (let index = 0; index < attendances.length; index++) {
        if (
          shifts.length === 0 ||
          !allShifts.includes(attendances[index].service.toLowerCase())
        ) {
          allShifts.push(attendances[index].service.toLowerCase());
          shifts.push({
            service_name: attendances[index].service,
            rate: attendances[index].daily_rate,
            shifts: attendances[index].working_time.toLowerCase() === 'full' ? 1 : 0.5,
          });
        } else {
          shifts = getData(shifts, attendances[index]);
        }
      }

      let deduction_sql_raw = `SELECT
    t1.id,
    t2.title,
    t1.deduction_amount
    FROM deductions AS t1
    INNER JOIN deduction_types AS t2 ON t2.id = t1.deduction_type_id
    WHERE t1.project_id =${payment.project_id} 
    AND t1.assigned_worker_id =${payroll_transaction.assigned_worker_id}
    AND t1.payment_id =${payment.id}
   
    `;

      let deductions_workers = await knex.raw(deduction_sql_raw);

      //   let deductions_worker = await strapi
      //   .query("deductions")
      //   .find({
      //     project_id: payment.project_id,
      //     assigned_worker_id: payroll_transaction.assigned_worker_id,
      //     payment_id: payment.id,
      //     consumed: false,
      //     _limit: -1
      //   });
      deductions = deductions_workers[0];
    }
    if (payroll_transaction.status === "unpaid") {
      payroll_transactions = {
        deductions: deductions,
        shifts: shifts,
      };
    } else {
      payroll_transactions = {
        deductions: deductions,
        shifts: shifts,
        payroll_transaction_tracks: payroll_transaction_tracks,
      };
    }

    return payroll_transactions;
  },

  async getAttendanceWorkerPayrollDetails(payroll_transaction, payment) {
    const knex = strapi.connections.default;
    let worker_attendance_details = {};
    let worker_rates = {};
    let assign_worker_details = await strapi
      .query("new-assigned-workers")
      .find({ id: payroll_transaction.assigned_worker_id });
    let attendances = await strapi.query("new-attendance").find({
      date_gte: payment.start_date,
      date_lte: payment.end_date,
      _limit: -1,
      project_id: payment.project_id,
    });
    // let attendances = await strapi.query("attendancelist").find({
    //   attendance_date_gte: payment.start_date,
    //   attendance_date_lte: payment.end_date,
    //   assigned_worker_id: payroll_transaction.assigned_worker_id,
    //   _limit: -1,
    //   project_id: payment.project_id,
    // });//to change
    let shifts = await strapi.query("shifts").find();
    let worker_rate = await strapi
      .query("worker-rates")
      .findOne({ assigned_worker_id: payroll_transaction.assigned_worker_id });
    if (worker_rate) {
      let worker_rate_sql_raw = `SELECT
      t2.name,
      t1.value
      FROM worker_rates AS t1
      LEFT JOIN services as t2 ON t1.service_id = t2.id
      WHERE t1.id=${worker_rate.id}
      `;
      let worker_rates_current = await knex.raw(worker_rate_sql_raw);

      worker_rates = { ...worker_rates_current[0][0] };
    }
    let deductions_workers;
    let new_shfits = shifts.map((item) => {
      return { name: item.name, id: item.id };
    });

    if (attendances.length > 0) {
      let attendance_ids = attendances.map((item) => item.id);
      let deduction_sql_raw = `SELECT
    t1.id,
    t4.id as attendance_id,
    t4.date,
    t3.name AS service_name,
    t5.name AS shift_name,
    t1.working_time,
    t2.value
    FROM attendance_details AS t1
    LEFT JOIN worker_rates as t2 ON t2.id = t1.worker_rate_id
    LEFT JOIN services as t3 ON t1.worker_service_id = t3.id
    LEFT JOIN new_attendances as t4 ON t4.id = t1.attendance_id
    LEFT JOIN shifts as t5 ON t5.id = t4.shift_id
    WHERE t1.assigned_worker_id =${payroll_transaction.assigned_worker_id} 
    AND t1.attendance_id IN (${attendance_ids}) AND t1.assigned_worker_id=${payroll_transaction.assigned_worker_id}
    `;

      deductions_workers = await knex.raw(deduction_sql_raw);
      // worker_attendance_details = attendances.map(arrangeAttendanceDetails);
    }
    var stringify_attendance_worker_shift = JSON.stringify(deductions_workers[0]);
    var attendance_worker_shift = JSON.parse(stringify_attendance_worker_shift);
    var new_attendance_worker_shift = attendance_worker_shift.map((item) => {
      let worker_rate_new = item['value'];
      if (item['working_time'].toLowerCase() == 'half') {
        worker_rate_new = worker_rate_new / 2;
      }
      return {
        "id": item.id,
        "attendance_id": item.attendance_id,
        "date": item.date,
        "service_name": item.service_name,
        "shift_name": item.shift_name,
        "value": worker_rate_new
      }
    })
    worker_attendance_details = {
      attendance_shifts: attendances.length > 0 ? new_attendance_worker_shift : [],
      worker_rate: worker_rates,
      shifts: new_shfits,
      assign_worker_details: assign_worker_details,
    };

    return worker_attendance_details;
  },

  async getAttendanceDeductions(payroll_transaction, payment) {
    const knex = strapi.connections.default;
    let deductions = [];
    let deduction_types = await strapi
      .query("deduction-types")
      .find({ project_id: payment.project_id });
    let deduction_types_new = deduction_types.map((item) => {
      return {
        id: item.id,
        title: item.title,
        project_id: item.project_id,
      };
    });
    let deduction_sql_raw = `SELECT
    t1.id,
    t2.title,
    t1.deduction_amount
    FROM deductions AS t1
    INNER JOIN deduction_types AS t2 ON t2.id = t1.deduction_type_id
    WHERE t1.project_id =${payment.project_id} 
    AND t1.assigned_worker_id =${payroll_transaction.assigned_worker_id}
    AND t1.payment_id =${payment.id}

    `;

    let deductions_workers = await knex.raw(deduction_sql_raw);

    deductions = {
      workers_deductions: deductions_workers[0],
      deduction_types: deduction_types_new,
    };

    return deductions;
  },
  async updateOnAttendace(
    amount,
    payment_id,
    payroll_transaction_id,
    shift_id,
    is_half_shift
  ) {
    let payment = await strapi.query("payments").findOne({ id: payment_id });
    let payroll_transaction = await strapi.query("payroll-transactions").findOne({ id: payroll_transaction_id });
    let payroll_transactions = await strapi.query("payroll-transactions").find({ payment_id: payment_id, _limit: -1 })

    if (is_half_shift === true) {
      let total_amount = parseInt(payment.total_amount) - (parseInt(amount) / 2);
      let total_earnings = parseInt(payroll_transaction.total_earnings) - (parseInt(amount) / 2);
      let take_home = parseInt(payroll_transaction.take_home) - (parseInt(amount) / 2);
      await strapi.query("payments").update({ id: payment_id }, { total_amount: total_amount });
      await strapi.query("payroll-transactions").update({ id: payroll_transaction.id }, { take_home: take_home, total_earnings: total_earnings });
    } else {
      let shift = await strapi.query("shifts").findOne({ id: shift_id });
      let day_shifts = shift.name.toLowerCase() === "day" ? 1 : 0;
      let night_shifts = shift.name.toLowerCase() === "night" ? 1 : 0;
      let days = parseInt(payroll_transaction.day_shifts) + parseInt(day_shifts);
      let nights = parseInt(payroll_transaction.night_shifts) + parseInt(night_shifts);
      let total_amount = parseInt(payment.total_amount) + parseInt(amount);
      let total_earnings = parseInt(payroll_transaction.total_earnings) + parseInt(amount);
      let take_home = parseInt(payroll_transaction.take_home) + parseInt(amount);
      await strapi.query("payments").update({ id: payment_id }, { total_amount: total_amount, total_payees: payroll_transactions.length + 1 });
      await strapi.query("payroll-transactions").update(
        { id: payroll_transaction.id },
        {
          take_home: take_home,
          total_earnings: total_earnings,
          day_shifts: days,
          night_shifts: nights,
        }
      );
    }
  },
  async createOnAttendace(
    amount,
    payment_id,
    assigned_worker_id,
    service_id,
    shift_id
  ) {
    let payment = await strapi.query("payments").findOne({ id: payment_id });
    let assign_worker = await strapi.query("new-assigned-workers").findOne({ id: assigned_worker_id });
    let shift = await strapi.query("shifts").findOne({ id: shift_id });
    let service = await strapi.query("services").findOne({ id: service_id });
    let worker = await strapi.query("service-providers").findOne({ id: assign_worker.worker_id });
    let default_payment = await getDefaultWorkerPaymentMethod(assign_worker.worker_id);
    if (default_payment.status) {
      let take_home = parseInt(amount);
      let payroll_transaction_worker = {
        total_shifts: 1,
        payee_type_id: payment.payment_types_id,
        payment_id: payment.id,
        total_earnings: amount,
        take_home: take_home,
        status: "unpaid",
        service_name: service.name,
        phone_number: worker.phone_number,
        assigned_worker_id: assigned_worker_id,
        worker_id: assign_worker.worker_id,
        total_deductions: 0,
        worker_name: `${worker.first_name} ${worker.last_name}`,
        day_shifts: shift.name.toLowerCase() === "day" ? 1 : 0,
        night_shifts: shift.name.toLowerCase() === "night" ? 1 : 0,
        is_momo: false,
        is_momo_verified_and_rssb: default_payment.data.is_verified,
        is_momo_verified_and_rssb_desc: default_payment.data.account_verified_desc,
        account_number: default_payment.data.account_number,
        payment_method: default_payment.data.provider,
        payment_method_id: default_payment.data.id
      };

      await strapi.query("payroll-transactions").create(payroll_transaction_worker);
      let transactions = await strapi.query("payroll-transactions").find({ payment_id: payment.id, _limit: -1 });
      const total_amount = transactions.reduce((sum, item) => {
        return sum + parseInt(item.take_home);
      }, 0);
      await strapi
        .query("payments")
        .update(
          { id: payment_id },
          { total_amount: total_amount, total_payees: transactions.length }
        );
    }
  },
  async removeFromAttendance(
    amount,
    payment_id,
    payroll_transaction_id,
    shift_id
  ) {
    let payment = await strapi.query("payments").findOne({ id: payment_id });
    let payroll_transaction = await strapi
      .query("payroll-transactions")
      .findOne({ id: payroll_transaction_id });
    let day_shifts = parseInt(payroll_transaction.day_shifts);
    let night_shifts = parseInt(payroll_transaction.night_shifts);
    if (shift_id) {
      if (shift_id === 1) {
        day_shifts = parseInt(payroll_transaction.day_shifts) - 1;
      }
      if (shift_id === 2) {
        night_shifts = parseInt(payroll_transaction.night_shifts) - 1;
      }
    }

    let total_earnings = parseInt(payroll_transaction.total_earnings) - parseInt(amount);
    let take_home = parseInt(payroll_transaction.take_home) - parseInt(amount);
    await strapi
      .query("payroll-transactions")
      .update(
        { id: payroll_transaction.id },
        {
          take_home: take_home,
          total_earnings: total_earnings,
          day_shifts: day_shifts,
          night_shifts: night_shifts,
        }
      );

    let transactions = await strapi.query("payroll-transactions").find({ payment_id: payment.id, _limit: -1 });
    const total_amount = transactions.reduce((sum, item) => {
      return sum + parseInt(item.take_home);
    }, 0);
    await strapi.query("payments")
      .update(
        { id: payment_id },
        { total_amount: total_amount, total_payees: transactions.length }
      );
  },
  async getPayrollWorkers(payment_id, status, payment_method_id) {
    // console.log('------>',payment_id, status,payment_method_id);
    let all_workers_to_pay = [];
    let workers_to_pay = [];
    if (status === "unpaid") {
      all_workers_to_pay = await strapi.query("payroll-transactions").find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1 });
      // console.log('all_workers_to_pay ',all_workers_to_pay.length);
      workers_to_pay = all_workers_to_pay.filter((worker) => {
        if (worker.status === "unpaid") {
          worker.amount = worker.take_home;
          worker.account_number = worker.account_number;
          worker.reference_id = uuid();
          worker.payment_type_name = "payroll";
          return worker;
        }
      });
    } else {
      all_workers_to_pay = await strapi.query("payroll-transactions").find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1, status: "failed" });
      let workersUnpaid = await strapi.query("payroll-transactions").find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1, status: "unpaid" });

      // console.log('all_workers_to_pay ',all_workers_to_pay.length,' workersUnpaid :: ',workersUnpaid.length);
      if (workersUnpaid.length > 0) {
        workers_to_pay = workersUnpaid.filter((worker) => {
          if (worker.status === "unpaid") {
            worker.amount = worker.take_home;
            worker.account_number = worker.account_number;
            worker.reference_id = uuid();
            worker.payment_type_name = "payroll";
            return worker;
          }
        });
      }
      if (all_workers_to_pay.length > 0) {
        for (let index = 0; index < all_workers_to_pay.length; index++) {
          let payroll_transaction = await strapi
            .query("payment-transaction-tracks")
            .findOne({
              payroll_payout_transaction_id: all_workers_to_pay[index].id,
              payments_id: payment_id,
              _sort: "created_at:DESC"
            });
          if (payroll_transaction && payroll_transaction.status.toLowerCase() === "failed") {
            workers_to_pay.push({
              ...all_workers_to_pay[index],
              amount: all_workers_to_pay[index].take_home,
              account_number: all_workers_to_pay[index].account_number,
              reference_id: uuid(),
              payment_type_name: "payroll"
            });
            await strapi.query("payment-transaction-tracks").update(
              { id: payroll_transaction.id },
              {
                is_rerun: true,
              }
            )
          }
        }
      }

    }
    // console.log('workers_to_pay ---->',workers_to_pay.length);
    return workers_to_pay;
  },
};

function getData(allShifts, shift) {
  let shifts = [];

  for (let index = 0; index < allShifts.length; index++) {
    if (
      allShifts[index].service_name.toLowerCase() ===
      shift.service.toLowerCase()
    ) {
      var shift_worker = shift.working_time.toLowerCase() === 'full' ? 1 : 0.5;
      shifts.push({
        service_name: allShifts[index].service_name,
        rate: allShifts[index].rate,
        shifts: allShifts[index].shifts + shift_worker,
      });
    } else {
      shifts.push(allShifts[index]);
    }
  }

  return shifts;
}

function checkMoMoPhoneNumber(phone) {
  // return true if length must be 10, starts with 07 and momo verified
  const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~ A-Za-z]/;
  if (
    phone.length === 10 &&
    specialChars.test(phone) === false &&
    phone.startsWith("07", 0) === true
  ) {
    return phone;
  } else {
    return false;
  }
}

async function getPayrollAttendanceTransactions(
  attendance_ids,
  assigned_worker_id
) {
  const knex = strapi.connections.default;
  let attendance_workers = [];
  let worker_data_sql_raw = `SELECT 
  t5.shift_id,
  t7.name AS shift_name,
  t1.assigned_worker_id,
  t4.name AS service,
  t4.id AS service_id,
  t2.value AS daily_rate,
  t1.working_time,
  t6.id AS worker_id
  FROM attendance_details AS t1
  LEFT JOIN worker_rates as t2 ON t2.id = t1.worker_rate_id
  LEFT JOIN new_assigned_workers AS t3 ON t3.id = t1.assigned_worker_id
  LEFT JOIN services as t4 ON t1.worker_service_id = t4.id
  LEFT JOIN new_attendances as t5 ON t5.id = t1.attendance_id
  LEFT JOIN service_providers AS t6 ON t6.id = t3.worker_id
  LEFT JOIN shifts AS t7 ON t7.id = t5.shift_id
  WHERE t1.attendance_id IN (${attendance_ids}) AND t1.assigned_worker_id=${assigned_worker_id}
  `;
  let attendance_workers_data = await knex.raw(worker_data_sql_raw);
  if (attendance_workers) {
    attendance_workers = JSON.stringify(attendance_workers_data[0]);
  }

  return attendance_workers;
}
async function getDefaultWorkerPaymentMethod(passed_id) {
  let response = { status: false, message: '', data: {} };
  try {
    const worker = await strapi.query("service-providers").findOne({ id: passed_id });
    if (worker && worker.payment_methods.length >= 1) {
      let default_payment = worker.payment_methods.find((element) => element.is_active);
      response = { status: true, message: 'success', data: default_payment };
    } else {
      response = { status: false, message: 'No default payment found', data: {} };
    }
  } catch (error) {
    console.log('error in getDefaultWorkerPaymentMethod()', error.message);
    response.message = error.message;
  }
  return response;
}
