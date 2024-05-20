const utils = require("../../config/functions/utils");

module.exports = async (ctx, next) => {
    let user = ctx.state.user;
    const regex = /\/(.*?)\//; 
    let url = "";

    if(!user){
        return ctx.unauthorized(`Unauthorized`);
    }
    if(user.role && user.role.name.toString().toLowerCase() === 'supervisor'){
        return await next();
    }
    // console.log(ctx.request);
    if(!ctx.request.url){
        return ctx.unauthorized(`Unauthorized`);
    }
    
    if(ctx.request.url){
     url = utils.removeAfterLastSlash(ctx.request.url);
    }

    // get user_admin
    let user_access = await strapi.query("user-admin-access").findOne({ user_id: user.id });
    if(!user_access){
        return ctx.unauthorized(`Unauthorized`);
    }
     // get user_admin_access
    if (!user_access.user_access) {
      return ctx.unauthorized(`Unauthorized`);
    }
    // console.log('url ===>',url);

    if(ctx.request.method === 'GET'){
        if(url === "/projects" || url === "/projects/list" || url === "/projects/all" || url === "/projects/client/user" || url === "/app/projects" || url === "/projects/count") {
            let objSettings = utils.getAccess(user_access.user_access,"page","Project","","","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else if(url === "/user-admin-accesses/all_supervisors_users"){
            let objSettings = utils.getAccess(user_access.user_access,"page_entities","Settings","Supervisors","","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else if(url === "/rates" || url === "/rates/count"){
            let objSettings = utils.getAccess(user_access.user_access,"page_entities","Project","Trades","","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'POST'){
        if(url === "/projects" || url === "/projects/create-project" || url === "/projects/create-site"){
            let objSettings = utils.getAccess(user_access.user_access,"page_entities","Project","New project","","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else if(url === "/rates/many"){
            let objSettings = utils.getAccess(user_access.user_access,"page_entities_sub_entities","Project","Trades","","","Add new");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'PUT'){
        if(url === "/projects/update-project" || url === "/projects"){
            let objSettings = utils.getAccess(user_access.user_access,"page_entities","Project","Edit Project","","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else if(url === "/rates"){
            let objSettings = utils.getAccess(user_access.user_access,"page_entities_sub_entities","Project","Trades","","","Add new");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'DELETE'){
        if(url === "/rates"){
            let objSettings = utils.getAccess(user_access.user_access,"page_entities_sub_entities","Project","Trades","","","Delete");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else {
            return ctx.unauthorized(`Unauthorized`);
        }
    } else {
        return ctx.unauthorized(`Unauthorized`);
    }
    
    

    
}