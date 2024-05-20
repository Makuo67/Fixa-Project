import axios from 'axios';
import { API_ERROR_500_MESSAGE, APP_ERROR_MESSAGE, API_ERROR_UNKNOWN_MESSAGE, API_ERROR_403_MESSAGE } from '../config.js';

const requestMethodsWithData = ['POST', 'PUT'];

export const getRemoteData = async (url, method, funcName, isAuthenticated, data) => {
    const response = {
        has_error: false,
        data: null,
        errors: []
    };
    try {
        const requestObj = {
            url,
            method,
            validateStatus: status => {
                if (status >= 200 && status < 500) {
                    return true;
                }
                return false;
            }
        };
        if (requestMethodsWithData.includes(method)) {
            requestObj.data = data;
        }
        if (isAuthenticated) {
          if (process.browser) {
            const token = localStorage.getItem("token");
            requestObj.headers = {
                Authorization: `${token}`
            };
          }
        }

        const serverResponse = await axios.request(requestObj);

        switch (serverResponse.status) {
            case 200:
                response.data = serverResponse.data;
                break;
            case 400:
                var errors = serverResponse.data.data[0].messages;
                console.log(`Authentication error  ${funcName}()`, errors);
                response.has_error = true;
                response.errors.push(errors[0].message);
                break;
            case 403:
                var errors = serverResponse.data.data[0].messages;
                console.log(`Api server forbidden error  ${funcName}()`, serverResponse.data.data);
                response.has_error = true;
                response.errors.push(errors[0].message);
                break;
            case 500:
                console.log(`Api server error  ${funcName}()`, serverResponse.data.data);
                response.has_error = true;
                response.errors.push(API_ERROR_500_MESSAGE);
                break;
            default:
                response.has_error = true;
                response.errors.push(API_ERROR_UNKNOWN_MESSAGE);
                console.log(`Unknown api server response status   ${funcName}()`, serverResponse.data);
                break;
        }
    } catch (err) {
        console.log(`an error happened when ${funcName}()`, err);
        response.has_error = true;
        response.errors.push(APP_ERROR_MESSAGE);
    }

    return response;
};
