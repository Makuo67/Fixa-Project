const moment = require("moment");
const _ = require("underscore");
const Validator = require("validatorjs");
const taxesTables = require("../../config/ressources/taxesTable.json");
const Pusher = require("pusher");
const levels = require("../ressources/user_levels.json");
const stringSimilarity = require('string-similarity');
const NameParser = require('name-parser');

module.exports = {
    removeAfterLastSlash(text) {
        var newText = "";

        var queryIndex = text.lastIndexOf("?");
        if (queryIndex !== -1) {
            var textToRemove = text.substring(queryIndex + 1);

            newText = text.substring(0, queryIndex);

        } else {
            newText = text;
        }

        var lastSlashIndex = newText.lastIndexOf("/");

        if (lastSlashIndex !== -1) {

            var textToRemove = newText.substring(lastSlashIndex + 1);

            if (!isNaN(textToRemove)) {
                return newText.substring(0, lastSlashIndex);
            } else {
                return newText;
            }

        } else {
            return newText;
        }
    },
    replaceSpacesWithUnderscores(str) {
        if (str) {
            return str.replace(/\s/g, "_");
        } else {
            return "";
        }
    },
    findActionByName(name, entities) {
        const foundEntity = entities.find(entity => entity.entity_name.toString().toLowerCase() === name.toString().toLowerCase());
        if (foundEntity) {
            return foundEntity;
        }
        return null;
    },
    getAccess,
    findSubEntitiesByName,
    findPageEntitiesByName,
    getPageStatus,
    getAccess,
    updateExistingAccessLevel(user_body, level, user_level) {
        let access_pages = [];
        if (level === 'level_1') {
            access_pages = getCorrectPageStatusLevel(user_level[level], user_body).data;
        }
        if (level === 'level_2') {
            access_pages = getCorrectPageStatusLevel2(user_level[level], user_body).data;
        }
        return access_pages;
    },
    userAccessLevel(user_body, level) {
        let access_pages = [];
        if (level === 'level_1') {
            access_pages = getCorrectPageStatusLevel(levels[level], user_body).data;
        }
        if (level === 'level_2') {
            access_pages = getCorrectPageStatusLevel2(levels[level], user_body).data;
        }
        return access_pages;
    },
    updateOldUserLevels(user_body, level) {
        let access_pages = [];
        if (level === 'level_1') {
            access_pages = getCorrectPageStatusOldLevel(levels[level], user_body).data;
        }
        if (level === 'level_2') {
            access_pages = getCorrectPageStatusOldLevel2(levels[level], user_body).data;
        }
        return access_pages;
    },
    payrollTransactionBody(combine_attendance, workers, payment_id) {
        let payroll_transactions_body = [];
        for (const worker_id in combine_attendance) {
            const worker_data = combine_attendance[worker_id];
            const payment_method = {
                payment_method_is_verified: "",
                payment_method_account_verified_desc: "",
                payment_method_account_number: "",
                payment_method_provider: "",
                payment_method_account_name: "",
                payment_method_id: 0
            };
            const worker_payment_methods = workers.find(itemWorker => {
                if (worker_id && itemWorker.id.toString() === worker_id.toString()) {
                    return itemWorker;
                }
            });
            if (worker_payment_methods && worker_payment_methods.payment_methods && worker_payment_methods.payment_methods.length > 0) {
                const active_payment_method = worker_payment_methods.payment_methods.find(itemPayment => {
                    if (itemPayment.is_active) {
                        return itemPayment;
                    }
                });

                if (active_payment_method && active_payment_method.payment_method) {
                    payment_method.payment_method_is_verified = active_payment_method.is_verified,
                        payment_method.payment_method_account_verified_desc = active_payment_method.account_verified_desc,
                        payment_method.payment_method_account_number = active_payment_method.account_number,
                        payment_method.payment_method_provider = active_payment_method.provider,
                        payment_method.payment_method_account_name = active_payment_method.account_name,
                        payment_method.payment_method_id = active_payment_method.payment_method.id
                }
            }
            // construct payroll transaction body 
            let payroll_transaction_body = {
                total_shifts: worker_data.total_shift,
                payee_type_id: 1,
                payment_id: payment_id,
                total_earnings: worker_data.total_amount,
                take_home: worker_data.total_amount,
                daily_rate: worker_data.daily_rate,
                status: "unpaid",
                service_name: worker_data.service,
                phone_number: worker_data.phone_number,
                id_number: worker_data.nid_number,
                assigned_worker_id: worker_data.assigned_worker_id,
                worker_id: worker_id,
                total_deductions: 0,
                worker_name: worker_data.worker_name,
                day_shifts: worker_data.day_shift,
                night_shifts: worker_data.night_shift,
                is_momo: false,
                is_momo_verified_and_rssb: worker_data.is_momo_verified_and_rssb,
                is_momo_verified_and_rssb_desc: worker_data.is_momo_verified_and_rssb_desc,
                account_number: payment_method.payment_method_account_number,
                account_name: payment_method.payment_method_account_name,
                payment_method: payment_method.payment_method_provider,
                payment_method_id: payment_method.payment_method_id,
                is_payment_method: payment_method.payment_method_is_verified,
                payment_method_verification_desc: payment_method.payment_method_account_verified_desc,
                worker_name_momo: payment_method.payment_method_account_name
            };
            payroll_transactions_body.push(payroll_transaction_body);
        }
        return payroll_transactions_body;
    },
    combineWorkerShifts(attendance_data) {
        let combinedAttendance = {};
        if (attendance_data.length > 0) {
            attendance_data.forEach(obj => {
                if (obj.worker_id) {
                    const workerId = obj.worker_id;
                    const attendanceId = obj.attendance_id;
                    if (!combinedAttendance[workerId]) {
                        combinedAttendance[workerId] = {
                            day_shift: 0,
                            night_shift: 0,
                            total_shift: 0,
                            total_amount: 0,
                            attendance_ids: [],
                            worker_name: `${obj.first_name} ${obj.last_name}`,
                            phone_number: obj.phone_number,
                            nid_number: obj.nid_number,
                            is_momo_verified_and_rssb: obj.is_momo_verified_and_rssb,
                            is_momo_verified_and_rssb_desc: obj.is_momo_verified_and_rssb_desc,
                            assigned_worker_id: obj.assigned_worker_id,
                            project_id: obj.project_id,
                            daily_rate: obj.daily_rate,
                            service: obj.service
                        };
                    }

                    // Check if the attendance_details_id already exists for this worker_id
                    const existingAttendanceIds = combinedAttendance[workerId].attendance_ids;
                    if (!existingAttendanceIds.includes(attendanceId)) {
                        // Add attendance_details_id to the array
                        existingAttendanceIds.push(attendanceId);

                        // Calculate day_shift and night_shift based on working_time and shift_name
                        if (obj.shift_name === 'day') {
                            combinedAttendance[workerId].day_shift += (obj.working_time === 'full') ? 1 : 0.5;
                        } else if (obj.shift_name === 'night') {
                            combinedAttendance[workerId].night_shift += (obj.working_time === 'full') ? 1 : 0.5;
                        }

                        // Calculate total_shift
                        combinedAttendance[workerId].total_shift = combinedAttendance[workerId].day_shift + combinedAttendance[workerId].night_shift;

                        // Calculate total_amount
                        if (obj.working_time === 'full') {
                            combinedAttendance[workerId].total_amount += obj.daily_rate;
                        } else if (obj.working_time === 'half') {
                            combinedAttendance[workerId].total_amount += obj.daily_rate / 2;
                        }
                    }
                }
            });

            return combinedAttendance;
        }
        return combinedAttendance;
    },
    makeStringOfErrorsFromValidation(array_of_objects) {
        let response = "";
        let values = Object.values(array_of_objects);
        for (let i = 0; i < values.length; i++) {
            if (values.length - 1 === i) {
                response += values[i][0];
            } else {
                response += values[i][0] + ", ";
            }
        }
        return response;
    },
    nidValidation(nid) {
        let status = false;
        const regex = /^\d{16}$/;
        if (nid && regex.test(nid.toString())) {
            status = true;
        } else {
            status = false;
        }
        return status;
    },
    nameValidation(name) {
        let status = false;
        const specialChars = /^[a-zA-Z\s'-]+$/;
        if (name) {
            const normalized = name.normalize("NFKD");
            // Remove special characters using a regular expression pattern
            const removedSpecialChars = normalized.replace(/[^\w\s]/g, "");
            // Remove extra spaces and return the modified name
            const trimmed = removedSpecialChars.trim();
            if (specialChars.test(trimmed)) {
                status = true;
            } else {
                status = false;
            }
        } else {
            status = false;
        }
        return status;
    },
    dailyEarningsValidation(daily) {
        let status = false;
        const specialChars = /^-?\d+(\.\d+)?$/;
        if (specialChars.test(daily)) {
            status = true;
        }
        else {
            status = false;
        }
        return status;
    },
    phoneNumberValidation(phone_number) {
        let status = false;
        const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~ A-Za-z]/;
        if (phone_number && phone_number.length === 10 && specialChars.test(phone_number) === false && phone_number.startsWith('07', 0) === true) {
            status = true;
        } else {
            status = false;
        }
        return status;
    },
    phoneNumberValidationSMS(phone_number) {
        const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~ A-Za-z]/;
        if (phone_number && phone_number.length === 10 && specialChars.test(phone_number) === false && phone_number.startsWith("07", 0) === true) {
            return `+25${phone_number}`;
        } else {
            return phone_number;
        }
    },
    giveMeAllYears(year) {
        let my_years = [];
        const current_year = moment().year();
        for (let index = 0; index < 100; index++) {
            if (year <= parseInt(current_year)) {
                my_years.push({ year: "" + year });
                year++;
            } else {
                break;
            }
        }
        return my_years;
    },
    giveMeAllDays(year, month) {
        const numberOfDays = moment(year + "-" + month, "YYYY-MM").daysInMonth();
        let my_month_days = [];
        for (let index = 1; index <= numberOfDays; index++) {
            if (index <= 9) {
                my_month_days.push({ day: "0" + index });
            } else {
                my_month_days.push({ day: "" + index });
            }
        }
        return my_month_days;
    },
    getDays(year, month) {
        return new Date(year, month, 0).getDate();
    },
    getCurrentYear() {
        return new Date().getFullYear();
    },
    format_dob(dateOfBirth) {
        if (!dateOfBirth) {
            return null;
        }
        const formattedDOB = moment(dateOfBirth).format("YYYY-MM-DD");
        return formattedDOB;
    },
    format_phone_number(number) {
        let goodNumber = "";
        const str_num = number && number.length > 0 ? String(parseInt(number)) : String(number);
        if (str_num.length === 9 && str_num.startsWith("7")) {
            goodNumber = str_num.padStart(str_num.length + 1, "0");
        } else {
            goodNumber = str_num;
        }
        return goodNumber;
    },
    isNumeric(str) {
        return !isNaN(str);
    },
    validateEmail(email) {
        const rules = { email: 'required|email' };
        const validation = new Validator({ email }, rules);
        return validation.passes();
    },
    validatePhoneNumber(phone_number) {
        let response = { status: false, phoneNumber: "" };
        // +2507xxxxxxxx
        if (phone_number.toString().startsWith('+2507') && phone_number.toString().length === 13) {
            let new_phone_number = phone_number.toString().slice(3);
            response = { status: true, phoneNumber: new_phone_number }
        }
        // 2507xxxxxxxx
        if (phone_number.toString().startsWith('2507') && phone_number.toString().length === 12) {
            let new_phone_number = phone_number.toString().slice(2);
            response = { status: true, phoneNumber: new_phone_number }
        }
        // 07xxxxxxxx
        if (phone_number.toString().startsWith('07') && phone_number.toString().length === 10) {
            response = { status: true, phoneNumber: phone_number }
        }
        // 7xxxxxxxx
        if (phone_number.toString().startsWith('7') && phone_number.toString().length === 9) {
            response = { status: true, phoneNumber: `0${phone_number}` }
        }
        return response;
    },
    removeDuplicatesByWorkerId(arr) {
        const uniqueWorkers = {};
        arr.forEach(obj => {
            const workerId = obj.worker_id;
            if (!uniqueWorkers[workerId]) {
                uniqueWorkers[workerId] = obj;
            }
        });
        const uniqueArray = Object.values(uniqueWorkers);
        return uniqueArray;
    },
    groupWorker(shifts, type, projects, services) {
        if (type === "project") {
            projects = _.map(projects, (p) => {
                return { type: p.name, value: _.size(_.filter(shifts, (s) => { return parseInt(s.project_id) === parseInt(p.id); })) };
            });
            return projects;
        } else {
            let serviceInAttendance = _.uniq(_.pluck(shifts, "service"));
            let realservice = [];
            for (let x = 0; x < services.length; x++) {
                for (let y = 0; y < serviceInAttendance.length; y++) {
                    if (services[x].name === serviceInAttendance[y]) {
                        realservice.push({ type: services[x].name, value: _.size(_.filter(shifts, (s) => { return services[x].name === s.service; })) });
                    }
                }
            }
            return realservice;
        }
    },
    getShift(worker_obj) {
        let shift_obj = { day_shifts: 0, night_shifts: 0 };
        if (worker_obj.shift_id.toString() === '1' && worker_obj.working_time === 'full') {
            shift_obj = { day_shifts: 1, night_shifts: 0 };
        } else if (worker_obj.shift_id.toString() === '1' && worker_obj.working_time === 'half') {
            shift_obj = { day_shifts: 0.5, night_shifts: 0 };
        } else if (worker_obj.shift_id.toString() === '2' && worker_obj.working_time === 'full') {
            shift_obj = { day_shifts: 0, night_shifts: 1 };
        } else if (worker_obj.shift_id.toString() === '2' && worker_obj.working_time === 'half') {
            shift_obj = { day_shifts: 0, night_shifts: 0.5 };
        }
        return shift_obj;
    },
    transformExcelColumn(data, mode) {
        let excel_data = [];
        if (mode === "permanent") {
            if (data.length > 0) {
                excel_data = data.map((item) => {
                    for (const key in item) {
                        if (taxesTables.permanent[0].hasOwnProperty(key)) {
                            item[taxesTables.permanent[0][key]] = item[key];
                            delete item[key];
                        }
                    }
                    return item;
                });
            }
        } else {
            const field_to_be_removed = ["G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "AB", "AC", "AD"];
            if (data.length > 0) {
                excel_data = data.map((item) => {
                    for (const key in item) {
                        if (taxesTables.casual[0].hasOwnProperty(key)) {
                            item[taxesTables.casual[0][key]] = item[key];
                            delete item[key];
                        } else {
                            let is_field_found = field_to_be_removed.find((item) => item === key);
                            if (is_field_found) {
                                delete item[key];
                            }
                        }
                    }
                    return item;
                });
            }
        }
        return excel_data;
    },
    canYouDoDeclaration(declared_month) {
        const data = { message: "", status: false };
        if (declared_month) {
            const currentDate = moment();
            let year = parseInt(declared_month.split("-")[0]);
            let month = parseInt(declared_month.split("-")[1]) - 1;
            let end_of_the_month = moment({ year, month }).endOf('month').format("YYYY-MM-DD");
            let next_month_12 = moment(end_of_the_month).add(12, 'days').format('YYYY-MM-DD');
            let isgreatOrEqual = currentDate.isSameOrAfter(next_month_12);
            if (isgreatOrEqual) {
                data.status = true;
            } else {
                data.message = `Apologies for the incomplete response. You will be able to generate the tax declaration for the specified period starting from '${next_month_12}'`;
            }
        }
        return data;
    },
    rssbCodeValidation(input) {
        return /\d/.test(input) && /[a-zA-Z]/.test(input);
    },
    getStartEndDateTaxes(declared_month) {
        let dates = { start_date: "", end_date: "" };
        if (declared_month) {
            let year = parseInt(declared_month.split("-")[0]);
            let month = parseInt(declared_month.split("-")[1]) - 1;
            dates.start_date = moment({ year, month }).startOf('month').format("YYYY-MM-DD");
            let end_of_the_month = moment({ year, month }).endOf('month').format("YYYY-MM-DD");
            dates.end_date = moment(end_of_the_month).format('YYYY-MM-DD');
        }
        return dates;
    },
    generateRandomNumber(count) {
        const min = Math.pow(10, count - 1); // Minimum number based on count
        const max = Math.pow(10, count) - 1; // Maximum number based on count
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomNumber;
    },
    checkIfNumber(value) {
        let status = false;
        if (/^-?\d+$/.test(value) && /^\d+$/.test(value)) {
            status = true;
        }
        return status;
    },
    validateExcelData(data_excel) {
        let status = true;
        let count = 0;
        for (let index = 0; index < data_excel.length; index++) {
            if (this.phoneNumberValidation(data_excel[index].momo_account)) {
                count = count + 1;
            }
        }
        if (count > 0) {
            status = false;
        }
        return status;
    },
    isValidURL(str) {
        const urlPattern = /^(?:\w+:)?\/\/([^\s.]+\.\S{2}|localhost[\:?\d]*)\S*$/;
        return urlPattern.test(str);
    },
    eventPublisher(event_name, message) {
        const pusher = new Pusher({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.PUSHER_CLUSTER,
            useTLS: true,
        });

        switch (process.env.EVENT_PUBLISHER.toLowerCase()) {
            case 'pusher':
                pusher.trigger(
                    `${event_name}`,
                    `${event_name}-event`, message
                );
                break;
            case 'socketio':
                strapi.io.emit(`${event_name}-event`, message);
                break;
            default:
                pusher.trigger(
                    `${event_name}`,
                    `${event_name}-event`, message
                );
                break;
        }
    },
    calculatePercentage(number, rangeStart, rangeEnd) {
        const rangeSize = rangeEnd - rangeStart;
        const percentage = ((number - rangeStart) / rangeSize) * 100;
        return percentage.toFixed(0);
    },
    getErrors(erros) {
        let messages = [];
        let message = "";
        for (const key in erros.errors) {
            if (erros.errors.hasOwnProperty(key)) {
                const errorMessages = erros.errors[key];
                errorMessages.forEach(errorMessage => {
                    messages.push(errorMessage);
                });
            }
        }
        message = messages.join(" ");
        return message;
    },
    fuzzyMatch(name1, name2) {
        // Tokenize and extract named entities from both names
        const entities1 = name1.split(/\s+/);
        const entities2 = name2.split(/\s+/);
        // Check if any named entities match between the names
        const intersection = entities1.filter(entity => entities2.includes(entity));
        if (intersection.length > 0) {
            console.log(`${name1} === ${name2}`);
            return true;
        }
        // Calculate the fuzzy matching score between the names
        const score = stringSimilarity.compareTwoStrings(name1, name2);
        // Check if the fuzzy matching score is above a threshold (e.g., 0.8)
        if (score >= 0.8) {
            console.log(`${name1} === ${name2}`);
            return true;
        }
        console.log(`${name1} !== ${name2}`);
        return false;

    },
    toTimestamp(mydate) {
        var datum = Date.parse(mydate);
        return datum / 1000;
    },
    getTimestampInSeconds() {
        return Math.floor(Date.now() / 1000);
    },
    sortByProperty(arr, propertyName) {
        const trueValues = arr.filter(item => item[propertyName]);
        const falseValues = arr.filter(item => !item[propertyName]);
        return trueValues.concat(falseValues);
    },
    removeDuplicatesByProperty(objects, propertyName) {
        const uniqueValues = new Set(); // Set to store unique property values
        const filteredArray = []; // Array to store objects without duplicate property values
        for (const object of objects) {
            const propertyValue = object[propertyName];
            if (!uniqueValues.has(propertyValue)) {
                uniqueValues.add(propertyValue);
                filteredArray.push(object);
            }
        }
        return filteredArray;
    },
    parseFullnames(names) {
        const normalized = names.normalize("NFKD");
        // Remove special characters using a regular expression pattern
        const removedSpecialChars = normalized.replace(/[^\w\s]/g, "");
        // Remove extra spaces and return the modified name
        const trimmed = removedSpecialChars.trim();
        return NameParser.parse(trimmed);

    },
    isValidObject(value) {
        return typeof value === 'object' && value !== null && !(value instanceof Array);
    },
    isValidDate(dateString) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return false;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return false;
        }
        const [year, month, day] = dateString.split('-');
        if (date.getFullYear() !== parseInt(year, 10) ||
            date.getMonth() + 1 !== parseInt(month, 10) ||
            date.getDate() !== parseInt(day, 10)) {
            return false;
        }
        return true;
    },
    getDateOneMonthAgo(inputDate) {
        const formattedDate = moment(inputDate, 'YYYY-MM-DD');
        const oneMonthAgo = formattedDate.subtract(1, 'month');
        return oneMonthAgo.format('YYYY-MM-DD');
    },
    compareStatus(a, b) {
        if (a.status === 'completed' && b.status !== 'completed') {
            return 1; 
        } else if (a.status !== 'completed' && b.status === 'completed') {
            return -1; 
        } else {
            return 0; 
        }
    }
}

