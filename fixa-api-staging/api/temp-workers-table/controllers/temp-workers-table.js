"use strict";
const { buildQuery, convertRestQueryParams } = require("strapi-utils");
let Validator = require("validatorjs");
const utils = require("../../../config/functions/utils");


/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async getTempWorkers(ctx) {
    const { _start, _limit, table } = ctx.request.query;
    let response;
    let count;
    const tempWorkers = await strapi.query("temp-workers-table").find({ _limit: -1 });
    try {
      let final_data;
      const filters = convertRestQueryParams({ _start, _limit });
      const countfilters = convertRestQueryParams({ _limit: 1 });
      const model = strapi.query("temp-workers-table").model;
      if (table === 'valid') {
        await model.query((qb) => {
          qb.Where("phone_number_exist", false)
            .andWhere("service_available", true)
            .andWhere("first_name_error", false)
            .andWhere("last_name_error", false)
            .andWhere("valid_nid", true)
            .andWhere("nid_exist", false)
            .andWhere("valid_daily_earnings", true)
        }).query(buildQuery({ model, filters }))
          .fetchAll().then((results) => final_data = results.toJSON());
        await model.query((qb) => {
          qb.Where("phone_number_exist", false)
            .andWhere("service_available", true)
            .andWhere("first_name_error", false)
            .andWhere("last_name_error", false)
            .andWhere("valid_nid", true)
            .andWhere("nid_exist", false)
            .andWhere("valid_daily_earnings", true)
        }).query(buildQuery({ model, countfilters }))
          .count().then((results) => count = results);
      } else if (table === 'invalid') {
        await model.query((qb) => {
          qb.Where("phone_number_exist", true)
            .orWhere("service_available", false)
            .orWhere("first_name_error", true)
            .orWhere("last_name_error", true)
            .orWhere("valid_nid", false)
            .orWhere("nid_exist", true)
            .orWhere("valid_daily_earnings", false)
        })
          .query(buildQuery({ model, filters }))
          .fetchAll().then((results) => final_data = results.toJSON());
        await model.query((qb) => {
          qb.Where("phone_number_exist", true)
            .orWhere("service_available", false)
            .orWhere("first_name_error", true)
            .orWhere("last_name_error", true)
            .orWhere("valid_nid", false)
            .orWhere("nid_exist", true)
            .orWhere("valid_daily_earnings", false)
        })
          .query(buildQuery({ model, countfilters }))
          .count().then((results) => count = results);
      } else {
        final_data = tempWorkers;
        count = await strapi.query("temp-workers-table").count();
      }
      const errors = [
        {
          count: getPhoneExist(tempWorkers),
          status: "error",
          message: "Phone number already exist in the system",
        },
        {
          count: getNidExist(tempWorkers),
          status: "error",
          message: "National ID already exist in the system",
        },
      ];

      const warnings = [{
        count: await strapi.services["temp-workers-table"].count({ valid_nid: false }),
        status: "error",
        message: "National ID not valid",
      },
      {
        count: await countUnvailableService(tempWorkers),
        status: "error",
        message: "Unidentified service",
      }];
      response = {
        status: "Success",
        status_code: 200,
        data: {
          errors: errors,
          warnings: warnings,
          workers: final_data,
        },
        error: "",
        meta: {
          pagination: {
            count,
          },
        }
      };
    } catch (error) {
      console.log("error in getTempWorkers", error.message);
      response = {
        status: "Failed",
        status_code: 400,
        data: [],
        error: "error  catch",
        meta: "",
      };
    }
    return response;
  },
  async deleteAll(ctx) {
    let response;
    // Current user
    const { id, email } = ctx.state.user;
    try {
      const temp_data = await strapi.query("temp-workers-table").find({ _limit: -1 });
      temp_data.forEach((entry) =>
        strapi.query("temp-workers-table").delete({ id: entry.id })
      );
      response = {
        status: "Success",
        status_code: 200,
        message: "Data deleted successfully!",
        error: "",
      };
    } catch (error) {
      console.log("TEMP_DATA_ERROR", error);
      response = {
        status: "Failed",
        status_code: 400,
        data: [],
        error: "ERROR DURING DELETING TEMP-TABLE",
      };
    }
    return response;
  },
  async deleteWorkers(ctx) {
    let entity;
    let workersData = ctx.request.body;
    entity = await strapi.query("temp-workers-table").find();
    if (workersData.id.length == 0 || entity.length == 0) {
      return ctx.badRequest("No data to discard");
    } else {
      /** Discarding single or multiple workers from temp table
       *
       * Receive an array of objects of workers do discard
       * Discard all of them
       */
      try {
        // console.log("workersData.id", typeof workersData.id)
        workersData.id.forEach((item) =>
          strapi.query("temp-workers-table").delete({ id: item })
        );
      } catch (error) {
        return ctx.badRequest(error.message);
      }
      return {
        status: "success",
        statusCode: 200,
        message: "Workers successfully discarded",
      };
    }
  },
  async getRecent(ctx) {
    let response = {
      status_code: 200,
      status: "success",
      data: {
        file_name: "",
        file_id: "",
        total: "",
      },
      errors: [],
      meta: [],
    };

    try {
      let recentData = await strapi
        .query("temp-workers-table")
        .findOne({ _sort: "created_at:DESC" });
      if (recentData) {
        let count = await strapi.query("temp-workers-table").count({
          file_id: recentData.file_id,
          file_name: recentData.file_name,
        });
        response.data.total = count;
        response.data.file_id = recentData.file_id;
        response.data.file_name = recentData.file_name;

        return response;
      }
      else {
        response = {
          status: "Failed",
          status_code: 204,
          data: [],
          error: "NO RECENT TEMP-TABLE",
        };

        return response;
      }

    } catch (error) {
      console.log("TEMP_DATA_ERROR", error);
      response = {
        status: "Failed",
        status_code: 400,
        data: [],
        error: "ERROR DURING GETTING RECENT TEMP-TABLE",
      };
    }

    return response;
  },
  async deleteRecent(ctx) {
    let response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    const { file_id, file_name } = ctx.request.body;
    let entity = await strapi.query("temp-workers-table").find({
      file_id,
      file_name,
      _limit: -1,
    });
    if (entity.length === 0) {
      return ctx.badRequest("No recent data to delete");
    } else {
      try {
        entity.forEach((entry) =>
          strapi.query("temp-workers-table").delete({ id: entry.id })
        );
        response.data = "OK";
      } catch (error) {
        console.log("TEMP_DATA_ERROR", error);
        response = {
          status: "Failed",
          status_code: 400,
          data: [],
          error: "ERROR DURING DELETING RECENT FILE",
        };
      }
    }
    return response;
  },
  async workerUpdate(ctx) {
    let { id } = ctx.params;
    let response;

    const rules = {
      daily_earnings: "required|integer",
      first_name: "required|string",
      last_name: "required|string",
      nid_number: ["required", "regex:/^[0-9]+$/"],
      phone_number: ["required", "regex:/^[0-9]+$/"],
      service: "required|string",
    };

    const validation = new Validator(ctx.request.body, rules);
    if (validation.passes()) {
      const updateBody = ctx.request.body;
      const phone_number_verified = utils.phoneNumberValidation(updateBody.phone_number);
      const service_available = await serviceExist(updateBody.service);
      const phone_number_exist = await phoneNumberExist(updateBody.phone_number, id);
      const first_name_error = !utils.nameValidation(updateBody.first_name);
      const last_name_error = !utils.nameValidation(updateBody.last_name);
      const valid_nid = utils.nidValidation(updateBody.nid_number);
      const nid_exist = await nidNumberExist(updateBody.nid_number, id);
      const valid_daily_earnings = utils.dailyEarningsValidation(updateBody.daily_earnings);
      updateBody.daily_earnings = parseInt(updateBody.daily_earnings);
      const checkData = {
        ...updateBody,
        service_available: service_available,
        service: updateBody.service.toLowerCase(),
        phone_number_verified: phone_number_verified,
        phone_number_exist: phone_number_exist,
        first_name_error: first_name_error,
        last_name_error: last_name_error,
        valid_nid: valid_nid,
        nid_exist: nid_exist,
        valid_daily_earnings: valid_daily_earnings,
      };

      const temp_worker = await strapi.query("temp-workers-table").findOne({ id: id });
      if (temp_worker) {
        await strapi.query("temp-workers-table").update({ id }, checkData);
        response = {
          status: "success",
          status_code: 200,
          data: "worker updated!",
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "worker not found",
          status_code: 404,
          data: "Worker not updated!",
          error: "",
          meta: "",
        };
      }
    } else {
      response = {
        status: "failed",
        status_code: 400,
        data: utils.makeStringOfErrorsFromValidation(validation.errors.all()),
        error: "",
        meta: "",
      };
    }
    return response;
  },
};


