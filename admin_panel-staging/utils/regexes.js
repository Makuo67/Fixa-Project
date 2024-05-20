/**
 * Validates a name.
 *
 * @param {string} name - The name to be validated.
 * @return {boolean} Whether the name is valid or not.
 */
export function validateName(name) {
  if (!name) return false
  const trimmedName = name?.toString()?.trim()
  const regex = /^[a-zA-Z\s'-]+$/;
  if (regex.test(trimmedName)) {
    return true
  } else { return false }
}

/**
 * Validates the given NID number.
 *
 * @param {string} str - The NID number to be validated.
 * @return {boolean} Returns true if the NID number is valid, otherwise false.
 */
export function validateNidNumber(str) {
  if (!str) return false
  const trimmedStr = str?.toString().trim();
  if (/^\d{16}$/.test(trimmedStr)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Validates a phone number.
 *
 * @param {string} str - The phone number to be validated.
 * @return {boolean} - Returns true if the phone number is valid, false otherwise.
 */
export function validatePhoneNumber(str) {
  if (!str) return false
  // Remove leading and trailing whitespace (optional)
  const trimmedStr = str?.toString().trim();
  if (
    trimmedStr.startsWith("7") && /^\d{9}$/.test(trimmedStr)
    || trimmedStr.startsWith("07") && /^\d{10}$/.test(trimmedStr)
    || trimmedStr.startsWith("250") && /^\d{12}$/.test(trimmedStr)
    || trimmedStr.startsWith("+250") && /^\d{13}$/.test(trimmedStr)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Validates a given string to check if it represents a valid daily earnings value.
 *
 * @param {string} str - The string to be validated.
 * @return {boolean} Returns true if the string represents a valid daily earnings value, otherwise false.
 */
export function validateDailyEarnings(str) {
  // Remove leading and trailing whitespace (optional)
  if (!str) return false
  const trimmedStr = str?.toString().trim();
  if (/^\d+$/.test(trimmedStr)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Checks if the given message contains HTML tags.
 *
 * @param {string} message - The message to be checked.
 * @return {boolean} Returns true if the message contains HTML tags, otherwise false.
 */
export const hasHtmlTags = (message) => {
  const htmlRegex = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
  return htmlRegex.test(message);
}

export const validateTinInput = (rule, value) => {
  if (value && value.length === 9 && !isNaN(value)) {
    return Promise.resolve();
  }
  return Promise.reject('The TIN number must be exactly 9 digits.');
};
export const validatePhoneInput = (rule, value) => {
  if (value && value.length === 10 && !isNaN(value) && value.startsWith('07')) {
    return Promise.resolve();
  }
  return Promise.reject('Phone number format 07xxxxxxxx');
};
export const validateEmail = (rule, value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (value && emailRegex.test(value)) {
    return Promise.resolve();
  }
  return Promise.reject('Please enter a valid email address.');
};

export const replaceSpacesWithUnderscores = (value) => {
  if (value) {
    const str = value?.toString().trim();
    return str.replace(/\s/g, "_");
  } else {
    return "";
  }
}

export const removeLastEmptyObject = (array) => {
  for (let i = array.length - 1; i >= 0; i--) {
    let obj = array[i];
    let values = Object.keys(obj)
      .filter(key => key !== "id") // Exclude 'id' property
      .map(key => obj[key]);
    values.every(value => value === "" || typeof value === "undefined")

    if (values.every(value => value.trim() === "" || typeof value === "undefined")) {
      // Remove the empty line at the end
      array.pop();
    } else {
      // Once a non-empty line is encountered, stop the loop
      break;
    }
  }
  return array;
}


export const rssbCodeValidation = (rule, value) => {
  if (!value) {
    return Promise.resolve();
  }
  if (value && /\d/.test(value?.toString()?.trim()) && /[a-zA-Z]/.test(value?.toString()?.trim())) {
    return Promise.resolve();
  }
  return Promise.reject('RSSB Code format 12345678X');
};