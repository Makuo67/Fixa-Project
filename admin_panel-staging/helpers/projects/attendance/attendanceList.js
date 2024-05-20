import { get, set } from 'idb-keyval';
import fixaApi from '../../api';
import queryString from "query-string"
import { retriveAuthTokenFromLocalStorage, getLoggedUserData, retriveUserDataFromLocalStorage } from '../../auth';

/* =================== BUILD ATTENDANCE AGGREGATES =============== */
export const buildCardData = (data) => {
    let cardData = [];
    for (let i = 0; i < Object.keys(data).length; i++) {
        let json_data = {};
        json_data['title'] = Object.keys(data)[i];
        json_data['numbers'] = Object.values(data)[i];
        cardData.push(json_data);
    }

    return cardData;
};

export const buildColumns = (antdColumns) => {
    let headers = [];
    for (let index = 0; index < antdColumns.length; index++) {
        let json_data = {};
        json_data['label'] = String(antdColumns[index]).toUpperCase();
        json_data['key'] = antdColumns[index];
        headers.push(json_data);
    }
    return headers;
}

/* ================= DATA CLEANING ================= */
export const cleanDatafn = (data) => {
    /**
     * The function cleans the data, it does it by going through the passed data
     *  and replace the null properties into a dash "-"
     * @params data array of objects
     * @output array of objects
     */
    const cleanData = [];

    for (let index = 0; index < data.length; index++) {
        let tempJson = {};
        let element = data[index];

        for (let property in element) {
            if (element[property] === null) {

                tempJson[property] = "-"
            } else {

                tempJson[property] = element[property];
            }
        }
        cleanData.push(tempJson);
    }
    return cleanData;
}

/* =================== GET ATTENDANCE =============== */
export const fetchAsyncAttendance =
    async (date, project_id, shift, gender, service) => {
        let shiftParams = `${shift.toLowerCase()}=1`

        let newQ = { gender, service }
        if (!gender) delete newQ.gender
        if (!service) delete newQ.service

        try {
            let authorization = await retriveAuthTokenFromLocalStorage();
            const query_string = queryString.stringify(newQ, { encode: false }).length > 1 ? "&" + queryString.stringify(newQ, { encode: false }) : '';

            const response = await fixaApi.get(`attendancelists?attendance_date=${date}&project_id=${project_id}&${shiftParams}&_limit=-1` + query_string,
                {
                    headers: { authorization },
                }
            );
            set("attendance_list", response?.data);
            return response.data;

        } catch (error) {
            let message;
            message = error.message;
            console.log('ERROR IN GETTING ATTENDANCE =====> ', message)
        }
    }
/* =================== GET ATTENDANCE AGGREGATES =============== */
export const fetchAsyncAggregates = async (date, project_id, shift, id, gender, service) => {
        let shiftParams = `${shift.toLowerCase()}=1`
        let data = [];

        let newQ = { gender, service }
        if (!gender) delete newQ.gender
        if (!service) delete newQ.service
        try {
            let authorization = await retriveAuthTokenFromLocalStorage();
            const query_string = queryString.stringify(newQ, { encode: false }).length > 1 ? "&" + queryString.stringify(newQ, { encode: false }) : '';

            const response = await fixaApi.get(`app/attendancelists/aggregate?attendance_id=${id}&_limit=-1` + query_string,
                {
                    headers: { authorization },
                }
            );
            //Transform the aggregate for the cards.
            data = buildCardData(response.data?.data);
            return data;

        } catch (error) {
            let message;
            return data;
            message = error.message;
            console.log('ERROR IN GETTING ATTENDANCE AGGREGATES =====> ', message)
        }
    }

/* =================== GET ATTENDANCE COUNT =============== */
export const getTotalAttendance = async (date, project_id, shift, gender, service) => {
    let responses = [];
    let shiftParams = `${shift.toLowerCase()}=1`
    let newQ = { gender, service }
    if (!gender) delete newQ.gender
    if (!service) delete newQ.service

    try {
        const token = await retriveAuthTokenFromLocalStorage();
        const authorization = `Bearer ${token}`;
        const query_string = queryString.stringify(newQ, { encode: false }).length > 1 ? "&" + queryString.stringify(newQ, { encode: false }) : '';
        responses = await fixaApi.get(`attendancelists/count?attendance_date=${date}&project_id=${project_id}&${shiftParams}` + query_string, { headers: { authorization } });
        return responses?.data;
    } catch (err) {
        console.log('ERROR in counting', err);
        return responses;
    }
}

