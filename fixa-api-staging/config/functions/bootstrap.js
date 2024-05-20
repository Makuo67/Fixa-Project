'use strict';
const socketIO = require('socket.io');
const _ = require("underscore");
const services = require('../ressources/services.json');
const countries = require('../ressources/countries.json');
const default_actions = require('../ressources/default_actions.json');
const provinces_districts_sectors = require('../ressources/provinces_districts_sectors.json');
const relationship = require('../ressources/relationship.json');
const kremit_banks = require('../ressources/kremit_banks.json');
const user_levels = require('../ressources/user_levels.json');
const EVENT_PUBLISHER = process.env.EVENT_PUBLISHER;
const redisService = require("../redis");
const redisClient = redisService.getClient();

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#bootstrap
 */
module.exports = async () => {
  createSockect();
  const default_configuration = await strapi.query("default-settings").findOne({ is_set: true });
  if (!default_configuration) {
    await cleanRedis();
    await seedDifferentConfiguration();
    await defaultAppAccess("Public");
    await defaultAppAccess("Supervisor");
  }
  const countries_in = await strapi.query("countries").findOne({ country_name: "Rwanda" });
  if (!countries_in) {
    await strapi.query("countries").createMany(countries);
  }
  global.all_workforces = await updateWorkforce(); // This is a global variable that has all workforces.
};

