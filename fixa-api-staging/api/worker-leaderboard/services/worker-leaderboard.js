'use strict';
const _ = require('underscore');
const moment = require("moment");
const axios = require('axios');
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();

const BUILD_LEADERBOARD_URL = process.env.BUILD_LEADERBOARD_URL;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async getMultipleSkillsScore(worker_id, worker_attendance_detail) {
    // Number of attendances tied to skills
    // more pts to ppl who worked many services
    // the assessments for each skill will be taken into consideration

    try {
      //defining the score weights
      let total_score = 0;

      if (worker_attendance_detail && worker_attendance_detail.length > 0) {
        const assessments_weights = 10;
        const services_weights = 5;
        const max_fixa_services = 5;
        let weighted_services_score = 0;
        let weighted_assessments_score = 0;

        const worker_assessments = await strapi.query('workers-assessments').find({
          worker_id: worker_id
        });

        if (worker_assessments && worker_assessments.length > 0) {
          const assessments_score = worker_assessments.reduce((acc, item) => acc + item.mean_score / 100, 0);
          weighted_assessments_score = assessments_weights * (assessments_score / worker_assessments.length);

        }

        const uniqueKeys = [...new Set(worker_attendance_detail.map(item => item.service_id))];
        if (uniqueKeys && uniqueKeys.length > 0) {
          const total_worker_services = uniqueKeys.length;
          // get weighted services score
          if (total_worker_services < max_fixa_services) {
            weighted_services_score = services_weights * (total_worker_services / max_fixa_services);
          } else {
            weighted_services_score = services_weights;
          }
        }
        total_score = (((weighted_assessments_score + weighted_services_score) / (assessments_weights + services_weights)) * 100).toFixed(2);
        // console.log("total_score ===>", total_score)
        // console.log(`Multiple skills Score is === ${total_score}`);
      }

      return total_score;
    } catch (error) {
      console.log(error)
      return 0;
    }
  },
  async getAttendanceScore(worker_attendance_detail) {
    try {
      let attended = 0;
      // past two weeks from now
      const past_two_weeks_from_now = moment().subtract(14, 'days');

      if (worker_attendance_detail && worker_attendance_detail.length > 0) {
        // attendance details in past 2 weeks
        const worker_attendance_detail_past_two_weeks = worker_attendance_detail.filter(
          item => moment(item.date).isAfter(past_two_weeks_from_now)
            && moment(item.date).isBefore(moment()))

        attended = worker_attendance_detail_past_two_weeks.length;
      }

      const ratio = attended / 14;

      // console.log(`Attended === ${attended},Ratio === ${ratio}`);
      // console.log(`Attendance Score for ${worker_id} is === ${(ratio * 100).toFixed(2)}`);
      return (ratio * 100).toFixed(2);

    } catch (error) {
      console.log("ERROR in getAttendanceScore() func ===", error)
      return 0
    }
  },
  async getTechnicalSkillsScore(worker_id) {
    /* 
     * This will deal with Worker Technical Skills: from worker-assessments
     */
    try {
      const workerAssessment = await strapi.query("workers-assessments").findOne({ worker_id });

      if (!workerAssessment || workerAssessment.mean_score === "") {
        return 0;
      }

      return workerAssessment.mean_score;
    } catch (error) {
      console.log("ERROR in getTechnicalSkillsScore() func ===>", error)
      return 0;
    }
  },
  async calculateStandardDeviation(values) {
    // console.log("values ====>", values)
    if (!Array.isArray(values) || values.some(isNaN)) {
      // throw new Error('Invalid input: values must be an array of numbers');
      return 0;
    }
    const mean = values.reduce((total, value) => total + value, 0) / values.length;

    const squared_differences = values.map((value) => Math.pow(value - mean, 2));
    const mean_squared_differences = squared_differences.reduce((total, diff) => total + diff, 0) / squared_differences.length;
    const standard_deviation = Math.sqrt(mean_squared_differences);


    // Z-score normalization
    // const normalizedStandardDeviation = standard_deviation / Math.abs(mean);
    // console.log(`Result normalizedStandardDeviation: ${normalizedStandardDeviation}, Standard dev === ${standard_deviation}`);
    return parseFloat(standard_deviation.toFixed(2));
  },
  async getFlexibilityScore(worker_attendance_detail) {
    /**
     * This will deal with Worker Employment History: 
     * Look into the worker's employment history, including past attendance, variations in earnings, and variations of services. 
     * This helps assess the worker's stability and reliability.
     */
    try {
      let earningsScore = 0.0;

      /* Calculate standard deviation for worker payment history,  
      A higher standard deviation indicates greater variations in earnings. */

      if (worker_attendance_detail && worker_attendance_detail.length > 0) {
        const earnings = worker_attendance_detail.map((attendance) => attendance.value);
        const std_earnings = await this.calculateStandardDeviation(earnings)

        // console.log("std_earnings ===>", std_earnings)
        earningsScore += parseFloat((std_earnings / 100).toFixed(2));
      }

      const fixaProjects = await strapi.query("projects").count({ _limit: -1 });
      const fixa_services = await strapi.query('services').count({ service_status: 'on' });

      // points for changing projects
      const total_worker_projects = _.chain(worker_attendance_detail)
        .groupBy("project_id")
        .size()
        .value()
      const projectsScore = normalizer(total_worker_projects, fixaProjects);

      // points for changing services
      const total_worker_services = _.chain(worker_attendance_detail)
        .groupBy("service_id")
        .size()
        .value()
      const serviceScore = normalizer(total_worker_services, fixa_services);

      // points for changing shifts
      const fixaShifts = await strapi.query("shifts").count({ _limit: -1 });
      const worker_shifts = _.chain(worker_attendance_detail)
        .groupBy("shift_id")
        .size()
        .value()
      const shiftsScore = normalizer(worker_shifts, fixaShifts);

      // points for changing locations
      let locationScore = 0.0;
      // if (attendance && worker_info) {
      //   const addressArray = attendance.map(item => item.address);
      //   locationScore = projectsLocationScore(addressArray);
      // }

      /* Adding weight to the flexibility score contributors
      Priority: 10
      Les priority but Important: 5
      */
      const flexibility_weight = {
        earnings_weight: 10,
        projects_weight: 5,
        services_weight: 10,
        shifts_weight: 10,
        // location_weight: 5
      }
      const total_flexibility_weight = Object.values(flexibility_weight).reduce((a, b) => a + b, 0);

      const total_score =
        ((flexibility_weight.earnings_weight * earningsScore +
          flexibility_weight.projects_weight * projectsScore +
          flexibility_weight.services_weight * serviceScore +
          flexibility_weight.shifts_weight * shiftsScore) / total_flexibility_weight).toFixed(2);

      // console.log(`Flexibility Score is === ${total_score}`);
      return total_score;

    } catch (error) {
      console.log("Error at getFlexibilityScore func ==>", error)
      return 0
    }
  },
  async getKYCScore(worker_id) {
    /**
     * KYC: Know Your Customer, personal information about a worker,
     * Such as names, date of birth, rssb_code, address, contact details. 
     * This information helps verify the worker's identity. 
     *  */

    try {
      const worker_profile = await strapi.query("service-providers").findOne({ id: worker_id });

      const points = {
        is_momo_verified_and_rssb: {
          green: 20,
          blue: 10,
          red: 0
        },
        is_rssb_verified: {
          green: 10,
          nothing: 0,
        },
        date_of_birth: 15,
        gender: 10,
        district: 5,
      };

      const basic_points = Object.keys(points).reduce((acc, key) => {
        if (key === 'is_rssb_verified') {
          if (worker_profile[key] === 'green') {
            acc[key] = points[key].green;
          } else {
            acc[key] = points[key].nothing;
          }
        } else if (key === 'is_momo_verified_and_rssb') {
          if (worker_profile[key] === 'green') {
            acc[key] = points[key].green;
          } else if (worker_profile[key] === 'blue') {
            acc[key] = points[key].blue;
          } else {
            acc[key] = points[key].red;
          }
        } else if (key === 'date_of_birth' || key === 'gender' || key === 'district' || key === 'rssb_code') {
          acc[key] = worker_profile[key] ? points[key] : 0;
        } else {
          acc[key] = 0;
        }
        return acc;
      }, {});

      // const basic_points = Object.keys(points).reduce((acc, key) => {
      //   console.log("worker_profile[key] ====>", worker_profile[key])
      //   acc[key] = (worker_profile[key] !== undefined && worker_profile[key] !== '' && worker_profile[key] !== "0" && worker_profile[key] !== null && worker_profile !== '-') ? points[key] : 0;
      //   return acc;
      // }, {});
      const rwandanMaxPoints = Object.keys(points).reduce((acc, key) => {
        if (typeof points[key] === 'object') {
          const max = Math.max(...Object.values(points[key]));
          acc[key] = max;
        } else {
          acc[key] = points[key];
        }
        return acc;
      }, {});

      const foreignerMaxPoints = Object.keys(points).reduce((acc, key) => {
        if (key === 'is_momo_verified_and_rssb') {
          acc[key] = points[key].blue;
        } else if (key !== 'is_rssb_verified' && typeof points[key] === 'object') {
          const max = Math.max(...Object.values(points[key]));
          acc[key] = max;
        } else if (key !== 'is_rssb_verified') {
          acc[key] = points[key];
        }
        return acc;
      }, {});

      const rwandanMax = Object.values(rwandanMaxPoints).reduce((a, b) => a + b, 0);
      const foreignerMax = Object.values(foreignerMaxPoints).reduce((a, b) => a + b, 0);
      let total_score = 0;
      // BUG: What if the nid is empty but the worker has been verified, the score exceed 100%
      if (worker_profile.nid_number && worker_profile.nid_number !== null && worker_profile.nid_number.length === 16) {
        // for rwandans
        total_score = (Object.values(basic_points).reduce((acc, score) => acc + score, 0) / rwandanMax).toFixed(2) * 100;
      } else {
        // foregners
        total_score = (Object.values(basic_points).reduce((acc, score) => acc + score, 0) / foreignerMax).toFixed(2) * 100;
      }
      // console.log(`WORKER Profile for ${worker_id} is == ${JSON.stringify(worker_profile, null, 2)}`);
      // console.log(`KYC Score for ${worker_id} is == ${total_score}`);
      return total_score;
    } catch (error) {

      console.log("Error at getKYCScore func ==>", error)
      return 0
    }
  },
  async getStreakCount(worker_id) {
    try {
      return 0
    } catch (error) {
      console.log(error)
      return 0
    }
  },
  async getTotalWeightedScore(metrics) {
    try {
      const multiple_skills_weight = 0.3;
      const flexibility_weight = 0.2;
      const attendance_weight = 0.2;
      const kyc_weight = 0.1;
      const technical_skills_weight = 0.2;

      const total_score =
        (metrics.multiple_skills_score * multiple_skills_weight +
          metrics.flexibility_score * flexibility_weight +
          metrics.kyc_score * kyc_weight +
          metrics.technical_score * technical_skills_weight +
          metrics.attendance_score * attendance_weight).toFixed(2);

      return total_score
    } catch (error) {
      console.log(error)
      return 0
    }
  },
  // async calculateLeaderboardStreaks() {
  //   const leaderboards = await strapi.query('worker-leaderboard').find({ _limit: 3, _sort: 'total_score:DESC' })
  //   const result = {
  //     first: null,
  //     second: null,
  //     third: null,
  //   }
  //   result.first = await this.calculateLeaderboardStreak(leaderboards[0])
  //   result.second = await this.calculateLeaderboardStreak(leaderboards[1])
  //   result.third = await this.calculateLeaderboardStreak(leaderboards[2])
  //   return result
  // },
  async calculateLeaderboardStreaks() {

    // if (leaderboard.total_score_difference >= 0) {
    //     await strapi.query('worker-leaderboard').update(
    //       { id: leaderboard.id },
    //       {
    //         streak: leaderboard.streak + 1,
    //         streak_difference: 1,
    //       }
    //     );
    // } else {
    //   await strapi.query('worker-leaderboard').update(
    //     { id: leaderboard.id },
    //     {
    //       streak: 1,
    //       streak_difference: -1,
    //     }
    //   );
    // }
    const leaderboards = await strapi.query('worker-leaderboard').find({ _limit: -1, _sort: 'total_score:DESC' })

    let longest_streak = 0
    let previous_total_score = null
    let previous_streak = null

    for (let i = 0; i < leaderboards.length; i++) {

      const current_worker = leaderboards[i]
      const current_total_score = current_worker.total_score
      const current_streak_difference = current_worker.streak - previous_streak

      let current_streak = current_worker.streak

      if (previous_total_score === null || current_total_score >= previous_total_score) {
        current_streak++
      } else {
        current_streak = 1
      }

      if (current_streak > longest_streak) {
        longest_streak = current_streak
      }

      await strapi.query('worker-leaderboard').update(
        { id: current_worker.id },
        {
          streak: current_streak,
          streak_difference: current_streak_difference,
        }
      );

      previous_total_score = current_total_score
      previous_streak = current_streak
    }

    return longest_streak
  },


  /**
   * Creates or updates the leaderboard entry for a given worker
  */
  async createWorkerLeaderBoardEntry(worker_id) {
    try {
      console.log(`***** Started Building Leaderboard for worker with ID ${worker_id} *****`);
      // TODO: call universal func
      //TODO: refactor this to be in a func
      // calculate standard deviation for worker payment history,  A higher standard deviation indicates greater variations in earnings.
      let assigned_worker = await strapi.query("new-assigned-workers").find({ worker_id: worker_id, _limit: -1 });

      let worker_assigned_ids = [];
      if (assigned_worker.length === 0) {
        worker_assigned_ids = []
      } else {
        worker_assigned_ids = assigned_worker.map((itmx) => itmx.id);
      }

      let worker_attendance_detail = [];

      if (worker_assigned_ids.length !== 0) {
        worker_attendance_detail = await getWorkerInformations(worker_assigned_ids);
        // console.log("worker_attendance_detail ====> ", worker_attendance_detail)
      } else {
        console.log("No worker assigned found for worker_id ==>", worker_id);
        // continue
        return;
      }
      //TODO: END of refactor this to be in a func

      const data = {
        worker: worker_id,

        multiple_skills_score: await this.getMultipleSkillsScore(worker_id, worker_attendance_detail),
        multiple_skills_score_difference: 100,

        flexibility_score: await this.getFlexibilityScore(worker_attendance_detail),
        flexibility_score_difference: 100,

        attendance_score: await this.getAttendanceScore(worker_attendance_detail),
        attendance_score_difference: 100,

        kyc_score: await this.getKYCScore(worker_id),
        kyc_score_difference: 100,

        technical_score: await this.getTechnicalSkillsScore(worker_id),
        technical_score_difference: 100,

        total_score: null,
        total_score_difference: 100,
        flagged: false,
        flagReasons: []
      };

      // if worker exists, calculate the score differences from previous entry
      const existingEntry = await strapi.query('worker-leaderboard').findOne({ worker: worker_id });

      if (existingEntry) {
        data.multiple_skills_score_difference =
          existingEntry.multiple_skills_score === 0 || existingEntry.technical_score === null
            ? data.multiple_skills_score
            : ((data.multiple_skills_score - existingEntry.multiple_skills_score) /
              existingEntry.multiple_skills_score) *
            100;

        data.flexibility_score_difference =
          existingEntry.flexibility_score === 0 || existingEntry.technical_score === null
            ? data.flexibility_score
            : ((data.flexibility_score - existingEntry.flexibility_score) /
              existingEntry.flexibility_score) *
            100;

        data.attendance_score_difference =
          existingEntry.attendance_score === 0 || existingEntry.technical_score === null
            ? data.attendance_score
            : ((data.attendance_score - existingEntry.attendance_score) /
              existingEntry.attendance_score) *
            100;

        data.kyc_score_difference =
          existingEntry.kyc_score === 0 || existingEntry.technical_score === null
            ? data.kyc_score
            : ((data.kyc_score - existingEntry.kyc_score) / existingEntry.kyc_score) * 100;

        data.technical_score_difference =
          existingEntry.technical_score === 0 || existingEntry.technical_score === null
            ? data.technical_score
            : ((data.technical_score - existingEntry.technical_score) / existingEntry.technical_score) * 100;
      }

      data.total_score = await this.getTotalWeightedScore(data)

      if (existingEntry) {
        data.total_score_difference =
          existingEntry.total_score === 0
            ? data.total_score
            : ((data.total_score - existingEntry.total_score) / existingEntry.total_score) * 100;

        console.log("🏅 Finished Leaderboard for existing worker ==", worker_id, "score of ", data.total_score);
        return await strapi.query('worker-leaderboard').update({ id: existingEntry.id }, data);
      } else {
        console.log("🎖Finished Leaderboard for new worker ==", worker_id, "Score of ", data.total_score);
        return await strapi.query('worker-leaderboard').create(data);
      }
    } catch (error) {
      console.error(error);
      return -1;
    }
  },
  /**
   * Build the leaderboard for given workers
   */
  async buildLeaderboard(worker_ids) {
    const knex = strapi.connections.default;
    let num_entries = 0;

    if (typeof worker_ids === 'string' && worker_ids.toLowerCase() === 'all_workers') {
      const allWorkersIds = await knex.raw('SELECT id FROM service_providers ORDER BY id DESC');
      const resultArray = allWorkersIds[0].map(entry => entry.id);
      // start the build
      for (let i = 0; i < resultArray.length; i++) {
        await this.createWorkerLeaderBoardEntry(resultArray[i]).then(async (res) => {
          if (res === -1) {
            console.log("Error creating entry for worker ==>", resultArray[i]);
          }
          else {
            await this.workerLeaderboardAnomalies(resultArray[i])
          }
          num_entries += 1
        })
      }
      // update score distribution
      await this.handleLeaderboardMetricDistCashe();
    }

    if (typeof worker_ids === 'string' && worker_ids.toLowerCase() === 'existing_leaderboard') {
      // const existingWorkers = await strapi.query("worker-leaderboard").find({ _limit: -1 })
      // using knex instead
      const existingLeaderboard = await knex.raw('SELECT worker FROM worker_leaderboards');
      const resultArray = existingLeaderboard[0].map(entry => entry.worker);
      // start build
      for (let i = 0; i < resultArray.length; i++) {
        await this.createWorkerLeaderBoardEntry(resultArray[i]).then(async (res) => {
          if (res === -1) {
            console.log("Error creating entry for worker ==>", resultArray[i]);
          }
          else {
            await this.workerLeaderboardAnomalies(resultArray[i]);
          }
          num_entries += 1
        })
      }
      // update score distribution
      await this.handleLeaderboardMetricDistCashe();
    }

    // Checking if input is array.
    if (Array.isArray(worker_ids)) {
      for (let i = 0; i < worker_ids.length; i++) {
        await this.createWorkerLeaderBoardEntry(worker_ids[i]).then(async (res) => {
          if (res === -1) {
            console.log("Error creating entry for worker ==>", worker_ids[i]);
          }
          else {
            await this.workerLeaderboardAnomalies(worker_ids[i]);
          }
          num_entries += 1
        })
      }
      // update score distribution
      await this.handleLeaderboardMetricDistCashe();
    }

    console.log(`Build entries for ${num_entries} workers`);
  },

  async leaderboardBuild(workers_to_build) {
    // Function to build the leaderboard whenever needed.
    // workers_to_build: array of worker ids, or string 'all_workers' or 'existing_leaderboard'
    // eg: workers_to_build: [5990, ...]

    let response = {};
    try {
      let data_response = await buildWorkerLeaderboard(
        BUILD_LEADERBOARD_URL,
        workers_to_build
      );
      response = {
        status: "success",
        message: "Building Leaderboard",
      };
    } catch (error) {
      response = {
        status: "failed",
        message: error.message,
      };
    }
    return response;
  },
  /**
 * @returns {Promise<void>} - A promise that resolves when the metric distribution is updated.
 */
  async handleLeaderboardMetricDistCashe() {
    try {
      const metrics_names = ['total_score', 'flexibility_score', 'attendance_score', 'kyc_score', 'technical_score', 'multiple_skills_score'];
      const ttlInSeconds = process.env.REDIS_KEY_EXPIRATION;
      const leaderboards = await strapi.query('worker-leaderboard').find({ _limit: -1, flagged: false });

      if (!leaderboards) {
        console.log("No leaderboard entries found");
        return;
      }

      for (let index = 0; index < metrics_names.length; index++) {
        const metric = metrics_names[index];
        // filtering the scores that are greater than 0.
        const score_distribution = leaderboards.map((entry) => ({
          value: entry[metric]
        })).filter((item => item.value > 0));

        await redisClient.set(`leaderboard-${metric}-${moment(new Date()).format("YYYY-MM-DD")}`, JSON.stringify(score_distribution))
        await redisClient.expire(`leaderboard-${metric}-${moment(new Date()).format("YYYY-MM-DD")}`, ttlInSeconds)
      }

      // update score distribution
      console.log("💽 Updated Leaderboard metric distribution");
    } catch (error) {
      console.error("Error in updating Leaderboard metric distribution == ", error);
    }
  },
  /**
   * Flags a worker in the leaderboard based on their data.
   * Flexibility threshold (100) is derived from Standard deviation of fixa services, 
   * and the total max of flexibility score, close to 60.
   * @param {number} worker_id - The ID of the worker (workers table) to flag.
   * @returns {Object} - An object containing flag status and reasons.
   */
  async workerLeaderboardAnomalies(worker_id) {
    const anomaliesThreshold = {
      flexibility_score: 100
    }

    let result = {
      flag: false,
      reasons: []
    }

    let updatedResults = null;

    const worker = await strapi.query('worker-leaderboard').find({ worker: worker_id });
    if (worker && worker !== null && worker.length > 0) {
      // Flexibility anomaly
      if (worker[0].flexibility_score >= anomaliesThreshold.flexibility_score) {
        result.flag = true;
        result.reasons.push("High flexibility score than threshold.")
      }
      updatedResults = await strapi.query('worker-leaderboard').update(
        { id: worker[0].id },
        {
          flagged: result.flag,
          flagReasons: result.reasons
        }
      );
    }

    return updatedResults;
  }
};

