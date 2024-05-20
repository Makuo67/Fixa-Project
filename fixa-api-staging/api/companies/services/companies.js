'use strict';
const SUPER_ADMIN_BACK_END_URL = process.env.SUPER_ADMIN_BACK_END_URL;
const PLATFORM_API_URL = process.env.PLATFORM_API_URL;
const axios = require("axios");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async updateCompanyStatus(status) {
        let response = false;
        let companies = await strapi.query("companies").find();
        if (companies.length > 0) {
            switch (status) {
                case 'is_staff_member':
                    await strapi.query("companies").update({ id: companies[0].id }, { "is_staff_members_added": true });
                    response = true;
                    break;
                case 'is_site_created':
                    await strapi.query("companies").update({ id: companies[0].id }, { "is_site_created": true });
                    response = true;
                    break;
                default:
                    break;
            }
        }
        return response;
    },

    async getCompanyStatus() {
        let response;
        let companies = await strapi.query("companies").find();
        if (companies.length > 0) {
            const payments = await strapi.query("payments").count();
            const attendances = await strapi.query("new-attendance").count();
            const workers = await strapi.query("service-providers").count();
            const is_payment_added = (payments && payments >= 1) ? true : false;
            const is_dashboard_available = (attendances && attendances >= 1) ? true : false;
            const is_workforce_added = (workers && workers >= 1) ? true : false;
            response = {
                company_name: companies[0].company_name,
                is_site_created: companies[0].is_site_created,
                is_staff_members_added: companies[0].is_staff_members_added,
                is_workforce_added: is_workforce_added,
                is_payment_added: is_payment_added,
                is_dashboard_available: is_dashboard_available,
                is_staffing: companies[0].is_staffing ?? false
            }
        } else {
            response = {
                company_name: "",
                is_site_created: false,
                is_staff_members_added: false,
                is_workforce_added: false,
                is_payment_added: false,
                is_dashboard_available: false,
                is_staffing: false
            }
        }
        return response;
    },

    async updateSuperAdminCompany(body) {
        const url = `${SUPER_ADMIN_BACK_END_URL}/companies`;
        const payload = { ...body, api: PLATFORM_API_URL };
        await axios.put(url, payload);
    }
};
