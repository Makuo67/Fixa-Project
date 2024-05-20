"use strict";
let Validator = require("validatorjs");
const { checkIfPaymentIsAvailable, isPaymentAttendance } = require("../services/deductions");
const { checkIfPaymentExist } = require("../../payments/services/payments");
const {
  createDeductionType,
} = require("../../deduction-types/services/deduction-types");
const api_key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
var admin_pannel_url = process.env.ADMIN_PANNEL_URL;
const { createDeductionTransactions } = require('../../deductions-transactions/services/deductions-transactions');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  // ************************** To-do sprint-7 (START) ***************************
  // create bulk deduction for internal attendance
  async createBulkInternalDeduction(ctx) {
    const user = ctx.state.user;
    let response;
    try {
      let rules = {
        date: "required|string",
        deductions: "array|required", // deductions: [ {"type_id":0,"amount":0,"assigned_worker_id":0}]
        project_id: "required|integer"
      };
      let validation = new Validator(ctx.request.body, rules);
      let worker_deductions = [];
      if (validation.passes()) {
        const { date, deductions, project_id } = ctx.request.body;
        let payment_type = await strapi.query('payment-types').findOne({ "type_name": "payroll" });
        if (payment_type) {

          let payment_is_available = await isPaymentAttendance(
            project_id,
            date,
            payment_type.id
          );
          if (payment_is_available === false) {
            for (let index = 0; index < deductions.length; index++) {
              const item = deductions[index];
              const body = {
                assigned_worker_id: item.assigned_worker_id,
                payment_id: 0,
                deduction_amount: item.amount,
                project_id: project_id,
                deduction_type_id: item.type_id,
                date: date,
                done_by: user.id
              };
              worker_deductions.push(body);
            }
            // save deduction 
            await strapi.query("deductions").createMany(worker_deductions);
            ctx.response.status = 200;
            response = {
              status: "success",
              data: "Deductions Applied successfully",
              error: "Deductions Applied successfully",
              meta: "",
            };
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Failed to apply deduction , payment exist",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Failed to apply deduction , payment-type does not exist",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.errors,
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch createBulkInternalDeduction ", error.message);
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
  // create deduction for internal payroll
  async createInternalPayrollDeduction(ctx) {
    const user = ctx.state.user;
    let response;
    try {
      let rules = {
        assigned_worker_id: "required|integer",
        payroll_transaction_id: "required|integer",
        project_id: "required|integer",
        deductions: "array|required"
      };
      let validation = new Validator(ctx.request.body, rules);
      const { assigned_worker_id, payroll_transaction_id, project_id, deductions } = ctx.request.body;
      let worker_deductions = [];
      if (validation.passes()) {
        let sum_amount = 0;
        // check if payroll transaction exist
        let payroll_transaction = await strapi.query("payroll-transactions").findOne({ id: payroll_transaction_id });
        if (payroll_transaction) {
          let deductions_transactions_payment = await strapi.query("deductions-transactions").findOne({ payment_id: payroll_transaction.payment_id });
          if (deductions_transactions_payment) {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Internal deductions are currently unavailable because external deductions are being deducted.",
              meta: "",
            };


          } else {
            let payment = await strapi.query("payments").findOne({ id: payroll_transaction.payment_id });
            if (payment) {
              // loop in deductions
              for (let index = 0; index < deductions.length; index++) {
                const item = deductions[index];
                sum_amount = sum_amount + parseInt(item.amount.toString());
                // check for new deduction type
                // if it contains type_name 
                if (item.hasOwnProperty("type_name") || item.type_id.toString() === '0') {
                  // check if type_nam exist before adding
                  const is_deduction_type_exist = await await strapi.query('deduction-types').findOne({ "title": item.type_name });
                  if (is_deduction_type_exist) {
                    const body = {
                      payment_id: payment.id,
                      payroll_id: payroll_transaction_id,
                      assigned_worker_id: assigned_worker_id,
                      project_id: project_id,
                      deduction_amount: item.amount,
                      deduction_type_id: is_deduction_type_exist.id,
                      date: payment.start_date,
                      done_by: user.id
                    };
                    worker_deductions.push(body);


                  } else {
                    //  register deduction_type
                    let new_deduction_type = await strapi.query('deduction-types').create({
                      'title': item.type_name,
                      'is_available': true,
                      'is_external': false
                    });
                    const body = {
                      payment_id: payment.id,
                      payroll_id: payroll_transaction_id,
                      assigned_worker_id: assigned_worker_id,
                      project_id: project_id,
                      deduction_amount: item.amount,
                      deduction_type_id: new_deduction_type.id,
                      date: payment.start_date,
                      done_by: user.id
                    };
                    worker_deductions.push(body);
                  }

                } else {
                  const body = {
                    payment_id: payment.id,
                    payroll_id: payroll_transaction_id,
                    assigned_worker_id: assigned_worker_id,
                    project_id: project_id,
                    deduction_amount: item.amount,
                    deduction_type_id: item.type_id,
                    date: payment.start_date,
                    done_by: user.id
                  };
                  worker_deductions.push(body);
                }
              }
              // update payroll_transaction
              const total_deductions = parseInt(sum_amount.toString()) + parseInt(payroll_transaction.total_deductions.toString());
              const take_home = parseInt(payroll_transaction.take_home.toString()) - parseInt(sum_amount.toString());
              await strapi.query("payroll-transactions").update({ id: payroll_transaction.id }, { take_home: take_home, total_deductions: total_deductions })
              // save deduction 
              await strapi.query("deductions").createMany(worker_deductions);
              ctx.response.status = 200;
              response = {
                status: "success",
                data: "Deduction Applied successfully",
                error: "Deduction Applied successfully",
                meta: "",
              };
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "",
                error: "Invalid Payroll transaction",
                meta: "",
              };
            }
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Invalid Payroll transaction",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.errors,
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch createInternalPayrollDeduction ", error.message);
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
  // create deduction for attendance 
  async createAttendanceDeduction(ctx) {
    const user = ctx.state.user;
    let response;
    try {
      let rules = {
        assigned_worker_id: "required|integer",
        date: "required|string",
        deductions: "array|required",
        project_id: "required|integer"
      };
      let validation = new Validator(ctx.request.body, rules);
      let worker_deductions = [];
      if (validation.passes()) {
        // check if payment-type is available
        let payment_type = await strapi.query('payment-types').findOne({ "type_name": "payroll" });
        //if  payment exist 
        if (payment_type) {
          // check if payment(payroll) is available
          let payroll_transaction_available = await isPaymentAttendance(
            ctx.request.body.project_id,
            ctx.request.body.date,
            payment_type.id
          );

          if (payroll_transaction_available === false) { // if payment is not available or if payment is available but no external deduction email is sent
            // loop in deductions
            for (let index = 0; index < ctx.request.body.deductions.length; index++) {
              const item = ctx.request.body.deductions[index];
              // check for new deduction type
              // check if type_id is present
              if (item.type_id) {
                // if it contains type_name 
                if (item.hasOwnProperty("type_name") || item.type_id.toString() === '0') {
                  // check if type_name exist before adding
                  const is_deduction_type_exist = await strapi.query('deduction-types').findOne({ "title": item.type_name });
                  if (is_deduction_type_exist) {
                    const body = {
                      assigned_worker_id: ctx.request.body.assigned_worker_id,
                      payment_id: 0,
                      project_id: ctx.request.body.project_id,
                      deduction_amount: item.amount,
                      deduction_type_id: is_deduction_type_exist.id,
                      date: ctx.request.body.date,
                      done_by: user.id
                    };
                    worker_deductions.push(body);
                  } else {
                    // register deduction_type
                    let new_deduction_type = await strapi.query('deduction-types').create({
                      'title': item.type_name,
                      'is_available': true,
                      'is_external': false
                    });
                    const body = {
                      assigned_worker_id: ctx.request.body.assigned_worker_id,
                      payment_id: 0,
                      project_id: ctx.request.body.project_id,
                      deduction_amount: item.amount,
                      deduction_type_id: new_deduction_type.id,
                      date: ctx.request.body.date,
                      done_by: user.id
                    };
                    worker_deductions.push(body);
                  }
                } else {
                  const body = {
                    assigned_worker_id: ctx.request.body.assigned_worker_id,
                    payment_id: 0,
                    deduction_amount: item.amount,
                    project_id: ctx.request.body.project_id,
                    deduction_type_id: item.type_id,
                    date: ctx.request.body.date,
                    done_by: user.id
                  };
                  worker_deductions.push(body);
                }
              }
            }


            const sum_deductions = worker_deductions.reduce((sum, item) => {
              return sum + parseInt(item.deduction_amount.toString());
            }, 0);


            // check if payment is available
            let payment = await checkIfPaymentExist(ctx.request.body.date, ctx.request.body.project_id, ctx.request.body.assigned_worker_id);
            if (payment.status !== 404) {
              if (payment.status_payment === "unpaid") {
                if (payment.status === 200) {
                  worker_deductions.map((item) => {
                    item.payment_id = payment.payment_id
                    return item;
                  })

                  let payroll_transaction = await strapi.query("payroll-transactions").findOne({ id: payment.payroll_transaction_id });

                  let take_home = parseInt(payroll_transaction.take_home.toString()) - sum_deductions;

                  let total_deductions = parseInt(payroll_transaction.total_deductions.toString()) + sum_deductions;

                  await strapi.query("payroll-transactions").update(
                    { id: payroll_transaction.id },
                    {
                      take_home: take_home,
                      total_deductions: total_deductions
                    }
                  );

                }
              }
            }
            // save deduction 
            await strapi.query("deductions").createMany(worker_deductions);
            ctx.response.status = 200;
            response = {
              status: "success",
              data: "Deduction Applied successfully",
              error: "Deduction Applied successfully",
              meta: "",
            };
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Failed to apply deduction, Payment is locked",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Failed to apply deduction , payment-type does not exist",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.errors,
          meta: "",
        };
      }

    } catch (error) {
      console.log("erro catch createAttendanceDeduction ", error.message);
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
  // get deductions for payroll_transactions
  async getPayrollDeductions(ctx) {
    const knex = strapi.connections.default;
    let response;
    try {
      const { id } = ctx.params;
      if (id) {
        let payroll_transaction = await strapi.query("payroll-transactions").findOne({ id: id });
        if (payroll_transaction) {
          let payment = await strapi.query("payments").findOne({ id: payroll_transaction.payment_id });
          if (payment) {
            let project = await strapi.query("projects").findOne({ id: payment.project_id });
            if (project) {
              let deduction_types = project.deduction_types;
              let worker_deductions = await strapi.query("deductions").find({
                assigned_worker_id: payroll_transaction.assigned_worker_id,
                payment_id: payroll_transaction.payment_id,
                _limit: -1,
              });

              let worker_deductions_ids = worker_deductions.map((item) => item.id);

              if (worker_deductions_ids.length === 0) {

                let internal_deductions_types = [];
                if (deduction_types.length > 0) {
                  for (let index = 0; index < deduction_types.length; index++) {
                    const item = deduction_types[index];
                    if (item.is_external === false) {
                      internal_deductions_types.push(item);
                    }
                  }

                }

                let deductions = {
                  workers_deductions: [],
                  deduction_types: internal_deductions_types,
                };
                ctx.response.status = 200;
                response = {
                  status: "success",
                  data: deductions,
                  error: "",
                  meta: "",
                };
              } else {
                let deduction_sql_raw = `SELECT
           t1.id,
          t2.title,
          t1.deduction_amount,
          t2.id AS deduction_type_id
          FROM deductions AS t1
          INNER JOIN deduction_types AS t2 ON t2.id = t1.deduction_type_id
          WHERE t1.id IN (${worker_deductions_ids})
          `;
                let deductions_workers = await knex.raw(deduction_sql_raw);

                const combinedDeductions = deductions_workers[0].reduce((result, currentObject) => {
                  const existingObject = result.find(obj => obj.deduction_type_id === currentObject.deduction_type_id);

                  if (existingObject) {
                    // Combine the properties of the current object with the existing object
                    existingObject.deduction_amount += currentObject.deduction_amount;
                  } else {
                    // Add the current object as a new entry in the result array
                    result.push(currentObject);
                  }

                  return result;
                }, []);

                let internal_deductions_types = [];
                if (deduction_types.length > 0) {
                  for (let index = 0; index < deduction_types.length; index++) {
                    const item = deduction_types[index];
                    if (item.is_external === false) {
                      internal_deductions_types.push(item);
                    }
                  }

                }

                let deductions = {
                  workers_deductions: combinedDeductions,
                  deduction_types: internal_deductions_types,
                };
                ctx.response.status = 200;
                response = {
                  status: "success",
                  data: deductions,
                  error: "",
                  meta: "",
                };
              }
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "",
                error: "Invalid Project Id",
                meta: "",
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Invalid payment id",
              meta: "",
            };
          }

        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Invalid id",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "Invalid id",
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch getPayrollDeductions ", error.message);
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
  //  get mobile deduction for daily attendance
  async getMobileAttendanceDeductions(ctx) {
    let response;
    const knex = strapi.connections.default;
    try {
      const { id, date } = ctx.params;
      if (id) {
        let worker_deductions = await strapi.query("deductions").find({
          assigned_worker_id: id, date: date, _limit: -1,
        });

        let worker_deductions_ids = worker_deductions.map((item) => item.id);

        if (worker_deductions_ids.length === 0) {
          ctx.response.status = 200;
          response = {
            status: "success",
            data: [],
            error: "",
            meta: "",
          };
        } else {

          let deduction_sql_raw = `SELECT
       t1.id,
      t2.title,
      t1.deduction_amount,
      t2.id AS deduction_type_id
      FROM deductions AS t1
      INNER JOIN deduction_types AS t2 ON t2.id = t1.deduction_type_id
      WHERE t1.id IN (${worker_deductions_ids})
      `;
          let deductions_workers = await knex.raw(deduction_sql_raw);

          ctx.response.status = 200;
          response = {
            status: "success",
            data: deductions_workers[0],
            error: "",
            meta: "",
          };
        }

      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "Invalid id",
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch getMobileAttendanceDeductions", error.message);
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
  // send email to payee-names 
  async sendPayeeEmails(ctx) {
    let response;
    try {
      let rules = {
        payment_id: "required|integer",
        emails: "required|array"
      };
      let validation = new Validator(ctx.request.body, rules);

      if (validation.passes()) {
        const { payment_id, emails } = ctx.request.body;
        // check if payment exist and if it's unpaid (status)
        const payment = await strapi.query("payments").findOne({ id: payment_id });
        if (payment && payment.status === 'unpaid') {
          for (let index = 0; index < emails.length; index++) {
            let email = emails[index];
            email = email.split(",");
            const payee = await strapi.query('payee-names').findOne({ email: emails[index] });
            if (payee) {
              let json_object = { payment_id: payment_id, payee_id: payee.id };
              let encode_payment_info = Buffer.from(JSON.stringify(json_object)).toString('base64');
              let link_url = `${admin_pannel_url}/finance/payments/deductions/${encode_payment_info}`;
              // creating deduction_transactions
              await createDeductionTransactions(payee, payment.id, link_url);
              var data = {
                from: "info@fixarwanda.com",
                to: email,
                subject: "Recording Deduction",
                template: "deduction-template",
                "v:join_link": `${link_url}`,
                "v:payroll_name": `${payment.title}`,
                "v:subject": "",
              };
              mailgun.messages().send(data, function (error, body) {

              });
            }
          }
          ctx.response.status = 200;
          response = {
            status: "sending",
            data: "Sending emails",
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Invalid Payment",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.errors,
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch ======> ", error.message);
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
  // ************************** To-do sprint-7 (END) ***************************



  async app_create(ctx) {
    let response;
    try {
      let rules = {
        project_id: "required|integer",
        payroll_id: "required|integer",
        assigned_worker_id: "required|integer",
      };

      let validation = new Validator(ctx.request.body, rules);
      let data = ctx.request.body;
      if (validation.passes()) {
        for (let index = 0; index < data.deductions.length; index++) {
          let payroll_transaction_available = await checkIfPaymentIsAvailable(
            data.project_id,
            data.assigned_worker_id,
            data.deductions[index].date
          );
          if (payroll_transaction_available.status === 200) {
            let payroll_transaction = await strapi
              .query("payroll-transactions")
              .findOne({
                id: payroll_transaction_available.payroll_translation_id,
              });
            let payment = await strapi
              .query("payments")
              .findOne({ id: payroll_transaction_available.payment_id });
            if (data.deductions[index].hasOwnProperty("type_id")) {
              if (data.deductions[index].type_id === 0) {
                let new_type = await createDeductionType(
                  data.deductions[index].type_name,
                  data.project_id
                );
                data.deductions[index].type_id = new_type.id;
              }
            }
            // if deduction_id === 0, we create a new deduction
            if (data.deductions[index].deduction_id === 0) {
              // get deduction_type
              let deduction_type = await strapi.query("deduction-types").findOne({ id: data.deductions[index].type_id });
              // check if deduction type exist
              if (deduction_type) {
                // check if deduction type is payable 
                if (deduction_type.is_payable) {
                  // check if deduction_transaction exist
                  let deduction_transactions = await strapi.query("deductions-transactions").findOne({ payment_id: payment.id, deduction_type_id: deduction_type.id });
                  let deduction_body = {
                    assigned_worker_id: data.assigned_worker_id,
                    payment_id: payment.id,
                    consumed: false,
                    date: data.deductions[index].date,
                    deduction_amount: data.deductions[index].amount,
                    project_id: data.project_id,
                    deduction_type_id: data.deductions[index].type_id,
                  };
                  // create deductions
                  await strapi.query("deductions").create(deduction_body);
                  //   update payroll_transaction

                  let total_deductions =
                    parseInt(payroll_transaction.total_deductions) +
                    parseInt(data.deductions[index].amount);
                  let take_home =
                    parseInt(payroll_transaction.take_home) -
                    parseInt(data.deductions[index].amount);

                  await strapi
                    .query("payroll-transactions")
                    .update(
                      { id: payroll_transaction.id },
                      { total_deductions: total_deductions, take_home: take_home }
                    );
                  let paymenttrs = await strapi
                    .query("payroll-transactions")
                    .find({ payment_id: payment.id });
                  let total_amount = paymenttrs.reduce((sum, item) => {
                    return sum + parseInt(item.take_home);
                  }, 0);
                  // upda
                  // update payment
                  await strapi
                    .query("payments")
                    .update({ id: payment.id }, { total_amount: total_amount });

                  // if yes, update the deductions_transactions
                  if (deduction_transactions) {
                    let new_amount = parseInt(data.deductions[index].amount) + parseInt(deduction_transactions.amount);
                    await strapi.query("deductions-transactions").update({ id: deduction_transactions.id }, { amount: new_amount });
                  } else { // if no, create a new deductions_transactions
                    let new_body = { status: "unpaid", payment_id: payment.id, deduction_type_id: deduction_type.id, amount: parseInt(data.deductions[index].amount), payee_name: deduction_type.payee_name, phone_number: deduction_type.phone_number };
                    await strapi.query("deductions-transactions").create(new_body);
                  }

                } else { // if no
                  let deduction_body = {
                    assigned_worker_id: data.assigned_worker_id,
                    payment_id: payment.id,
                    consumed: false,
                    date: data.deductions[index].date,
                    deduction_amount: data.deductions[index].amount,
                    project_id: data.project_id,
                    deduction_type_id: data.deductions[index].type_id,
                  };
                  // create deductions
                  await strapi.query("deductions").create(deduction_body);
                  //   update payroll_transaction

                  let total_deductions =
                    parseInt(payroll_transaction.total_deductions) +
                    parseInt(data.deductions[index].amount);
                  let take_home =
                    parseInt(payroll_transaction.take_home) -
                    parseInt(data.deductions[index].amount);

                  await strapi
                    .query("payroll-transactions")
                    .update(
                      { id: payroll_transaction.id },
                      { total_deductions: total_deductions, take_home: take_home }
                    );
                  let paymenttrs = await strapi
                    .query("payroll-transactions")
                    .find({ payment_id: payment.id });
                  let total_amount = paymenttrs.reduce((sum, item) => {
                    return sum + parseInt(item.take_home);
                  }, 0);
                  await strapi
                    .query("payments")
                    .update({ id: payment.id }, { total_amount: total_amount });
                }
              }
            } else {

              let deductionWorker = await strapi
                .query("deductions")
                .findOne({ id: data.deductions[index].deduction_id });
              if (
                deductionWorker.consumed === false &&
                payroll_transaction_available.transaction_status === "unpaid"
              ) {
                let deduction_body = {
                  assigned_worker_id: data.assigned_worker_id,
                  payment_id: payroll_transaction_available.payment_id,
                  consumed: false,
                  date: data.deductions[index].date,
                  deduction_amount: data.deductions[index].amount,
                  project_id: data.project_id,
                  deduction_type_id: data.deductions[index].type_id,
                };
                await strapi
                  .query("deductions")
                  .update(
                    { id: data.deductions[index].deduction_id },
                    deduction_body
                  );
                //   update payroll_transaction

                let deductions_to_add = await strapi.query("deductions").find({
                  payment_id: payment.id,
                  consumed: false,
                  project_id: data.project_id,
                  assigned_worker_id: data.assigned_worker_id,
                });
                let total_deductions = deductions_to_add.reduce((sum, item) => {
                  return sum + parseInt(item.deduction_amount);
                }, 0);
                let take_home =
                  parseInt(payroll_transaction.total_earnings) -
                  parseInt(total_deductions);
                await strapi
                  .query("payroll-transactions")
                  .update(
                    { id: payroll_transaction.id },
                    { total_deductions: total_deductions, take_home: take_home }
                  );
                let payments = await strapi
                  .query("payroll-transactions")
                  .find({ payment_id: payment.id });
                let total_amount = payments.reduce((sum, item) => {
                  return sum + parseInt(item.take_home);
                }, 0);
                // update payment
                await strapi
                  .query("payments")
                  .update({ id: payment.id }, { total_amount: total_amount });
              }
            }
          } else {
            if (data.deductions[index].hasOwnProperty("type_id")) {
              if (data.deductions[index].type_id === 0) {
                let new_type = await createDeductionType(
                  data.deductions[index].type_name,
                  data.project_id
                );
                data.deductions[index].type_id = new_type.id;
              }
            }
            if (data.deductions[index].deduction_id === 0) {
              let deduction_body = {
                assigned_worker_id: data.assigned_worker_id,
                payment_id: 0,
                consumed: false,
                date: data.deductions[index].date,
                deduction_amount: data.deductions[index].amount,
                project_id: data.project_id,
                deduction_type_id: data.deductions[index].type_id,
              };
              // create deductions
              await strapi.query("deductions").create(deduction_body);
            } else {
              //
              let deductionWorker = await strapi
                .query("deductions")
                .findOne({ id: data.deductions[index].deduction_id });

              let deduction_body = {
                assigned_worker_id: data.assigned_worker_id,
                payment_id: 0,
                consumed: false,
                date: data.deductions[index].date,
                deduction_amount: data.deductions[index].amount,
                project_id: data.project_id,
                deduction_type_id: data.deductions[index].type_id,
              };
              await strapi
                .query("deductions")
                .update(
                  { id: data.deductions[index].deduction_id },
                  deduction_body
                );
            }
          }
        }
        response = {
          status: "success, applied successfully",
          data: "",
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: error.message,
        error: "",
        meta: "",
      };
    }
    return response;
  },

  async app_create_many(ctx) {
    let response;
    let rules = {
      project_id: "required|integer",
      payroll_id: "required|integer",
      date: "required|date",
      type_id: "required|integer",
      amount: "required|integer",
    };

    let validation = new Validator(ctx.request.body, rules);
    let data = ctx.request.body;
    let workers_not_found = [];
    if (validation.passes()) {
      for (let index = 0; index < data.assigned_workers.length; index++) {
        // check if worker exist
        let assigned_worker = await strapi
          .query("new-assigned-workers")
          .findOne({ id: data.assigned_workers[index] });
        // *********** create deduction if user exist **********
        if (assigned_worker) {
          // check if payroll transaction exists

          let payroll_transaction_available = await checkIfPaymentIsAvailable(
            data.project_id,
            data.assigned_workers[index],
            data.date
          );
          // if found
          if (payroll_transaction_available.status === 200) {
            let deduction_body = {
              assigned_worker_id: data.assigned_workers[index],
              payment_id: payroll_transaction_available.payment_id,
              consumed: false,
              deduction_amount: data.amount,
              date: data.date,
              project_id: data.project_id,
              deduction_type_id: data.type_id,
            };
            await strapi.query("deductions").create(deduction_body);

            let payroll_transaction = await strapi
              .query("payroll-transactions")
              .findOne({
                id: payroll_transaction_available.payroll_translation_id,
              });
            let payment = await strapi
              .query("payments")
              .findOne({ id: payroll_transaction_available.payment_id });
            let total_deductions =
              parseInt(payroll_transaction.total_deductions) +
              parseInt(data.amount);
            let take_home =
              parseInt(payroll_transaction.take_home) - parseInt(data.amount);
            let total_amount =
              parseInt(payment.total_amount) - parseInt(data.amount);
            await strapi
              .query("payroll-transactions")
              .update(
                { id: payroll_transaction.id },
                { total_deductions: total_deductions, take_home: take_home }
              );
            // update payment
            await strapi
              .query("payments")
              .update({ id: payment.id }, { total_amount: total_amount });
          } else {
            let deduction_body = {
              assigned_worker_id: data.assigned_workers[index],
              payment_id: 0,
              consumed: false,
              deduction_amount: data.amount,
              date: data.date,
              project_id: data.project_id,
              deduction_type_id: data.type_id,
            };
            await strapi.query("deductions").create(deduction_body);
          }
        } else {
          workers_not_found.push(data.assigned_workers[index]);
        }
      }
      response = {
        status: "success, created successfully",
        data: "",
        error:
          workers_not_found.length === 0
            ? ""
            : `Workers not found with Ids ${workers_not_found}`,
        meta: "",
      };
    } else {
      response = {
        status: "failed",
        data: validation.data,
        error: validation.failedRules,
        meta: validation.rules,
      };
    }
    return response;
  },

  async app_update(ctx) {
    let response;
    let rules = {
      project_id: "required|integer",
      payroll_id: "required|integer",
      assigned_worker_id: "required|integer",
    };

    let validation = new Validator(ctx.request.body, rules);
    let data = ctx.request.body;
    if (validation.passes()) {
      for (let index = 0; index < data.deductions.length; index++) {
        let deduction_worker = await strapi
          .query("deductions")
          .findOne({ id: data.deductions[index].deduction_id });
        // let payroll_details_worker = await strapi.query("payroll-details").findOne({ payroll_id: data.payroll_id, assigned_worker_id: data.assigned_worker_id });
        // let payroll = await strapi.query("payroll").findOne({ id: data.payroll_id });
        if (deduction_worker) {
          // let old_deduction_amount = deduction_worker.deduction_amount;
          // let payroll_details_deduction_amount = (payroll_details_worker.total_deductions - old_deduction_amount) + data.deductions[index].amount;
          // let payroll_details_take_home = (payroll_details_worker.take_home + old_deduction_amount) - data.deductions[index].amount;
          // let payroll_deducted_amount = (parseInt(payroll.deducted_amount) - parseInt(old_deduction_amount)) + parseInt(data.deductions[index].amount);
          // let payroll_amount = (parseInt(payroll.amount) + parseInt(old_deduction_amount)) - parseInt(data.deductions[index].amount);
          // create deductions
          await strapi.query("deductions").update(
            { id: data.deductions[index].deduction_id },
            {
              deduction_amount: data.deductions[index].amount,
              deduction_type_id: data.deductions[index].type_id,
            }
          );
          // update deduction in payroll_details worker
          // await strapi.query("payroll-details").update({ id: payroll_details_worker.id }, { total_deductions: payroll_details_deduction_amount, take_home: payroll_details_take_home });
          // update payroll
          // await strapi.query("payroll").update({ id: payroll.id }, { amount: payroll_amount, deducted_amount: payroll_deducted_amount });
        }
      }
      response = {
        status: "success, created successfully",
        data: "",
        error: "",
        meta: "",
      };
    } else {
      response = {
        status: "failed",
        data: validation.data,
        error: validation.failedRules,
        meta: validation.rules,
      };
    }
    return response;
  },

  async delete(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      let deduction = await strapi.query("deductions").findOne({ id: id });
      let payment_type = await strapi.query('payment-types').findOne({ "type_name": "payroll" });
      if (payment_type) {

        if (deduction) {
          // check if payment exist 
          let payroll_transaction_available = await isPaymentAttendance(
            deduction.project_id,
            deduction.date,
            payment_type.id
          );
          if (payroll_transaction_available === false) {
            // check if deduction is available in payment
            if (deduction.payment_id === 0) {
              await strapi.query("deductions").delete({ id: id });
              response = {
                status: "success",
                data: "Deduction deleted successfully",
                error: "",
                meta: "",
              };
            } else {
              let payment = await strapi
                .query("payments")
                .findOne({ id: deduction.payment_id });
              if (payment) {
                let payroll_transaction = await strapi
                  .query("payroll-transactions")
                  .findOne({
                    payment_id: payment.id,
                    id: deduction.payroll_id,
                    assigned_worker_id: deduction.assigned_worker_id,
                  });

                if (payroll_transaction) {
                  let take_home =
                    parseInt(payroll_transaction.take_home) +
                    parseInt(deduction.deduction_amount);
                  let total_deductions =
                    parseInt(payroll_transaction.total_deductions) -
                    parseInt(deduction.deduction_amount);
                  await strapi
                    .query("payroll-transactions")
                    .update(
                      { id: payroll_transaction.id },
                      { total_deductions: total_deductions, take_home: take_home }
                    );
                  let all_payroll_transactions = await strapi
                    .query("payroll-transactions")
                    .find({ payment_id: payment.id, _limit: -1 });
                  let total_amount = all_payroll_transactions.reduce(
                    (sum, item) => {
                      return sum + parseInt(item.take_home);
                    },
                    0
                  );
                  await strapi
                    .query("payments")
                    .update({ id: payment.id }, { total_amount: total_amount });

                  await strapi.query("deductions").delete({ id: id });
                  response = {
                    status: "success",
                    data: "Deduction deleted successfully",
                    error: "",
                    meta: "",
                  };
                } else {
                  await strapi.query("deductions").delete({ id: id });
                  response = {
                    status: "success",
                    data: "Deduction deleted successfully",
                    error: "",
                    meta: "",
                  };
                }
              } else {
                await strapi.query("deductions").delete({ id: id });
                response = {
                  status: "success",
                  data: "Deduction deleted successfully",
                  error: "",
                  meta: "",
                };
              }
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: `Failed to apply deduction , payment exist`,
              error: "",
              meta: "",
            };
          }
        } else {
          response = {
            status: "failed",
            data: `Deduction with id ${id} does not exist`,
            error: "",
            meta: "",
          };
        }
      } else {
        response = {
          status: "failed",
          data: `Payment Types not available`,
          error: "",
          meta: "",
        };
      }

    } catch (error) {
      response = {
        status: "failed",
        data: error.message,
        error: "",
        meta: "",
      };
    }
    return response;
  },

  async findWorkerDeduction(ctx) {
    let response;

    try {
      const { id } = ctx.params;
      if (id) {
        let assigned_workers = await strapi
          .query("new-assigned-workers")
          .find({ worker_id: id });
        if (assigned_workers.length > 0) {
          let assigned_workers_ids = assigned_workers.map((item) => item.id);
          // get worker deductions
          let worker_deductions = await strapi.query("deductions").find({
            assigned_worker_id: assigned_workers_ids,
            date_gte: ctx.query.start_date,
            date_lte: ctx.query.end_date,
            _limit: -1,
          });
          const total_deductions = worker_deductions.reduce((sum, item) => {
            return sum + item.deduction_amount;
          }, 0);

          ctx.response.status = 200;
          response = {
            status: "Success",
            data: { total_deduction: total_deductions },
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 200;
          response = {
            status: "Success",
            data: { total_deduction: 0 },
            error: "",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "Invalid Worker_ID",
          meta: "",
        };
      }
    } catch (error) {
      console.log("error in getting worker deduction ", error.message);
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
};
