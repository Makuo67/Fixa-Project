'use strict';

const { sanitizeEntity } = require('strapi-utils');
const { getAssignedWorkers,getAssignedWorkersKnex } = require("../services/assigned-workers");

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  // async find(ctx) {
  //   let serviceWorkers = [];
  //   // serviceWorkers =  await getAssignedWorkers(ctx);
  //   serviceWorkers= await getAssignedWorkersKnex();
  //   return serviceWorkers;
  //   // if (ctx.query._q) {
  //   //     serviceWorkers = await strapi.services['assigned-workers'].search(ctx.query);
  //   // } else {
  //   //     serviceWorkers = await strapi.services['assigned-workers'].find(ctx.query);
  //   // }

  //   // for(var i = 0; i < serviceWorkers.length; i++) {
  //   //     var worker = await strapi.services['service-providers'].findOne({id: serviceWorkers[i].worker_id});
  //   //     if(worker) {
  //   //         serviceWorkers[i]['services'] = worker.services;
  //   //     }
  //   // }

  //   // return serviceWorkers.map(serviceWorker => sanitizeEntity(serviceWorker, { model: strapi.models['assigned-workers'] }));
  //   serviceWorkers =  await getAssignedWorkers(ctx);
  //   serviceWorkers= await getAssignedWorkersKnex();
  //   return serviceWorkers;
  //   if (ctx.query._q) {
  //       serviceWorkers = await strapi.services['assigned-workers'].search(ctx.query);
  //   } else {
  //       serviceWorkers = await strapi.services['assigned-workers'].find(ctx.query);
  //   }

  //   for(var i = 0; i < serviceWorkers.length; i++) {
  //       var worker = await strapi.services['service-providers'].findOne({id: serviceWorkers[i].worker_id});
  //       if(worker) {
  //           serviceWorkers[i]['services'] = worker.services;
  //       }
  //   }

  //   return serviceWorkers.map(serviceWorker => sanitizeEntity(serviceWorker, { model: strapi.models['assigned-workers'] }));
  // }
};