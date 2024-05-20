const { sanitizeEntity } = require('strapi-utils');
const moment = require('moment');
const _ = require('underscore');
const { getClientProjectsId } = require('../../projects/services/projects');

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services['client-users'].search(ctx.query);
    } else {
      entities = await strapi.services['client-users'].find(ctx.query);
    }

    const response = {
      status: 'success',
      data: [],
      errors: [],
      meta: []
    };

    response.data = entities.map((entity) => {
      const clientUser = sanitizeEntity(entity, { model: strapi.models['client-users'] });
      clientUser.date_added = moment(clientUser.created_at).format('YYYY-MM-DD');
      delete clientUser.created_at;
      delete clientUser.updated_at;
      delete clientUser.type;
      delete clientUser.dataset;
      return clientUser;
    });
    return response;
  },
  async getClientUser(ctx) {
    const { user_id } = ctx.params;
    const response = {
      status_code: 200,
      status: "failed",
      data: {},
      errors: [],
      meta: [],
    };
    try {
      let client = await strapi.query("client-users").findOne({ user_id });
      let client_projects = await getClientProjectsId(user_id, false);
      if (client) {
        let my_client = {
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          user_id: client.user_id,
          phone_number: client.phone_number,
          position_name: client.position_name,
          access: client.access,
          client: client.client_id,
          projects: _.map(client_projects, (index) => {
            return { id: index.id, name: index.name, address: index.address, progress_status: index.progress_status }
          })
        }
        response.status = "successful";
        response.data = my_client;
      }
    } catch (error) {
      console.log("error in getClientUser", error.message);
    }

    return response;
  }
};
