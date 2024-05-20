"use strict";
let Validator = require("validatorjs");
var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var admin_pannel_url = process.env.ADMIN_PANNEL_URL;
var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
const { updateCompanyStatus, getCompanyStatus } = require("../../companies/services/companies")
const PLATFORM_URL = process.env.PLATFORM_URL;
const PLATFORM_API_URL = process.env.PLATFORM_API_URL;
const SUPER_ADMIN_FRONT_END_URL = process.env.SUPER_ADMIN_FRONT_END_URL;
const { updateSuperAdminCompany } = require("../../companies/services/companies");
const Format = require('response-format');
const utils = require("../../../config/functions/utils");
const user_levels = require("../../../config/ressources/user_levels.json");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
function getProjects(projects) {
  let projects_data = [];
  projects_data = projects.map((item) => {
    return {
      id: item.id,
      name: item.name,
    };
  });
  return projects_data;
}

module.exports = {
  // update old users levels
  async updateOldUsersLevel(ctx) {
    let response;
    try {
      let user_to_update = [];
      let user_admin_access = await strapi.query("user-admin-access").find({ _limit: -1 });
      if (user_admin_access) {
        for (let index = 0; index < user_admin_access.length; index++) {
          const item = user_admin_access[index];
          // if (!item.user_access) {
          user_to_update.push(item);
          // }
        }
        for (let index = 0; index < user_to_update.length; index++) {
          const item = user_to_update[index];
          // console.log('---->',user_to_update.length);
          let page_access = utils.updateOldUserLevels(item, 'level_1');
          await strapi.query("user-admin-access").update({ id: item.id }, { user_access: page_access, user_level_id: 1 });
        }
        ctx.response.status = 200;
        response = Format.success(`User updated successfully`, []);
      } else {
        ctx.response.status = 400;
        response = Format.badRequest("No user found", []);
      }

    } catch (error) {
      console.log(error);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  // get user roles
  async getRoles(ctx) {
    let response;
    try {
      let query_body = ctx.query
      const roles = await strapi.query('role', 'users-permissions').find({ ...query_body, _limit: -1 });
      ctx.response.status = 200;
      response = {
        status: "success",
        data: roles,
        error: "",
        meta: "",
      };
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
  // check staff email
  async checkStaffEmail(ctx) {
    let response;
    try {
      let rules = {
        email: "required|string",
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let adminExist = await strapi.query("user", "admin").findOne({ email: request_body.email });
        if (adminExist && adminExist.isActive) {
          ctx.response.status = 200;
          response = {
            status: "Success",
            data: { "emailExists": true },
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 200;
          response = {
            status: "Success",
            data: { "emailExists": false },
            error: "",
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
  // get user profile
  async getUserProfile(ctx) {
    let response;
    try {
      let user = ctx.state.user;
      let userAdmin = await strapi.query("user", "admin").findOne({ id: user.id });
      if (userAdmin) {
        let userProfile = await strapi.query("user-admin-access").findOne({ user_id: userAdmin.id });
        let user_levels = {};
        if (userProfile.user_level_id) {
          let level = await strapi.query("users-levels").findOne({ id: userProfile.user_level_id });
          if (level) {
            user_levels = { "id": level.id, "name": level.name };
          }
        }
        if (userProfile) {
          ctx.response.status = 200;
          response = {
            status: "success",
            data: {
              user: { "id": userAdmin.id, "firstname": userAdmin.firstname, "lastname": userAdmin.lastname, "email": userAdmin.email, 'username': userAdmin.username },
              user_profile: userProfile,
              company_status: await getCompanyStatus(),
              user_level: user_levels
            },
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "User not found",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "User not found",
          meta: "",
        };
      }
    } catch (error) {
      console.log(error);
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
  // remove supervisor
  async removeSupervisor(ctx) {
    let response;
    try {
      let rules = {
        user_id: "required|integer",
        project_id: "required|integer",
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let project = await strapi.query("projects").findOne({
          id: request_body.project_id,
        });
        if (project) {
          let user_info = await strapi
            .query("user", "users-permissions")
            .findOne({ id: request_body.user_id });
          if (user_info) {
            let users_projects_ids = project.supervisors.map((item) => {
              return item.id;
            });
            let users_to_keep = users_projects_ids.filter(
              (item) => item !== request_body.user_id
            );
            let proejct_users_ids = user_info.projects.map((item) => {
              return item.id;
            });
            let projects_to_keep = proejct_users_ids.filter(
              (item) => item !== request_body.project_id
            );
            await strapi
              .query("user", "users-permissions")
              .update(
                { id: request_body.user_id },
                { projects: projects_to_keep }
              );
            await strapi
              .query("projects")
              .update(
                { id: request_body.project_id },
                { supervisors: users_to_keep }
              );
            ctx.response.status = 200;
            response = {
              status: "success",
              data: "Supervisor removed successfully",
              error: "",
              meta: "",
            };
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: `User with id ${request_body.user_id} not found`,
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: `Project with id ${request_body.project_id} not found`,
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
    } catch (error) {
      console.log("error", error);
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
  // add supervisor
  async addSupervisor(ctx) {
    let response;
    try {
      let rules = {
        project_id: "required|integer",
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let project = await strapi.query("projects").findOne({ id: request_body.project_id });
        if (project) {

          for (let index = 0; index < request_body.user_ids.length; index++) {
            // check if supervisor exist under project
            let project_all_users = await strapi.query("projects").findOne({ id: request_body.project_id });
            let supervisors_ids = project_all_users.supervisors.map((item) => {
              return item.id;
            });
            let project_users = await strapi.query("projects").find({
              id: request_body.project_id,
              supervisors: request_body.user_ids[index],
            });
            let user_info = await strapi.query("user", "users-permissions").findOne({ id: request_body.user_ids[index] });
            if (project_users.length === 0 && user_info) {
              let user_info_ids = user_info.projects.map((item) => {
                return item.id;
              });
              await strapi.query("projects").update(
                { id: request_body.project_id },
                {
                  supervisors: [
                    ...supervisors_ids,
                    request_body.user_ids[index],
                  ],
                }
              );
              await strapi
                .query("user", "users-permissions")
                .update(
                  { id: request_body.user_ids[index] },
                  { projects: [...user_info_ids, request_body.project_id] }
                );
            }
          }
          ctx.response.status = 200;
          response = {
            status: "success",
            data: "Supervisors added to project",
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "Project not found",
            error: "",
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
    } catch (error) {
      console.log("error", error);
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
  // get users
  async getUsersSupervisors(ctx) {
    let response;
    try {
      let queries = ctx.query;
      if (ctx.ctx) { //ctx from another controller
        ctx = ctx.ctx;
      }
      let users = [];
      if (queries.hasOwnProperty("search")) {
        let new_queries = { _q: queries.search, ...queries };
        delete new_queries.search;
        users = await strapi.query("user", "users-permissions").search(new_queries);
      } else {
        users = await strapi.query("user", "users-permissions").find(queries);
      }
      let users_data = users.map((item) => {
        return {
          id: item.id,
          phone_number: item.username,
          email: item.email,
          role_id: item.role.id,
          role_name: item.role.name,
          first_name: item.first_name,
          last_name: item.last_name,
          status: item.blocked ? false : true,
          projects: getProjects(item.projects),
        };
      });
      ctx.response.status = 200;
      response = {
        status: "success",
        data: utils.sortByProperty(users_data, 'status'),
        error: "",
        meta: "",
      };
    } catch (error) {
      console.log("error", error);
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
  // forgot password
  async forgotPassword(ctx) {
    let response;
    try {
      let rules = {
        email: "required|string",
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let request_body = ctx.request.body;
        let user = await strapi.admin.services.user.findOne({
          email: request_body.email,
        });
        if (user) {
          //   send email to user
          const token = await strapi.admin.services.token.createJwtToken(user);
          await strapi
            .query("user", "admin")
            .update({ id: user.id }, { resetPasswordToken: token });
          const setPasswordLink = `${admin_pannel_url}/activation/reset-password?code=${token}&&email=${user.email}`;
          let data = {
            from: `support@fixarwanda.com`,
            to: [`${user.email}`],
            subject: "Reset your password",
            template: "corporate_forgot_password",
            "v:url": `${setPasswordLink}`,
            "v:name": `${user.firstname} ${user.lastname}`,
          };
          //   console.log("email to send :: ",data);
          // Send an email to the user.
          mailgun.messages().send(data);
          //   const emailData = {
          //     from: "support@fixarwanda.com",
          //     to: [`${user.email}`],
          //     subject: "Invite To Join FIXA Admin Pannel",
          //     template: "corporate-user-invite-email",
          //     "v:admin_user_name": `${user.firstname || user.lastname}`,
          //     "v:admin_user_email": `${user.email}`,
          //     "v:scope_text": `Fixa admin pannel`,
          //     "v:join_link": setPasswordLink,
          //     "v:twitter_page_link": "#",
          //     "v:linkedin_page_link": "#",
          //     "v:instagram_page_link": "#",
          //   };
          //   // Send an email to the user.
          //   mailgun.messages().send(emailData);
          ctx.response.status = 200;
          response = {
            status: "success",
            data: `Email sent successfully to ${user.email}`,
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 404;
          response = {
            status: "failed",
            data: "",
            error: `User with email ${request_body.email} not found`,
            meta: validation.rules,
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
  // reset password
  async resetPassword(ctx) {
    let response;
    try {
      let rules = {
        email: "required|string",
        token: "required|string",
        new_password: "required|string",
        confirm_password: "required|string",
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let request_body = ctx.request.body;
        let user = await strapi.admin.services.user.findOne({
          email: request_body.email,
          resetPasswordToken: request_body.token,
        });
        if (user) {
          if (request_body.new_password === request_body.confirm_password) {
            // let validatePassword = await strapi.query('user', 'admin').update({id:user.id},{password:hashedPassword});;
            // if(validatePassword){
            let hashedPassword = await strapi.admin.services.auth.hashPassword(
              request_body.new_password
            );
            await strapi
              .query("user", "admin")
              .update({ id: user.id }, { password: hashedPassword });
            ctx.response.status = 200;
            response = {
              status: "success",
              data: "Password Update Successfully",
              error: "",
              meta: "",
            };
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Password should match (new and confirmation) ",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 404;
          response = {
            status: "failed",
            data: "",
            error: "User not found ",
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
  // change password
  async changePassword(ctx) {
    let response;
    try {
      let user_request = ctx.state.user;
      let rules = {
        email: "required|string",
        old_password: "required|string",
        new_password: "required|string",
        confirm_password: "required|string",
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let request_body = ctx.request.body;
        let user = await strapi.admin.services.user.findOne({
          email: request_body.email,
        });
        if (user && user.email === user_request.email) {
          if (request_body.new_password === request_body.confirm_password) {
            let validatePassword =
              await strapi.admin.services.auth.validatePassword(
                request_body.old_password,
                user.password
              );
            if (validatePassword) {
              let hashedPassword =
                await strapi.admin.services.auth.hashPassword(
                  request_body.new_password
                );
              await strapi
                .query("user", "admin")
                .update({ id: user.id }, { password: hashedPassword });
              ctx.response.status = 200;
              response = {
                status: "success",
                data: "",
                error: "Password Update Successfully.",
                meta: "",
              };
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "",
                error: "Invalid password",
                meta: "",
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Password should match (new and confirmation) ",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "User not found",
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
  // register admin user
  async registerAdminUser(ctx) {
    let response;
    try {
      let rules = {
        firstname: "required|string",
        lastname: "required|string",
        email: "required|string",
        password: "required|string"
      }
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      const level_user = user_levels['level_1'];
      if (validation.passes()) {
        let adminExist = await strapi.query("user", "admin").find();
        let level = await strapi.query("users-levels").findOne({ name: "level_1" });
        if (adminExist.length === 0) {
          let user_body_updt = {
            firstname: request_body.firstname,
            lastname: request_body.lastname,
            username: request_body.username,
            email: request_body.email,
            isActive: true,
            password: await strapi.admin.services.auth.hashPassword(
              request_body.password
            ),
            roles: [1]
          };
          let userExist = await strapi
            .query("user", "admin")
            .findOne({ email: request_body.email });
          if (userExist) {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Email already exist",
              meta: "",
            };
          } else {
            if (level_user && level) {
              let new_user = await strapi.query("user", "admin").create(user_body_updt);
              if (new_user) {
                let user_access_updt = {
                  title: 1,
                  avatar_url: request_body.avatar_url,
                  username: request_body.username,
                  avatar_url: request_body.user_profile_image ? request_body.user_profile_image : "",
                  user_id: new_user.id,
                  user_access: level_user.pages,
                  user_level_id: level.id
                  // admin: true
                };
                // update
                let user_profile_exist = await strapi.query("user-admin-access").findOne({ user_id: new_user.id });
                let user_profile;
                if (!user_profile_exist) {
                  user_profile = await strapi.query("user-admin-access").create(user_access_updt);
                } else {
                  user_profile = await strapi.query("user-admin-access").update({ user_id: new_user.id }, user_access_updt);
                }
                //   screate token
                const token = await strapi.admin.services.token.createJwtToken(
                  new_user
                );
                let new_bodyy = { email: new_user.email };
                await updateSuperAdminCompany(new_bodyy);

                ctx.response.status = 200;
                response = {
                  status: "success",
                  data: {
                    "jwt": token,
                    "user_info": {
                      "first_name": new_user.firstname,
                      "last_name": new_user.lastname,
                      "email": new_user.email,
                      "user_profile_image": user_profile.avatar_url,
                      "title": user_profile.avatar_url.title
                    }
                  },
                  error: "",
                  meta: "",
                };
              }
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "",
                error: "User levels missing",
                meta: "",
              };
            }
          }
        }
        else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Admin already created",
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
      console.log("Line 660 on registerAdminUser", error.message);
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
  // complete profile staff members
  async completeprofileStaff(ctx) {
    let response;
    try {
      let rules = {
        firstname: "required|string",
        lastname: "required|string",
        email: "required|string",
        password: "required|string"
      }
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let userExist = await strapi.query("user", "admin").findOne({ email: request_body.email });
        if (userExist) {
          let user_body_updt = {
            firstname: request_body.firstname,
            lastname: request_body.lastname,
            username: request_body.username,
            isActive: true,
            password: await strapi.admin.services.auth.hashPassword(
              request_body.password
            ),
            roles: [1]
          };
          let new_user = await strapi.query("user", "admin").update({ id: userExist.id }, { ...user_body_updt });
          const token = await strapi.admin.services.token.createJwtToken(
            new_user
          );
          let user_profile = await strapi.query("user-admin-access").findOne({ user_id: new_user.id });
          if (request_body.user_profile_image && user_profile) {
            await strapi.query("user-admin-access").update({ id: user_profile.id }, { avatar_url: request_body.user_profile_image ? request_body.user_profile_image : "" })
          }
          ctx.response.status = 200;
          response = {
            status: "success",
            data: {
              "jwt": token,
              "user_info": {
                "first_name": new_user.firstname,
                "last_name": new_user.lastname,
                "email": new_user.email,
                "user_profile": user_profile
              }
            },
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: `User with email: ${request_body.email} not found`,
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
      // console.log(error);
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

  // invite staff member
  async inviteStaffMember(ctx) {
    let response;
    try {
      const request_body = ctx.request.body;
      const rules = {
        job_title: "required|integer",
        user_access: "required|array",
        email: "required|string"
      };
      // const validation = new Validator(request_body, rules);
      const date_now = new Date();
      const year = date_now.getFullYear();
      const validateArray = (data, rules) => {
        const errors = [];
        if (data.length != 0) {
          data.forEach((item, index) => {
            const validation = new Validator(item, rules);
            if (validation.fails()) {
              errors.push({ index, errors: validation.errors.all() });
            }
          });
        } else {
          errors.push({ errors: "Empty Body" });
        }
        return errors.length === 0 ? 'All objects are valid' : errors;
      };
      const validationResults = validateArray(request_body, rules);

      if (typeof validationResults === 'string') {
        let worker_not_registered = [];
        for (let index = 0; index < request_body.length; index++) {
          const element = request_body[index];
          let userExist = await strapi.query("user", "admin").findOne({ email: element.email });
          if (userExist) {
            worker_not_registered.push({ email: element.email, reason: "Email already exist" })
          }
        }
        let levels = await strapi.query("users-levels").findOne({ name: 'level_1' });
        if (levels) {
          let company = await strapi.query("companies").find();
          if (company.length > 0) {
            if (worker_not_registered.length === 0) {
              for (let index = 0; index < request_body.length; index++) {
                const item = request_body[index];
                var randomstring = Math.random().toString(36).slice(-8);
                let user_body_updt = {
                  email: item.email,
                  isActive: false,
                };
                item.roles = [1];
                item.password = await strapi.admin.services.auth.hashPassword(randomstring);
                let userExist = await strapi.query("user", "admin").findOne({ email: item.email });
                if (userExist) {
                  worker_not_registered.push({ email: item.email, reason: "Email already exist" })
                } else {
                  let new_user = await strapi.query("user", "admin").create(user_body_updt);
                  let pages = utils.userAccessLevel(item.user_access, "level_1");
                  if (new_user) {
                    let user_access_updt = {
                      user_id: new_user.id,
                      title: item.job_title,
                      user_level_id: levels.id,
                      user_access: pages
                    };
                    // update
                    await strapi.query("user-admin-access").create(user_access_updt);
                    let title = await strapi.query("titles").findOne({ id: item.job_title });
                    let body_data = { "email": new_user.email, "link_api": PLATFORM_API_URL, "link_platform": PLATFORM_URL, "is_admin": false };
                    let encode_info = Buffer.from(JSON.stringify(body_data)).toString('base64');
                    const setPasswordLink = `${SUPER_ADMIN_FRONT_END_URL}/signup/${encode_info}`;
                    const emailData = {
                      from: "support@fixarwanda.com",
                      to: [`${new_user.email}`],
                      subject: `Welcome to Fixa`,
                      template: "admin_saas_onboarding_staff",
                      "v:company_name": `${company[0].company_name}`,
                      "v:role_invited": `${title ? title.title_name : ""}`,
                      "v:join_link": setPasswordLink,
                      "v:year": `${year}`
                    };
                    // Send an email to the user.
                    mailgun.messages().send(emailData);
                  }
                }
              }
              await updateCompanyStatus('is_staff_member');
              ctx.response.status = 200;
              response = {
                status: "success",
                data: "Staff members invited",
                error: [],
                meta: "",
              };
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "",
                error: worker_not_registered,
                meta: "",
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: "Company not Registered",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: 'Please add levels',
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validationResults,
          meta: "",
        };
      }
    } catch (error) {
      console.log("Line 901 in inviteStaffMember", error.message);
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
  // invite office team user
  async inviteOfficeTeamUser(ctx) {
    let response;
    try {
      const rules = {
        firstname: "required|string",
        job_title: "required|integer",
        lastname: "required|string",
        username: "required|string",
        email: "required|string",
        isActive: "required|boolean",
        user_access: "required|array"
      };
      const request_body = ctx.request.body;
      let errors = [];
      let error_status = false;
      const user = ctx.state.user;
      const date_now = new Date();
      const year = date_now.getFullYear();
      let clientProjects = [];

      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let user_level = "";

        const company = await strapi.query("companies").findOne();
        if (!company) {
          error_status = true;
          errors.push('Company not found');
        }
        if (request_body.client) {
          let client = await strapi.query("clients").findOne({ id: request_body.client, isActive: true });
          if (!client) {
            error_status = true;
            errors.push('Client not found or not active');
          }
        }

        const user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
        if (!user_admin) {
          error_status = true;
          errors.push('User not found');
        }

        const title = await strapi.query('titles').findOne({ id: request_body.job_title });
        if (!title) {
          error_status = true;
          errors.push('Title not found');
        }
        const userExistEmail = await strapi.query("user", "admin").findOne({ email: request_body.email });
        if (userExistEmail) {
          error_status = true;
          errors.push('Email already exist');
        }
        const usernameExist = await strapi.query("user", "admin").findOne({ username: request_body.username });
        if (usernameExist) {
          error_status = true;
          errors.push('A user already exist with the same phone number.');
        }

        if (request_body.client) {
          user_level = "level_2";
        } else {
          user_level = "level_1";
        }

        const levels = await strapi.query("users-levels").findOne({ name: user_level });
        if (!levels) {
          error_status = true;
          errors.push('Users_levels not found');
        }

        if (user_admin) {
          const user_access = await strapi.query("user-admin-access").findOne({ user_id: user_admin.id });
          if (!user_access) {
            error_status = true;
            errors.push('User access not found');
          }
          if (user_access && user_access.client) {
            if (request_body.client) {
              if (user_access.client.id.toString() != request_body.client.toString()) {
                error_status = true;
                errors.push('Allowed to invite use from your list of clients');
              }
            } else {
              error_status = true;
              errors.push('Client required for this user');
            }
          }
        }

        if (request_body.client) {
          const client_id = request_body.client;
          clientProjects = await strapi.query("projects").find({ client_id: client_id });
          if (!(clientProjects.length >= 1)) {
            error_status = true;
            errors.push("You can't invite a user of level-2 if you don't have a project under this client");
          }
        }

        if (error_status === false) {
          let project_ids_for_new_user = [];
          if (request_body.client) {
            for (let i = 0; i < clientProjects.length; i++) {
              const find_project = request_body.projects.find((x) => parseInt(x) === parseInt(clientProjects[i].id));
              if (find_project) {
                project_ids_for_new_user.push(clientProjects[i].id);
              }
            }
            if (project_ids_for_new_user.length === 0) {
              ctx.response.status = 400;
              response = Format.badRequest("The project you are trying to add either doesn't exist or doesn't belong to the client associated to this user.", []);
              return response;
            }
          }

          const randomstring = Math.random().toString(36).slice(-8);
          const user_body_updt = {
            firstname: request_body.firstname,
            lastname: request_body.lastname,
            email: request_body.email,
            username: request_body.username,
            isActive: false,

          };
          user_body_updt.roles = [1];
          user_body_updt.password = await strapi.admin.services.auth.hashPassword(randomstring);
          const new_user = await strapi.query("user", "admin").create(user_body_updt);
          const pages = utils.userAccessLevel(request_body.user_access, user_level);
          if (new_user) {
            const user_access_updt = {
              avatar_url: request_body.avatar_url,
              username: request_body.username,
              title: request_body.job_title,
              user_id: new_user.id,
              user_level_id: levels.id,
              user_access: pages,
              projects: project_ids_for_new_user
            };
            if (request_body.client) {
              user_access_updt.client = request_body.client;
            }
            await strapi.query("user-admin-access").create(user_access_updt);
            const title = await strapi.query("titles").findOne({ id: request_body.job_title });
            const body_data = { "email": new_user.email, "link_api": PLATFORM_API_URL, "link_platform": PLATFORM_URL, "is_admin": false };
            const encode_info = Buffer.from(JSON.stringify(body_data)).toString('base64');
            const setPasswordLink = `${SUPER_ADMIN_FRONT_END_URL}/signup/${encode_info}`;
            const emailData = {
              from: "support@fixarwanda.com",
              to: [`${new_user.email}`],
              subject: `Welcome to Fixa`,
              template: "admin_saas_onboarding_staff",
              "v:company_name": `${company.company_name}`,
              "v:role_invited": `${title ? title.title_name : ""}`,
              "v:join_link": setPasswordLink,
              "v:year": `${year}`
            };
            mailgun.messages().send(emailData);
            ctx.response.status = 200;
            response = Format.success(`User with email ${new_user.email} Invited successfully`, []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest(errors.join(','), []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log(error);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },

  // edit edit office team user access
  async editOfficeTeamUserAccess(ctx) {
    let response;
    try {
      let rules = {
        user_access: "required|array",
      };
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let error_status = false;
        let errors = [];
        const request_body = ctx.request.body;
        const user = ctx.state.user;
        const { id } = ctx.params;
        let user_admin_level = "";
        let user_to_upt_level = "";
        const user_admin_access = await strapi.query("user-admin-access").findOne({ user_id: user.id });
        const user_to_upt_access = await strapi.query("user-admin-access").findOne({ user_id: id });
        const users_levels = await strapi.query("users-levels").find();

        if (!user_levels || user_levels.length === 0) {
          error_status = true;
          errors.push("user_levels missing")
        }

        if (!user_to_upt_access) {
          error_status = true;
          errors.push("User-admin-access not found");
        } else {
          if (user_admin_access.user_level_id) {
            user_admin_level = users_levels.find(level => {
              if (level.id.toString() === user_admin_access.user_level_id?.toString()) {
                return level;
              }
            });
          } else {
            error_status = true;
            errors.push("You don't have a level");
          }

          if (user_to_upt_access.user_level_id) {
            user_to_upt_level = users_levels.find(level => {
              if (level.id.toString() === user_to_upt_access.user_level_id?.toString()) {
                return level;
              }
            });
          } else {
            error_status = true;
            errors.push("User does not have a level");
          }
        }

        if (user_admin_level === 'level_2') {
          if (!user_admin_access.client) {
            error_status = true;
            errors.push("Client not available");
          }

          if (!user_to_upt_access.client) {
            error_status = true;
            errors.push("Client not available for this user")
          }
          if (Object.keys(user_admin_access.client).length != 0 && Object.keys(user_to_upt_access.client).length != 0) {
            if (user_admin_access.client.id != user_to_upt_access.client.id) {
              error_status = true;
              errors.push("Update only user from your client list")
            }
          }
          if (request_body.user_level_id) {
            delete request_body.user_level_id;
          }
          if (user_to_upt_level.name === 'level_1') {
            error_status = true;
            errors.push("User not authorized")
          }
        }

        if (error_status === false) {
          const pages_access = utils.updateExistingAccessLevel(request_body.user_access, user_to_upt_level.name, { [user_to_upt_level.name]: { pages: user_to_upt_access.user_access } });
          if (request_body.user_access) {
            delete request_body.user_access
          }
          await strapi.query("user-admin-access").update({ user_id: id }, { user_access: pages_access });
          ctx.response.status = 200;
          response = Format.success(`User Access Updated Successfully`, []);

        } else {
          ctx.response.status = 400;
          response = Format.badRequest(errors.join(","), []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log('error ', error);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },

  // edit office team user
  async editOfficeTeamUser(ctx) {
    let response;
    try {
      let error_status = false;
      let errors = [];
      const request_body = ctx.request.body;
      const user = ctx.state.user;
      const { id } = ctx.params;
      let user_access = {};
      let user_to_upt_access = {};
      let user_to_upt_level = "";
      let clientProjects = [];
      const user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
      const users_levels = await strapi.query("users-levels").find();

      if (!user_levels || user_levels.length === 0) {
        error_status = true;
        errors.push("user_levels missing")
      }

      if (!user_admin) {
        error_status = true;
        errors.push("User-admin not found")
      }
      if (user_admin) {
        user_access = await strapi.query("user-admin-access").findOne({ user_id: user_admin.id });
        if (!user_access) {
          error_status = true;
          errors.push("User-admin access not found")
        }

        user_to_upt_access = await strapi.query("user-admin-access").findOne({ user_id: id });
        if (!user_to_upt_access) {
          error_status = true;
          errors.push("User to update not found")
        }

        if (user_access) {
          if (!user_access.user_access) {
            error_status = true;
            errors.push("User access not found")
          }
          if (user_access.user_access) {
            if (user.id != id) {
              // let objSettings = utils.findSubPageEntitiesByName('Workers',user_access.user_access);
              // let obj2 = utils.findPageEntitiesByName('Attendance',user_access.user_access);
              let objSettings = utils.getAccess(user_access.user_access, "page_entities", "Settings", "Office Team", "", "", "");
              // console.log('----> objSettings',objSettings);
              if (!objSettings || objSettings.is_active === false) {
                error_status = true;
                errors.push("User settings not active")
              }
              if (objSettings) {

                // check for action
                const actionEntity = utils.getAccess(user_access.user_access, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Edit office user");
                if (!actionEntity || actionEntity.is_active === false) {
                  error_status = true;
                  errors.push("User not allowed to edit")
                } else {
                  'lo'
                  if (user_to_upt_access) {
                    const user_level = users_levels.find(level => {
                      if (level.id.toString() === user_access.user_level_id?.toString()) {
                        return level;
                      }
                    });

                    user_to_upt_level = users_levels.find(level => {
                      if (level.id.toString() === user_to_upt_access.user_level_id?.toString()) {
                        return level;
                      }
                    });

                    if (!user_to_upt_level) {
                      error_status = true;
                      errors.push("User level not found")
                    }


                    if (user_level.name === 'level_2') {
                      if (!user_access.client) {
                        error_status = true;
                        errors.push("Client not available for this user")
                      }

                      if (!user_to_upt_access.client) {
                        error_status = true;
                        errors.push("Client not available for this user")
                      }
                      if (Object.keys(user_access.client).length != 0 && Object.keys(user_to_upt_access.client).length != 0) {
                        if (user_access.client.id != user_to_upt_access.client.id) {
                          error_status = true;
                          errors.push("Update only user from your client list")
                        }
                      }
                      if (request_body.User_level_id) {
                        delete request_body.User_level_id;
                      }
                      if (user_to_upt_level.name === 'level_1') {
                        error_status = true;
                        errors.push("User not authorized")
                      }

                    }
                  }
                }
              }
            } else {
              user_to_upt_level = users_levels.find(level => {
                if (level.id.toString() === user_access.user_level_id?.toString()) {
                  return level;
                }
              });
            }
          }
        }
      }

      if (request_body.client) {
        const client_id = request_body.client;
        clientProjects = await strapi.query("projects").find({ client_id: client_id });
        if (!(clientProjects.length >= 1)) {
          error_status = true;
          errors.push("To be able to update this level-2 user, the client under this user must have at least one project associated to it.");
        }
      }

      if (error_status === false) {

        let project_ids_for_new_user = [];
        if (request_body.client) {
          for (let i = 0; i < clientProjects.length; i++) {
            const find_project = request_body.projects.find((x) => parseInt(x) === parseInt(clientProjects[i].id));
            if (find_project) {
              project_ids_for_new_user.push(clientProjects[i].id);
            }
          }
          if (project_ids_for_new_user.length === 0) {
            ctx.response.status = 400;
            response = Format.badRequest("The project you are trying to add either doesn't exist or doesn't belong to the client associated to this user.", []);
            return response;
          }
        }



        await strapi.query("user", "admin").update({ id: id }, request_body);

        const access_body = {
          title: request_body.title_id ?? user_to_upt_access.title?.id,
          avatar_url: request_body.avatar_url ?? user_to_upt_access.avatar_url,
          projects: project_ids_for_new_user

        }
        await strapi.query("user-admin-access").update({ id: user_to_upt_access.id }, access_body);
        // if (!user_to_upt_access.user_access || user_to_upt_access.user_access.length === 0) {
        //   let user_to_upt_pages = user_levels[user_to_upt_level.name].pages;

        //   user_to_upt_access.user_access = user_to_upt_pages;
        // }
        // let pages = utils.updateExistingAccessLevel(request_body, user_to_upt_level.name, { [user_to_upt_level.name]: { "pages": user_to_upt_access.user_access } });
        // if (request_body.user_access) {
        //   delete request_body.user_access
        // }
        // let body = { ...request_body, user_access: pages };
        // await strapi.query("user-admin-access").update({ user_id: id }, body);

        ctx.response.status = 200;
        response = Format.success(`User updated successfully`, []);

      } else {
        ctx.response.status = 400;
        response = Format.badRequest(errors.join(","), []);
      }
    } catch (error) {
      console.log(error);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  // invite a user
  async inviteUser(ctx) {
    let response;
    try {
      let rules = {
        firstname: "required|string",
        job_title: "required|integer",
        user_level_id: "required|integer",
        lastname: "required|string",
        username: "required|string",
        email: "required|string",
        isActive: "required|boolean",
        company_name: "required|string",
        payment_view: "required|boolean",
        payment_edit: "required|boolean",
        project_view: "required|boolean",
        project_edit: "required|boolean",
        workforce_view: "required|boolean",
        workforce_edit: "required|boolean",
        attendance_view: "required|boolean",
        attendance_edit: "required|boolean",
        attendance_approve: "required|boolean",
        settings_edit: "required|boolean",
        settings_view: "required|boolean",

      };
      const date_now = new Date();
      const year = date_now.getFullYear();
      let error_status = false;
      let errors = [];
      const validation = new Validator(ctx.request.body, rules);
      const request_body = ctx.request.body;
      if (validation.passes()) {
        const users_level = await strapi.query("users-levels").findOne({ id: request_body.user_level_id });
        // check if user_levels is available
        if (!users_level) {
          error_status = true;
          errors.push("Please provide a correct level to this user");
        }
        // check if client id is present for level-2 users
        if (users_level.name.toString().toLowerCase() === 'level_2' && !request_body.client_ids && !Array.isArray(request_body.client_ids)) {
          error_status = true;
          errors.push("Please provide client_ids");
        }
        if (!error_status) {
          // check if new title is available
          if (request_body.job_title_name) {
            // create new title
            const new_title = await strapi.query("titles").findOne({ "title_name": request_body.job_title_name });
            if (new_title) {
              request_body.job_title = new_title.id;
            } else {
              let new_created_title = await strapi.query("titles").create({ title_name: request_body.job_title_name });
              request_body.job_title = new_created_title.id;
            }
          }
          const randomstring = Math.random().toString(36).slice(-8);
          const user_body_updt = {
            firstname: request_body.firstname,
            lastname: request_body.lastname,
            username: request_body.username,
            email: request_body.email,
            isActive: false,

          };
          user_body_updt.roles = [1];
          user_body_updt.password = await strapi.admin.services.auth.hashPassword(randomstring);
          const userExist = await strapi.query("user", "admin").findOne({ username: request_body.username });
          if (userExist) {
            ctx.response.status = 400;
            response = Format.badRequest("Phone Number duplicated", request_body.username);
          } else {
            let client_ids = [];
            if (request_body.client_ids && request_body.client_ids.length > 0) {
              client_ids = request_body.client_ids;
            }
            const userExistEmail = await strapi.query("user", "admin").findOne({ email: request_body.email });
            if (userExistEmail) {
              ctx.response.status = 400;
              response = Format.badRequest("Email duplicated", request_body.email);
            } else {
              const new_user = await strapi.query("user", "admin").create(user_body_updt);
              if (new_user) {
                const user_access_updt = {
                  avatar_url: request_body.avatar_url,
                  username: request_body.username,
                  title: request_body.job_title,
                  user_id: new_user.id,
                  payment_view: request_body.payment_view ? request_body.payment_view : false,
                  payment_edit: request_body.payment_edit ? request_body.payment_edit : false,
                  settings_view: request_body.settings_view ? request_body.settings_view : false,
                  settings_edit: request_body.settings_edit ? request_body.settings_edit : false,
                  project_view: request_body.project_view ? request_body.project_view : false,
                  project_edit: request_body.project_edit ? request_body.project_edit : false,
                  workforce_view: request_body.workforce_view ? request_body.workforce_view : false,
                  workforce_edit: request_body.workforce_edit ? request_body.workforce_edit : false,
                  attendance_view: request_body.attendance_view ? request_body.attendance_view : false,
                  attendance_edit: request_body.attendance_edit ? request_body.attendance_edit : false,
                  attendance_approve: request_body.attendance_approve ? request_body.attendance_approve : false,
                  user_level_id: request_body.user_level_id,
                  clients: client_ids
                };
                await strapi.query("user-admin-access").create(user_access_updt);
                const title = await strapi.query("titles").findOne({ id: request_body.job_title });
                const body_data = { "email": new_user.email, "link_api": PLATFORM_API_URL, "link_platform": PLATFORM_URL, "is_admin": false };
                const encode_info = Buffer.from(JSON.stringify(body_data)).toString('base64');
                const setPasswordLink = `${SUPER_ADMIN_FRONT_END_URL}/signup/${encode_info}`;
                const emailData = {
                  from: "support@fixarwanda.com",
                  to: [`${new_user.email}`],
                  subject: `Welcome to Fixa`,
                  template: "admin_saas_onboarding_staff",
                  "v:company_name": `${request_body.company_name}`,
                  "v:role_invited": `${title ? title.title_name : ""}`,
                  "v:join_link": setPasswordLink,
                  "v:year": `${year}`
                };

                // Send an email to the user.
                mailgun.messages().send(emailData);
                ctx.response.status = 200;
                response = Format.success(`User with email ${new_user.email} Invited successfully`, []);
              }
            }
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest(errors.join(","), []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  // update profile
  async editAvatarUrl(ctx) {
    let response;
    try {
      let user = ctx.state.user;
      const { id } = ctx.params;
      // check user
      let user_admin = await strapi
        .query("user", "admin")
        .findOne({ id: user.id });
      if (user_admin) {
        let user_access = await strapi
          .query("user-admin-access")
          .findOne({ user_id: user_admin.id });

        if (user.id == id && user_access) {
          let rules = {
            avatar_url: "required|string",
          };
          let validation = new Validator(ctx.request.body, rules);
          if (validation.passes()) {
            let user_updt = await strapi
              .query("user", "admin")
              .findOne({ id: id });
            if (user_updt) {
              let request_body = ctx.request.body;
              let user_access_user_updt = await strapi
                .query("user-admin-access")
                .findOne({ user_id: user_updt.id });
              if (user_access_user_updt) {
                // update
                await strapi
                  .query("user-admin-access")
                  .update({ id: user_access_user_updt.id }, ctx.request.body);
                ctx.response.status = 200;
                response = {
                  status: "success",
                  data: "User avatar updated successfully",
                  error: "",
                  meta: "",
                };
              } else {
                // create
                let user_access_updt = {
                  user_id: user_updt.id,
                  username: request_body.username,
                  settings: request_body.settings,
                  title: request_body.job_title,
                  payment_view: request_body.payment_view,
                  payment_edit: request_body.payment_edit,
                  settings_view: request_body.settings_view,
                  settings_edit: request_body.settings_edit,
                  project_view: request_body.project_view,
                  project_edit: request_body.project_edit,
                  workforce_view: request_body.workforce_view,
                  workforce_edit: request_body.workforce_edit,
                  attendance_view: request_body.attendance_view,
                  attendance_edit: request_body.attendance_edit,
                  attendance_approve: request_body.attendance_approve,
                };
                // update
                await strapi
                  .query("user-admin-access")
                  .create(user_access_updt);
                ctx.response.status = 200;
                response = {
                  status: "success",
                  data: "User created successfully",
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
          ctx.response.status = 403;
          response = {
            status: "failed",
            data: "",
            error: "User access forbidden",
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
  // edit user admin
  async editUserAdmin(ctx) {
    let response;
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;
      let rules = {
        firstname: "required|string",
        lastname: "required|string",
        job_title: "required|integer",
        email: "required|string",
        user_level_id: "required|integer",
        settings: "required|boolean",
      };
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
        if (user_admin) {
          const user_access = await strapi.query("user-admin-access").findOne({ user_id: user_admin.id });
          if (user_access && user_access.user_level_id) {
            const users_levels = await strapi.query("users-levels").find();
            if (users_levels) {
              const user_level = users_levels.find(level => {
                if (level.id.toString() === user_access.user_level_id?.toString()) {
                  return level;
                }
              });
              //We are editing a user with level-1
              if (user_level && user_level.name.toString().toLowerCase() === 'level_1') {
                const user_updt = await strapi.query("user", "admin").findOne({ id: id });
                if (user_updt) {
                  // check if user is the same
                  if (user_updt.id.toString() === user_admin.id.toString()) {
                    const request_body = ctx.request.body;
                    const user_access_user_updt = await strapi.query("user-admin-access").findOne({ user_id: user_updt.id });
                    const user_body_updt = {
                      firstname: request_body.firstname ?? user_admin.firstname,
                      lastname: request_body.lastname ?? user_admin.lastname,
                      username: request_body.username ?? user_admin.username,
                      email: request_body.email ?? user_admin.email,
                      isActive: request_body.isActive ?? user_admin.isActive,
                    };
                    await strapi.query("user", "admin").update({ id: user_updt.id }, user_body_updt);
                    if (user_access_user_updt) {
                      const user_access_updt = {
                        avatar_url: request_body.avatar_url,
                        username: request_body.username ?? user_access.username,
                        title: request_body.job_title ?? user_access.title,
                        user_level_id: request_body.user_level_id ?? user_access.user_level_id,
                        payment_view: request_body.payment_view ?? user_access.payment_view,
                        payment_edit: request_body.payment_edit ?? user_access.payment_edit,
                        settings_view: request_body.settings_view ?? user_access.settings_view,
                        settings_edit: request_body.settings_edit ?? user_access.settings_edit,
                        project_view: request_body.project_view ?? user_access.project_view,
                        project_edit: request_body.project_edit ?? user_access.project_edit,
                        workforce_view: request_body.workforce_view ?? user_access.workforce_view,
                        workforce_edit: request_body.workforce_edit ?? user_access.workforce_edit,
                        attendance_view: request_body.attendance_view ?? user_access.attendance_view,
                        attendance_edit: request_body.attendance_edit ?? user_access.attendance_edit,
                        attendance_approve: request_body.attendance_approve ?? user_access.attendance_approve,
                      };
                      // update
                      await strapi.query("user-admin-access").update({ id: user_access_user_updt.id }, user_access_updt);
                      ctx.response.status = 200;
                      response = Format.success(`User updated successfully`, []);
                    } else {
                      // create
                      let user_access_updt = {
                        user_id: user_updt.id,
                        user_level_id: request_body.user_level_id,
                        username: request_body.username,
                        // settings: request_body.settings,
                        title: request_body.job_title,
                        payment_view: request_body.payment_view ?? false,
                        payment_edit: request_body.payment_edit ?? false,
                        settings_view: request_body.settings_view ?? false,
                        settings_edit: request_body.settings_edit ?? false,
                        project_view: request_body.project_view ?? false,
                        project_edit: request_body.project_edit ?? false,
                        workforce_view: request_body.workforce_view ?? false,
                        workforce_edit: request_body.workforce_edit ?? false,
                        attendance_view: request_body.attendance_view ?? false,
                        attendance_edit: request_body.attendance_edit ?? false,
                        attendance_approve: request_body.attendance_approve ?? false
                      };
                      // update
                      await strapi.query("user-admin-access").create(user_access_updt);
                      ctx.response.status = 200;
                      response = Format.success(`User updated successfully`, []);
                    }
                  } else {
                    let client_ids = [];
                    let request_body = ctx.request.body;
                    if (request_body.client_ids && request_body.client_ids.length > 0) {
                      client_ids = request_body.client_ids;
                    }
                    let user_access_user_updt = await strapi.query("user-admin-access").findOne({ user_id: user_updt.id });
                    let user_body_updt = {
                      firstname: request_body.firstname ?? user_updt.firstname,
                      lastname: request_body.lastname ?? user_updt.lastname,
                      username: request_body.username ?? user_updt.username,
                      email: request_body.email ?? user_updt.email,
                      isActive: request_body.isActive ?? user_updt.isActive,
                    };
                    await strapi.query("user", "admin").update({ id: user_updt.id }, user_body_updt);
                    if (user_access_user_updt) {
                      let user_access_updt = {
                        avatar_url: request_body.avatar_url ?? user_access_user_updt.avatar_url,
                        username: request_body.username ?? user_access_user_updt.username,
                        // settings: request_body.settings ?? user_access_user_updt,
                        title: request_body.job_title ?? user_access_user_updt.title,
                        user_level_id: request_body.user_level_id ?? user_access_user_updt.user_level_id,
                        clients: client_ids,
                        payment_view: request_body.payment_view ?? user_access_user_updt.payment_view,
                        payment_edit: request_body.payment_edit ?? user_access_user_updt.payment_edit,
                        settings_view: request_body.settings_view ?? user_access_user_updt.settings_view,
                        settings_edit: request_body.settings_edit ?? user_access_user_updt.settings_edit,
                        project_view: request_body.project_view ?? user_access_user_updt.project_view,
                        project_edit: request_body.project_edit ?? user_access_user_updt.project_edit,
                        workforce_view: request_body.workforce_view ?? user_access_user_updt.workforce_view,
                        workforce_edit: request_body.workforce_edit ?? user_access_user_updt.workforce_edit,
                        attendance_view: request_body.attendance_view ?? user_access_user_updt.attendance_view,
                        attendance_edit: request_body.attendance_edit ?? user_access_user_updt.attendance_edit,
                        attendance_approve: request_body.attendance_approve ?? user_access_user_updt.attendance_approve,
                      };
                      // update
                      await strapi.query("user-admin-access").update({ id: user_access_user_updt.id }, user_access_updt);
                      ctx.response.status = 200;
                      response = Format.success(`User updated successfully`, []);
                    } else {
                      // create
                      let user_access_updt = {
                        user_id: user_updt.id,
                        username: request_body.username,
                        // settings: request_body.settings,
                        title: request_body.job_title,
                        clients: client_ids,
                        user_level_id: request_body.user_level_id,
                        payment_view: request_body.payment_view ?? false,
                        payment_edit: request_body.payment_edit ?? false,
                        settings_view: request_body.settings_view ?? false,
                        settings_edit: request_body.settings_edit ?? false,
                        project_view: request_body.project_view ?? false,
                        project_edit: request_body.project_edit ?? false,
                        workforce_view: request_body.workforce_view ?? false,
                        workforce_edit: request_body.workforce_edit ?? false,
                        attendance_view: request_body.attendance_view ?? false,
                        attendance_edit: request_body.attendance_edit ?? false,
                        attendance_approve: request_body.attendance_approve ?? false
                      };
                      // update
                      await strapi.query("user-admin-access").create(user_access_updt);
                      ctx.response.status = 200;
                      response = Format.success(`User updated successfully`, []);
                    }
                  }

                } else {
                  ctx.response.status = 404;
                  response = Format.notFound('User not found', []);
                }
              }
              //We are editing a user with level-2
              if (user_level && user_level.name.toString().toLowerCase() === 'level_2') {
                const user_updt = await strapi.query("user", "admin").findOne({ id: id });
                if (user_updt) {
                  let user_access_user_updt = await strapi.query("user-admin-access").findOne({ user_id: user_updt.id });
                  let user_level_upt = users_levels.find(level => {
                    if (level.id.toString() === user_updt.user_level_id?.toString()) {
                      return level;
                    }
                  });
                  let user_to_update_clients_ids = user_access_user_updt.clients ? user_access_user_updt.clients.map((item) => item.id) : [];
                  let user_access_clients_ids = user_access.clients ? user_access.clients.map((item) => item.id) : [];
                  // check if user is the same
                  if (user_updt.id.toString() === user_admin.id.toString()) {
                    let request_body = ctx.request.body;

                    let user_body_updt = {
                      firstname: request_body.firstname ?? user_updt.firstname,
                      lastname: request_body.lastname ?? user_updt.lastname,
                      username: request_body.username ?? user_updt.username,
                      email: request_body.email ?? user_updt.email,
                      isActive: request_body.isActive ?? user_updt.isActive,
                    };
                    await strapi.query("user", "admin").update({ id: user_updt.id }, user_body_updt);
                    if (user_access_user_updt) {
                      let user_access_updt = {
                        avatar_url: request_body.avatar_url ?? user_access_user_updt.avatar_url,
                        username: request_body.username ?? user_access_user_updt.username,
                        // settings: request_body.settings ?? user_access_user_updt,
                        title: request_body.job_title ?? user_access_user_updt.title,
                        // payment_view: request_body.payment_view ?? user_access_user_updt.payment_view ,
                        // payment_edit: request_body.payment_edit ?? user_access_user_updt.payment_edit ,
                        settings_view: request_body.settings_view ?? user_access_user_updt.settings_view,
                        settings_edit: request_body.settings_edit ?? user_access_user_updt.settings_edit,
                        project_view: request_body.project_view ?? user_access_user_updt.project_view,
                        // project_edit: request_body.project_edit ?? user_access_user_updt.project_edit ,
                        workforce_view: request_body.workforce_view ?? user_access_user_updt.workforce_view,
                        // workforce_edit: request_body.workforce_edit ?? user_access_user_updt.workforce_edit ,
                        attendance_view: request_body.attendance_view ?? user_access_user_updt.attendance_view,
                        // attendance_edit: request_body.attendance_edit ?? user_access_user_updt.attendance_edit ,
                        attendance_approve: request_body.attendance_approve ?? user_access_user_updt.attendance_approve,
                      };
                      // update
                      await strapi.query("user-admin-access").update({ id: user_access_user_updt.id }, user_access_updt);
                      ctx.response.status = 200;
                      response = Format.success(`User updated successfully`, []);
                    } else {
                      // create
                      let user_access_updt = {
                        user_id: user_updt.id,
                        username: request_body.username,
                        // settings: request_body.settings,
                        title: request_body.job_title,
                        payment_view: false,
                        payment_edit: false,
                        settings_view: request_body.settings_view ?? false,
                        settings_edit: request_body.settings_edit ?? false,
                        project_view: request_body.project_view ?? false,
                        project_edit: false,
                        workforce_view: request_body.workforce_view ?? false,
                        workforce_edit: false,
                        attendance_view: request_body.attendance_view ?? false,
                        attendance_edit: false,
                        attendance_approve: request_body.attendance_approve ?? false
                      };
                      // update
                      await strapi.query("user-admin-access").create(user_access_updt);
                      ctx.response.status = 200;
                      response = Format.success(`User updated successfully`, []);
                    }
                  } else {
                    if (user_access && user_level_upt && user_level_upt.name.toString().toLowerCase() === 'level_2' && isAnyElementInArray2(user_access_clients_ids, user_to_update_clients_ids)) {
                      let request_body = ctx.request.body;

                      let user_access_user_updt = await strapi.query("user-admin-access").findOne({ user_id: user_updt.id });
                      let user_body_updt = {
                        firstname: request_body.firstname ?? user_updt.firstname,
                        lastname: request_body.lastname ?? user_updt.lastname,
                        username: request_body.username ?? user_updt.username,
                        email: request_body.email ?? user_updt.email,
                        isActive: request_body.isActive ?? user_updt.isActive,
                      };
                      await strapi.query("user", "admin").update({ id: user_updt.id }, user_body_updt);
                      if (user_access_user_updt) {
                        let user_access_updt = {
                          avatar_url: request_body.avatar_url,
                          username: request_body.username,
                          // settings: request_body.settings,
                          title: request_body.job_title,
                          // payment_view: request_body.payment_view ?? user_access_user_updt.payment_view ,
                          // payment_edit: request_body.payment_edit ?? user_access_user_updt.payment_edit ,
                          settings_view: request_body.settings_view ?? user_access_user_updt.settings_view,
                          settings_edit: request_body.settings_edit ?? user_access_user_updt.settings_edit,
                          project_view: request_body.project_view ?? user_access_user_updt.project_view,
                          // project_edit: request_body.project_edit ?? user_access_user_updt.project_edit ,
                          workforce_view: request_body.workforce_view ?? user_access_user_updt.workforce_view,
                          // workforce_edit: request_body.workforce_edit ?? user_access_user_updt.workforce_edit ,
                          attendance_view: request_body.attendance_view ?? user_access_user_updt.attendance_view,
                          // attendance_edit: request_body.attendance_edit ?? user_access_user_updt.attendance_edit ,
                          attendance_approve: request_body.attendance_approve ?? user_access_user_updt.attendance_approve,
                        };
                        // update
                        await strapi.query("user-admin-access").update({ id: user_access_user_updt.id }, user_access_updt);
                        ctx.response.status = 200;
                        response = Format.success(`User updated successfully`, []);
                      } else {
                        // create
                        let user_access_updt = {
                          user_id: user_updt.id,
                          username: request_body.username,
                          // settings: request_body.settings,
                          title: request_body.job_title,
                          payment_view: false,
                          payment_edit: false,
                          settings_view: request_body.settings_view ?? false,
                          settings_edit: request_body.settings_edit ?? false,
                          project_view: request_body.project_view ?? false,
                          project_edit: false,
                          workforce_view: request_body.workforce_view ?? false,
                          workforce_edit: false,
                          attendance_view: request_body.attendance_view ?? false,
                          attendance_edit: false,
                          attendance_approve: request_body.attendance_approve ?? false
                        };
                        // update
                        await strapi.query("user-admin-access").create(user_access_updt);
                        ctx.response.status = 200;
                        response = Format.success(`User updated successfully`, []);
                      }
                    } else {
                      ctx.response.status = 403;
                      response = Format.forbidden("User access forbidden", []);
                    }
                  }

                } else {
                  ctx.response.status = 404;
                  response = Format.notFound('User not found', []);
                }


              }
            } else {
              ctx.response.status = 400;
              response = Format.badRequest('user level not found', []);
            }
          } else {
            ctx.response.status = 404;
            response = Format.notFound("We can't find you in our user access level", []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("Only admin can do that.", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }

    } catch (error) {
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  // // edit user
  // async editUserAdmin(ctx) {
  //   let response;
  //   try {
  //     let user = ctx.state.user;
  //     const { id } = ctx.params;
  //     // check user
  //     let user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
  //     if (user_admin) {
  //       let user_access = await strapi.query("user-admin-access").findOne({ user_id: user_admin.id });
  //       let user_updt = await strapi.query("user", "admin").findOne({ id: id });
  //       // if owner of account
  //       if (user_updt) {
  //         if (user_updt.id.toString() === user_admin.id.toString()) {
  //           let rules = {
  //             firstname: "required|string",
  //             job_title: "required|integer",
  //             user_level_id: "required|integer",
  //             settings: "required|boolean",
  //             lastname: "required|string",
  //             email: "required|string",
  //             isActive: "required|boolean",
  //             payment_view: "required|boolean",
  //             payment_edit: "required|boolean",
  //             project_view: "required|boolean",
  //             project_edit: "required|boolean",
  //             workforce_view: "required|boolean",
  //             workforce_edit: "required|boolean",
  //             attendance_view: "required|boolean",
  //             attendance_edit: "required|boolean",
  //             attendance_approve: "required|boolean",
  //             settings_edit: "required|boolean",
  //             settings_view: "required|boolean",
  //           };
  //           let validation = new Validator(ctx.request.body, rules);
  //           if (validation.passes()) {
  //             let request_body = ctx.request.body;
  //             let user_access_user_updt = await strapi.query("user-admin-access").findOne({ user_id: user_updt.id });
  //             let user_body_updt = {
  //               firstname: request_body.firstname,
  //               lastname: request_body.lastname,
  //               username: request_body.username,
  //               email: request_body.email,
  //               isActive: request_body.isActive,
  //             };
  //             await strapi.query("user", "admin").update({ id: user_updt.id }, user_body_updt);
  //             if (user_access_user_updt) {
  //               let user_access_updt = {
  //                 avatar_url: request_body.avatar_url,
  //                 username: request_body.username,
  //                 settings: request_body.settings,
  //                 title: request_body.job_title,
  //                 payment_view: request_body.payment_view ? request_body.payment_view : false,
  //                 payment_edit: request_body.payment_edit ? request_body.payment_edit : false,
  //                 settings_view: request_body.settings_view ? request_body.settings_view : false,
  //                 settings_edit: request_body.settings_edit ? request_body.settings_edit : false,
  //                 project_view: request_body.project_view ? request_body.project_view : false,
  //                 project_edit: request_body.project_edit ? request_body.project_edit : false,
  //                 workforce_view: request_body.workforce_view ? request_body.workforce_view : false,
  //                 workforce_edit: request_body.workforce_edit ? request_body.workforce_edit : false,
  //                 attendance_view: request_body.attendance_view ? request_body.attendance_view : false,
  //                 attendance_edit: request_body.attendance_edit ? request_body.attendance_edit : false,
  //                 attendance_approve: request_body.attendance_approve ? request_body.attendance_approve : false,
  //               };
  //               // update
  //               await strapi.query("user-admin-access").update({ id: user_access_user_updt.id }, user_access_updt);
  //               ctx.response.status = 200;
  //               response = Format.success(`User updated successfully`, []);
  //             } else {
  //               // create
  //               let user_access_updt = {
  //                 user_id: user_updt.id,
  //                 user_level_id: request_body.user_level_id,
  //                 username: request_body.username,
  //                 settings: request_body.settings,
  //                 title: request_body.job_title,
  //                 payment_view: request_body.payment_view,
  //                 payment_edit: request_body.payment_edit,
  //                 settings_view: request_body.settings_view,
  //                 settings_edit: request_body.settings_edit,
  //                 project_view: request_body.project_view,
  //                 project_edit: request_body.project_edit,
  //                 workforce_view: request_body.workforce_view,
  //                 workforce_edit: request_body.workforce_edit,
  //                 attendance_view: request_body.attendance_view,
  //                 attendance_edit: request_body.attendance_edit,
  //                 attendance_approve: request_body.attendance_approve
  //               };
  //               // update
  //               await strapi.query("user-admin-access").create(user_access_updt);
  //               ctx.response.status = 200;
  //               response = Format.success(`User updated successfully`, []);
  //             }

  //           } else {
  //             ctx.response.status = 400;
  //             response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
  //           }
  //         } else {
  //           if (user_access && user_access.settings_edit) {
  //             let rules = {
  //               firstname: "required|string",
  //               job_title: "required|integer",
  //               user_level_id: "required|integer",
  //               settings: "required|boolean",
  //               lastname: "required|string",
  //               email: "required|string",
  //               isActive: "required|boolean",
  //               payment_view: "required|boolean",
  //               payment_edit: "required|boolean",
  //               project_view: "required|boolean",
  //               project_edit: "required|boolean",
  //               workforce_view: "required|boolean",
  //               workforce_edit: "required|boolean",
  //               attendance_view: "required|boolean",
  //               attendance_edit: "required|boolean",
  //               attendance_approve: "required|boolean",
  //               settings_edit: "required|boolean",
  //               settings_view: "required|boolean",
  //             };
  //             let validation = new Validator(ctx.request.body, rules);
  //             if (validation.passes()) {
  //               // if (user_updt) {
  //               let request_body = ctx.request.body;
  //               let user_access_user_updt = await strapi.query("user-admin-access").findOne({ user_id: user_updt.id });
  //               let user_body_updt = {
  //                 firstname: request_body.firstname,
  //                 lastname: request_body.lastname,
  //                 username: request_body.username,
  //                 email: request_body.email,
  //                 isActive: request_body.isActive,
  //               };
  //               await strapi.query("user", "admin").update({ id: user_updt.id }, user_body_updt);
  //               if (user_access_user_updt) {
  //                 let user_access_updt = {
  //                   avatar_url: request_body.avatar_url,
  //                   username: request_body.username,
  //                   settings: request_body.settings,
  //                   title: request_body.job_title,
  //                   payment_view: request_body.payment_view ? request_body.payment_view : false,
  //                   payment_edit: request_body.payment_edit ? request_body.payment_edit : false,
  //                   settings_view: request_body.settings_view ? request_body.settings_view : false,
  //                   settings_edit: request_body.settings_edit ? request_body.settings_edit : false,
  //                   project_view: request_body.project_view ? request_body.project_view : false,
  //                   project_edit: request_body.project_edit ? request_body.project_edit : false,
  //                   workforce_view: request_body.workforce_view ? request_body.workforce_view : false,
  //                   workforce_edit: request_body.workforce_edit ? request_body.workforce_edit : false,
  //                   attendance_view: request_body.attendance_view ? request_body.attendance_view : false,
  //                   attendance_edit: request_body.attendance_edit ? request_body.attendance_edit : false,
  //                   attendance_approve: request_body.attendance_approve ? request_body.attendance_approve : false,
  //                 };
  //                 // update
  //                 await strapi.query("user-admin-access").update({ id: user_access_user_updt.id }, user_access_updt);
  //                 ctx.response.status = 200;
  //                 response = Format.success(`User updated successfully`, []);
  //               } else {
  //                 // create
  //                 let user_access_updt = {
  //                   user_id: user_updt.id,
  //                   username: request_body.username,
  //                   settings: request_body.settings,
  //                   title: request_body.job_title,
  //                   payment_view: request_body.payment_view,
  //                   payment_edit: request_body.payment_edit,
  //                   settings_view: request_body.settings_view,
  //                   settings_edit: request_body.settings_edit,
  //                   project_view: request_body.project_view,
  //                   project_edit: request_body.project_edit,
  //                   workforce_view: request_body.workforce_view,
  //                   workforce_edit: request_body.workforce_edit,
  //                   attendance_view: request_body.attendance_view,
  //                   attendance_edit: request_body.attendance_edit,
  //                   attendance_approve: request_body.attendance_approve
  //                 };
  //                 // update
  //                 await strapi.query("user-admin-access").create(user_access_updt);
  //                 ctx.response.status = 200;
  //                 response = Format.success(`User updated successfully`, []);
  //               }

  //               // } else {
  //               //   ctx.response.status = 404;
  //               //   response = Format.notFound('User not found', []);
  //               // }
  //             } else {
  //               ctx.response.status = 400;
  //               response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
  //             }
  //           } else {
  //             ctx.response.status = 403;
  //             response = Format.forbidden("User access forbidden", []);
  //           }
  //         }
  //       } else {
  //         ctx.response.status = 404;
  //         response = Format.notFound('User not found', []);
  //       }
  //     } else {
  //       ctx.response.status = 404;
  //       response = Format.notFound('User not found', []);
  //     }
  //   } catch (error) {
  //     ctx.response.status = 500;
  //     response = Format.internalError(error.message, []);
  //   }
  //   return response;
  // },
  // get a  user
  async getUser(ctx) {
    let response;
    try {
      let user = ctx.state.user;
      const { id } = ctx.params;

      // check user
      let user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
      if (user_admin) {
        let user_access = await strapi.query("user-admin-access").findOne({ user_id: user_admin.id });
        let users_levels = await strapi.query("users-levels").find();
        let user_admin_to_check = await strapi.query("user", "admin").findOne({ id: id });
        if (user_admin_to_check) {

          let user_access_to_check = await strapi.query("user-admin-access").findOne({ user_id: user_admin_to_check.id });
          let user_body = {};
          //   console.log(user_access_to_check);
          if (user_access_to_check) {
            let user_level = users_levels.find(level => {
              if (level.id.toString() === user_access_to_check.user_level_id?.toString()) {
                return level;
              }
            });

            user_body = {
              id: user_admin_to_check.id,
              firstname: user_admin_to_check.firstname,
              job_title: user_access_to_check.title ? user_access_to_check.title.name : "",
              avatar_url: user_access_to_check.avatar_url,
              lastname: user_admin_to_check.lastname,
              username: user_admin_to_check.username,
              email: user_admin_to_check.email,
              isActive: user_admin_to_check.isActive,
              title_id: user_access_to_check.title ? user_access_to_check.title.id : 0,
              title: user_access_to_check.title ? user_access_to_check.title.title_name : "",
              level: user_level ? { "id": user_level.id, "name": user_level.name } : {},
              user_access: user_access_to_check.user_access,
              clients: user_access_to_check.client
            };
          } else {
            user_body = {
              id: user_admin_to_check.id,
              firstname: user_admin_to_check.firstname,
              title_id: 0,
              title: "",
              avatar_url: "",
              lastname: user_admin_to_check.lastname,
              username: user_admin_to_check.username,
              email: user_admin_to_check.email,
              isActive: user_admin_to_check.isActive,
              user_access: [],
              level: {},
              clients: {}
            };
          }

          let titles = await strapi.query("titles").find({ _limit: -1 });
          let titles_respone =
            titles.length > 0
              ? titles.map((item) => {
                return {
                  id: item.id,
                  title_name: item.title_name,
                };
              })
              : [];
          ctx.response.status = 200;
          response = {
            status: "success",
            data: {
              titles: titles_respone,
              user_body: user_body,
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
      console.log(error);
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
  // get all users
  async getAllAdminUsers(ctx) {
    let response;
    try {
      let user = ctx.state.user;
      let queries = ctx.query;
      // check user
      let user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
      if (user_admin) {
        var user_admin_access = await strapi.query("user-admin-access").findOne({ user_id: user.id });
        let users_levels = await strapi.query("users-levels").find();
        if (user_admin_access) {
          let user_admin_level = users_levels.find(level => {
            if (level.id.toString() === user_admin_access.user_level_id?.toString()) {
              return level;
            }
          });
          if (user_admin_level) {
            let admins_users = [];
            if (queries.hasOwnProperty("search")) {
              let new_queries = { _q: queries.search, ...queries };
              delete new_queries.search;
              admins_users = await strapi.query("user", "admin").search(new_queries);
            } else {
              admins_users = await strapi.query("user", "admin").find(queries);
            }
            let admins_users_access = await strapi.query("user-admin-access").find({ _limit: -1 });
            if (admins_users.length > 0) {
              let user_admins = [];
              for (let index = 0; index < admins_users.length; index++) {
                const user_attached = attachTitle(admins_users[index].id, admins_users_access);
                if (user_attached.status) {
                  let user_level = users_levels.find(level => {
                    if (level.id.toString() === user_attached.body.user_level_id?.toString()) {
                      return level;
                    }
                  });
                  if (user_admin_level.name === 'level_1') {
                    user_admins.push({
                      id: admins_users[index].id,
                      admin_access_id: user_attached.body.id,
                      firstname: admins_users[index].firstname,
                      job_title: user_attached.body.title ? user_attached.body.title.title_name : "",
                      avatar_url: user_attached.body.avatar_url,
                      lastname: admins_users[index].lastname,
                      username: admins_users[index].username,
                      email: admins_users[index].email,
                      isActive: admins_users[index].isActive,
                      level: user_level ? { "id": user_level.id, "name": user_level.name } : {},
                      client: user_attached.body.client,
                      user_access: user_attached.body.user_access
                    });
                  } else if (user_admin_level.name === 'level_2') {
                    if (user_attached.body.client && user_attached.body.client.id === user_admin_access.client.id) {
                      user_admins.push({
                        id: admins_users[index].id,
                        admin_access_id: user_attached.body.id,
                        firstname: admins_users[index].firstname,
                        job_title: user_attached.body.title ? user_attached.body.title.title_name : "",
                        avatar_url: user_attached.body.avatar_url,
                        lastname: admins_users[index].lastname,
                        username: admins_users[index].username,
                        email: admins_users[index].email,
                        isActive: admins_users[index].isActive,
                        level: user_level ? { "id": user_level.id, "name": user_level.name } : {},
                        client: user_attached.body.client,
                        user_access: user_attached.body.user_access
                      });
                    }
                  }
                } else {
                  if (user_admin_level.name === 'level_1') {
                    user_admins.push({
                      id: admins_users[index].id,
                      firstname: admins_users[index].firstname,
                      job_title: "unavailable",
                      avatar_url: "",
                      lastname: admins_users[index].lastname,
                      username: admins_users[index].username,
                      email: admins_users[index].email,
                      isActive: admins_users[index].isActive,
                      level: {},
                      clients: '',
                      user_access: []
                    });
                  }
                }
              }
              ctx.response.status = 200;
              response = {
                status: "success",
                data: utils.sortByProperty(user_admins, 'isActive'),
                error: "",
                meta: "",
              };
            }
          } else {
            ctx.response.status = 404;
            response = {
              status: "failed",
              data: "",
              error: "User level not found",
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
      console.log("error", error);
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

function attachTitle(user_id, users_access) {
  let user = { status: false };
  for (let index = 0; index < users_access.length; index++) {
    if (users_access[index].user_id.toString() === user_id.toString()) {
      user = { status: true, body: users_access[index] };
    }
  }
  return user;
}

function isAnyElementInArray2(array1, array2) {
  return array1.some(element => array2.includes(element));
}