function findEntityAccess(entities, name) {
    const entryFound = entities.find(entity => entity.entity_name.toString().toLowerCase() === name.toString().toLowerCase());
    if (entryFound) {
        return entryFound;
    }
    return null;
}

function getSubPageStatus(sub_page_name, subPages) {
    let response = {};
    for (let index = 0; index < subPages.length; index++) {
        const item = subPages[index];
        if (item.sub_page_name.toString().toLowerCase() === sub_page_name.toString().toLowerCase()) {
            response = item;
        }
    }
    return response;
}
function getPageStatus(page_name, pages) {
    let response = {};
    for (let index = 0; index < pages.length; index++) {
        const item = pages[index];
        if (item.page_name.toString().toLowerCase() === page_name.toString().toLowerCase()) {
            response = item;
        }
    }
    return response;
}

function findPageEntitiesByName(entityName, page) { //Todo check for page changes
    const foundEntity = page.page_entities.find(entity => entity.entity_name.toString().toLowerCase() === entityName.toString().toLowerCase());
    if (foundEntity) {
        return foundEntity;
    }

    return null;
}

function findSubEntitiesByName(entityName, pages) {
    for (const page of pages) {
        const foundEntity = page.page_entities.find(entity => entity.entity_name.toString().toLowerCase() === entityName.toString().toLowerCase());
        if (foundEntity) {
            return foundEntity;
        }
    }
    return null;
}

