const _ = require('underscore');
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

module.exports = {
  /**
   * Triggered before after updating project.
   */
  lifecycles: {
    async afterCreate(result, params) {
      const id = result.id;
      const client_user = { id: params.client_project_manager };
      try {
        if (client_user && client_user.id && id) {
          let client = await strapi.query("client-users").findOne({ id: client_user.id });
          let projects_associated_to_client_user = _.map(client.client_projects, (index) => {
            return index.id;
          })
          let is_already_in = _.find(projects_associated_to_client_user, (p) => { return p === id });
          if (!is_already_in) {
            projects_associated_to_client_user.push(id);
            await strapi.query("client-users").update({ id: client_user.id }, { client_projects: projects_associated_to_client_user });
          }
        }

        // Add default services
        let saved_services = await strapi.query("services").find({ _limit: -1 });
        saved_services = saved_services.map((item) => {
          return { name: item.name, id: item.id };
        });
        await strapi.query("projects").update({ id: id }, { progress_status: "ongoing" });
        // Add default deduction types
        let default_deduction_types = await strapi.query("deduction-types").find();
        default_deduction_types = _.map(default_deduction_types, (deductions) => {
          return { "deduction-type_id": deductions.id, project_id: id }
        })
        if (default_deduction_types) {
          const knex = strapi.connections.default;
          await knex('projects__deduction_types').insert(default_deduction_types);
        }

      } catch (error) {
        console.log("lifecycles afterCreate error", error)
      }
      for await (const key of redisClient.scanIterator()) {
        redisClient.del(key, (err, reply) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Keys deleted:', reply);
          }
          redisClient.quit();
        });
      }
    },
    async afterUpdate(data, result, params) { //please don't delete result, the order is very important!!!!!!!!!
      const { id } = data;
      const client_user = { id: params.client_project_manager };
      try {
        if (client_user && client_user.id && id) {
          let client = await strapi.query("client-users").findOne({ id: client_user.id });
          let projects_associated_to_client_user = _.map(client.client_projects, (index) => {
            return index.id;
          });
          let is_already_in = _.find(projects_associated_to_client_user, (p) => { return p === id });
          if (!is_already_in) {
            projects_associated_to_client_user.push(id);
            await strapi.query("client-users").update({ id: client_user.id }, { client_projects: projects_associated_to_client_user });
          }
        }
      } catch (error) {
        console.log("lifecycles afterUpdate error", error)
      }
      for await (const key of redisClient.scanIterator()) {
        redisClient.del(key, (err, reply) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Keys deleted:', reply);
          }
          redisClient.quit();
        });
      }
    },
  },
};
