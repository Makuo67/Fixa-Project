export const decodeBase64 = (base64String) => {
    try {
        const decodedString = atob(base64String);
        return decodedString;
    } catch (error) {
        return '';
    }
}

export const encodeJSONBase64 = (jsonData) => {
    if (!jsonData) return;
    const jsonString = JSON.stringify(jsonData);
    const encodedString = btoa(jsonString);
    return encodedString;
}

export const decodeJSONBase64 = (base64String) => {
    const decodedString = decodeBase64(base64String);
    if (!decodedString) return;
    const jsonData = JSON?.parse(decodedString);
    return jsonData;
}

export const decodeJSONBase64Workfoces = (base64String) => {
    if (!base64String) return [];
    const decodedString = decodeBase64(base64String);
    if (!decodedString || decodedString === 'null' || decodedString === 'undefined' || decodedString === "" ) return [];
    const jsonData = JSON?.parse(decodedString);
    return jsonData;
}

function isValidEmail(email) {
    // Regular expression for validating email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUrl(url) {
    // TODO: we can include fixa domain to strengthen the validation
    // Regular expression for validating URLs
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    return urlRegex.test(url);
}

/**
 * Check if the provided object matches the required format for decoded JSON.
 * @param {Object} obj - The object to be checked.
 * @returns {boolean} Returns true if the object matches the required format, otherwise false.
 */
export const checkDecodedJSONFormat = (obj) => {
    console.log("inside checkdecodedJSON =====", obj)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return false;
    }

    const requiredKeys = ["email", "link_api", "link_platform", "is_admin"];

    for (const key of requiredKeys) {
        if (!(key in obj)) {
            return false;
        }
    }

    if (!isValidEmail(obj["email"]) ||
        !isValidUrl(obj["link_api"]) ||
        !isValidUrl(obj["link_platform"]) ||
        typeof obj["is_admin"] !== 'boolean') {
        return false;
    }
    return true;
}