function getAccess(user_body, type, page_name, page_entity_name, sub_page_name, entity_name, sub_entity_name) {
    let response = false;
    switch (type.toString().toLowerCase()) {
        case "page":
            let status_page = getPageStatus(page_name, user_body);
            if (status_page) {
                response = status_page.is_active;
            }
            break;
        case "sub_page":
            let status__page = getPageStatus(page_name, user_body);
            if (status__page) {
                let sub_page = getSubPageStatus(sub_page_name, status__page.sub_pages);
                if (sub_page) {
                    response = sub_page.is_active;
                }
            }
            break;
        case "page_entities":
            let status___page = getPageStatus(page_name, user_body);
            if (status___page) {
                let status_page_entity = findEntityAccess(status___page.page_entities, page_entity_name);
                if (status_page_entity) {
                    response = status_page_entity.is_active;
                }
            }
            break;
        case "page_entities_sub_entities":
            let status____page = getPageStatus(page_name, user_body);
            if (status____page) {
                let status_page__entity = findEntityAccess(status____page.page_entities, page_entity_name);
                if (status_page__entity) {
                    let sub_entity = findEntityAccess(status_page__entity.sub_entities, sub_entity_name);
                    if (sub_entity) {
                        response = sub_entity.is_active;
                    }
                }
            }
            break;
        case "sub_page_sub_page_entities":
            let status_____page = getPageStatus(page_name, user_body);
            if (status_____page) {
                let sub__page = getSubPageStatus(sub_page_name, status_____page.sub_pages);
                if (sub__page) {
                    let sub_page_entity = findEntityAccess(sub__page.entities, entity_name);
                    if (sub_page_entity) {
                        response = sub_page_entity.is_active;
                    }
                }
            }
            break;
        case "sub_page_sub_page_entities_sub_entities":
            let status______page = getPageStatus(page_name, user_body);
            if (status______page) {
                let sub____page = getSubPageStatus(sub_page_name, status______page.sub_pages);
                if (sub____page) {
                    let sub_page__entity = findEntityAccess(sub____page.entities, entity_name);
                    if (sub_page__entity) {
                        let sub_page__entity_sub_entities = findEntityAccess(sub_page__entity.sub_entities, sub_entity_name);
                        if (sub_page__entity_sub_entities) {
                            response = sub_page__entity_sub_entities.is_active;
                        }
                    }
                }
            }
            break;
        default:
            response = false;
            break;
    }
    return response;
}


