"use strict";
const {
  getPayrollWorkerTransactions,
  getPayrollWorkerTransactionsDetails,
  getAttendanceWorkerPayrollDetails,
  getAttendanceDeductions,
} = require("../services/payroll-transactions");
const Format = require('response-format');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async payrollTransactionDetails(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      let queries = ctx.query;
      if (id) {
        let payment = await strapi.query("payments").findOne({ id: id });
        if (payment) {
          queries.payment_id = id;
          // get all deductions from the above payment
          let deductions = await strapi.query("deductions").find({ payment_id: id, _limit: -1 });
          // get payroll transactions
          const worker_payroll_transactions = await strapi.query("payroll-transactions").find({ ...queries });
          
          const total_earnings = worker_payroll_transactions.reduce((sum, item) => {
            if (parseInt(item.take_home) < 0) {
              return sum;
            }
            return sum + parseInt(item.take_home);
          }, 0);

          const total_deduction_amount = worker_payroll_transactions.reduce(
            (sum, item) => {
              if (parseInt(item.total_deductions) < 0) {
                return sum;
              }
              return sum + parseInt(item.total_deductions);
            }, 0);

          let deduction_types = await strapi.query("deduction-types").find({ _limit: -1 });

          let groupedDeductions = Object.values(
            deductions.reduce((result, current) => {
              const { deduction_type_id, deduction_amount } = current;

              if (!result[deduction_type_id]) {
                result[deduction_type_id] = { deduction_type_id, deduction_amount: 0 };
              }
              result[deduction_type_id].deduction_amount += deduction_amount;

              return result;
            }, {})
          );

          groupedDeductions = groupedDeductions.map((item) => {
            item.name = deduction_types.find(i => i.id.toString() === item.deduction_type_id.toString()).title;
            item.status = '';
            item.amount = item.deduction_amount;
            return item;
          });
          ctx.response.status = 200;

          response = {
            status: "success",
            data: {
              worker_earnings: total_earnings,
              total_deductions: total_deduction_amount,
              deductions_details: groupedDeductions
            },
            error: "",
            meta: "",
          };

        } else {
          ctx.response.status = 401;
          response = {
            status: "failed",
            data: "",
            error: `Payment with ID ${id} not found`,
            meta: "",
          };
        }
      } else {
        ctx.response.status = 401;
        response = {
          status: "failed",
          data: "",
          error: "ID Not found",
          meta: "",
        };
      }
    } catch (error) {
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
  async allPayrollTransactions(ctx) {
    let response;
    const { id } = ctx.params;
    let queries = ctx.query;
    try {
      const payment = await strapi.query("payments").findOne({ id: id });
      if (payment) {
        const payroll_transactions = await getPayrollWorkerTransactions(payment, queries);
        response = {
          status: "success",
          data: payroll_transactions,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: "",
          error: `Payment with ${id} does not exist`,
          meta: "",
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }

    return response;
  },
  async allPayrollTransactionsDetails(ctx) {
    let response;
    const { id } = ctx.params;

    try {
      // check if payroll_transaction exist under ids
      let payroll_transaction = await strapi
        .query("payroll-transactions")
        .findOne({ id: id });

      if (payroll_transaction) {
        let worker_payroll_transactions_details =
          await getPayrollWorkerTransactionsDetails(payroll_transaction);

        response = {
          status: "success",
          data: worker_payroll_transactions_details,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: "",
          error: `payroll_transaction with ${id} does not exist`,
          meta: "",
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }

    return response;
  },
  async allAttendanceShift(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      // check if payroll_transaction exist under ids
      let payroll_transaction = await strapi
        .query("payroll-transactions")
        .findOne({ id: id });

      if (payroll_transaction) {
        let payment = await strapi
          .query("payments")
          .findOne({ id: payroll_transaction.payment_id });

        let worker_payroll_transactions_details =
          await getAttendanceWorkerPayrollDetails(payroll_transaction, payment);

        response = {
          status: "success",
          data: worker_payroll_transactions_details,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: "",
          error: `payroll_transaction with ${id} does not exist`,
          meta: "",
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async allDeductions(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      //check if payroll_transaction exist under ids
      let payroll_transaction = await strapi
        .query("payroll-transactions")
        .findOne({ id: id });

      if (payroll_transaction) {
        let payment = await strapi
          .query("payments")
          .findOne({ id: payroll_transaction.payment_id });

        let worker_payroll_transactions_details = await getAttendanceDeductions(
          payroll_transaction,
          payment
        );

        response = {
          status: "success",
          data: worker_payroll_transactions_details,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: "",
          error: `payroll_transaction with ${id} does not exist`,
          meta: "",
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async removePayrollTransaction(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      // check if payroll transaction exist

      let payroll_transaction = await strapi
        .query("payroll-transactions")
        .findOne({ id: id });



      if (payroll_transaction) {
        let deductions = await strapi
          .query("deductions")
          .find({
            assigned_worker_id: payroll_transaction.assigned_worker_id,
            payment_id: payroll_transaction.payment_id,
          });
        if (deductions.length > 0) {
          for (let index = 0; index < deductions.length; index++) {
            await strapi
              .query("deductions")
              .update(
                { id: deductions[index].id },
                { payment_id: 0 }
              );
          }
        }
        await strapi.query("payroll-transactions").delete({ id: payroll_transaction.id });
        let payments_transactions = await strapi.query("payroll-transactions").find({ payment_id: payroll_transaction.payment_id, _limit: -1 });
        const total_amount = payments_transactions.reduce((sum, item) => {
          return sum + parseInt(item.total_earnings); // TODO : Are we supposed to use take_home  or total_earnings
        }, 0);

        await strapi.query("payments").update({ id: payroll_transaction.payment_id }, { total_amount: total_amount, total_payees: payments_transactions.length });

        response = {
          status: "success",
          data: "payroll transaction deleted successfully",
          error: "",
          meta: "",
        };

      } else {
        response = {
          status: "failed",
          data: "",
          error: `Payroll transaction with id ${payroll_transaction.id} does not exist`,
          meta: "",
        };
      }
    } catch (error) {
      console.log(error);
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async payrollDisbursementDetails(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      if (parseInt(id)) {
        const payroll_transactions = await strapi.query("payroll-transactions").find({ payment_id: id, _limit: -1 });
        if (payroll_transactions) {
          const payee_amount_total = payroll_transactions.reduce((sum, item) => {
            if (parseInt(item.take_home) < 0) {
              return sum;
            }
            return sum + parseInt(item.take_home);
          }, 0);

          const grouped_payee = payroll_transactions.reduce((result, obj) => {
            const status = obj.status;
            if (!result[status]) {
              result[status] = { status, data: [] };
            }
            result[status].data.push(obj);
            return result;
          }, {});

          const resultArray = Object.values(grouped_payee);
          let payee_status_data = [];
          for (let x = 0; x < resultArray.length; x++) {
            const status_count = resultArray[x].data.length;
            const status_sum = resultArray[x].data.reduce((sum, item) => {
              return sum + parseInt(item.take_home);
            }, 0);
            if (resultArray[x].status.toLowerCase() === "successful") {
              resultArray[x].status = "Disbursed Net amount";
            } else if (resultArray[x].status.toLowerCase() === "failed") {
              resultArray[x].status = "Failed amount";
            } else if (resultArray[x].status.toLowerCase() === "pending") {
              resultArray[x].status = "Pending amount";
            } else if (resultArray[x].status.toLowerCase() === "unpaid") {
              resultArray[x].status = "Unpaid amount";
            } else {
              resultArray[x].status = resultArray[x].status;
            }
            payee_status_data.push({ status: resultArray[x].status, count: status_count, amount: status_sum });
          }

          const deduction_transactions = await strapi.query("deductions-transactions").find({ payment_id: id, _limit: -1 });
          if (deduction_transactions) {
            const supplier_amount_total = deduction_transactions.reduce((sum, item) => {
              return sum + parseInt(item.amount);
            }, 0);

            let supplier_status_data = [];
            for (let s = 0; s < deduction_transactions.length; s++) {
              supplier_status_data.push({ status: deduction_transactions[s].payee_name, count: 1, amount: parseInt(deduction_transactions[s].amount) });
            }

            ctx.response.status = 200;
            response = Format.success("List of available status", {
              total: payee_amount_total + supplier_amount_total,
              payees: { statuses: payee_status_data, total: payee_amount_total },
              suppliers: { statuses: supplier_status_data, total: supplier_amount_total }
            });
          } else {
            ctx.response.status = 200;
            response = Format.success("List of available status", {
              total: payee_amount_total,
              payees: { statuses: payee_status_data, total: payee_amount_total },
              suppliers: { statuses: [], total: 0 }
            });
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("No payroll found", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(`No payment ID found`, []);
      }
    } catch (error) {
      console.log("Error in payrollDisbursementDetails ", error.message);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  }
};
