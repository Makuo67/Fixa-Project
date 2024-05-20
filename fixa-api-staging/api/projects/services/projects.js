'use strict';
const _ = require('underscore');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async getProjectsByUserLoggedIn(user_id) {
        let projects = [];
        let user_projects = [];
        projects = await strapi.query("projects").find({ _limit: -1 });
        if (projects) {
            let services = await strapi.query("services").find({ _limit: -1 });
            for (let index = 0; index < projects.length; index++) {
                if (checkUser(projects[index], user_id)) {
                    let project_rates = await strapi.query("rates").find({ project_id: projects[index].id });
                    let rates = _.map(project_rates, (p) => {
                        let service_obj = _.find(services, (ps) => { return parseInt(ps.id) === parseInt(p.service_id); });
                        if (service_obj) {
                            return { id: service_obj.id, name: service_obj.name, maximum_rate: p.maximum_rate ? p.maximum_rate : 0 };
                        }
                    });
                    rates = _.filter(rates, (r) => { return r != null; });
                    user_projects.push({
                        project_id: projects[index].id,
                        project_name: projects[index].name,
                        project_descritpion: projects[index].description,
                        project_profile_url: projects[index].project_profile_url,
                        company_id: projects[index].client_id ? projects[index].client_id.id : 0,
                        company_name: projects[index].client_id ? projects[index].client_id.name : "",
                        services: rates,

                    });
                }
            }
        }
        return user_projects;
    },
    async getClientProjectsId(userID, id_only = true) {
        let user = await strapi.query("client-users").findOne({ user_id: userID });
        if (!user) return []
        if (user.access == "admin") {
            const client = await strapi.query("clients").findOne({ id: user.client_id.id });
            return id_only ? _.pluck(client.projects, "id") : client.projects;
        }
        return id_only ? _.pluck(user.client_projects, "id") : user.client_projects;
    },
    // get office team user project based on level and client
    async getUserProjects(user_id) {
        let projects = [];
        const knex = strapi.connections.default;
        const users_levels = await strapi.query("users-levels").find();
        const user_admin = await strapi.query("user-admin-access").findOne({ user_id: user_id });
        if (user_admin) {
            const user_level = users_levels.find(level => {
                if (level.id.toString() === user_admin.user_level_id?.toString()) {
                    return level;
                }
            });
            if (user_level && user_level.name.toString().toLowerCase() === 'level_1') {
                const projects_raw = `SELECT t1.id, t1.name, t1.progress_status, t1.project_profile_url, t1.address, t1.description, t1.start_date, t1.end_date, t2.id AS client_id, t2.name AS client_name FROM projects AS t1 LEFT JOIN clients AS t2 ON t1.client_id = t2.id ORDER BY id desc`;
                const projects_data = await knex.raw(projects_raw);
                if (projects_data) {
                    projects = projects_data[0];
                }
                let data_projects = JSON.parse(JSON.stringify(projects));
                data_projects = data_projects.filter((item) => item.progress_status !== "hidden");
                const project_response = data_projects.map((item) => {
                    let client = {};
                    if (item.client_id) {
                        client = { id: item.client_id, name: item.client_name }
                    }
                    return { ...item, client: client };
                });
                projects = project_response;
            } else if (user_level && user_level.name.toString().toLowerCase() === 'level_2') {
                if (user_admin.client) {
                    const projects_raw = `SELECT t1.id, t1.name, t1.progress_status, t1.project_profile_url, t1.address, t1.description, t1.start_date, t1.end_date, t2.id AS client_id, t2.name AS client_name FROM projects AS t1 LEFT JOIN clients AS t2 ON t1.client_id = t2.id WHERE client_id = ${user_admin.client.id} ORDER BY id desc`;
                    const projects_data = await knex.raw(projects_raw);
                    if (projects_data) {
                        projects = projects_data[0];
                    }
                    let data_projects = JSON.parse(JSON.stringify(projects));
                    data_projects = data_projects.filter((item) => item.progress_status !== "hidden");
                    const project_response = data_projects.map((item) => {
                        let client = {};
                        if (item.client_id) {
                            client = { id: item.client_id, name: item.client_name }
                        }
                        return { ...item, client: client };
                    });
                    projects = project_response;
                }
            }
        }
        return projects;
    },
    async getSupplierProjects(project_id, for_count) {
        let available_payees = [];
        const payees = await strapi.query("payee-names").find({ _limit: -1, isActive: true });
        const knex = strapi.connections.default;
        const sql_query = `SELECT * FROM projects__payee_names WHERE project_id='${project_id}'`;
        const sql_raw_executed = await knex.raw(sql_query);
        const project_payees = sql_raw_executed[0];
        if (for_count) {
            if (project_payees.length >= 1) {
                available_payees = payees.map((item) => {
                    return { id: item.id, name: item.names, phone: item.phone_number, email: item.email, payee_type_id: item.payee_type_id, isActive: item.isActive }
                });
                available_payees = available_payees.filter((item) => {
                    return project_payees.find(x => x['payee-name_id'] === item.id);
                });
            }
        } else {
            if (project_payees.length >= 1) {
                available_payees = payees.map((item) => {
                    return { id: item.id, name: item.names, phone: item.phone_number, email: item.email, payee_type_id: item.payee_type_id, isActive: item.isActive }
                });
                available_payees = available_payees.filter((item) => {
                    return !(project_payees.find(x => x['payee-name_id'] === item.id));
                });
            } else {
                available_payees = payees.map((item) => {
                    return { id: item.id, name: item.names, phone: item.phone_number, email: item.email, payee_type_id: item.payee_type_id, isActive: item.isActive }
                });
            }
        }
        return available_payees;
    },
};

// check if job contains current loggin_user
const checkUser = (projects, user_id) => {
    let found = false;
    for (var i = 0; i < projects.supervisors.length; i++) {
        if (projects.supervisors[i].id == user_id) {
            found = true;
            break;
        }
    }
    return found;
}