function getCorrectPageStatusLevel(level, user_body) {
    let response = { status: false, data: levels['level_0'].pages };
    let pages = [];

    for (let index = 0; index < level.pages.length; index++) {

        const page = level.pages[index];
        let page_name = page.page_name;

        if (page_name.toString().toLowerCase() === 'project') {
            let project = {
                "page_name": "Project",
                "is_active": getAccess(user_body, "page", "Project", "", "", "", "") ?? page.is_active,
                "page_entities": [
                    {
                        "entity_name": "New project",
                        "is_active": getAccess(user_body, "page_entities", "Project", "New project", "", "", "") ?? page.page_entities[0].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Edit Project",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Edit Project", "", "", "") ?? page.page_entities[1].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Details",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Details", "", "", "") ?? page.page_entities[2].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Attendance",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Attendance", "", "", "") ?? page.page_entities[3].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Approved",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Attendance", "", "", "Approved") ?? page.page_entities[3].sub_entities[0].is_active
                            },
                            {
                                "entity_name": "Declined",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Attendance", "", "", "Declined") ?? page.page_entities[3].sub_entities[1].is_active
                            }
                        ]
                    },
                    {
                        "entity_name": "Trades",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Trades", "", "", "") ?? page.page_entities[4].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Delete",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Trades", "", "", "Delete") ?? page.page_entities[4].sub_entities[0].is_active
                            },
                            {
                                "entity_name": "Add new",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Trades", "", "", "Add new") ?? page.page_entities[4].sub_entities[1].is_active
                            }
                        ]
                    },
                    {
                        "entity_name": "Supervisors",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Supervisors", "", "", "") ?? page.page_entities[5].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Delete",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Supervisors", "", "", "Delete") ?? page.page_entities[5].sub_entities[1].is_active
                            },
                            {
                                "entity_name": "Link existing",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Supervisors", "", "", "Link existing") ?? page.page_entities[5].sub_entities[1].is_active
                            }
                        ]
                    },
                    {
                        "entity_name": "Suppliers",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Suppliers", "", "", "") ?? page.page_entities[6].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Delete",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Suppliers", "", "", "Delete") ?? page.page_entities[6].sub_entities[1].is_active
                            },
                            {
                                "entity_name": "Link existing",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Suppliers", "", "", "Link existing") ?? page.page_entities[6].sub_entities[1].is_active
                            }
                        ]
                    }
                ],
                "sub_pages": []
            }
            pages.push(project);

        }
        if (page_name.toString().toLowerCase() === 'workforce') {
            let workforce = {
                "page_name": "Workforce",
                "is_active": getAccess(user_body, "page", "Workforce", "", "", "", "") ?? page.is_active,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Workers",
                        "is_active": getAccess(user_body, "sub_page", "Workforce", "", "Workers", "", "") ?? page.sub_pages[0].is_active,
                        "entities": [
                            {
                                "entity_name": "bulk_actions",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "bulk_actions", "") ?? page.sub_pages[0].entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Register workers",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Register workers", "") ?? page.sub_pages[0].entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Send message",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Send message", "") ?? page.sub_pages[0].entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Details",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Details", "") ?? page.sub_pages[0].entities[3].is_active,
                                "sub_entities": [
                                    {
                                        "entity_name": "Edit contact details",
                                        "is_active": getAccess(user_body, "sub_page_sub_page_entities_sub_entities", "Workforce", "", "Workers", "Details", "Edit contact details") ?? page.sub_pages[0].entities[3].sub_entities[0].is_active
                                    },
                                    {
                                        "entity_name": "Edit personal details",
                                        "is_active": getAccess(user_body, "sub_page_sub_page_entities_sub_entities", "Workforce", "", "Workers", "Details", "Edit personal details") ?? page.sub_pages[0].entities[3].sub_entities[1].is_active
                                    }
                                ]
                            },
                            {
                                "entity_name": "Work History",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Work History", "") ?? page.sub_pages[0].entities[4].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Payment Details",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Payment Details", "") ?? page.sub_pages[0].entities[5].is_active,
                                "sub_entities": [
                                    {
                                        "entity_name": "Edit payment method",
                                        "is_active": getAccess(user_body, "sub_page_sub_page_entities_sub_entities", "Workforce", "", "Workers", "Details", "Edit payment method") ?? page.sub_pages[0].entities[5].sub_entities[0].is_active
                                    }
                                ]
                            },
                            {
                                "entity_name": "Scores",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Scores", "") ?? page.sub_pages[0].entities[6].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Leaderboard",
                        "is_active": getAccess(user_body, "sub_page", "Workforce", "", "Leaderboard", "", "") ?? page.sub_pages[1].is_active,
                        "entities": []
                    }
                ]
            };
            pages.push(workforce);
        }
        if (page_name.toString().toLowerCase() === 'finance') {
            let finance = {
                "page_name": "Finance",
                "is_active": getAccess(user_body, "page", "Finance", "", "", "", "") ?? page.is_active,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Payment",
                        "is_active": getAccess(user_body, "sub_page", "Finance", "", "Payment", "", "") ?? page.sub_pages[0].is_active,
                        "entities": [
                            {
                                "entity_name": "New Payment",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "New Payment", "") ?? page.sub_pages[0].entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete Payment",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Delete Payment", "") ?? page.sub_pages[0].entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Add Claim",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Add Claim", "") ?? page.sub_pages[0].entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete worker in payment",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Delete worker in payment", "") ?? page.sub_pages[0].entities[3].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Send Confirmation SMS",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Send Confirmation SMS", "") ?? page.sub_pages[0].entities[4].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Pay",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Pay", "") ?? page.sub_pages[0].entities[5].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Send deduction",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Send deduction", "") ?? page.sub_pages[0].entities[6].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit deduction",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Edit deduction", "") ?? page.sub_pages[0].entities[7].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Close Payment",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Payment", "Close Payment", "") ?? page.sub_pages[0].entities[8].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Taxes",
                        "is_active": getAccess(user_body, "sub_page", "Finance", "", "Taxes", "", "") ?? page.sub_pages[1].is_active,
                        "entities": [
                            {
                                "entity_name": "Generate",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Taxes", "Generate", "") ?? page.sub_pages[1].entities[0].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Wallet",
                        "is_active": getAccess(user_body, "sub_page", "Finance", "", "Wallet", "", "") ?? page.sub_pages[2].is_active,
                        "entities": [
                            {
                                "entity_name": "Wallet Request",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Wallet", "Wallet Request", "") ?? page.sub_pages[2].entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Wallet Top up",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Finance", "", "Wallet", "Wallet Top up", "") ?? page.sub_pages[2].entities[1].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Billing",
                        "is_active": getAccess(user_body, "sub_page", "Finance", "", "Billing", "", "") ?? page.sub_pages[3].is_active,
                        "entities": []
                    }
                ]
            };
            pages.push(finance);
        }
        if (page_name.toString().toLowerCase() === 'settings') {
            let settings = {
                "page_name": "Settings",
                "is_active": getAccess(user_body, "page", "Settings", "", "", "", "") ?? page.is_active,
                "page_entities": [
                    {
                        "entity_name": "Edit Company Info",
                        "is_active": getAccess(user_body, "page_entities", "Settings", "Edit Company Info", "", "", "") ?? page.page_entities[0].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Office Team",
                        "is_active": getAccess(user_body, "page_entities", "Settings", "Office Team", "", "", "") ?? page.page_entities[1].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Invite office user",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Invite office user") ?? page.page_entities[1].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit office user",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Edit office user") ?? page.page_entities[1].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete office user",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Delete office user") ?? page.page_entities[1].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate office user",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Deactivate office user") ?? page.page_entities[1].sub_entities[2].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "entity_name": "Supervisors",
                        "is_active": getAccess(user_body, "page_entities", "Settings", "Supervisors", "", "", "") ?? page.page_entities[2].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Add New supervisor",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supervisors", "", "", "Add New supervisor") ?? page.page_entities[2].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete a supervisor",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supervisors", "", "", "Delete a supervisor") ?? page.page_entities[2].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit a supervisor",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supervisors", "", "", "Edit a supervisor") ?? page.page_entities[2].sub_entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate a supervisor",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supervisors", "", "", "Deactivate a supervisor") ?? page.page_entities[2].sub_entities[3].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "entity_name": "Clients",
                        "is_active": getAccess(user_body, "page_entities", "Settings", "Clients", "", "", "") ?? page.page_entities[3].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Add Client",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Clients", "", "", "Add Client") ?? page.page_entities[3].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate client",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Clients", "", "", "Deactivate client") ?? page.page_entities[3].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit client",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Clients", "", "", "Edit client") ?? page.page_entities[3].sub_entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete client",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Clients", "", "", "Delete client") ?? page.page_entities[3].sub_entities[3].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "entity_name": "Supplier",
                        "is_active": getAccess(user_body, "page_entities", "Settings", "Supplier", "", "", "") ?? page.page_entities[4].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Add Supplier",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supplier", "", "", "Add Supplier") ?? page.page_entities[4].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete Supplier",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supplier", "", "", "Delete Supplier") ?? page.page_entities[4].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit Supplier",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supplier", "", "", "Edit Supplier") ?? page.page_entities[4].sub_entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate Supplier",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Supplier", "", "", "Deactivate Supplier") ?? page.page_entities[4].sub_entities[2].is_active,
                                "sub_entities": []
                            }
                        ]
                    }
                ],
                "sub_pages": []
            };
            pages.push(settings);
        }
    }
    if (pages.length > 0) {
        pages.push({
            "page_name": "Dashboard",
            "is_active": true,
            "page_entities": [],
            "sub_pages": []
        });
        response.status = true;
        response.data = pages
    }

    return response;
}

