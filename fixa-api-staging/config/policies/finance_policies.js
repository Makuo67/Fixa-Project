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
        if(url === "/payments" || url === "/payments/all_payments" || url === "/payments/count" || url === "/payments/deductions-summary" || url === "/payments/details" || url === "/payments/momo_verification" || url === "/payments/status" || url === "/payments/build/existing/payments") {
            let objSettings = utils.getAccess(user_access.user_access,"sub_page","Finance","","Payment","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }
        else if(url === "/payments/closing"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Finance","","Payment","Close Payment","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }

        } 
        else if(url === "/rra-taxes" || url === "/rra-taxes/count"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page","Finance","","Taxes","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else if(url === "/wallet-requests" || url === "/wallet-requests/count"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page","Finance","","Wallet","","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'POST'){
        if(url === "/otp-verifications/verify-otp-payment" || url === "/otp-verifications/create-otp-payment" || url === "/otp-verifications/verify-otp" || url === "/payments" || url === "/payments/payroll" || url === "/payments/payout-claim" || url === "/payments/payout" || url === "/payments/checking_status" || url ==="/payments/run" || url === "/payments/kremit/account/validation" || url === "/payments/kremit/transfer/found" || url==="/payments/kremit/transaction/status"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Finance","","Payment","New Payment","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else if(url === "/rra-taxes" || url === "/rra-taxes/generate-taxes" || url === "/rra-taxes/re-generate-taxes"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Finance","","Taxes","Generate","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else if(url === "/wallet-requests" || url === "/wallet-requests/create-request"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Finance","","Wallet","Wallet Request","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else if(url === "/wallet-requests/update-request"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Finance","","Wallet","Wallet Top up","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        } else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'PUT'){
        if(url === "/payments"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Finance","","Payment","New Payment","");
            if(objSettings && objSettings === true){
                return await next();
            }else {
                ctx.unauthorized(`Unauthorized`);
            }
        }else {
            return ctx.unauthorized(`Unauthorized`);
        }
    }else if(ctx.request.method === 'DELETE'){
        if(url === "/payments"){
            let objSettings = utils.getAccess(user_access.user_access,"sub_page_sub_page_entities","Finance","","Payment","Delete Payment","");
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