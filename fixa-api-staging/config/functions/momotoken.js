const axios = require('axios');
const jwt_decode = require('jwt-decode');
const MOMO_API_USER = process.env.MOMO_API_USER;
const MOMO_API_KEY = process.env.MOMO_API_KEY;
const redisService = require("../redis");
const redisClient = redisService.getClient();
const moment = require("moment");

module.exports = {
    async getMomoToken(momo_url, momo_primary_key) {
        const response = { access_token: "" };
        try {
            const redisToken = await redisClient.get(process.env.MTN_TOKEN_KEY);
            if (redisToken) {
                const { token } = JSON.parse(redisToken);
                const { expires } = jwt_decode(token);
                const isExpired = hasExpired(expires);
                if (isExpired) {
                    let new_token = await requestMomoToken(momo_url, momo_primary_key, false);
                    response.access_token = new_token.token;
                } else {
                    response.access_token = token;
                }
            } else {
                let new_token = await requestMomoToken(momo_url, momo_primary_key, false);
                response.access_token = new_token.token;
            }
        } catch (error) {
            console.error("error in getMomoToken", error);
        }
        return response;
    },
    async getMomoTokenCollection(momo_url, momo_primary_key) {
        const response = { access_token: "" };
        try {

            const redisToken = await redisClient.get(process.env.MTN_TOKEN_KEY_COLLECTION);
            if (redisToken) {
                const { token } = JSON.parse(redisToken);
                const { expires } = jwt_decode(token);
                const isExpired = hasExpired(expires);
                if (isExpired) {
                    let new_token = await requestMomoToken(momo_url, momo_primary_key, true);
                    response.access_token = new_token.token;

                } else {
                    response.access_token = token;

                }
            } else {
                let new_token = await requestMomoToken(momo_url, momo_primary_key, true);
                response.access_token = new_token.token;

            }
        } catch (error) {
            console.error("error in getMomoToken", error.message);
        }
        return response;
    },
}

async function requestMomoToken(momo_url, momo_primary_key, is_collection) {
    const response = { status: false, token: "" };
    try {
        let responseMomo = await axios.post(momo_url + "token/", {}, {
            headers: {
                'Content-Length': 0,
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Ocp-Apim-Subscription-Key': momo_primary_key,
            },
            auth: {
                username: MOMO_API_USER,
                password: MOMO_API_KEY
            }
        });
        if (responseMomo.status === 200) {
            if (is_collection) {
                await redisClient.set(process.env.MTN_TOKEN_KEY_COLLECTION, JSON.stringify({ token: responseMomo.data.access_token }));
                response.token = responseMomo.data.access_token;
                response.status = true;
            } else {
                await redisClient.set(process.env.MTN_TOKEN_KEY, JSON.stringify({ token: responseMomo.data.access_token }));
                response.token = responseMomo.data.access_token;
                response.status = true;
            }
        }

    } catch (error) {
        console.log('Line 81 :: ==> error in requestMomoToken()', error.message);
    }
    return response;
}

function hasExpired(expirationTimestamp) {
    let status = false;
    const harareTimeZone = 'Africa/Harare';
    const currentDateInHarare = moment().tz(harareTimeZone);
    const formattedDate = currentDateInHarare.format('YYYY-MM-DDTHH:mm:ss');
    const momoTime = moment(expirationTimestamp);
    const currentTime = moment(formattedDate);
    if (currentTime.isAfter(momoTime)) {
        status = true;
    }
    return status;
}