function getCorrectPageStatusLevel2(level, user_body) {
    let response = { status: false, data: levels['level_0'].pages };
    let pages = [];

    for (let index = 0; index < level.pages.length; index++) {

        const page = level.pages[index];
        let page_name = page.page_name;

        if (page_name.toString().toLowerCase() === 'project') {
            let project = {
                "page_name": "Project",
                "is_active": getAccess(user_body, "page", "Project", "", "", "", "") ?? false,
                "page_entities": [
                    {
                        "entity_name": "Details",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Details", "", "", "") ?? false,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Attendance",
                        "is_active": getAccess(user_body, "page_entities", "Project", "Attendance", "", "", "") ?? false,
                        "sub_entities": [
                            {
                                "entity_name": "Approved",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Attendance", "", "", "Approved") ?? false
                            },
                            {
                                "entity_name": "Declined",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Project", "Attendance", "", "", "Declined") ?? false
                            }
                        ]
                    },

                ],
                "sub_pages": []
            }
            pages.push(project);

        }
        if (page_name.toString().toLowerCase() === 'workforce') {
            let workforce = {
                "page_name": "Workforce",
                "is_active": getAccess(user_body, "page", "Workforce", "", "", "", "") ?? false,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Workers",
                        "is_active": getAccess(user_body, "sub_page", "Workforce", "", "Workers", "", "") ?? false,
                        "entities": [
                            {
                                "entity_name": "Details",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Details", "") ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Work History",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Work History", "") ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Payment Details",
                                "is_active": getAccess(user_body, "sub_page_sub_page_entities", "Workforce", "", "Workers", "Payment Details", "") ?? false,
                                "sub_entities": []
                            }
                        ]
                    }
                ]
            };
            pages.push(workforce);
        }
        if (page_name.toString().toLowerCase() === 'finance') {
            let finance = {
                "page_name": "Finance",
                "is_active": getAccess(user_body, "page", "Finance", "", "", "", "") ?? false,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Billing",
                        "is_active": getAccess(user_body, "sub_page", "Finance", "", "Billing", "", "") ?? false,
                        "entities": []
                    }
                ]
            };
            pages.push(finance);
        }
        if (page_name.toString().toLowerCase() === 'settings') {
            let settings = {
                "page_name": "Settings",
                "is_active": getAccess(user_body, "page", "Settings", "", "", "", "") ?? false,
                "page_entities": [
                    {
                        "entity_name": "Office Team",
                        "is_active": getAccess(user_body, "page_entities", "Settings", "Office Team", "", "", "") ?? false,
                        "sub_entities": [
                            {
                                "entity_name": "Invite office user",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Invite office user") ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit office user",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Edit office user") ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate office user",
                                "is_active": getAccess(user_body, "page_entities_sub_entities", "Settings", "Office Team", "", "", "Deactivate office user") ?? false,
                                "sub_entities": []
                            }
                        ]
                    }
                ],
                "sub_pages": []
            };
            pages.push(settings);
        }
    }
    if (pages.length > 0) {
        pages.push({
            "page_name": "Dashboard",
            "is_active": true,
            "page_entities": [],
            "sub_pages": []
        });
        response.status = true;
        response.data = pages
    }

    return response;
}


