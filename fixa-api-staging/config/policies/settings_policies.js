const utils = require("../../config/functions/utils");

module.exports = async (ctx, next) => {
    let user = ctx.state.user;
    const regex = /\/(.*?)\//;
    let url = "";

    if (!user) {
        return ctx.unauthorized(`Unauthorized`);
    }
    if (user.role && user.role.name.toString().toLowerCase() === 'supervisor') {
        return await next();
    }
    // console.log(ctx.request);
    if (!ctx.request.url) {
        return ctx.unauthorized(`Unauthorized`);
    }

    if (ctx.request.url) {
        url = utils.removeAfterLastSlash(ctx.request.url);
    }

    // get user_admin
    let user_access = await strapi.query("user-admin-access").findOne({ user_id: user.id });
    if (!user_access) {
        return ctx.unauthorized(`Unauthorized`);
    }
    // get user_admin_access
    if (!user_access.user_access) {
        return ctx.unauthorized(`Unauthorized`);
    }
    // console.log('url ===>',url);

    if (ctx.request.method === 'GET') {
        if (url === "/user-admin-accesses/get-roles" || url === "/user-admin-accesses/count" || url === '/user-admin-accesses/all_users' || url === '/user-admin-accesses' || url === '/user-admin-accesses/') {
            let objSettings = utils.getAccess(user_access.user_access, "page_entities", "Settings", "Office Team", "", "", "");
            if (objSettings && objSettings === true) {
                return await next();
            } else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else if (url === "/user-admin-accesses/all_supervisors_users") {
            let objSettings = utils.getAccess(user_access.user_access, "page_entities", "Settings", "Supervisors", "", "", "");
            if (objSettings && objSettings === true) {
                return await next();
            } else {
                ctx.unauthorized(`Unauthorized`);
            }
        }
    } else if (ctx.request.method === 'POST') {
        if (url === "/user-admin-accesses/invite_staff_members" || url === "/user-admin-accesses/invite_user" || url === "/user-admin-accesses" || url === "/user-admin-accesses/onboarding_invite_staff_members") {
            let objSettings = utils.getAccess(user_access.user_access, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Invite office user");
            if (objSettings && objSettings === true) {
                return await next();
            } else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else if (url === "/user-admin-accesses/add_supervisor") {
            let objSettings = utils.getAccess(user_access.user_access, "page_entities_sub_entities", "Settings", "Supervisors", "", "", "Add New supervisor");
            if (objSettings && objSettings === true) {
                return await next();
            } else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else if (url === "/user-admin-accesses/remove_supervisor") {
            let objSettings = utils.getAccess(user_access.user_access, "page_entities_sub_entities", "Settings", "Supervisors", "", "", "Delete a supervisor");
            if (objSettings && objSettings === true) {
                return await next();
            } else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else {
            return ctx.unauthorized(`Unauthorized`);
        }
    } else if (ctx.request.method === 'PUT') {
        if (url === "/user-admin-accesses/edit_user" || url === "/user-admin-accesses/edit_user_access" || url === "/user-admin-accesses/edit_user_avatar") {
            let objSettings = utils.getAccess(user_access.user_access, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Edit office user");
            if (objSettings && objSettings === true) {
                return await next();
            } else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }




}