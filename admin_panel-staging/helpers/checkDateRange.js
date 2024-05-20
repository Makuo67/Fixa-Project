export const checkDateRange = (start, end, new_date) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateToCheck = new Date(new_date);

  if (dateToCheck >= startDate && dateToCheck <= endDate) {
    return true;
  } else {
    return false;
  }
};
