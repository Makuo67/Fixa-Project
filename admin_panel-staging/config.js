/**
 * USER MESSAGE CONSTANTS
 */
export const API_ERROR_500_MESSAGE =
  "OOPS! Looks like our service is down. Please try again!";
export const API_ERROR_403_MESSAGE =
  "OOPS! Looks like you don't have access to view this resource. Please try again or contact the support team to grant you access";
export const API_ERROR_UNKNOWN_MESSAGE =
  "OOPS! Looks like our service is down. Please try again!";
export const APP_ERROR_MESSAGE =
  "OOPS! Something went wrong. Please check if you have an active internet connection and try again!";

/**
 * API CONSTANT
 */
//export const API_URL = "http://localhost:1337";
export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const USER_AUTHENTICATED_TOKEN = "FIXA_ADMIN_PANEL_AUTH_TOKEN";
export const USER_AUTH_CACHE_TTL = 604800000; // 7 days in ms