async function buildWorkerLeaderboard(build_url, worker_to_build) {
  try {
    let body = {
      worker_ids: worker_to_build,
    };
    let response = await axios.post(build_url, body, {
      headers: {
        "Content-Length": 0,
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });
  } catch (err) {
    console.log("axios error", err.code);
  }
}

const projectsLocationScore = (projects_locations) => {
  /**
   *  @params projects_locations: array
     * func that receives the worker attendancelist
     *  - Iterate through the list comparing the addresses, award points if the current address is different from a previous iterated address.
     *  - IF there is no worker address just return 0 and break; before starting the loop.
     *  - IF the string is "-" or null, just skip it.
     *  - IF the project address is the same as the previous one we don't award points.
  */
  if (!Array.isArray(projects_locations) || projects_locations.length === 0) {
    return 0; // Handle empty or undefined array
  }

  let score = 0;
  let previousLocation = null;

  for (let i = 0; i < projects_locations.length; i++) {
    const currentLocation = projects_locations[i];
    if (!currentLocation || currentLocation === "-") {
      continue; // Skip null or "-"
    }

    if (currentLocation !== previousLocation) {
      score += 1; // Increment score if addresses are different
    }

    previousLocation = currentLocation;
  }
  return score;

}

const normalizer = (value, max) => {
  if (!value) return 0;
  return (value / max).toFixed(2);
}

async function getWorkerInformations(assigned_worker_ids) {
  const knex = strapi.connections.default;
  let response_data = [];
  let sql_raw = `SELECT
    t1.worker_service_id AS service_id,
    t2.shift_id,
    t2.project_id, 
    t3.value,
    t2.date
    FROM attendance_details AS t1
    LEFT JOIN new_attendances AS t2 ON t1.attendance_id = t2.id
    LEFT JOIN worker_rates AS t3 on t1.worker_rate_id = t3.id
    WHERE t1.assigned_worker_id IN (${assigned_worker_ids})
    ORDER BY t2.date DESC
    `;
  let data = await knex.raw(sql_raw);
  response_data = data[0];
  return response_data;
}
