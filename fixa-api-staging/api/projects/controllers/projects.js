let Validator = require("validatorjs");
const _ = require('underscore');
const moment = require("moment");
const { getProjectsByUserLoggedIn, getClientProjectsId, getUserProjects, getSupplierProjects } = require("../services/projects");
const { getUsersSupervisors } = require("../../user-admin-access/controllers/user-admin-access");
const { updateCompanyStatus } = require("../../companies/services/companies");
const { getUserLevel } = require("../../user-admin-access/services/user-admin-access");
const api_key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
const utils = require("../../../config/functions/utils");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();
const Format = require('response-format');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  // create site
  async createSite(ctx) {
    let response;
    try {
      const request_body = ctx.request.body;
      const user = ctx.state.user;
      let errors = [];
      let error_status = false;
      let rules = {
        name: "required|string",
        country: "required|integer",
        province: "required|integer",
        start_date: "required|string",
        end_date: "required|string",
        // client_id: "required|integer"
      };
      const validation = new Validator(request_body, rules);
      if (validation.passes()) {
        let project_exist = await strapi.query("projects").findOne({ name: request_body.name });
        if (project_exist) {
          error_status = true;
          errors.push("Project with the same exist");
        }
        let company = await strapi.query("companies").findOne();
        if (!company) {
          error_status = true;
          errors.push("Company required");
        }
        // if (company.is_staffing === true) {
        //   if (!request_body.client_id) {
        //     error_status = true;
        //     errors.push("Client id required for staffing company");
        //   }
        if (request_body.client_id) {
          const client = await strapi.query("clients").findOne({ id: request_body.client_id, isActive: true });
          if (!client) {
            error_status = true;
            errors.push("Client not found or not active");
          } else {
            request_body.client_id = request_body.client_id;
          }
        }
        // }

        if (error_status === false) {
          let project = await strapi.query("projects").create(request_body);
          let address = `${project.country.country_name}, ${project.province.name}`;
          let project_updated = await strapi.query("projects").update({ id: project.id }, { address: address });
          await updateCompanyStatus('is_site_created');
          let companies = await strapi.query("companies").find();
          if (companies.length > 0) {
            if (companies[0].email && companies[0].email.length > 0) {
              const emailData = {
                from: `${companies[0].email}`,
                to: [`${user.email}`],
                subject: "Welcome To Your Project",
                template: "saas_assign_staff_to_project",
                "v:fixa_website": `https://fixarwanda.com`,
                "v:project_name": `${project.name}`,
                "v:role_invited": 'Project Manager'
              };
              mailgun.messages().send(emailData);
            }
          }
          ctx.response.status = 200;
          response = {
            status: "success",
            data: {
              "project": project_updated
            },
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = Format.badRequest(errors.join(","), []);
        }

      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
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
  // create project
  async createProject(ctx) {
    let response;
    try {
      /*****************Temp for presentation to Shelter**************** */
      let rules = {
        start_date: "required|string",
        name: "required|string",
        shifts: "required|array",
        client_id: "required|integer"
        // company_project_manager: "required|integer",
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (request_body.company_project_manager) {
        delete request_body.company_project_manager;
      }
      if (validation.passes()) {
        let client = await strapi.query("clients").findOne({ id: request_body.client_id, isActive: true });
        if (client) {
          let project_created = await strapi.query("projects").create(request_body);
          let user_profile = await strapi.query("user-admin-access").findOne({ user_id: ctx.state.user.id });
          let user_admin = await strapi.query("user", "admin").findOne({ id: user_profile.user_id });
          if (user_profile && user_admin) {
            let companies = await strapi.query("companies").find();
            if (companies.length > 0) {
              if (companies[0].email && companies[0].email.length > 0) {
                const emailData = {
                  from: `${companies[0].email}`,
                  to: [`${user_admin.email}`],
                  subject: "Welcome To Your Project",
                  template: "saas_assign_staff_to_project",
                  "v:fixa_website": `https://fixarwanda.com`,
                  "v:project_name": `${project_created.name}`,
                  "v:role_invited": 'Project Manager'
                };
                mailgun.messages().send(emailData);
              }
            }
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: [],
            error: "Client not found or Not active",
            meta: [],
          };
        }


        ctx.response.status = 200;
        response = {
          status: "success",
          data: "Project created Successfully",
          error: "",
          meta: "",
        };
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
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
  // update project
  async updateProject(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      const request_body = ctx.request.body;
      const project = await strapi.query("projects").findOne({ id: id });
      if (project) {
        const project_updated = await strapi.query("projects").update({ id: id }, request_body);
        if (project_updated) {
          ctx.response.status = 200;
          response = {
            status: "success",
            data: `Successfully updating ${project_updated.name}`,
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Project unvalaible",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "Project unvalaible",
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
  async projectStatistics(ctx) {
    let entities;
    let blue = "#369fff";
    let yellow = "#ffd143";
    let orange = "#ff993a";
    let green = "#8ac53e";
    if (ctx.query._q) {
      entities = await strapi.services.project.search(ctx.query);
    } else {
      const user_level = await getUserLevel(ctx.state.user.id);
      if (user_level.status) {
        let query = {};
        if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
          query = { client_id: user_level.data.client_info.id, progress_status: ["not_started", "ongoing", "onhold", "completed"], _limit: -1 }
        } else if (user_level.data.user_level === "level_1") {
          query = { progress_status: ["not_started", "ongoing", "onhold", "completed"], _limit: -1 }
        } else {
          query = { client_id: -1, progress_status: ["not_started", "ongoing", "onhold", "completed"], _limit: -1 }
        }
        entities = await strapi.query("projects").find(query);
      }
    }
    entities = _.map(entities, (w) => {
      w.start_timestamp = utils.toTimestamp(w.start_date);
      w.end_timestamp = utils.toTimestamp(w.end_date);
      w.current_timestamp = utils.getTimestampInSeconds();
      w.progress = ((w.end_timestamp - w.current_timestamp) * 100) / (w.end_timestamp - w.start_timestamp);
      if (w.progress <= 25) {
        w.backgroundColor = orange;
      } else if (w.progress > 25 && w.progress <= 50) {
        w.backgroundColor = yellow;
      } else if (w.progress > 50 && w.progress <= 75) {
        w.backgroundColor = green;
      } else if (w.progress > 75) {
        w.backgroundColor = blue;
      }
      return w;
    });
    return entities;
  },
  async getProjectsByUser(ctx) {
    let projects = [];
    var userLoggedIn = ctx.state.user;
    projects = await getProjectsByUserLoggedIn(userLoggedIn.id);
    return projects;
  },
  async getProjectsByClient(ctx) {
    let response;
    let user = ctx.state.user;
    const projects = await getClientProjectsId(user.id);
    if (projects.length > 0) {
      response = {
        status: "success",
        data: projects,
        error: "",
        meta: "",
      };
    } else {
      response = {
        status: "fail",
        data: [],
        error: "Not found!",
        meta: "",
      };
    }
    return response;
  },
  async getProjectList(ctx) {
    const user_level = await getUserLevel(ctx.state.user.id);
    let projects;
    if (user_level.status) {
      let query = {};
      if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
        query = { _limit: -1, client_id: user_level.data.client_info.id, progress_status: ["not_started", "ongoing", "onhold", "completed"], _sort: "id:DESC" }
      } else if (user_level.data.user_level === "level_1") {
        query = { _limit: -1, progress_status: ["not_started", "ongoing", "onhold", "completed"], _sort: "id:DESC" }
      } else {
        query = { _limit: -1, client_id: -1, progress_status: ["not_started", "ongoing", "onhold", "completed"], _sort: "id:DESC" }
      }
      projects = await strapi.query("projects").find(query);
      projects = _.map(projects, function (index) {
        return { id: index.id, name: index.name, address: index.address }
      })
    }
    return projects;
  },
  async getAllProject(ctx) {
    const response = {
      status_code: 200,
      status: "failed",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const user = ctx.state.user;
      const user_level = await getUserLevel(ctx.state.user.id);
      let client = "";
      if (user_level.status) {
        if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
          client = user_level.data.client_info.id
        } else if (user_level.data.user_level === "level_1") {
          client = "all";
        } else {
          client = -1;
        }
        const getcachedresults = await redisClient.get(`${utils.replaceSpacesWithUnderscores(process.env.COMPANY_TITLE)}-projects-${client}-${moment(new Date()).format("YYYY-MM-DD")}`);
        if (getcachedresults) {
          const parsed_projects = JSON.parse(getcachedresults);
          parsed_projects.data = parsed_projects.data.sort(utils.compareStatus);
          return parsed_projects;
        }
        const projects = await getUserProjects(user.id);
        let filteredProject = [];
        for (let index = 0; index < projects.length; index++) {
          const workforces = await getProjectWorkers(projects[index].id);
          const project_services = await strapi.query("rates").count({ project_id: projects[index].id });
          const role_supervisor = await strapi.query('role', 'users-permissions').findOne({ name: 'Supervisor' });
          let supervisor = [];
          if (role_supervisor) {
            supervisor = await getUsersSupervisors({ query: { projects: projects[index].id.toString(), role: `${role_supervisor.id}` }, ctx: ctx });
          }
          const project_suppliers = await getSupplierProjects(projects[index].id, true);
          const number_of_attendance_by_project = await strapi.query("new-attendance").count({ project_id: projects[index].id });

          filteredProject.push({
            id: projects[index].id,
            name: projects[index].name,
            status: projects[index].progress_status,
            project_profile_url: projects[index].project_profile_url,
            project_manager: "",
            address: projects[index].address,
            start_date: projects[index].start_date,
            end_date: projects[index].end_date,
            client: projects[index].client,
            supervisor: _.size(supervisor.data),
            workers: _.size(workforces),
            services: project_services,
            suppliers: _.size(project_suppliers),
            attendances: number_of_attendance_by_project
          });
        }
        const sorted_projects = filteredProject.sort(utils.compareStatus);
        response.status = "success";
        response.data = sorted_projects; 
        const ttlInSeconds = process.env.REDIS_KEY_EXPIRATION;
        await redisClient.set(`${utils.replaceSpacesWithUnderscores(process.env.COMPANY_TITLE)}-projects-${client}-${moment(new Date()).format("YYYY-MM-DD")}`, JSON.stringify(response));
        await redisClient.expire(`${utils.replaceSpacesWithUnderscores(process.env.COMPANY_TITLE)}-projects-${client}-${moment(new Date()).format("YYYY-MM-DD")}`, ttlInSeconds);
      }
    } catch (error) {
      console.log("error in getAllProject", error.message);
      response.errors = error.message;
    }
    return response;
  },
  async readProject(ctx) {
    const { id } = ctx.params;
    const response = {
      status_code: 200,
      status: "failed",
      data: {},
      errors: [],
      meta: [],
    };

    const services = await strapi.query("services").find({ _limit: -1 });
    const new_attendance = await strapi.query("new-attendance").findOne({ project_id: id, _sort: "date:desc" });
    const knex = strapi.connections.default;
    let project = {};
    const project_raw = `SELECT 
    p.id,
    p.name,
    p.address,
    p.description,
    p.start_date,
    p.end_date,
    p.project_profile_url,
    p.progress_status,
    pc.id AS client_id,
    pc.name AS client_name,
    GROUP_CONCAT(ps.shift_id) as shifts
    FROM projects As p
    LEFT JOIN projects__shifts as ps ON ps.project_id = p.id
    LEFT JOIN clients as pc ON p.client_id = pc.id
    WHERE p.id=${id} GROUP BY p.id`;
    const project_data = await knex.raw(project_raw);
    if (project_data) {
      project = project_data[0][0];
    }
    project = JSON.parse(JSON.stringify(project)); //Remove RowDataPacket
    if (project && services) {
      const company_manager = await getProjectCompanyManager(project.company_project_manager);
      const agreegates = await calculateProjectDashboardAgreegate(id);
      const project_rates = await strapi.query("rates").find({ project_id: id });
      let earnings = [];
      let rates = [];

      let client = {};
      if (project.client_id) {
        client = await strapi.query("clients").findOne({ id: project.client_id });
      }
      if (company_manager && agreegates && project_rates.length > 0) {
        response.status = "success";
        if (project.shifts && project.shifts.length > 0) {
          project.shifts = _.map(project.shifts.split(','), (i) => {
            return { id: parseInt(i) };
          });
        }
        rates = _.map(project_rates, (p) => {
          let service_obj = _.find(services, (ps) => { return parseInt(ps.id) === parseInt(p.service_id); });
          if (service_obj) {
            return { id: p.id, service: { id: service_obj.id, name: service_obj.name }, maximum_rate: p.maximum_rate }
          }
        });
        rates = _.filter(rates, r => r != null);

        earnings = _.map(project_rates, (p) => {
          const service_obj = _.find(services, (ps) => { return parseInt(ps.id) === parseInt(p.service_id); });
          if (service_obj) {
            return {
              id: p.id,
              service: { id: service_obj.id, name: service_obj.name },
              default_rate: p.default_rate,
              beginner_rate: p.beginner_rate,
              intermediate_rate: p.intermediate_rate,
              advanced_rate: p.advanced_rate
            }
          }
        });

        earnings = _.filter(earnings, (e) => { return e != null; });

        response.data = {
          info: {
            id: project.id,
            name: project.name,
            location: project.address,
            description: project.description,
            start_date: moment(project.start_date).format("YYYY-MM-DD"),
            end_date: moment(project.end_date).format("YYYY-MM-DD"),
            project_profile_url: project.project_profile_url,
            status: project.progress_status,
            last_attendance: new_attendance ? new_attendance.date : null,
            company_project_manager: company_manager,
            shifts: project.shifts,
            client: client
          },
          aggregation: {
            total_shifts: agreegates.totalShifts,
            total_day_shifts: agreegates.totalshiftDay,
            total_night_shifts: agreegates.totalshiftNight,
            total_active_workers: agreegates.totalactiveworkers,
            total_active_male_workers: agreegates.totalactiveMaleWorker,
            total_active_female_workers: agreegates.totalactiveFemaleWorker,
            total_invoices: agreegates.totalinvoices,
            total_paid_invoices: agreegates.totalpaidinvoices,
            total_unpaid_invoices: agreegates.totalunpaidinvoices,
            numberofunpaidinvoices: agreegates.numberofunpaidinvoices
          },
          rates: rates,
          earnings: earnings
        };
      } else {
        response.status = "success";
        response.data = {
          info: {
            id: project.id,
            name: project.name,
            location: project.address,
            description: project.description,
            start_date: moment(project.start_date).format("YYYY-MM-DD"),
            end_date: moment(project.end_date).format("YYYY-MM-DD"),
            project_profile_url: project.project_profile_url,
            status: project.progress_status,
            last_attendance: new_attendance ? new_attendance.date : null,
            company_project_manager: company_manager,
            shifts: project.shifts,
            client: client
          },
          aggregation: {
            total_shifts: agreegates.totalShifts,
            total_day_shifts: agreegates.totalshiftDay,
            total_night_shifts: agreegates.totalshiftNight,
            total_active_workers: agreegates.totalactiveworkers,
            total_active_male_workers: agreegates.totalactiveMaleWorker,
            total_active_female_workers: agreegates.totalactiveFemaleWorker,
            total_invoices: agreegates.totalinvoices,
            total_paid_invoices: agreegates.totalpaidinvoices,
            total_unpaid_invoices: agreegates.totalunpaidinvoices,
            numberofunpaidinvoices: agreegates.numberofunpaidinvoices
          },
          rates: rates,
          earnings: earnings
        };

      }
    }
    return response;
  },
  async createProjectRates(ctx) {
    const { id, type } = ctx.params;
    const response = {
      status: "failed",
      data: null,
      message: null,
      error: null,
      meta: null
    };
    let rules = {
      rates: "required"
    }
    let validation = new Validator(ctx.request.body, rules);
    if (!validation.passes()) {
      ctx.response.status = 400;
      response.data = validation.data;
      response.error = validation.failedRules;
      response.meta = validation.rules;
    } else {
      let payload = ctx.request.body.rates;
      if (type === "earnings") {
        let default_rates = await strapi.query("rates").find({ project_id: id });
        payload = _.map(payload, (index) => {
          index.default_rate = _.find(default_rates, (d) => { return parseInt(d.service_id) === parseInt(index.service_id) }).default_rate;
          return index;
        })
        let earning_greater_than_rate = _.find(payload, (p) => { return (p.default_rate < p.advanced_rate || p.default_rate < p.beginner_rate || p.default_rate < p.intermediate_rate); });
        if (earning_greater_than_rate) {
          ctx.response.status = 400;
          response.message = "Worker earnings cannot be higher than rates";
          return response;
        }
        let beginner_greater_than_intermediate = _.find(payload, (p) => { return p.intermediate_rate < p.beginner_rate; });
        if (beginner_greater_than_intermediate) {
          ctx.response.status = 400;
          response.message = "[Beginner] cannot have a rate higher than [Intermediate]";
          return response;
        }
        let intermediate_greater_than_advanced_rate = _.find(payload, (p) => { return p.advanced_rate < p.intermediate_rate; });
        if (intermediate_greater_than_advanced_rate) {
          ctx.response.status = 400;
          response.message = "[Intermediate] cannot have a rate higher than [Advanced]";
          return response;
        }
      }
      for (let i = 0; i < payload.length; i++) {
        payload[i].project_id = id;
        payload[i].beginner_rate = 0;
        payload[i].intermediate_rate = 0;
        payload[i].advanced_rate = 0;
        payload[i].default_rate = 0;
        payload[i].status = true;
        let projectRate = await strapi.query("rates").findOne({ project_id: id, service_id: payload[i].service_id });
        if (projectRate) {
          await strapi.query("rates").update({ id: projectRate.id }, payload[i]);
        } else {
          await strapi.query("rates").create(payload[i]);
        }
      }
      response.status = "success";
      response.data = payload;
    }
    return response;
  }
};

const getProjectCompanyManager = async (obj) => {
  let manager = { names: "", email: "", id: null };
  if (obj && obj.user_id) {
    let admin = await strapi.query("user", "admin").findOne({ id: parseInt(obj.user_id) });
    if (admin) {
      manager.id = admin.id;
      manager.admin_access_id = obj.id;
      manager.names = admin.firstname + " " + admin.lastname;
      manager.email = admin.email;
      manager.phone_number = admin.username;
    }
  } else if (obj) {
    let admin = await strapi.query("user", "admin").findOne({ id: obj });
    if (admin) {
      manager.id = admin.id;
      manager.admin_access_id = obj.id;
      manager.names = admin.firstname + " " + admin.lastname;
      manager.email = admin.email;
      manager.phone_number = admin.username;
    }
  }
  return manager;
};


const getProjectWorkers = async (id) => {
  let workforce = [];
  try {
    const created_updated_end = moment().format('YYYY-MM-DD');
    const created_updated_start = utils.getDateOneMonthAgo(created_updated_end);
    const knex = strapi.connections.default;
    const attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE project_id=${id}`);
    const shifts = attendancelists[0].map((entity) => {
      return {
        id: entity.id,
        shift_id: entity.shift_id,
        attendance_date: entity.attendance_date,
        service: entity.service,
        worker_id: entity.worker_id,
        gender: entity.gender,
        project_id: entity.project_id
      };
    });
    const filtered_shifts = shifts.filter(item => new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end));
    workforce = utils.removeDuplicatesByWorkerId(filtered_shifts);
  } catch (error) {
    console.log("Error in getProjectWorkers ", error.message)
  }
  return workforce;
};

const calculateProjectDashboardAgreegate = async (project_id) => {
  const answer = {
    totalShifts: 0,
    totalshiftDay: 0,
    totalshiftNight: 0,
    totalactiveworkers: 0,
    totalactiveMaleWorker: 0,
    totalactiveFemaleWorker: 0,
    totalinvoices: 0,
    totalpaidinvoices: 0,
    numberofunpaidinvoices: 0,
    totalunpaidinvoices: 0
  };

  let shifts = [];
  const knex = strapi.connections.default;
  const created_updated_end = moment().format('YYYY-MM-DD');
  const created_updated_start = utils.getDateOneMonthAgo(created_updated_end);

  const attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE project_id=${project_id}`);
  shifts = attendancelists[0].map((entity) => {
    return {
      id: entity.id,
      shift_id: entity.shift_id,
      attendance_date: entity.attendance_date,
      service: entity.service,
      worker_id: entity.worker_id,
      gender: entity.gender,
      project_id: entity.project_id
    };
  });
  const shift_in_range = shifts.filter(item => new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end));
  const totalactiveWorker  = utils.removeDuplicatesByWorkerId(shift_in_range);

  const invoices = await strapi.query("new-invoice").find({ project_id, status: ["paid", "unpaid"], _limit: -1 });
  const shiftTotalDay = _.size(_.filter(shifts, (shift) => parseInt(shift.shift_id) === 1));
  const shiftTotalNight = _.size(_.filter(shifts, (shift) => parseInt(shift.shift_id) === 2));
  const totalShifts = shiftTotalDay + shiftTotalNight;
  const totalactiveMaleWorker = _.size(_.filter(totalactiveWorker, (worker) => worker.gender?.toLowerCase() === "male"));
  const totalactiveFemaleWorker = _.size(_.filter(totalactiveWorker, (worker) => worker.gender?.toLowerCase() === "female"));
  const totalinvoices = _.reduce(invoices, (sum, item) => { return sum + parseInt(item.amount_due); }, 0);
  const totalpaidinvoices = _.reduce(_.filter(invoices, (i) => { return i.status === "paid" }), (sum, item) => { return sum + parseInt(item.amount_due); }, 0);
  const totalunpaidinvoices = _.reduce(_.filter(invoices, (i) => { return i.status === "unpaid" }), (sum, item) => { return sum + parseInt(item.amount_due); }, 0);
  const numberofunpaidinvoices = _.size(_.filter(invoices, (i) => { return i.status === "unpaid" }));

  answer.totalShifts = totalShifts;
  answer.totalshiftDay = shiftTotalDay;
  answer.totalshiftNight = shiftTotalNight;
  answer.totalactiveworkers = totalactiveWorker.length;
  answer.totalactiveMaleWorker = totalactiveMaleWorker;
  answer.totalactiveFemaleWorker = totalactiveFemaleWorker;
  answer.totalinvoices = totalinvoices;
  answer.totalpaidinvoices = totalpaidinvoices;
  answer.numberofunpaidinvoices = numberofunpaidinvoices;
  answer.totalunpaidinvoices = totalunpaidinvoices;
  return answer;
}