function getCorrectPageStatusOldLevel(level, user_body) {
    let response = { status: false, data: levels['level_0'].pages };
    let pages = [];

    for (let index = 0; index < level.pages.length; index++) {

        const page = level.pages[index];
        let page_name = page.page_name;

        if (page_name.toString().toLowerCase() === 'project') {
            let project = {
                "page_name": "Project",
                "is_active": user_body.project_view ?? page.is_active,
                "page_entities": [
                    {
                        "entity_name": "New project",
                        "is_active": user_body.project_edit ?? page.page_entities[0].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Edit Project",
                        "is_active": user_body.project_view ?? page.page_entities[1].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Details",
                        "is_active": user_body.project_edit ?? page.page_entities[2].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Attendance",
                        "is_active": user_body.attendance_view ?? page.page_entities[3].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Approved",
                                "is_active": user_body.attendance_approve ?? page.page_entities[3].sub_entities[0].is_active
                            },
                            {
                                "entity_name": "Declined",
                                "is_active": user_body.attendance_approve ?? page.page_entities[3].sub_entities[1].is_active
                            }
                        ]
                    },
                    {
                        "entity_name": "Trades",
                        "is_active": user_body.project_view ?? page.page_entities[4].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Delete",
                                "is_active": user_body.project_edit ?? page.page_entities[4].sub_entities[0].is_active
                            },
                            {
                                "entity_name": "Add new",
                                "is_active": user_body.project_edit ?? page.page_entities[4].sub_entities[1].is_active
                            }
                        ]
                    },
                    {
                        "entity_name": "Supervisors",
                        "is_active": user_body.project_view ?? page.page_entities[5].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Delete",
                                "is_active": user_body.project_edit ?? page.page_entities[5].sub_entities[1].is_active
                            },
                            {
                                "entity_name": "Link existing",
                                "is_active": user_body.project_edit ?? page.page_entities[5].sub_entities[1].is_active
                            }
                        ]
                    },
                    {
                        "entity_name": "Suppliers",
                        "is_active": user_body.project_view ?? page.page_entities[6].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Delete",
                                "is_active": user_body.project_edit ?? page.page_entities[6].sub_entities[1].is_active
                            },
                            {
                                "entity_name": "Link existing",
                                "is_active": user_body.project_edit ?? page.page_entities[6].sub_entities[1].is_active
                            }
                        ]
                    }
                ],
                "sub_pages": []
            }
            pages.push(project);

        }
        if (page_name.toString().toLowerCase() === 'workforce') {
            let workforce = {
                "page_name": "Workforce",
                "is_active": user_body.workforce_view ?? page.is_active,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Workers",
                        "is_active": user_body.workforce_view ?? page.sub_pages[0].is_active,
                        "entities": [
                            {
                                "entity_name": "bulk_actions",
                                "is_active": user_body.workforce_edit ?? page.sub_pages[0].entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Register workers",
                                "is_active": user_body.workforce_edit ?? page.sub_pages[0].entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Send message",
                                "is_active": user_body.workforce_edit ?? page.sub_pages[0].entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Details",
                                "is_active": user_body.workforce_view ?? page.sub_pages[0].entities[3].is_active,
                                "sub_entities": [
                                    {
                                        "entity_name": "Edit contact details",
                                        "is_active": user_body.workforce_edit ?? page.sub_pages[0].entities[3].sub_entities[0].is_active
                                    },
                                    {
                                        "entity_name": "Edit personal details",
                                        "is_active": user_body.workforce_edit ?? page.sub_pages[0].entities[3].sub_entities[1].is_active
                                    }
                                ]
                            },
                            {
                                "entity_name": "Work History",
                                "is_active": user_body.workforce_view ?? page.sub_pages[0].entities[4].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Payment Details",
                                "is_active": user_body.workforce_view ?? page.sub_pages[0].entities[5].is_active,
                                "sub_entities": [
                                    {
                                        "entity_name": "Edit payment method",
                                        "is_active": user_body.workforce_edit ?? page.sub_pages[0].entities[5].sub_entities[0].is_active
                                    }
                                ]
                            },
                            {
                                "entity_name": "Scores",
                                "is_active": user_body.workforce_view ?? page.sub_pages[0].entities[6].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Leaderboard",
                        "is_active": user_body.workforce_view ?? page.sub_pages[1].is_active,
                        "entities": []
                    }
                ]
            };
            pages.push(workforce);
        }
        if (page_name.toString().toLowerCase() === 'finance') {
            let finance = {
                "page_name": "Finance",
                "is_active": user_body.payment_view ?? page.is_active,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Payment",
                        "is_active": user_body.payment_view ?? page.sub_pages[0].is_active,
                        "entities": [
                            {
                                "entity_name": "New Payment",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete Payment",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Add Claim",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete worker in payment",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[3].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Send Confirmation SMS",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[4].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Pay",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[5].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Send deduction",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[6].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit deduction",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[7].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Close Payment",
                                "is_active": user_body.payment_edit ?? page.sub_pages[0].entities[8].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Taxes",
                        "is_active": user_body.payment_view ?? page.sub_pages[1].is_active,
                        "entities": [
                            {
                                "entity_name": "Generate",
                                "is_active": user_body.payment_edit ?? page.sub_pages[1].entities[0].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Wallet",
                        "is_active": user_body.payment_view ?? page.sub_pages[2].is_active,
                        "entities": [
                            {
                                "entity_name": "Wallet Request",
                                "is_active": user_body.payment_edit ?? page.sub_pages[2].entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Wallet Top up",
                                "is_active": user_body.payment_edit ?? page.sub_pages[2].entities[1].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "sub_page_name": "Billing",
                        "is_active": user_body.payment_view ?? page.sub_pages[3].is_active,
                        "entities": []
                    }
                ]
            };
            pages.push(finance);
        }
        if (page_name.toString().toLowerCase() === 'settings') {
            let settings = {
                "page_name": "Settings",
                "is_active": user_body.settings_view ?? page.is_active,
                "page_entities": [
                    {
                        "entity_name": "Edit Company Info",
                        "is_active": user_body.settings_edit ?? page.page_entities[0].is_active,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Office Team",
                        "is_active": user_body.settings_view ?? page.page_entities[1].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Invite office user",
                                "is_active": user_body.settings_edit ?? page.page_entities[1].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit office user",
                                "is_active": user_body.settings_edit ?? page.page_entities[1].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete office user",
                                "is_active": user_body.settings_edit ?? page.page_entities[1].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate office user",
                                "is_active": user_body.settings_edit ?? page.page_entities[1].sub_entities[2].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "entity_name": "Supervisors",
                        "is_active": user_body.settings_view ?? page.page_entities[2].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Add New supervisor",
                                "is_active": user_body.settings_edit ?? page.page_entities[2].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete a supervisor",
                                "is_active": user_body.settings_edit ?? page.page_entities[2].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit a supervisor",
                                "is_active": user_body.settings_edit ?? page.page_entities[2].sub_entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate a supervisor",
                                "is_active": user_body.settings_edit ?? page.page_entities[2].sub_entities[3].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "entity_name": "Clients",
                        "is_active": user_body.settings_view ?? page.page_entities[3].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Add Client",
                                "is_active": user_body.settings_edit ?? page.page_entities[3].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate client",
                                "is_active": user_body.settings_edit ?? page.page_entities[3].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit client",
                                "is_active": user_body.settings_edit ?? page.page_entities[3].sub_entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete client",
                                "is_active": user_body.settings_edit ?? page.page_entities[3].sub_entities[3].is_active,
                                "sub_entities": []
                            }
                        ]
                    },
                    {
                        "entity_name": "Supplier",
                        "is_active": user_body.settings_view ?? page.page_entities[4].is_active,
                        "sub_entities": [
                            {
                                "entity_name": "Add Supplier",
                                "is_active": user_body.settings_edit ?? page.page_entities[4].sub_entities[0].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Delete Supplier",
                                "is_active": user_body.settings_edit ?? page.page_entities[4].sub_entities[1].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit Supplier",
                                "is_active": user_body.settings_edit ?? page.page_entities[4].sub_entities[2].is_active,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate Supplier",
                                "is_active": user_body.settings_edit ?? page.page_entities[4].sub_entities[2].is_active,
                                "sub_entities": []
                            }
                        ]
                    }
                ],
                "sub_pages": []
            };
            pages.push(settings);
        }
    }
    if (pages.length > 0) {
        pages.push({
            "page_name": "Dashboard",
            "is_active": true,
            "page_entities": [],
            "sub_pages": []
        });
        response.status = true;
        response.data = pages
    }

    return response;
}

