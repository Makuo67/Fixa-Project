'use strict';
let Validator = require('validatorjs');
const { getAllAssignedWorkersKnex, getProjectAssignedWorkersKnex, getWorker } = require("../../service-providers/services/service-providers");
const { getQuotationByService } = require("../../quotation/services/quotation");
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const { getProjectsByUserLoggedIn } = require("../../projects/services/projects");
const { updateWorker } = require("../services/new-assigned-workers");
const Format = require('response-format');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    // assign_bulk_worker
    async assignBulkWorkers(ctx) {
        let response;
        // workers to assign
        var data = ctx.request.body;
        for (let index = 0; index < data.length; index++) {
            //   check if worker exist on the same project_id
            let worker_check = await strapi.query("new-assigned-workers").findOne({ worker_id: data[index].worker_id, project_id: data[index].project_id });
            if (!worker_check) { // yes, worker exist
                // assigned_worker and rate
                let assign_worker = await strapi.query("new-assigned-workers").create({
                    "worker_id": data[index].worker_id,
                    "project_id": data[index].project_id,
                    "is_active": false,
                });
                // create for the worker
                if (assign_worker) {
                    var new_worker_rate = await create_worker_rate_bulk(assign_worker.id, data[index].service_id, data[index].worker_rate, data[index].project_id);
                    await strapi.query("new-assigned-workers").update({ id: assign_worker.id }, { worker_rate_id: new_worker_rate.id, is_active: false });

                }
            }
        }
        response = {
            status: "success",
            status_code: 201,
            data: "",
            error: "",
            meta: ""
        }
        return response;
    },

    async create(ctx) {
        let entity;
        let response;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.new - assigned - workers.create(data, { files });
        } else {
            let rules = {
                'worker_id': 'required|integer',
                'project_id': 'required|integer',
                'service_id': 'required|integer',
                'worker_rate': 'required|string'
            };
            //   validate data 
            let validation = new Validator(ctx.request.body, rules);
            if (validation.passes()) {
                var data = ctx.request.body;
                //   check if worker exist on the same project_id
                let worker_check = await strapi.query("new-assigned-workers").findOne({ worker_id: data.worker_id, project_id: data.project_id, _sort: "created_at:DESC" });
                if (worker_check) {
                    response = {
                        status: "failed",
                        status_code: 400,
                        data: "worker exist under this project",
                        error: "",
                        meta: ""
                    }
                } else {
                    // assigned_worker and rate
                    let assign_worker = await strapi.query("new-assigned-workers").create({
                        "worker_id": data.worker_id,
                        "project_id": data.project_id,
                        "is_active": false,
                    });
                    // create for the worker
                    if (assign_worker && assign_worker.id) {
                        var new_worker_rate = await create_worker_rate(assign_worker.id, data.service_id, data.worker_rate);
                        var new_worker_assigned = await strapi.query("new-assigned-workers").update({ id: assign_worker.id }, { worker_rate_id: new_worker_rate.id, is_active: false });
                        response = {
                            status: "success",
                            status_code: 201,
                            data: new_worker_assigned,
                            error: "",
                            meta: ""
                        }
                    } else {
                        response = {
                            status: "failed",
                            status_code: 400,
                            data: "we can't create a worker under this project",
                            error: "",
                            meta: ""
                        }
                    }
                }
            } else {
                response = {
                    status: "failed",
                    status_code: 400,
                    data: "all fields are required",
                    error: "",
                    meta: ""
                }
            }
        }
        return response;
    },

    // get all assigned workers
    async getAllAssignedWorkers(ctx) {
        let response;
        let projects = [];
        let workers_assigned = [];
        // get user projects
        var userLoggedIn = ctx.state.user;
        projects = await getProjectsByUserLoggedIn(userLoggedIn.id);

        if (projects && projects.length > 0) {
            let project_ids = projects.map((project) => project.project_id);
            workers_assigned = await getProjectAssignedWorkersKnex(project_ids);
            response = {
                status_code: 200,
                status: 'success',
                data: workers_assigned,
                errors: [],
                meta: []
            }
        }

        // if(project){
        // workers_assigned = await getProjectAssignedWorkersKnex();

        //     }
        // }else{
        //     response = {
        //         status_code: 401,
        //         status: 'not found',
        //         data: [],
        //         errors: [],
        //         meta: []
        //     }
        // }





        return response;
    },


    /**
     * Migrate all existing assigned workers to new db structure.
     *
     * @return {Object}
     */

    async migrateAssignedWorkers(ctx) {

        const response = {
            status_code: 200,
            status: 'success',
            data: [],
            errors: [],
            meta: []
        };

        try {
            /**
             * TO DO
             * 1. Migrate all the workers to assigned workers, active workers with valid project IDs, Inactive workers with project_id=0
             * 2. for all assigned workers assign them the quotation rates for now
             */

            const workers = await strapi.services['service-providers'].find({ _limit: -1 });

            for (var i = 0; i < workers.length; i++) {
                const newAssignedWorker = {
                    project_id: 0,
                    worker_id: workers[i].id,
                    is_active: false
                };
                const oldAssignedWorker = await strapi.services['assigned-workers'].findOne({ worker_id: workers[i].id });
                if (oldAssignedWorker) {
                    newAssignedWorker.project_id = oldAssignedWorker.project_id;
                    newAssignedWorker.is_active = oldAssignedWorker.status === 'active' ? true : false;
                }

                let createdAssignedWorker = await strapi.services['new-assigned-workers'].findOne({ worker_id: newAssignedWorker.worker_id, project_id: newAssignedWorker.project_id });
                if (!createdAssignedWorker) {
                    createdAssignedWorker = await strapi.services['new-assigned-workers'].create(newAssignedWorker);
                }
                if (createdAssignedWorker && createdAssignedWorker.id) {
                    /** Adding worker rate for assigned worker */

                    // Generating service from the existing worker entry. Selecting only one(the first one)
                    const serviceId = (workers[i].services && typeof workers[i].services === 'object' && workers[i].services[0]) ? workers[i].services[0].id : 0;
                    const workerRate = {
                        assigned_worker_id: createdAssignedWorker.id,
                        service_id: serviceId,
                        value: 0
                    };
                    const quotation = await strapi.services['quotation'].findOne({ project: createdAssignedWorker.project_id });
                    if (quotation) {
                        for (var y = 0; y < quotation.service.length; y++) {
                            // console.log('quotation service is ', quotation.service[y]);
                            // console.log('quotation service - service ', quotation.service[y].service);
                            // console.log('quotation service - service - id ', quotation.service[y].service.id);
                            if (quotation.service[y] && quotation.service[y].service && quotation.service[y].service.id) {
                                if (quotation.service[y].service.id === workerRate.service_id) {
                                    workerRate.value = quotation.service[y].daily_rate;
                                }
                            } else {
                                // console.log('no service found');
                                workerRate.value = 0;
                            }
                        }
                    }

                    let createdWorkerRate = await strapi.services['worker-rates'].findOne({ assigned_worker_id: createdAssignedWorker.id });

                    if (!createdWorkerRate) {
                        createdWorkerRate = await strapi.services['worker-rates'].create(workerRate);
                    } else {
                        createdWorkerRate = await strapi.services['worker-rates'].update({ id: createdWorkerRate.id }, workerRate);
                    }
                }
                console.log(`worker id :: ${workers[i].id}`);

            }

        } catch (error) {
            console.log('error happened in /new-assigned-workers/migrateAssignedWorkers() ', error);
            ctx.response.status_code = 500;
            response.status_code = 500;
            response.status = 'failure';
            response.errors.push(error);
        }

        return response;
    },

    async updateWorkerStatus(ctx) {
        let response;
        try {
            ctx.response.status = 200;
            response = Format.success("Starting updating worker status", []);
            updateWorker();
        } catch (error) {
            ctx.response.status = 500;
            console.log("error in updateWorkerStatus", error.message);
            response = Format.internalError(error.message, []);
        }
        return response;
    }
};

