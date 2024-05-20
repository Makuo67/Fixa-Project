import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api";
// import queryString from "query-string";

/*  ====== GET leaderboard list ====== */
export const getWorkerLeaderboard = async (query) => {
  try {
    // let query_string = queryString.stringify(newQuery, { encode: false });
    // console.log("Query ==>", query);

    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/api/v1/worker-leaderboards?_limit=-1&flagged=false` + query,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e.message);
  }
};

/*  ====== GET leaderboard distribution ====== */
export const getMetricDistribution = async (metric) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/worker-leaderboards/get-distribution/` + metric,
      {
        headers: { authorization },
      }
    );
    return response.data.result;
  } catch (e) {
    console.log(e.message);
  }
};

/*  ====== GET leaderboard aggregates ====== */
export const getLeaderboardAggregates = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/worker-leaderboards/get-aggregates`,
      {
        headers: { authorization },
      }
    );
    return response.data.result;
  } catch (e) {
    console.log(e.message);
  }
};
/*  ====== GET worker leaderboard score ====== */
export const getWorkerLeaderboardScore = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/api/v1/worker-leaderboards/${id}`,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e.message);
  }
};
