import { retriveAuthTokenFromLocalStorage } from "./auth";
import fixaAPI from "../helpers/api";
import queryString from "query-string"

export const fetchAllWorkForce = async (filters) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    if (filters) {
      if (filters === "?_limit=10&_start=0") {
        // console.log(
        //   "-----normal call all workforce with no filters::",
        //   filters
        // );
        const response = await fixaAPI.get(`workforce/list?_limit=-1`, {
          headers: { authorization },
        });
        return response.data.data;
      } else {
        // console.log("-----call with filters", filters);
        var lt = ""
        if (filters === '?') {
          lt = "?_limit=-1"
          // console.log("--lt---", lt)
        } else {
          lt = filters.replace("_limit=10", "_limit=-1");
          // console.log("--lt---", lt)
        }

        const response = await fixaAPI.get(`workforce/list${lt}`, {
          headers: { authorization },
        });
        return response.data.data;
      }
    } else {
      // console.log("---no filters applied whatsoever", typeof filters);
      const response = await fixaAPI.get(`workforce/list?_limit=-1`, {
        headers: { authorization },
      });
      return response.data.data;
    }
  } catch (error) {
    let message;
    message = error.message;
  }
};

export const buildExportList = async (query) => {
  let newQuery = query
  try {

    let query_string = "?" + queryString.stringify(newQuery, { encode: false });

    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(`/workforce/export` + query_string, {
      headers: { authorization },
    });
    return response.data.data;
  } catch (e) {
    console.log("Error in buildExportList():", e.message)
    return [];
  }
}

// export const getPhoneNumbers = async (workers, unselected) => {
//   const ph = [];
//   const phones = workers.map((worker) => worker.phone_number);

//   for (var i = 0; i < workers.length; i++) {
//     for (var j = 0; j < unselected.length; j++) {
//       if (workers[i].worker_id !== unselected) ph.push(workers[i].phone_number);
//     }
//   }

//   return phones;
// };

export const getPhoneNumbers = async (workers, selected) => {

  const getSelectedWorkers = workers.filter((worker) => {
    return selected.includes(worker.worker_id);
  })

  const phones = getSelectedWorkers.map((worker) => worker.phone_number);

  return phones;
};

export const getAbsentValues = async (arr1, arr2) => {
  let res = [];
  res = arr1.filter((el) => {
    return !arr2.find((obj) => {
      return el === obj;
    });
  });
  return res;
};

export const getWithoutUnselectedPhoneNumbers = async (
  workers,
  selected,
  allWorkers
) => {
  const not_selected = [];

  const ph = await getAbsentValues(workers, selected);

  return ph;
};

export const getDistrictsCode = (data, values) => {
  let district = []
  if (typeof values.district == 'object') {
    values.district.forEach(x => {
      district.push(data.find((item) => item.id == x || item.code == x).code)
    })
  } else {
    district.push(data.find((item) => item.code == values.district).code)
  }
  return district
}

export const getProvincesCode = (data, values) => {
  let province = []
  if (typeof values.province == 'object') {
    values.province.forEach(x => {
      province.push(data.find((item) => item.id == x || item.code == x).code)
    })
  } else {
    province.push(data.find((item) => item.code == values.province).code)
  }
  return province
}
