'use strict';

const _ = require('lodash');
const _u = require('underscore');

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');


/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

/**
 * Assigns workers to jobs
 * 
 * @param {*} job_id 
 * @param {*} workers 
 * @returns 
 */
const createEntry = async (job_id, workers) => {
  try {

    const existing_workers = await strapi
      .query('assigned-workers')
      .find({ job_id: job_id });


    var new_workers = workers;

    if (new_workers.length == 0) {
      return;
    }
    for (let i = new_workers.length - 1; i >= 0; i--) {
      const worker = await strapi
        .query('service-providers')
        .findOne({ id: new_workers[i] });

      const assigned_worker_exist = await strapi
        .query('assigned-workers')
        .findOne({ job_id: job_id, worker_id: new_workers[i] });



      if (assigned_worker_exist) {

        continue;
      }
      const assignWorker = await strapi.query('assigned-workers').create({
        job_id: job_id,
        worker_id: worker.id,
        worker_first_name: worker.first_name,
        worker_last_name: worker.last_name,
        worker_phone_number: worker.phone_number,
      });
    }


  } catch (error) {
    console.log('Error caught createEntry()', error);
  }
};

const updateSupervisorsOfAJob = async (existingJob, job_id, supervisorIds) => {
  try {
    // console.log('about to update supervisors');
    var existingSupervisorIds = existingJob.supervisors.length !== 0 ? existingJob.supervisors.map((supervisor) => {
      return supervisor.id;
    }) : [];

    if (existingSupervisorIds.length !== 0) {
      for (var i = 0; i < existingSupervisorIds.length; i++) {
        for (var y = 0; y < supervisorIds.length; y++) {
          if (existingSupervisorIds[i] !== supervisorIds[y]) {
            existingSupervisorIds.unshift(supervisorIds[y]);
          }
        }
      }
    }

    // console.log('supervisors to assign ', existingSupervisorIds);

    //await strapi.services.jobs.update({ id: job_id }, {supervisors: existingSupervisorIds});
    // console.log('assigning supervisors');
  } catch (err) {
    console.log('Error happened in updateSupervisorsOfAJob()', err)
  }
}

module.exports = {
  async update(ctx) {
    try {

      const { id } = ctx.params;


      const { supervisors } = ctx.request.body;

      var supervisorIds = supervisors || [];

      // console.log('I am reaching here');
      // console.log(JSON.stringify(ctx.params));

      let inyange_job;

      inyange_job = await strapi.query('jobs').findOne({ id });

      createEntry(inyange_job.id, ctx.request.body.workers);

      // if(supervisorIds.length !== 0){
      //   updateSupervisorsOfAJob(inyange_job, id, supervisorIds);
      // }

      return id;
    } catch (error) {
      console.log('error caught job update(ctx)', error);
    }
  },
  
  async apphome(ctx) {
    try {
      var userLoggedIn =ctx.state.user;
      var responseData = [];
      let jobs = await strapi.services.jobs.find(ctx.query);
        
      // check if job contains current loggin_user
      function  checkUser(jobsItems) {
        let found = false;
        for (var i = 0; i < jobsItems.supervisors.length; i++){
          if(jobsItems.supervisors[i].id == userLoggedIn.id){
           
            found = true;
            break;
          }
        }
        return found;
        }
      if (typeof jobs === "object" && jobs.length !== 0) {
        for (var i = 0; i < jobs.length; i++) {
          if(checkUser(jobs[i])){
            responseData.push({
              id: jobs[i].id,
              title: jobs[i].title,
              services: jobs[i].services,
              company_id: jobs[i].company.id,
              project_id: jobs[i].project_id
            });
          }
         
        }
      }

      /**
       * TO DO:
       * 1. IN-MEMORY CACHE
       */

      return responseData;
    } catch (err) {
      console.log('Error happened in apphome()', err);
    }
  },
  async find(ctx) {
    let jobs;
    if (ctx.query._q) {
      jobs = await strapi.services.jobs.search(ctx.query);
    } else {
      jobs = await strapi.services.jobs.find(ctx.query);
    }

    // if(typeof jobs === "object" && jobs.length !== 0) {
    //   for(var i = 0; i < jobs.length; i++) {
    //     const assignedWorkers = await strapi
    //       .query('assigned-workers')
    //       .find({ _limit: -1, job_id: jobs[i].id });
    //   console.log('assigned worker findMany()', assignedWorkers.length);
    //   if(assignedWorkers.length !== 0) {
    //     jobs[i].workers = assignedWorkers;
    //     for(var y = 0; y < jobs[i].workers.length; y++) {
    //       const { worker_id, worker_first_name, worker_last_name, worker_phone_number, job_id } = jobs[i].workers[y];

    //       var updatedJobObject = {
    //         id: worker_id,
    //         first_name: worker_first_name,
    //         last_name: worker_last_name,
    //         phone_number: worker_phone_number,
    //         job_id
    //       };
    //       jobs[i].workers[y] = updatedJobObject;
    //     }
    //   }
    //   }
    // }

    var data = jobs.map(jobs => sanitizeEntity(jobs, { model: strapi.models.jobs }));
    return data;
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    const job = await strapi.services.jobs.findOne({ id });

    const assigned_workers = await strapi
      .query('assigned-workers')
      .find({ _limit: -1, job_id: id });
    // console.log('assigned worker find()', assigned_workers.length);

    if (assigned_workers.length !== 0) {
      job.workers = assigned_workers;
      for (var i = 0; i < job.workers.length; i++) {
        var { job_id, worker_id, worker_first_name, worker_last_name, worker_phone_number } = job.workers[i];
        var updatedWorkerObject = {
          id: worker_id,
          first_name: worker_first_name,
          last_name: worker_last_name,
          job_id,
          phone_number: worker_phone_number
        };
        job.workers[i] = updatedWorkerObject;
      }
    }
    return sanitizeEntity(job, { model: strapi.models.jobs });
  },
  // async find(ctx) {
  //   console.log('content find(ctx)===>', ctx)

  //   const { data, meta } = await super.find(ctx);
  //   console.log('content meta find(ctx)===>', meta);

  //   /**
  //    * Get assigned worker
  //    * Change assigned workers properties to match what's expected by the mobile app
  //    */

  //   // const assigned_workers = await strapi
  //   //   .query('assigned-workers')
  //   //   .find({ job_id: data.id });

  //   return { data, meta };
  // },
};
