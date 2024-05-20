"use strict";
let Validator = require("validatorjs");
const crypto = require("crypto");
var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
const Format = require('response-format');
const utils = require("../../../config/functions/utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  // create client/company
  async saveClient(ctx) {
    let response;
    try {
      let rules = {
        company_name: "required|string",
        country_id: "required|integer",
        industry_type_id: "required|integer",
        province_id: "required|integer",
        company_phone_number: "required|string",
        company_email: "required|string",
        company_logo_url: "required|string",
        user_first_name: "required|string",
        user_last_name: "required|string",
        user_email: "required|string",
        user_phone_number: "required|string",
        user_title: "required|string",
        createdBy_name: "required|string",
        createdBy_email: "required|string",
      };
      let clients_obj_data = await strapi.query("clients").find({ _limit: -1 });

      let users_clients_data = await strapi
        .query("client-users")
        .find({ _limit: -1 });
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        var client_exist = await strapi.query("clients").findOne({ email: request_body.company_email });
        if (client_exist) {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: {
              clients: clients_obj_data,
              users_clients: users_clients_data,
            },
            error: "Client Company email already existed",
            meta: "",
          };
        } else {
          var client_user_exist = await strapi.query("user", "users-permissions").findOne({ email: request_body.user_email });
          if (client_user_exist) {
            ctx.response.status = 400;
            response = {
              status: "failed",
              error: "email already in use",
              data: {
                clients: clients_obj_data,
                users_clients: users_clients_data,
              },
              meta: "",
            };
          } else {
            var clieint_obj = {
              name: request_body.company_name,
              logo_url: request_body.company_logo_url,
              phone_number: request_body.company_phone_number,
              province: request_body.province_id,
              country: request_body.country_id,
              industry: request_body.industry_type_id,
              email: request_body.company_email,
            };
            // 1.create client
            let client = await strapi.query("clients").create(clieint_obj);
            if (client) {
              // 2.create client user and invite
              const role = await strapi
                .query("role", "users-permissions")
                .findOne({ type: 'corporate' }, []);
              var client_user_obj = {
                username: request_body.user_phone_number,
                email: request_body.user_email,
                first_name: request_body.user_first_name,
                last_name: request_body.user_last_name,
                provider: 'local',
                confirmed: true,
                role: role.id,
                position: 1,
                blocked: false
              };
              var client_user = await strapi
                .query("user", "users-permissions")
                .create(client_user_obj);
              if (client_user) {
                const clientUser = {
                  full_name: `${client_user.first_name} ${client_user.last_name}`,
                  status: "pending",
                  email: client_user.email,
                  phone_number: client_user.username,
                  added_by: `${request_body.createdBy_name}`,
                  position_name: `${request_body.user_title}`,
                  access: "admin",
                  user_id: client_user.id,
                  client_id: client.id,
                  type: "object",
                  dataset: "users",
                };
                var client_user_data = await strapi
                  .query("client-users")
                  .create(clientUser);
                let platformUrl = await strapi.services[
                  "platform-settings"
                ].findOne({
                  identifier: "business-platform-url",
                });
                // Generate random token.
                const resetPasswordToken = crypto.randomBytes(64).toString("hex");
                await strapi
                  .query("user", "users-permissions")
                  .update(
                    { id: client_user.id },
                    { resetPasswordToken: resetPasswordToken }
                  );
                const setPasswordLink = `${platformUrl.value}/activation/set-password?code=${resetPasswordToken}&&email=${client_user.email}`;

                const emailData = {
                  from: "support@fixarwanda.com",
                  to: [`${client_user.email}`],
                  subject: "Welcome to Fixa",
                  template: "corporate-user-invite-email",
                  "v:admin_user_name": `${client_user.first_name || client_user.last_name
                    }`,
                  "v:admin_user_email": `${request_body.createdBy_email}`,
                  "v:scope_text": `Fixa Platform`,
                  "v:join_link": setPasswordLink,
                  "v:twitter_page_link": "#",
                  "v:linkedin_page_link": "#",
                  "v:instagram_page_link": "#",
                };
                // update user
                await strapi.query("user", "users-permissions").update({ id: client_user.id }, { client_id: client.id, company_name: client.name });
                // Send an email to the user.
                mailgun.messages().send(emailData);
                let clients_obj = await strapi
                  .query("clients")
                  .find({ _limit: -1 });
                let users_clients = await strapi
                  .query("client-users")
                  .find({ _limit: -1 });
                ctx.response.status = 200;
                response = {
                  status: "success Client created successfully",
                  data: {
                    clients: clients_obj,
                    users_clients: users_clients,
                  },
                  error: "Client User not created",
                  meta: "",
                };
              } else {
                ctx.response.status = 400;
                response = {
                  status: "failed",
                  data: {
                    clients: clients_obj_data,
                    users_clients: users_clients_data,
                  },
                  error: "Client User not created",
                  meta: "",
                };
              }
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: {
                  clients: clients_obj_data,
                  users_clients: users_clients_data,
                },
                error: "Client not created",
                meta: "",
              };
            }
          }
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
  async updateClient(ctx) {
    let response;
    try {
      const rules = {
        status: "required|boolean",
      };
      const validation = new Validator(ctx.request.body, rules);
      const { client_id } = ctx.params;
      if (client_id) {
        if (validation.passes()) {
          const client = await strapi.query("clients").findOne({ id: client_id });
          if (client) {
            const { status } = ctx.request.body;
            const updated_client = await strapi.query("clients").update({ id: client.id }, { isActive: status });
            if (updated_client) {
              ctx.response.status = 200;
              response = Format.success("Client successful updated.", updated_client);
            } else {
              ctx.response.status = 400;
              response = Format.badRequest("Client not updated.", []);
            }
          } else {
            ctx.response.status = 400;
            response = Format.badRequest("No client found.", []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest("No client_id found.", []);
      }
    } catch (error) {
      ctx.response.status = 500;
      console.log("error in changeClientStatus", error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async deleteClient(ctx) {
    let response;
    try {
      const { client_id } = ctx.params;
      if (client_id) {
        const client = await strapi.query("clients").findOne({ id: client_id });
        if (client) {
          const deleted_client = await strapi.query("clients").delete({ id: client_id });
          if (deleted_client) {
            ctx.response.status = 200;
            response = Format.success("Client deleted successful.", deleted_client);
          } else {
            ctx.response.status = 400;
            response = Format.badRequest("Client not deleted.", []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("No client found.", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest("No client_id found.", []);
      }
    } catch (error) {
      ctx.response.status = 500;
      console.log("error in deleteClient", error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async getAllClient(ctx) {
    let response;
    try {
      let all_clients = [];
      const queries = ctx.query;
      let passed_query = { _sort: 'isActive:desc' };
      if (queries.isActive) {
        passed_query.isActive = true
      }
      const projects = await strapi.query("projects").find({_limit:-1});
      const clients = await strapi.query("clients").find(passed_query);
     
      if (clients) {
        for (let index = 0; index < clients.length; index++) {
          const item = clients[index];
            
          var client_projects = projects.filter((itemP) =>{
            
            if(itemP.client_id && itemP.client_id.toString() === item.id.toString()){
              return itemP;
            }
          });
          var client_projects_name = client_projects.map((itemP)=>{return {id:itemP.id,"name":itemP.name}});

          all_clients.push({...item,projects:client_projects_name.length > 0? client_projects_name : []})        
        }
        ctx.response.status = 200;
        response = Format.success("Client successful updated.", all_clients);
      } else {
        ctx.response.status = 400;
        response = Format.badRequest("No client found.", []);
      }
    } catch (error) {
      ctx.response.status = 500;
      console.log("error in getAllClient", error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  }

};
