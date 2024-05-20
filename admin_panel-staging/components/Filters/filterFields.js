// const review = [
//   { title: "Worker first name", dataIndex: "worker.first_name" },
//   { title: "Worker last name", dataIndex: "worker.last_name" },
//   { title: "Phone number", dataIndex: "worker.phone_number" },
//   //   { title: "Phone number verification", dataIndex: "is_momo" },
//   //   { title: "Total shifts", dataIndex: "total_shifts" },
//   { title: "Earnings", dataIndex: "deducted_earnings" },
//   { title: "Total deductions", dataIndex: "total_deductions" },
//   //   { title: "Service name", dataIndex: "service_name" },
//   //   { title: "Level", dataIndex: "level" },
//   //   { title: "Daily Rate", dataIndex: "daily_rate" },
// ];
// const mtn = [
//   { title: "Worker first name", dataIndex: "worker.first_name" },
//   { title: "Worker last name", dataIndex: "worker.last_name" },
//   { title: "Phone number", dataIndex: "worker.phone_number" },
//   //   { title: "Phone number verification", dataIndex: "is_momo" },
//   { title: "Deducted earnings", dataIndex: "deducted_earnings" },
//   { title: "On hold", dataIndex: "on_hold" },
// ];
// const summary = [
//   { title: "Worker first name", dataIndex: "worker.first_name" },
//   { title: "Worker last name", dataIndex: "worker.last_name" },
//   { title: "Phone number", dataIndex: "worker.phone_number" },
//   //   { title: "Phone number verification", dataIndex: "is_momo" },
//   { title: "Earnings", dataIndex: "deducted_earnings" },
//   { title: "Status", dataIndex: "status" },
// ];

const review = [
  { title: "Worker name", dataIndex: "worker_name" },
  { title: "Phone number", dataIndex: "worker_phone_number" },
  { title: "Earnings", dataIndex: "take_home" },
  { title: "Total deductions", dataIndex: "total_deductions" },
];
const mtn = [
  { title: "Worker name", dataIndex: "worker_name" },
  { title: "Phone number", dataIndex: "worker_phone_number" },
  { title: "Earnings", dataIndex: "take_home" },
  { title: "On hold", dataIndex: "on_hold" },
];
const summary = [
  { title: "Worker name", dataIndex: "worker_name" },
  { title: "Phone number", dataIndex: "worker_phone_number" },
  { title: "Earnings", dataIndex: "take_home" },
  { title: "Status", dataIndex: "status" },
];
export const filter_fields = {
  review: review,
  MTN: mtn,
  summary: summary,
};
