"use strict";
let Validator = require("validatorjs");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async consumeDeductionPayroll(assigned_worker_id, payment_id, project_id, start_date, end_date) {
    let total_deductions = 0;
    let deductions_types = await strapi.query("deduction-types").find({ _limit: -1 });
    try {
      let deductions_worker = [];
      let all_deductions_worker = await strapi.query("deductions").find({
        project_id: project_id,
        assigned_worker_id: assigned_worker_id,
        payment_id: 0,
        date_gte: start_date,
        date_lte: end_date,
        _limit: -1,
      });
      for (let index = 0; index < all_deductions_worker.length; index++) {
        const item = all_deductions_worker[index];
        let status_deduction_type = getDeductionType(deductions_types, item.deduction_type_id);
        if (status_deduction_type) {
          deductions_worker.push(item);
        }

      }
      let deductions_worker_ids = deductions_worker.map((item) => item.id);
      if (deductions_worker.length > 0) {
        const total_amount = deductions_worker.reduce((sum, item) => {
          return sum + parseInt(item.deduction_amount);
        }, 0);
        for (let indx = 0; indx < deductions_worker_ids.length; indx++) {
          const element = deductions_worker_ids[indx];

          await strapi.query("deductions").update(
            {
              id: element
            },
            {
              project_id: project_id,
              assigned_worker_id: assigned_worker_id,
              payment_id: payment_id,
              payee_name_id: 0
            }
          );
        }
        total_deductions = total_amount;
      }
    } catch (error) {
      console.log("error in consumeDeductionPayroll ", error.message);
    }
    return total_deductions;
  },

  async getPayableDeductionPayroll(payment_id, project_id, start_date, end_date) {
    try {
      // get payable deduction_type
      let deduction_types = await strapi.query("deduction-types").find({ is_payable: true, _limit: -1 });
      if (deduction_types.length > 0) {
        for (let index = 0; index < deduction_types.length; index++) {
          // get all deduction using the filters (project_id, start_date, end_date)
          let deductions = await strapi.query("deductions").find({
            date_gte: start_date,
            date_lte: end_date,
            project_id: project_id,
            deduction_type_id: deduction_types[index].id
          });
          if (deductions.length > 0) {
            // get sum of deductions
            const total_amount = deductions.reduce((sum, item) => {
              return sum + parseInt(item.deduction_amount);
            }, 0);
            // save in deduction_transactions
            let body = {
              amount: total_amount,
              payee_name: deduction_types[index].payee_name,
              phone_number: deduction_types[index].phone_number,
              deduction_type_id: deduction_types[index].id,
              payment_id: payment_id,
              status: "unpaid"
            }
            await strapi.query("deductions-transactions").create(body);
          }

        }
      }
    } catch (error) {
      console.log("Error in getting payble deductions getPayableDeductionPayroll", error.message);
    }
  },
  async isPaymentAttendance(project_id, date, payment_type_id) {

    let status = false;
    let payment = await strapi
      .query("payments")
      .findOne({
        payment_types_id: payment_type_id,
        start_date_lte: date,
        end_date_gte: date,
        project_id: project_id
      });
    if (payment) { // 2. check if deduction email has been sent on this payment + 1. payment must not be unpaid
      let deductions_transactions_payment = await strapi.query("deductions-transactions").findOne({ payment_id: payment.id });
      if (payment.status != 'unpaid' || deductions_transactions_payment) {
        status = true;
      }
    }
    return status;
  },
  async isPayment(project_id, date) {
    let status = false;
    let payment = await strapi
      .query("payments")
      .findOne({
        start_date_lte: date,
        end_date_gte: date,
        project_id: project_id
      });
    if (payment) {
      status = true;
    }
    return status;
  },


  async checkIfPaymentIsAvailable(project_id, assigned_worker_id, date) {
    let response;

    let payment = await strapi
      .query("payments")
      .findOne({
        start_date_lte: date,
        end_date_gte: date,
        project_id: project_id,
        status: "unpaid",
      });
    if (payment) {
      let payroll_translation = await strapi
        .query("payroll-transactions")
        .findOne({
          payment_id: payment.id,
          assigned_worker_id: assigned_worker_id,
        });
      if (payroll_translation) {
        response = {
          status: 200,
          payment_id: payment.id,
          payroll_translation_id: payroll_translation.id,
          transaction_status: payment.status,
        };
      } else {
        response = {
          status: 404,
          payment_id: payment.id,
          payroll_translation_id: 0,
          transaction_status: "",
        };
      }
    } else {
      response = {
        status: 404,
        payment_id: 0,
        payroll_translation_id: 0,
        transaction_status: "",
      };
    }
    return response;
  },
  // create deduction for external payroll
  async createExternalPayrollDeduction(obj) {

    let response;
    try {
      let rules = {
        assigned_worker_id: "required|integer",
        payroll_transaction_id: "required|integer",
        project_id: "required|integer",
        deductions: "array|required",
        payee_name_id: "required|integer"
      };
      let validation = new Validator(obj, rules);
      const { assigned_worker_id, payroll_transaction_id, project_id, deductions, payee_name_id } = obj;
      let worker_deductions = [];
      if (validation.passes()) {
        let sum_amount = 0;
        // check if payroll transaction exist
        let payroll_transaction = await strapi.query("payroll-transactions").findOne({ id: payroll_transaction_id });
        if (payroll_transaction) {
          let payment = await strapi.query("payments").findOne({ id: payroll_transaction.payment_id });
          if (payment) {
            // loop in deductions
            for (let index = 0; index < deductions.length; index++) {
              const item = deductions[index];
              sum_amount = sum_amount + parseInt(item.amount.toString());
              // check for new deduction type
              // if it contains type_name 
              if (item.type_id) {
                const is_deduction_type_exist = await strapi.query('deduction-types').findOne({ id: item.type_id });
                if (is_deduction_type_exist) {
                  const body = {
                    payment_id: payment.id,
                    payroll_id: payroll_transaction_id,
                    assigned_worker_id: assigned_worker_id,
                    project_id: project_id,
                    deduction_amount: item.amount,
                    deduction_type_id: is_deduction_type_exist.id,
                    date: payment.start_date,
                    done_by: payee_name_id,
                    payee_name_id: payee_name_id
                  };
                  worker_deductions.push(body);
                }
              }
            }
            // update payroll_transaction
            const total_deductions = parseInt(sum_amount.toString()) + parseInt(payroll_transaction.total_deductions.toString());
            const take_home = parseInt(payroll_transaction.take_home.toString()) - parseInt(sum_amount.toString());
            await strapi.query("payroll-transactions").update({ id: payroll_transaction.id }, { take_home: take_home, total_deductions: total_deductions })
            // save deduction 
            await strapi.query("deductions").createMany(worker_deductions);
            response = {
              status: "success",
              data: "Deduction Applied successfully",
              error: "Deduction Applied successfully",
              meta: "",
            };
          } else {
            response = {
              status: "failed",
              data: "",
              error: "Invalid Payroll transaction",
              meta: "",
            };
          }
        } else {
          response = {
            status: "failed",
            data: "",
            error: "Invalid Payroll transaction",
            meta: "",
          };
        }
      } else {
        response = {
          status: "failed",
          data: JSON.stringify(validation.data),
          error: JSON.stringify(validation.errors),
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch createExternalPayrollDeduction ", error.message);
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
};

function getDeductionType(deductions_Types, id) {
  let status = false;
  let deduction_types_response = deductions_Types.filter(item => item.id.toString() === id.toString());
  if (deduction_types_response.length > 0) {
    if (deduction_types_response[0].is_external === false) {
      status = true;
    }

  }
  return status;
}

