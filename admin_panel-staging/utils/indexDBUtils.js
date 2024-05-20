// clear indexDB func
import { del } from 'idb-keyval';
import localforage from 'localforage';
import { decodeJSONBase64, encodeJSONBase64 } from './decodeBase';

export const clearIndexDB = async (key) => {
  await del(key);
  return true;
}

export const saveIndexDB = async (key, value) => {
  // console.log("key 🔑🔑🔑", key, "value 🫙🫙🫙", value)
  return await localforage.setItem(key, encodeJSONBase64(value));
}

export const getIndexDB = async (key) => {
  // console.log("key 🔑🔑🔑", key)
  return await localforage.getItem(key);
}