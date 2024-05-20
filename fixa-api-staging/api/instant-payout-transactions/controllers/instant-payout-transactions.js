"use strict";
const { v4: uuid } = require("uuid");
module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */
  async find(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: {
        instant_payout: "",
        transactions: [],
        aggregates: {
          total_transactions:0,
          initiated: 0,
          failed:0,
          successful:0,
        },
      },
      errors: [],
      meta: [],
    };
    const { instant_payout_id, project_id, payroll_type_id, _start, _limit } =
      ctx.request.query;

    const errors = [];

    if (
      (typeof instant_payout_id === "undefined" || !instant_payout_id) &&
      (typeof project_id === "undefined" || !project_id) &&
      (typeof payroll_type_id === "undefined" || !payroll_type_id)
    ) {
      errors.push(
        "The instant_payout_id, project_id and payroll_type_id are required"
      );
    } else if (typeof instant_payout_id === "undefined") {
      errors.push("The instant_payout_id is required");
    } else if (typeof project_id === "undefined") {
      errors.push("The project_id is required");
    } else if (typeof payroll_type_id === "undefined") {
      errors.push("The payroll_type_id is required");
    }

    if (errors.length !== 0) {
      response.status_code = 400;
      response.status = "failure";
      response.errors = errors;
      return response;
    }

    response.data.instant_payout = await getProjectInfo(
      payroll_type_id,
      instant_payout_id
    );
    response.data.transactions = await getInstantTransactions(
      instant_payout_id,
      _start,
      _limit
    );

    let instant_transactions_total = await strapi
      .query("instant-payout-transactions")
      .find({ instant_payout_id: payroll_type_id });
     
    let total_successful =  await strapi
    .query("instant-payout-transaction-tracks")
    .find({ instant_payout_transaction_id: instant_payout_id, status : "successful" }); 

    let total_failed =  await strapi
    .query("instant-payout-transaction-tracks")
    .find({ instant_payout_transaction_id: instant_payout_id, status : "failed" }); 

    let total_initiated =  await strapi
    .query("instant-payout-transaction-tracks")
    .find({ instant_payout_transaction_id: instant_payout_id, status : "initiated" }); 

    response.data.aggregates.total_transactions = instant_transactions_total.length;
    response.data.aggregates.successful = total_successful.length;
    response.data.aggregates.failed = total_failed.length;
    response.data.aggregates.initiated = total_initiated.length;
    return response;
  },
};

const savePayoutExcel = async (data) => {
  const instantPayout = await strapi.services["instant-payouts"].findOne({
    status: "pending",
    _sort: "updated_at:DESC",
  });
  if (instantPayout) {
    for (let index = 0; index < data.length; index++) {
      let payee = {
        instant_payout_id: instantPayout.id,
        entity_name: `${data[index].first_name} ${data[index].last_name}`,
        phone_number: data[index].momo_account,
        amount: data[index].total_earnings,
      };
      // Saving worker
      await strapi.query("instant-payout-transactions").create(payee);
    }
  }
  // updating the status of recent instant payouts
  await strapi.services["instant-payouts"].update(
    { id: instantPayout.id },
    {
      status: "File uploaded",
    }
  );
};

const trackInstantPayout = async () => {
  // get the most recent instant payout entry
  const instantPayout = await strapi.services["instant-payouts"].find({
    status: "File uploaded",
    _sort: "updated_at:DESC",
  });

  // get the transactions for this instant payroll
  const data = await strapi
    .query("instant-payout-transactions")
    .find({ instant_payout_id: instantPayout[0].id, _limit: -1 });

  for (let index = 0; index < data.length; index++) {
    const transactionTracks = {
      payroll_type_id: instantPayout[0].payroll_type_id,
      reference_id: uuid(),
      status: "unpaid",
      instant_payout_transaction_id: data[index].id,
    };

    strapi.query("instant-payout-transaction-tracks").create(transactionTracks);
  }
};

const transactionStatuses = async (id) => {
  let status;
  let tracks = await strapi
    .query("instant-payout-transaction-tracks")
    .find({ instant_payout_transaction_id: id, _sort: "id:DESC" });
  // get status
  if (tracks) {
    status = tracks[0]?.status;
  } else {
    status = "Unknown";
  }
  return status;
};

const getInstantTransactions = async (payroll_type_id, _start, _limit) => {
  const transactions = [];
  // Get the data
  let instant_transactions = await strapi
    .query("instant-payout-transactions")
    .find({
      instant_payout_id: payroll_type_id,
      _limit: _limit,
      _start: _start,
    });

  for (let index = 0; index < instant_transactions.length; index++) {
    transactions.push({
      id: instant_transactions[index].id,
      entity_name: instant_transactions[index].entity_name,
      phone_number: instant_transactions[index].phone_number,
      amount: instant_transactions[index].amount,
      status: await transactionStatuses(instant_transactions[index].id),
    });
  }
  return transactions;
};

// Get projects and payout types
const getProjectInfo = async (payroll_type_id, instant_payout_id) => {
  let instant_payout_project = {};

  const instantPayout = await strapi
    .query("instant-payouts")
    .findOne({ payroll_type_id: payroll_type_id });
  // FIXED ISSUE HERE
  const project = await strapi
    .query("projects")
    .findOne({ id: instantPayout?.project_id });

  let payroll_type_name = await strapi
    .query("payroll-types")
    .findOne({ id: payroll_type_id });
  const payrollName = payroll_type_name?.name;
  if (
    (typeof payroll_type_name !== undefined || payroll_type_name) &&
    (typeof payrollName !== undefined || payrollName)
  ) {
    instant_payout_project = {
      instant_payout_project_id: instant_payout_id,
      instant_payout_project_status: instantPayout.status,
      project: {
        id: project?.id,
        name: project?.name,
      },
      payroll_type: {
        id: payroll_type_id,
        name: payrollName,
      },
    };
  }

  return instant_payout_project;
};