const createSockect = async () => {
  if (EVENT_PUBLISHER.toLowerCase() === 'socketio') {
    console.log('Running with socketio');
    const server = strapi.server;

    const io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ["GET", "POST"]
      },
      transports: ['websocket']
    });

    io.on('connection', (socket) => {
      console.log(`Socket ${socket.id} has connected`);

      strapi.io = io;

      socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} has disconnected`);
      });
    });
  }

};

const seedDifferentConfiguration = async () => {

  // ---------------------- users-levels ---------------------------- 
  let levels_in = await strapi.query("users-levels").find();
  levels_in = levels_in.map(i => i.name);
  const levels_in_default = ["level_1", "level_2"];
  for (let i = 0; i < levels_in_default.length; i++) {
    let is_in = levels_in.find(x => x.toLowerCase() === levels_in_default[i].toLowerCase());
    if (!is_in) {
      await strapi.query("users-levels").create({ name: levels_in_default[i] });
    }
  }

  // ---------------------- opt-verification-types ---------------------------- 
  let otp_types_in = await strapi.query("opt-verification-types").find();
  otp_types_in = otp_types_in.map(i => i.type_name);
  const otp_types_default = ["sms", "pay", "login", "external"];
  for (let i = 0; i < otp_types_default.length; i++) {
    let is_in = otp_types_in.find(x => x.toLowerCase() === otp_types_default[i].toLowerCase());
    if (!is_in) {
      await strapi.query("opt-verification-types").create({ type_name: otp_types_default[i] });
    }
  }

  // ---------------------- Payment type ---------------------------- 

  let payment_types_in = await strapi.query("payment-types").find();
  payment_types_in = payment_types_in.map(i => i.type_name);
  const payment_types_default = ["payroll", "payout"];
  for (let i = 0; i < payment_types_default.length; i++) {
    let is_in = payment_types_in.find(x => x.toLowerCase() === payment_types_default[i].toLowerCase());
    if (!is_in) {
      await strapi.query("payment-types").create({ type_name: payment_types_default[i] });
    }
  }

  // ---------------------- Titles ---------------------------- 

  let titles_in = await strapi.query("titles").find();
  titles_in = titles_in.map(i => i.title_name);
  const titles_default = ["Admin"];
  for (let i = 0; i < titles_default.length; i++) {
    let is_in = titles_in.find(x => x.toLowerCase() === titles_default[i].toLowerCase());
    if (!is_in) {
      await strapi.query("titles").create({ title_name: titles_default[i] });
    }
  }

  // ---------------------- industry-types ---------------------------- 

  let industry_types_in = await strapi.query("industry-types").findOne({ type_name: "construction" });
  if (!industry_types_in) {
    await strapi.query("industry-types").create({ type_name: "construction", status: true });
  }

  // ---------------------- Country ---------------------------- 

  await strapi.query("countries").createMany(countries);

  // ---------------------- relations ---------------------------- 

  await strapi.query("next-of-kin-relations").createMany(relationship);

  // ---------------------- Provinces ---------------------------- 

  let provinces_in = await strapi.query("province").find();
  provinces_in = provinces_in.map(i => i.name);
  const provinces_default = [
    { name: "Kigali Province", code: "kigali-province" },
    { name: "Eastern Province", code: "eastern-province" },
    { name: "Southern Province ", code: "southern-province" },
    { name: "Western Province", code: "western-province" },
    { name: "Northern Province", code: "northern-province" },
  ];
  const rwanda_id = await strapi.query("countries").findOne({ country_name: "Rwanda" });
  for (let i = 0; i < provinces_default.length; i++) {
    let is_in = provinces_in.find(x => x.toLowerCase() === provinces_default[i].name.toLowerCase());
    if (!is_in) {
      let res = await strapi.query("province").create({ name: provinces_default[i].name, code: provinces_default[i].code, country: rwanda_id.id });
      _.keys(provinces_districts_sectors[provinces_default[i].name]).map(async (i) => {
        try {
          let district = await strapi.query("district").findOne({ name: i, province: res.id });
          if (!district) {
            await strapi.query("district").create({ name: i, province: res.id, code: i.toLowerCase(), country: rwanda_id.id });
          }
        } catch (error) {
          console.log("Error caught", error);
        }
      });
    }
  }

  // ---------------------- Service ---------------------------- 

  let services_in = await strapi.query("services").find();
  services_in = services_in.map(i => i.name);
  const services_default = services;

  for (let i = 0; i < services_default.length; i++) {
    let is_in = services_in.find(x => x.toLowerCase() === services_default[i].name.toLowerCase());
    if (!is_in) {
      await strapi.query("services").create({ name: services_default[i].name, service_status: "on" });
    }
  }

  // ---------------------- shift ---------------------------- 

  let shift_in = await strapi.query("shifts").find();
  shift_in = shift_in.map(i => i.name);
  const shift_default = ["day", "night"];
  for (let i = 0; i < shift_default.length; i++) {
    let is_in = shift_in.find(x => x.toLowerCase() === shift_default[i].toLowerCase());
    if (!is_in) {
      await strapi.query("shifts").create({ name: shift_default[i] });
    }
  }

  // ---------------------- payment method ---------------------------- 

  let payment_method_in = await strapi.query("payment-methods").find();
  payment_method_in = payment_method_in.map(i => i.name);
  const payment_method_default = [{ name: "Mtn Mobile Money", code: "mtn" }, { name: "Airtel Money", code: "airtel" }, { name: "Kremit", code: "kremit" }];
  for (let i = 0; i < payment_method_default.length; i++) {
    let is_in = payment_method_in.find(x => x.toLowerCase() === payment_method_default[i].name.toLowerCase());
    if (!is_in) {
      let adjacents = [];
      if (payment_method_default[i].name === "Kremit") {
        adjacents = kremit_banks;
      }
      await strapi.query("payment-methods").create({ name: payment_method_default[i].name, is_active: 1, adjacents: adjacents, code_name: payment_method_default[i].code });
    }
  }

  // ---------------------- payee type ---------------------------- 

  let payee_type_in = await strapi.query("payees").find();
  payee_type_in = payee_type_in.map(i => i.payee_type);
  const payee_type_default = ["Worker", "Restaurant", "Payee"];
  for (let i = 0; i < payee_type_default.length; i++) {
    let is_in = payee_type_in.find(x => x.toLowerCase() === payee_type_default[i].toLowerCase());
    if (!is_in) {
      await strapi.query("payees").create({ payee_type: payee_type_default[i] });
    }
  }

  // ---------------------- Deduction type ---------------------------- 

  let deduction_type_in = await strapi.query("deduction-types").find();
  deduction_type_in = deduction_type_in.map((i) => {
    return { name: i.title, is_external: (i.is_external) ? 1 : 0, is_available: (i.is_available) ? 1 : 0 };
  });

  const deduction_type_default = [
    { name: "Food external", is_external: 1, is_available: 1 },
    { name: "Equipment/Tool external", is_external: 1, is_available: 1 },
    { name: "Food", is_external: 0, is_available: 1 },
    { name: "Equipment/Tool", is_external: 0, is_available: 1 }
  ];
  for (let i = 0; i < deduction_type_default.length; i++) {
    let is_in = deduction_type_in.find(x => {
      if ((x.toString() === deduction_type_default[i].toString())) {
        return x;
      }
    });
    if (!is_in) {
      await strapi.query("deduction-types").create({ title: deduction_type_default[i].name, is_external: deduction_type_default[i].is_external, is_available: deduction_type_default[i].is_available });
    }
  }

  // ---------------------- assessmentLevelOneConfiguration ---------------------------- 

  const find_assessments_level = await strapi.query("assessments").findOne({ level: 1 });
  const find_assessment_metrics = await strapi.query("assessment-metrics").find({ metric_name: ['Productivity/ Target Achieved/ Speed (0-100%)', 'Quality of the work (0-100%)'] });
  const find_assessment_questions = await strapi.query("assessment-questions").find({ question: ['Task completion and performance percentage', 'Quality percentage of the completed task'] });
  let metrics = _.filter(find_assessment_metrics, (m) => { return m.metric_name == 'Productivity/ Target Achieved/ Speed (0-100%)' || m.metric_name == 'Quality of the work (0-100%)'; });
  let questions = _.filter(find_assessment_questions, (m) => { return m.question == 'Task completion and performance percentage' || m.question == 'Quality percentage of the completed task'; });
  if (metrics.length != 2) {
    let metric_1 = _.find(metrics, (m) => { return m.metric_name == 'Productivity/ Target Achieved/ Speed (0-100%)'; });
    let metric_2 = _.find(metrics, (m) => { return m.metric_name == 'Quality of the work (0-100%)'; });
    if (!metric_1) {
      await strapi.query("assessment-metrics").create({ metric_name: 'Productivity/ Target Achieved/ Speed (0-100%)', is_available: true });
    }
    if (!metric_2) {
      await strapi.query("assessment-metrics").create({ metric_name: 'Quality of the work (0-100%)', is_available: true });
    }
  }
  if (questions.length != 2) {
    let questions_1 = _.find(questions, (m) => { return m.question == 'Task completion and performance percentage'; });
    let questions_2 = _.find(questions, (m) => { return m.question == 'Quality percentage of the completed task'; });
    if (!questions_1) {
      await strapi.query("assessment-questions").create({ question: 'Task completion and performance percentage', is_available: true });
    }
    if (!questions_2) {
      await strapi.query("assessment-questions").create({ question: 'Quality percentage of the completed task', is_available: true });
    }
  }
  if (!find_assessments_level) {
    let metrics = [{ "assessment_metrics": [1], "questions": [{ "question_description": 1 }], "is_available": true }, { "assessment_metrics": [2], "questions": [{ "question_description": 2 }], "is_available": true }];
    await strapi.query("assessments").create({ level: 1, is_available: true, metrics: metrics });
  }


  // ---------------------- User Admin Accesses ---------------------------- 

  let admin_title = await strapi.query("titles").findOne({ title_name: "Admin" });
  if (admin_title) {
    let admin_access = await strapi.query("user-admin-access").findOne({ user_id: 1 });
    if (!admin_access) {
      await strapi.query("user-admin-access").create({
        user_id: 1,
        payment_edit: true,
        payment_view: true,
        project_edit: true,
        project_view: true,
        settings_edit: true,
        settings_view: true,
        workforce_edit: true,
        workforce_view: true,
        attendance_edit: true,
        attendance_view: true,
        attendance_approve: true,
        title: admin_title.id
      });
    }
  }

  // ---------------------- Default-settings ---------------------------- 

  await strapi.query("default-settings").create({ is_set: true });
  console.log("🔌User Levels confing set");
  console.log("🔌Opt-verification-types confing set");
  console.log("🔌Payment type confing set");
  console.log("🔌Payment method confing set");
  console.log("🔌Title confing set");
  console.log("🔌Service confing set");
  console.log("🔌Shift confing set");
  console.log("🔌Deduction type confing set");
  console.log("🔌Assessment Level One confing set");
}

const defaultAppAccess = async (key) => {
  try {
    switch (key) {
      case 'Public':
        const Public = await strapi.query('role', 'users-permissions').findOne({ name: "Public" });
        const default_public_action = default_actions.public;
        if (Public) {
          let public_actions = _.filter(Public.permissions, (p) => {
            let find_action = _.find(default_public_action, (f) => {
              if ((p.controller === f.controller) && (p.action === f.action) && (p.type === f.type)) {
                return f;
              }
            });
            if (find_action) {
              return p;
            }
          });
          for (let i = 0; i < public_actions.length; i++) {
            await strapi.query('permission', 'users-permissions').update({ id: public_actions[i].id }, { enabled: true });
          }
        }
        break;
      case 'Supervisor':
        let supervisor_permissions = [];
        let Supervisor = await strapi.query('role', 'users-permissions').findOne({ name: "Supervisor" });
        if (!Supervisor) {
          let authenticated = await strapi.query('role', 'users-permissions').findOne({ name: "Authenticated" });
          if (authenticated) {
            let createdPermission = [];
            Supervisor = await strapi.query('role', 'users-permissions').create({ name: "Supervisor", type: "supervisors", description: "This is a role given to supervisors" });
            if (Supervisor) {
              authenticated.permissions = _.map(authenticated.permissions, (a) => {
                a.role = Supervisor.id;
                return a;
              });
              createdPermission = await strapi.query('permission', 'users-permissions').createMany(authenticated.permissions);
            }
            supervisor_permissions = createdPermission;
          }
        } else {
          supervisor_permissions = Supervisor.permissions;
        }
        const default_supervisor_action = default_actions.supervisor;
        let supervisor_actions = _.filter(supervisor_permissions, (p) => {
          let find_action = _.find(default_supervisor_action, (f) => {
            if ((p.controller === f.controller) && (p.action === f.action) && (p.type === f.type)) {
              return f;
            }
          });
          if (find_action) {
            return p;
          }
        });
        for (let i = 0; i < supervisor_actions.length; i++) {
          await strapi.query('permission', 'users-permissions').update({ id: supervisor_actions[i].id }, { enabled: true });
        }
      default:
        break;
    }
  } catch (error) {
    console.log("error in defaultAppAccess", error.message);
  }
}

const cleanRedis = async () => {
  await redisClient.flushDb();
  console.log("🔋Redis cleaned successfully.");
}

const updateWorkforce = async () => {
  const workforces = await strapi.query("workforce").find({ _limit: -1 });
  console.log("🔋Update workforce successfull.");
  return workforces;
}





