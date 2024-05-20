const NumberFormat = ({ value }) => {
  return <span>{value ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0}</span>;
};

export default NumberFormat;