/* =================== APPROVE AND DECLINE ATTENDANCE =============== */
export const attendanceAction = async (attendance_payload, user, decline, comment) => {
    let responses = '';
    // try {
    //     user = await retriveUserDataFromLocalStorage();
    //     approved_by = user?.id;
    //     // put this in try and catch block
    // } catch (error) {
    //     let message = error.message;
    //     console.log('ERROR IN APPROVING OR DECLINING ATTENDANCE =====> ', message)
    // }
    //ID of logged user
    let approvePayload = {
        "attendance_id": attendance_payload?.attendance_id,
        "status": attendance_payload?.status,
        "approved_by": user?.id,
        "type": "routine",
        "approved_by_name": user?.firstname + " " + user?.lastname,
        "approved_time": Date.now(),
    }

    let declinePayload = {
        "attendance_id": attendance_payload?.attendance_id,
        "status": attendance_payload?.status,
        "approved_by": user?.id,
        "type": "routine",
        "comment": `${comment}`,
        "approved_by_name": user?.firstname + " " + user?.lastname,
        "approved_time": Date.now(),
    }

    if (decline) {

        try {
            let authorization = await retriveAuthTokenFromLocalStorage();

            responses = await fixaApi.put(`attendance-statuses/app/${attendance_payload?.attendance_status_id}`,
                declinePayload,
                { headers: { authorization } }
            );
            return responses.data?.status;
        } catch (err) {
            responses = err.code
            return responses;
        }
    } else {

        try {
            let authorization = await retriveAuthTokenFromLocalStorage();
            responses = await fixaApi.put(`attendance-statuses/app/${attendance_payload?.attendance_status_id}`,
                approvePayload,
                { headers: { authorization } }
            );
            return responses.data?.status;
        } catch (err) {
            responses = err.code
            return responses;
        }
    }

}

/* =================== GET ATTENDANCE STATUS =============== */
export const getAttendanceStatus = async (attendance_id) => {
    let attendanceStatus = '';
    try {
        let authorization = await retriveAuthTokenFromLocalStorage();
        // Fetch status of attendance id
        attendanceStatus = await fixaApi.get(`attendance-statuses?attendance_id=${attendance_id}`,
            {
                headers: { authorization },
            });
        return attendanceStatus?.data[0];

    } catch (err) {
        attendanceStatus = 'Unknown';
        return attendanceStatus;
    }
}
/* =================== EXPORT ATTENDANCE =============== */
export const exportAttendance = async (date, project_id) => {
    let response = [];
    try {
        let authorization = await retriveAuthTokenFromLocalStorage();
        response = await fixaApi.get(`attendancelists?attendance_date=${date}&project_id=${project_id}&_start=0&_limit=-1`,
            {
                headers: { authorization },
            });

        return response?.data;

    } catch (error) {
        let message = error.message;
        console.log('ERROR IN EXPORTING ATTENDANCE =====> ', message);
        return response
    }
}
/*  ================== CUSTOM SEARCH FUNCTION ==================  */
/**
 * Searches an array of objects for a given query string in specified properties.
 * @param {string} query - The query string to search for.
 * @param {Array} array - The array of objects to search in.
 * @param {Array} propertiesToSearch - The properties to search for the query string in.
 * @returns {Array} - An array of objects that match the query string in the specified properties.
 */
export const onSearch = (query, array, propertiesToSearch) => {
    let results = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i] && query.length > 0) {
            for (let j = 0; j < propertiesToSearch.length; j++) {
                if (array[i][propertiesToSearch[j]].toLowerCase().includes(query.toLowerCase())) {
                    results.push(array[i]);
                    break;
                }
            }
        } else {
            return results;
        }
    }
    return results;
};


/* =================== SEARCH ON ATTENDANCE LIST TABLE =============== */
export const searchAttendanceList = async (query) => {
    /*
    * @params searchItem
    * @ Including cancellation of axios
    */

    let searchData = [];
    await get("attendance_list")
        .then((response) => {
            // search using custom function
            searchData = onSearch(query, response, ["names", "service"]);
        })
        .catch((err) => {
            console.log("ERROR In searching", err);
        });
    return searchData;
};


/* =================== GET user project =============== */
export const getProjects = async (user_id) => {
    let response = [];
    try {
        let authorization = await retriveAuthTokenFromLocalStorage();
        response = await fixaApi.get(`app/client-users/${user_id}`, { headers: { authorization } });

        return response.data?.data;
    } catch (error) {
        let message = error.message;
        console.log('ERROR IN USER PROJECTS =====> ', message);
        return response
    }
}

/* =================== GET project details =============== */
export const getProjectDetails = async (id) => {
    let response = [];
    try {
        let authorization = await retriveAuthTokenFromLocalStorage();
        response = await fixaApi.get(`projects/${id}`, { headers: { authorization } });
        return response?.data;
    } catch (error) {
        let message = error.message;
        console.log('ERROR IN USER PROJECTS =====> ', message);
        return response
    }
}