const countUnvailableService = async (data) => {
  /**
   * Count unvailability of services in temporary worker data
   * @data array
   */
  let serviceExistCount = 0;
  for (let index = 0; index < data.length; index++) {
    if (data[index].service_available === false) {
      serviceExistCount = serviceExistCount + 1;
    }
  }
  return serviceExistCount;
}

const getPhoneExist = (data) => {
  let workers_phone = 0;
  for (let index = 0; index < data.length; index++) {
    if (data[index].phone_number_exist) {
      workers_phone = workers_phone + 1;
    }
  }
  return workers_phone;
};

const getNidExist = (data) => {
  let nid_number = 0;
  for (let index = 0; index < data.length; index++) {
    if (data[index].nid_exist) {
      nid_number = nid_number + 1;
    }
  }
  return nid_number;
};



const checkIfPhoneIsContained = (phone_number, workkers, id) => {
  let status = false;
  for (let index = 0; index < workkers.length; index++) {
    if (workkers[index].phone_number === phone_number && workkers[index].id != id) {
      status = true;
    }
  }
  return status;
};

// check if phone_number_exist
const phoneNumberExist = async (phone_number, id) => {
  let status = false;
  let phone = await strapi.query("service-providers").findOne({ phone_number: phone_number.toString() });
  // check in temporary table too for duplication
  let temp_phones = await strapi.query("temp-workers-table").find({ phone_number: phone_number.toString() });
  if (phone || checkIfPhoneIsContained(phone_number, temp_phones, id)) {
    status = true;
  } else {
    status = false;
  }
  return status;
};
// check if service exist
const serviceExist = async (service_name) => {
  let status = false;
  let service = await strapi.query("services").findOne({ name: service_name.toLowerCase() });
  if (service) {
    status = true;
  }
  return status;
};

const checkIfNidIsContained = (nid_number, workkers, id) => {
  let status = false;
  for (let index = 0; index < workkers.length; index++) {
    if (workkers[index].nid_number === nid_number && workkers[index].id != id) {
      status = true;
    }
  }
  return status;
}
const nidNumberExist = async (nid, id) => {
  let status = false;
  // check if nid_number_exist
  let nid_provider = await strapi.query("service-providers").findOne({ nid_number: nid.toString() });
  // check in temporary table too for duplication
  let nid_temp = await strapi.query("temp-workers-table").find({ nid_number: nid.toString() });
  if (nid_provider || checkIfNidIsContained(nid, nid_temp, id)) {
    status = true;
  } else {
    status = false;
  }
  return status;
};
