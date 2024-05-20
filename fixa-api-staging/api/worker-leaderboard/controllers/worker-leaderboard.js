'use strict';
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();
const { sanitizeEntity } = require("strapi-utils/lib");
const _ = require('underscore');
const moment = require("moment");
const { handleLeaderboardMetricDistCashe } = require("../services/worker-leaderboard");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getScore(ctx) {
        let response = {};
        try {
            const { metric, worker_id } = ctx.params;
            var score = 0
            switch (metric) {
                case "technical-skills":
                    score = await strapi.services['worker-leaderboard'].getTechnicalSkillsScore(worker_id);
                    response.score = score
                    break
                case "multiple-skills":
                    score = await strapi.services['worker-leaderboard'].getMultipleSkillsScore(worker_id);
                    response.score = score
                    break
                case "flexibility":
                    score = await strapi.services['worker-leaderboard'].getFlexibilityScore(worker_id);
                    response.score = score
                    break;
                case "kyc":
                    score = await strapi.services['worker-leaderboard'].getKYCScore(worker_id);
                    response.score = score
                    break;
                case "attendance":
                    score = await strapi.services['worker-leaderboard'].getAttendanceScore(worker_id);
                    response.score = score
                    break;
                default:
                    break;
            }


        } catch (error) {
            response.error = error.message
        }
        return response;
    },
    async calculateLeaderboardStreaks() {
        let response = {};
        try {
            response.result = await strapi.services['worker-leaderboard'].calculateLeaderboardStreaks();
            response.status = "success"
        } catch (error) {
            response.error = error.message
        }
        return response;
    },
    async getMetricDistribution(ctx) {
        let response = {};

        try {
            const allowed_metrics = ['total_score', 'flexibility_score', 'attendance_score', 'kyc_score', 'technical_score', 'multiple_skills_score'];
            const { metric } = ctx.params;

            if (!allowed_metrics.includes(metric)) {
                response.error = `metric ${metric} not allowed`
                response.allowed_metrics = allowed_metrics
                response.result = []
                return response;
            }

            const getcachedresults = await redisClient.get(`leaderboard-${metric}-${moment(new Date()).format("YYYY-MM-DD")}`);
            if (getcachedresults) {
                response.result = JSON.parse(getcachedresults);
                return response
            }
            const ttlInSeconds = process.env.REDIS_KEY_EXPIRATION;

            const leaderboards = await strapi.query('worker-leaderboard').find({ _limit: -1 })
            const score_distribution = leaderboards.map((entry) => ({
                value: entry[metric]
            }))

            await redisClient.set(`leaderboard-${metric}-${moment(new Date()).format("YYYY-MM-DD")}`, JSON.stringify(score_distribution))
            await redisClient.expire(`leaderboard-${metric}-${moment(new Date()).format("YYYY-MM-DD")}`, ttlInSeconds)

            response.result = score_distribution

            return response
        } catch (error) {
            console.error(error)
            return {}
        }
    },
    async createLeaderBoardEntry(ctx) {
        let response = {};
        try {
            const { worker_id } = ctx.params;
            response.result = await strapi.services['worker-leaderboard'].createWorkerLeaderBoardEntry(worker_id);
            response.status = "success"
        } catch (error) {
            response.error = error.message
        }
        return response;
    },
    async buildLeaderboard(ctx) {
        let response = {};
        try {
            const { worker_ids } = ctx.request.body;
            let result = strapi.services['worker-leaderboard'].buildLeaderboard(worker_ids);
            let response_result = ""
            if (Array.isArray(worker_ids)) {
                response_result = worker_ids.length
            } else {
                response_result = worker_ids
            }
            response.result = `Building leaderboard for ${response_result} workers`
            response.status = "success"
        } catch (error) {
            response.error = error.message
        }
        return response;
    },
    async getAggregates(ctx) {
        let response = {
            status: "",
            result: {
                active_workers: {
                    total: 0,
                    male: 0,
                    female: 0
                },
                workers_over_60: {
                    total: 0,
                    male: 0,
                    female: 0
                },
            }
        };
        try {

            const getcachedresults = await redisClient.get(`admin-workforce-leaderboard-aggregates-${moment(new Date()).format("YYYY-MM-DD")}`);
            if (getcachedresults) {
                return JSON.parse(getcachedresults);
            }
            const ttlInSeconds = process.env.REDIS_KEY_EXPIRATION;

            let workforce = await strapi.query("workforce").find({ _limit: -1 });
            let workforce_sanitized = workforce?.map((entity) => sanitizeEntity(entity, { model: strapi.models.workforce }));
            let active_workers = _.filter(workforce_sanitized, (d) => d.is_active === true);
            let total_active_male_worker = _.size(_.filter(active_workers, (worker) => worker.gender?.toLowerCase() === "male"));
            let total_active_female_worker = _.size(_.filter(active_workers, (worker) => worker.gender?.toLowerCase() === "female"));

            for (let i = 0; i < active_workers.length; i++) {
                const worker_id = active_workers[i].worker_id;
                const worker_entry = await strapi.query("service-providers").findOne({ id: worker_id });

                if (worker_entry) {
                    const current_date = new Date();
                    const birth_date = new Date(worker_entry.date_of_birth);
                    const age = current_date.getFullYear() - birth_date.getFullYear();

                    if (age > 60) {
                        response.result.workers_over_60.total += 1;
                        if (worker.gender?.toLowerCase() === "male") {
                            response.result.workers_over_60.male += 1;
                        } else if (worker.gender?.toLowerCase() === "female") {
                            response.result.workers_over_60.female += 1;
                        }
                    }
                }
            }

            response.status = "success";
            response.result.active_workers.total = _.size(active_workers);
            response.result.active_workers.male = total_active_male_worker;
            response.result.active_workers.female = total_active_female_worker;

            await redisClient.set(`admin-workforce-leaderboard-aggregates-${moment().format("YYYY-MM-DD")}`, JSON.stringify(response));
            await redisClient.expire(`admin-workforce-leaderboard-aggregates-${moment().format("YYYY-MM-DD")}`, ttlInSeconds);

        } catch (error) {
            response.error = error.message
        }
        return response;
    },

    async getWorkerScores(ctx) {
        let response = {};
        try {
            const { id } = ctx.params;
            // console.log('worker id:', id)
            // get worker id, filter that 
            const worker = await strapi.query('worker-leaderboard').findOne({ 'worker.id': parseInt(id) });

            if (worker) {
                // check anomalies
                let results_after_anomalies_check = await strapi.services['worker-leaderboard'].workerLeaderboardAnomalies(parseInt(id));

                response.result = {
                    id: results_after_anomalies_check.id,
                    streak: results_after_anomalies_check.streak,
                    total_score: results_after_anomalies_check.total_score,
                    total_score_difference: results_after_anomalies_check.total_score_difference,
                    flagged: results_after_anomalies_check.flagged,
                    flag_reason: results_after_anomalies_check.flagReasons,
                    ...constructScoresObj(results_after_anomalies_check)
                };
                response.status = "success";

                // update the score distribution metric if there is flag
                if (results_after_anomalies_check.flagged) {
                    handleLeaderboardMetricDistCashe();
                }

            } else {
                let new_worker_results = await strapi.services['worker-leaderboard'].createWorkerLeaderBoardEntry(id);
                // update the score distribution metric.
                if (new_worker_results) {
                    let results_after_anomalies_check = await strapi.services['worker-leaderboard'].workerLeaderboardAnomalies(parseInt(id));
                    await handleLeaderboardMetricDistCashe();
                    response.result = {
                        id: results_after_anomalies_check.id,
                        streak: results_after_anomalies_check.streak,
                        total_score: results_after_anomalies_check.total_score,
                        total_score_difference: results_after_anomalies_check.total_score_difference,
                        flagged: results_after_anomalies_check.flagged,
                        flag_reason: results_after_anomalies_check.flagReasons,
                        ...constructScoresObj(results_after_anomalies_check)
                    };
                } else {
                    response.result = {}
                    response.error = "No worker found!"
                }

                response.status = "success";
            }
        } catch (error) {
            response.result = [];
            response.error = "Error fetching worker scores";
            response.status = "error";
            console.log("Error in getWorkerScores() =====>:", error);
        }
        return response;
    },
    async getLeaderboard(ctx) {
        let response = {};
        try {
            let { _limit = 10, _start = 0, _sort, flagged } = ctx.query;
            // handle the limit issue
            let offset = '';
            if (_limit === "-1") { // if limit is -1, remove the LIMIT clause
                _limit = '';
            } else {
                _limit = `LIMIT ${_limit}`; // else, add the LIMIT clause
                offset = `OFFSET ${_start}`; // add OFFSET only when LIMIT is present

            }

            const filters = {
                _sort: _sort || 'total_score:DESC',
                flagged: flagged || false
                // _q: _q || ''
            };

            // strapi connections
            const knex = strapi.connections.default;
            // sql raw to fetch data from db
            let sql_raw = `
            SELECT 
                worker_leaderboards.id, 
                t2.id AS worker_id, t2.first_name, t2.last_name, t2.gender, t2.nid_number,t2.phone_number, t2.is_momo_verified_and_rssb_desc,
                t3.project_id, t3.names, t3.is_momo_verified_and_rssb, t3.is_phone_number_verified, t3.is_rssb_verified,
                worker_leaderboards.flexibility_score, 
                worker_leaderboards.attendance_score, 
                worker_leaderboards.kyc_score, 
                worker_leaderboards.technical_score, 
                worker_leaderboards.multiple_skills_score, 
                worker_leaderboards.total_score, 
                worker_leaderboards.streak, 
                worker_leaderboards.kyc_score_difference, 
                worker_leaderboards.technical_score_difference, 
                worker_leaderboards.multiple_skills_score_difference, 
                worker_leaderboards.total_score_difference, 
                worker_leaderboards.flexibility_score_difference, 
                worker_leaderboards.attendance_score_difference,
                worker_leaderboards.flagged,
                worker_leaderboards.flagReasons,
                worker_leaderboards.streak_difference
            FROM worker_leaderboards
            LEFT JOIN service_providers as t2 ON worker_leaderboards.worker = t2.id
            LEFT JOIN workforces as t3 ON t2.id = t3.worker_id
            WHERE worker_leaderboards.${filters._sort.split(':')[0]} > 0 
            AND worker_leaderboards.flagged = ${filters.flagged}
            ORDER BY ${filters._sort.split(':').map((item, index) => index === 0 ? item : item.toUpperCase()).join(' ')}
            ${_limit}
            ${offset} 
        `;
            // fetch from db
            const leaderboards = await knex.raw(sql_raw);
            // const leaderboards = await strapi.query('worker-leaderboard').find(filters);
            // count leaderboard without filters
            const leaderboard_count = await strapi.query('worker-leaderboard').count();
            response.result = leaderboards[0];
            response.meta = leaderboard_count;
            response.status = 200;
            response.message = "Success";
        } catch (error) {
            response.status = 500;
            response.meta = [];
            response.message = "Internal Server Error";
            response.error = error;
            console.error("Error in getLeaderboard() =====>:", error);
        }
        return response;
    },
};

const constructScoresObj = (worker_data) => {
    const scores = [];

    for (const key in worker_data) {
        if (key.endsWith("_score") && key !== "total_score") {
            const name = key.replace("_score", "");
            const differenceKey = `${name}_score_difference`;
            scores.push({
                score_name: name,
                score: worker_data[key],
                score_difference: worker_data[differenceKey]
            });
        }
    }

    return { scores };
}
