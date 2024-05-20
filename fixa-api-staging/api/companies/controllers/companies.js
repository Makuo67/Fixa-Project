"use strict";
let Validator = require("validatorjs");
const { updateSuperAdminCompany } = require("../services/companies");
const Format = require('response-format');
const utils = require("../../../config/functions/utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  // remove payment methods to company
  async removePaymentMethod(ctx) {
    let response;
    try {
      let rules = {
        payment_method: "required|integer",
        // is_payment_method_active: "required|boolean"
      }
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let updated_payment_methods = [];
        let company = await strapi.query('companies').findOne({ id: 1 });
        if (company.payment_methods.length > 0) {
          for (let index = 0; index < company.payment_methods.length; index++) {
            const item = company.payment_methods[index];
            if (item.payment_method.id.toString() != request_body.payment_method.toString()) {
              updated_payment_methods.push({
                payment_method: item.payment_method.id, is_payment_method_active: item.is_payment_method_active
              });
            }
          }
          let data = await strapi.query('companies').update({ id: 1 }, { payment_methods: updated_payment_methods });
          ctx.response.status = 200;
          response = {
            status: "success",
            data: data.payment_methods,
            error: '',
            meta: "",
          };


        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: 'No payment method to remove',
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validation.failedRules,
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

  // add payment methods to company
  async addPaymentMethod(ctx) {
    let response;
    try {
      let rules = {
        payment_method: "required|integer",
        is_payment_method_active: "required|boolean"
      }
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let company = await strapi.query('companies').findOne({ id: 1 });
        let payment_method = await strapi.query('payment-methods').findOne({ id: request_body.payment_method });
        if (company) {
          let updated_payment_methods = [];
          // check if payment is present in company
          let is_payment_present = false;
          if (payment_method) {
            if (company.payment_methods.length > 0) {
              let company_payment_ids = company.payment_methods.map((item) => item.payment_method.id.toString());
              if (company_payment_ids.includes(request_body.payment_method.toString())) {
                is_payment_present = true;
              }
              updated_payment_methods = company.payment_methods.map((item) => {
                return {
                  payment_method: item.payment_method.id, is_payment_method_active: item.is_payment_method_active
                }
              });
            }
            if (is_payment_present === false) {
              updated_payment_methods.push({
                payment_method: request_body.payment_method,
                is_payment_method_active: request_body.is_payment_method_active
              });
              let data = await strapi.query('companies').update({ id: 1 }, { payment_methods: updated_payment_methods });
              ctx.response.status = 200;
              response = {
                status: "success",
                data: data.payment_methods,
                error: '',
                meta: "",
              };
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "",
                error: 'Payment method available',
                meta: "",
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: 'Payment method not found',
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: 'Company not found',
            meta: "",
          };
        }

      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validation.failedRules,
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
  // get logo
  async getLogo(ctx) {
    let response;
    try {
      let companies = await strapi.query("companies").find();
      if (companies.length > 0) {
        ctx.response.status = 200;
        response = {
          status: "success",
          data: { "logo": companies[0].img_url ? companies[0].img_url : "" },
          error: "",
          meta: "",
        };
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "no company found",
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
  // edit company
  async editComapny(ctx) {
    let response;
    try {
      const user = ctx.state.user;
      // check user
      const user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
      if (user_admin) {
        const { id } = ctx.params;
        if (id) {
          const rules = {
            company_name: "required|string",
            address: "required|string",
            tin_number: "required|string",
            // img_url: "required|string",
            phone: "required|string",
            email: "required|string",
          };
          const validation = new Validator(ctx.request.body, rules);
          if (validation.passes()) {
            const company = await strapi.query("companies").findOne({ id: id });
            if (company) {
              const company_updated = await strapi.query("companies").update({ id: id }, ctx.request.body);
              ctx.response.status = 200;
              response = {
                status: "success",
                data: {
                  id: company_updated.id,
                  company_name: company_updated.company_name,
                  address: company_updated.address,
                  tin_number: company_updated.tin_number,
                  img_url: company_updated.img_url,
                  phone: company_updated.phone,
                  email: company_updated.email,
                },
                error: "",
                meta: "",
              };
            } else {
              ctx.response.status = 404;
              response = {
                status: "failed",
                data: "",
                error: `Company with id ${id} not found`,
                meta: "",
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: validation.data,
              error: validation.failedRules,
              meta: validation.rules,
            };
          }
        } else {
          ctx.response.status = 404;
          response = {
            status: "failed",
            data: "Company id required",
            error: "",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: "",
          error: "User not found",
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
  // view company
  async getCompany(ctx) {
    let response;
    try {
      let user = ctx.state.user;

      // check user
      let user_admin = await strapi
        .query("user", "admin")
        .findOne({ id: user.id });
      if (user_admin) {
        let user_access = await strapi
          .query("user-admin-access")
          .findOne({ user_id: user_admin.id });
        // get company info
        let companies = await strapi.query("companies").find({ _limit: -1 });
        let titles = await strapi.query("titles").find({ _limit: -1 });
        let company_respone = companies.length > 0 ? companies.map((item) => {
          return {
            id: item.id,
            company_name: item.company_name,
            address: item.address,
            img_url: item.img_url,
            tin_number: item.tin_number,
            phone: item.phone,
            email: item.email,
          };
        }) : [];
        let titles_respone = titles.length > 0 ? titles.map((item) => {
          return {
            id: item.id,
            title_name: item.title_name
          };
        }) : [];
        let payment_methods = [];
        if (companies.length > 0) {
          if (companies[0].payment_methods.length > 0) {
            payment_methods = companies[0].payment_methods.map((item) => {
              return {
                id: item.payment_method.id,
                name: item.payment_method.name,
                is_active: item.is_payment_method_active,
              }
            });
          }
        }
        ctx.response.status = 200;
        response = {
          status: "success",
          data: {
            companies: company_respone,
            job_titles: titles_respone,
            payment_methods: payment_methods
          },
          error: "",
          meta: "",
        };
      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: "",
          error: "User not found",
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

  // create company
  async createCompany(ctx) {
    let response;
    try {
      let rules = {
        company_name: "required|string",
        tin_number: "required|string",
        country: "required|string",
        province: "required|string"  //img_url
      }
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let company_exist = await strapi.query("companies").find();
        if (company_exist.length === 0) {
          let new_company = await strapi.query("companies").create({ ...request_body, is_site_created: false, is_staff_members_added: false, is_workforce_added: false, is_staffing: false });
          // Update super-admin company details
          var body = {
            email: ctx.state.user.email,
            address: new_company.address,
            phone: new_company.phone,
            tin: new_company.tin_number,
            name: new_company.company_name,
            country: new_company.country.country_name,
            city: new_company.province.name,
            status: "completed",
          };
          await updateSuperAdminCompany(body);
          ctx.response.status = 200;
          response = {
            status: "success",
            data: new_company,
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Company Already exist",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validation.failedRules,
          meta: "",
        };
      }

    } catch (error) {
      console.log("error in createCompany ", error.message);
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

  async getPaymentMethods(ctx) {
    let response;
    try {
      let company = await strapi.query("companies").findOne({ id: 1 });
      if (company && company.payment_methods.length > 0) {
        let active_payment_methods = company.payment_methods.filter((item) => item.is_payment_method_active).map(t => t.payment_method);
        if (active_payment_methods.length >= 1) {
          ctx.response.status = 200;
          response = Format.success(`List of available payment-methods for company ${company.company_name} `, active_payment_methods);
        } else {
          ctx.response.status = 404;
          response = Format.notFound(`No active payment-methods for company ${company.company_name} `, []);
        }
      } else {
        ctx.response.status = 404;
        response = Format.notFound(`No payment-methods for company ${company.company_name} `, []);
      }
    } catch (error) {
      ctx.response.status = 500;
      console.log("error in getPaymentMethods", error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  }
};