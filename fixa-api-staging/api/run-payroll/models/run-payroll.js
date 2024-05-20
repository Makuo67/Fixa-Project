"use strict";

const axios = require("axios");
const _ = require("underscore");
const { v4: uuid } = require('uuid');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(data) {
      let id = data.id;
      let service_id = data.service_id;
      let service = await strapi.query("services").findOne({ id: service_id });
      if (service) {
        await strapi
          .query("run-payroll")
          .update({ id }, { service_name: service.name });
      }

      //======================================== update payroll-details_table //START ========================================

      let worker_payroll_detail = await strapi.query("payroll-details").findOne({
        project_id: data.project_id,
        payroll_id: data.payroll_id,
        "worker.id": data.worker_id,
      });
      // 1.(yes) check if worker is present in payroll-details_table basing on the payroll_id and worker_id
      if (worker_payroll_detail) {
        let worker_deductions = await strapi.query("deductions").find({
          payroll_id: data.payroll_id,
          project_id: data.project_id,
          worker_id: data.worker_id,
        });
        // get sum of deductions
        const total_deductions = worker_deductions.reduce(
          (n, { deduction_amount }) => n + deduction_amount,
          0
        );
        const initial_earnings =
          parseInt(data.earnings) +
          parseInt(worker_payroll_detail.initial_earnings);
        const deducted_earnings = initial_earnings - total_deductions;
        // increase days worked by 1 because one entry of run-payroll is one shift
        const total_shifts = parseInt(worker_payroll_detail.total_shifts) + 1
        //    update existing entry basing on the payroll_id and worker_id
        const update_body = {
          initial_earnings,
          deducted_earnings,
          total_deductions,
          total_shifts,
        };
        await strapi.query("payroll-details").update(
          {
            project_id: data.project_id,
            payroll_id: data.payroll_id,
            id: worker_payroll_detail.id,
          },
          update_body
        );
      }
      // 1. (no) check if worker is present in payroll_details_table
      else {
        // generate reference_id 
        const reference_uuid = uuid();
        
       
        //    create new entry basing on the payroll_id and worker_id
        const create_body = {
          project_id: data.project_id,
          worker: data.worker_id,
          payroll_id: data.payroll_id,
          initial_earnings: parseInt(data.earnings),
          deducted_earnings: parseInt(data.earnings),
          total_shifts: 1,
          total_deductions: 0,
          reference_id:reference_uuid
        };
        await strapi.query("payroll-details").create(create_body);
      }
      //======================================== update payroll-details_table //END ========================================
    },
    async afterUpdate(data) {
      // console.log("========================================");
      // console.log(JSON.stringify(data));
      // console.log("========================================");
    },
  },
};
