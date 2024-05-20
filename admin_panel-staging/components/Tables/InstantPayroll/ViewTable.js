import { Progress, Select, Space, Table, Tag, Tooltip } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Error from "../../Error/Error";
import NumberFormat from "../../shared/NumberFormat";
import { StyledPayrollTable } from "../PayrollTable.styled";
import SkeletonTable from "../SkeletonTable";
import Pusher from "pusher-js";
import { PUSHER_UPDATE } from "../../../redux/constants/instant-payroll.constants";
import { useDispatch, useSelector } from "react-redux";
import { getOneInstantPayroll } from "../../../redux/actions/instant-payroll.actions";

const { Option } = Select;

const projects = ["Amohoro", "Inyange"];

const getColor = (status) => {
  switch (status) {
    case "failed":
      return "red";
    case "successful":
      return "green";
    case "initiated":
      return "orange";
    default:
      return "blue";
  }
};

export default function ViewTable({ data, loading, error, _start, _limit, total }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const router = useRouter();
  const { project_name, project_id, instant_payroll_id, payroll_type } = router.query;
  const dispatch = useDispatch();
  const change = useSelector((state) => state.instant_payroll.change);

  const [status, setStatus] = useState([]);
  const [count, setCount] = useState(0);
  const [starting_page, setStarting_page] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const countStatuses = () => {
    var _count = 0;
    data.map((item) => {
      if (item.status == "successful") {
        _count += 1;
      }
      setCount(_count);
    });
  };

  useEffect(() => {
    if (payroll_type && instant_payroll_id) {
      // console.log(`transaction-status-${payroll_type}-${instant_payroll_id}`);
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });

      const channel = pusher.subscribe(`transaction-status-${payroll_type}-${instant_payroll_id}`);

      channel.bind(`transaction-status-${payroll_type}-${instant_payroll_id}-event`, function (data) {
        setStatus(data);
      });

      return () => {
        pusher.unsubscribe(`transaction-status-${payroll_type}-${instant_payroll_id}`);
      };
    }
  }, [router.isReady]);

  useEffect(() => {
    console.log(data.find((item) => item.id == status.entity_id));
    if (data.find((item) => item.id == status.entity_id)) {
      console.log("status triggered", status);
      data.find((item) => item.id == status.entity_id).status = status.status;
      dispatch({ type: PUSHER_UPDATE });
    }
  }, [status]);

  console.log("status", status);
  console.log("change", change);

  const capitalize = (string) => {
    const str = string;
    const str2 = str?.charAt(0).toUpperCase() + str?.slice(1);
    return str2;
  };

  const columns = [
    // {
    //   title: "Worker ID",
    //   dataIndex: "id",
    //   key: "id",
    // },
    {
      title: "Worker Name",
      dataIndex: "entity_name",
      key: "entity_name",
      ellipsis: true,
      render: (_, data) => {
        return capitalize(data.entity_name);
      },
    },
    {
      title: "MoMo Account",
      dataIndex: "phone_number",
      key: "phone_number",
    },

    {
      title: "Total Earnings",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <NumberFormat value={value} />,
    },
    {
      title: "Transaction Status",
      dataIndex: "status",
      key: "status",
      width: 200,
      render: (status, worker) => {
        return (
          <Tooltip title={worker.error_message}>
            <Tag color={getColor(status)} key={status}>
              {status?.toUpperCase()}
            </Tag>
          </Tooltip>
        );
      },
    },
  ];

  const handleTabChange = (page) => {
    var _limit = 10;
    var _start = 0;
    let pge = 0;

    if (page === 1) {
      _start = 0;
      setCurrentPage(1);
      console.log("hello, ----", page);
      dispatch(getOneInstantPayroll(instant_payroll_id, project_id, payroll_type, _start, _limit));
    } else {
      pge = _limit * (page - 1);
      setStarting_page(pge);
      _start = pge;
      setCurrentPage(page);
      dispatch(getOneInstantPayroll(instant_payroll_id, project_id, payroll_type, _start, _limit));
    }
  };

  // console.log(currentPage, "console of current page--");

  return (
    <StyledPayrollTable>
      {loading ? (
        <SkeletonTable columns={columns} rowCount={10} />
      ) : error ? (
        <Error status={error} backHome={true} />
      ) : (
        <div>
          <div style={{ padding: 20, display: "flex" }}>
            <h3 style={{ whiteSpace: "nowrap", marginRight: 20, marginBottom: 0 }}>Transaction progress: </h3>
            <div style={{ width: "100%" }}>
              <Progress
                percent={parseInt((data?.filter((o) => o.status == "successful").length / data?.length) * 100)}
                status={data?.filter((o) => o.status == "successful").length == data?.length}
              />
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: currentPage,
              showSizeChanger: false,
              pageSize: 10,
              total: total,
              onChange: (page) => handleTabChange(page),
            }}

            // onChange =changeTab(_start, _limit)}
          />
        </div>
      )}
    </StyledPayrollTable>
  );
}
