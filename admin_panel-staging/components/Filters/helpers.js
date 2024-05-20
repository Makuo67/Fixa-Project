const queryString = require("query-string");

export default function objectToQuery(filters) {
  const obj = {};
  Object.assign(obj, filters);

  if (Object.hasOwn(obj, "current_page")) delete obj["current_page"];
  if (Object.hasOwn(obj, "name")) delete obj["name"];
  if (Object.hasOwn(obj, "worker_id")) delete obj["worker_id"];
  if (Object.hasOwn(obj, "tab")) delete obj["tab"]; // removing the tab in query
  if (!Object.hasOwn(obj, "_start")) obj["_start"] = 0;
  if (!Object.hasOwn(obj, "_limit")) obj["_limit"] = 10;

  var query_string = "?" + queryString.stringify(obj, { encode: false });

  if (Object.hasOwn("worker_id") && !Object.hasOwn(obj, "assigned")) query_string += "&_sort=is_active:DESC";
  return query_string;
}
