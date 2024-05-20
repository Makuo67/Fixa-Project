import Stats from "../../Stats/Stats";
import DynamicTable from "../../Tables/DynamicTable";
import Filters from "./Filters";
import { StyledWorkHistory } from "./WorkHistory .styled";
import { Input } from "antd";
const { Search } = Input;

const columns = [
  {
    title: "DATE",
    dataIndex: "date",
    key: "work_date",
  },
  {
    title: "TOTAL SHIFTS",
    dataIndex: "shift",
    key: "work_shift",
  },
  {
    title: "PROJECT",
    dataIndex: "project",
    key: "work_project",
  },
  {
    title: "SITE ADMIN",
    dataIndex: "admin",
    key: "work_admin",
  },
  {
    title: "TRADE",
    dataIndex: "trade",
    key: "work_trade",
  },
  {
    title: "DEDUCTIONS",
    dataIndex: "deductions",
    key: "work_deductions",
  },
  {
    title: "TOTAL PAID",
    dataIndex: "total",
    key: "work_total",
  },
];

const working_history = [
  {
    date: "1/09/2022",
    shift: "DAY",
    project: "AMAHORO",
    admin: "Welcome",
    trade: "Mason",
    deductions:"2000",
    total: "6000",
  },
  {
    date: "2/09/2022",
    shift: "NIGHT",
    project: "INYANGE",
    admin: "Welcome",
    trade: "Steel bender",
    deductions:"1000",
    total: "6000",
  },
  {
    date: "1/09/2022",
    shift: "NIGHT",
    project: "AMAHORO",
    admin: "Welcome",
    trade: "Mason",
    deductions:"5000",
    total: "6000",
  },
  {
    date: "1/09/2022",
    shift: "NIGHT",
    project: "AMAHORO",
    admin: "Welcome",
    trade: "Mason",
    deductions:"10000",
    total: "6000",
  },
  {
    date: "1/09/2022",
    shift: "NIGHT",
    project: "AMAHORO",
    admin: "Welcome",
    trade: "Mason",
    deductions:"1000",
    total: "6000",
  },
  {
    date: "1/09/2022",
    shift: "NIGHT",
    project: "AMAHORO",
    admin: "Welcome",
    trade: "Mason",
    deductions:"4000",
    total: "6000",
  },
  {
    date: "1/09/2022",
    shift: "NIGHT",
    project: "AMAHORO",
    admin: "Welcome",
    trade: "Mason",
    deductions:"1000",
    total: "6000",
  },
  {
    date: "1/09/2022",
    shift: "NIGHT",
    project: "AMAHORO",
    admin: "Welcome",
    trade: "Mason",
    deductions:"2000",
    total: "6000",
  },
];

const SearchField = () => {
  return (
    <Search
      placeholder="Search worker date, project"
      style={{ width: "500px" }}
      // onSearch={(e) => applyFilters({ search: e })}
    />
  );
};

const total_days = working_history.length;
const deduction = <h3 style={{ color: "red", fontSize: "" }}>10 000 RWF</h3>;
const PaymentHistory = () => {
  return (
    <>
      <StyledWorkHistory>
        <div className="worker-history">
          <Filters className="worker-hist-filters" />
          <div className="stats">
            <div className="stat">
              <Stats title={"DAY SHIFT/NIGHT SHIFTS"} value={"100 / 21"} />
            </div>
            <div className="stat">
              <Stats
                title={" TOTAL PROJECTS"}
                value={"4"}
                sub_title={" LAST MONTH"}
              />
            </div>
            <div className="stat">
              <Stats title={"DEDUCTIONS"} value={deduction} info={true} />
            </div>
            <div className="stat">
              <Stats title={"value EARNINGS"} value={"5 000 000 RWF"} />
            </div>
          </div>
          <div className="history-table">
            <DynamicTable
              data={working_history}
              columns={columns}
              extra_left={[`Total: ${total_days}`]}
              extra_middle={[<SearchField key={0} />]}
            />
          </div>
        </div>
      </StyledWorkHistory>
    </>
  );
};

export default PaymentHistory;