//   create worker rate
const create_worker_rate = async (assigned_worker_id, service_id, worker_rate) => {
    var assigned_worker_rate = {};
    let rate_type = "";
    if (!worker_rate || parseInt(worker_rate) === 0) {
        rate_type = 'standard';
    } else {
        rate_type = "negotiated";

    }
    var obj = {
        "assigned_worker_id": assigned_worker_id,
        "service_id": service_id,
        "rate_type": rate_type,
        "value": parseFloat(worker_rate)
    }
    // assign worker rate from params
    assigned_worker_rate = await strapi.query("worker-rates").create(obj);
    return assigned_worker_rate;
};

//   create worker rate
const create_worker_rate_bulk = async (assigned_worker_id, service_id, worker_rate, project_id) => {
    var assigned_worker_rate = {};
    let worker_rate_to_assign = 0;
    if (worker_rate && parseInt(worker_rate) > 0) {
        var obj = {
            "assigned_worker_id": assigned_worker_id,
            "service_id": service_id,
            "value": parseFloat(worker_rate)
        }
        // assign worker rate from params
        assigned_worker_rate = await strapi.query("worker-rates").create(obj);
    } else {
        // get service rate quotation
        const quotation = await strapi.services['quotation'].findOne({ project: project_id });
        if (quotation) {
            for (var y = 0; y < quotation.service.length; y++) {
                if (quotation.service[y].service.id === service_id) {
                    // console.log("inside loop ::",quotation.service[y].daily_rate);
                    worker_rate_to_assign = parseInt(quotation.service[y].daily_rate);
                }
            }
        }
        var obj = {
            "assigned_worker_id": assigned_worker_id,
            "service_id": service_id,
            "value": worker_rate_to_assign
        }
        // assign worker rate from params
        assigned_worker_rate = await strapi.query("worker-rates").create(obj);
    }

    return assigned_worker_rate;
};