function getCorrectPageStatusOldLevel2(level, user_body) {
    let response = { status: false, data: levels['level_0'].pages };
    let pages = [];

    for (let index = 0; index < level.pages.length; index++) {

        const page = level.pages[index];
        let page_name = page.page_name;

        if (page_name.toString().toLowerCase() === 'project') {
            let project = {
                "page_name": "Project",
                "is_active": user_body.project_view ?? false,
                "page_entities": [
                    {
                        "entity_name": "Details",
                        "is_active": user_body.project_edit ?? false,
                        "sub_entities": []
                    },
                    {
                        "entity_name": "Attendance",
                        "is_active": user_body.attendance_view ?? false,
                        "sub_entities": [
                            {
                                "entity_name": "Approved",
                                "is_active": user_body.attendance_approve ?? false
                            },
                            {
                                "entity_name": "Declined",
                                "is_active": user_body.attendance_approve ?? false
                            }
                        ]
                    }
                ],
                "sub_pages": []
            }
            pages.push(project);

        }
        if (page_name.toString().toLowerCase() === 'workforce') {
            let workforce = {
                "page_name": "Workforce",
                "is_active": user_body.workforce_view ?? false,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Workers",
                        "is_active": user_body.workforce_view ?? false,
                        "entities": [
                            {
                                "entity_name": "Details",
                                "is_active": user_body.workforce_view ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Work History",
                                "is_active": user_body.workforce_view ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Payment Details",
                                "is_active": user_body.workforce_view ?? false,
                                "sub_entities": []
                            }
                        ]
                    }
                ]
            };
            pages.push(workforce);
        }
        if (page_name.toString().toLowerCase() === 'finance') {
            let finance = {
                "page_name": "Finance",
                "is_active": user_body.payment_view ?? false,
                "page_entities": [],
                "sub_pages": [
                    {
                        "sub_page_name": "Billing",
                        "is_active": user_body.payment_view ?? false,
                        "entities": []
                    }
                ]
            };
            pages.push(finance);
        }
        if (page_name.toString().toLowerCase() === 'settings') {
            let settings = {
                "page_name": "Settings",
                "is_active": user_body.settings_view ?? false,
                "page_entities": [
                    {
                        "entity_name": "Office Team",
                        "is_active": user_body.settings_view ?? false,
                        "sub_entities": [
                            {
                                "entity_name": "Invite office user",
                                "is_active": user_body.settings_edit ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Edit office user",
                                "is_active": user_body.settings_edit ?? false,
                                "sub_entities": []
                            },
                            {
                                "entity_name": "Deactivate office user",
                                "is_active": user_body.settings_edit ?? false,
                                "sub_entities": []
                            }
                        ]
                    }
                ],
                "sub_pages": []
            };
            pages.push(settings);
        }
    }
    if (pages.length > 0) {
        pages.push({
            "page_name": "Dashboard",
            "is_active": true,
            "page_entities": [],
            "sub_pages": []
        });
        response.status = true;
        response.data = pages
    }

    return response;
}
