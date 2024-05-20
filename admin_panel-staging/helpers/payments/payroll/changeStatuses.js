export const changeStatuses = (payrollData, pusherData) => {
  let data = [];
  for (let i = 0; i < payrollData.workers?.length; i++) {
    if (payrollData.workers[i].id === pusherData.entity_id) {
      payrollData.workers[i].status = pusherData.status;
      data.push(payrollData.workers[i]);
    } else {
      data.push(payrollData.workers[i]);
    }
  }
  payrollData.workers = data;
  return payrollData;
};
