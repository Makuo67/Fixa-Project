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
        if(url === "/excel/generate" || url === "/service-providers" || url === "/workforce/list" || url === "/worker/web/info") {
            let objSettings = utils.getAccess(user_access.user_access,"page","Workforce","","","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else if(url === "/worker/app/working_history"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Workforce","","Workers","Work History","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'POST'){
        if(url === "/service-providers/get-nid-information" || url === "/service-providers/single-worker-registration"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Workforce","","Workers","Register workers","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else  if(url === "/worker/app/sms"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Workforce","","Workers","Send message","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'PUT'){
        if(url === "/app/service-providers" || url === "/service-providers/update-worker"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities_sub_entities","Workforce","","Workers","Details","Edit personal details");
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