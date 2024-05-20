import { useEffect } from "react";
import { useState } from "react";
import {
  Form,
  DatePicker,
  Button,
  Empty,
} from "antd";
import dayjs from "dayjs";

import { StyledAttendance } from "./Attendancelist.styled";
import { Icon } from "@iconify/react";
import {
  CalendarOutlined,
  CloseCircleFilled,
  LoadingOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { CSVLink } from "react-csv";

import DynamicTable from "../../Tables/Projects/ProjectsDynamicTable";
import { AttendanceTableColumns } from "../../Columns/AttendanceTableColumns";
import AttendanceStat from "./AttendanceStat";
import { StatsContainer } from "./AttendanceStat/StyledAttendanceStat.styled";
import { getAttendanceAggregates, getProjectAttendances } from "../../../helpers/projects/projects";
import { ExportAttendanceColumns } from "../../Export/ExportPaymentsColumns";
import { StyledExportStyled } from "../../Export/StyledExport.styled";
import { capitalizeAll } from "../../../helpers/capitalize";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { checkUserAccessToEntity } from "@/utils/accessLevels";
import ErrorComponent from "@/components/Error/Error";
import objectToQuery from "@/components/Filters/helpers";

const { RangePicker } = DatePicker;
const Attendance = () => {
  const router = useRouter();
  const { id, name } = router.query;

  const [form] = Form.useForm();
  const [aggregates, setAggregates] = useState({});
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastWeek, setLastWeek] = useState("");
  const [thisWeek, setThisWeek] = useState("");
  const [showCaption, setShowCaption] = useState(true);
  const [entityAccess, setEntityAccess] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [paginationQueries, setPaginationQueries] = useState({
    _sort: "date:DESC",
    date_gte: "",
    date_lte: "",
    project_id: id,
    _start: 0,
    _limit: 10
  })

  const { userProfile } = useUserAccess();
  const { user_access, user_level } = userProfile
  useEffect(() => {
    setEntityAccess(checkUserAccessToEntity("project", "attendance", user_access))
  }, [user_access])

  useEffect(() => {
    if (id && loading) {

      if (paginationQueries.date_gte === "") delete paginationQueries.date_gte
      if (paginationQueries.date_lte === "") delete paginationQueries.date_lte

      const filters = objectToQuery(paginationQueries);
      getProjectAttendances(filters)
        .then((response) => {
          setAttendances(response?.attendances);
          setAggregates(response?.aggregates);
          setTotal(response?.meta?.pagination?.total);
          setLoading(false);
        });
    }
  }, [id, loading])


  const onFinish = (values) => {
    if (values.date !== undefined && values.date !== null) {
      setPaginationQueries({ ...paginationQueries, date_gte: dayjs(values.date[0]).format("YYYY-MM-DD"), date_lte: dayjs(values.date[1]).format("YYYY-MM-DD") })
      setLoading(true);

    } else {
      setPaginationQueries({ ...paginationQueries, date_gte: "", date_lte: "" })
      setLoading(true);
    }
  };

  const handleTableChange = (pagination) => {

    setLimit(pagination.pageSize);
    setCurrentPage(pagination.current);

    if (pagination.current === 1) {
      const offset = pagination.current * pagination.pageSize - pagination.pageSize;
      setPaginationQueries({ ...paginationQueries, _start: offset, _limit: pagination.pageSize })
      setLoading(true);

    } else {
      const pageStrt = pagination.pageSize * (pagination.current - 1);
      setPaginationQueries({ ...paginationQueries, _start: pageStrt, _limit: pagination.pageSize })
      setLoading(true);
    }
  };

  return (
    <StyledAttendance>
      {entityAccess && (<Form
        form={form}
        initialValues={{
          remember: true,
        }}
        onFinish={onFinish}
        autoComplete="off"
        className="form"
      >
        <Form.Item
          name="date"
        // rules={[{ required: true, message: "Missing Date" }]}
        >
          <RangePicker
            format={"YYYY-MM-DD"}
            allowClear={true}
            className="rangePicker"
          // defaultValue={[dayjs().subtract(6, "days"), dayjs()]}
          />
        </Form.Item>
        {paginationQueries.date_gte && paginationQueries.date_lte && <Form.Item>
          <Button className="secondaryBtn"
            // htmlType="submit"
            type="primary"
            onClick={() => {
              setPaginationQueries({ ...paginationQueries, date_gte: "", date_lte: "" })
              form.resetFields();
              setLoading(true);
            }}
            >
            <ClearOutlined />
            <span>Clear</span>
          </Button>
        </Form.Item>}
        <Form.Item>
          <Button className="primaryBtn"
            htmlType="submit"
            type="primary">
            <Icon icon="icon-park-outline:filter" color="white" />
            <span>Apply</span>
          </Button>
        </Form.Item>
      </Form>)}
      {/* Stats Cards  */}

      <div className="wrapper">
        <div className="stats">
          <StatsContainer>
            <AttendanceStat
              loading={loading}
              numbers={aggregates?.total_active_workers}
              showLastWeekText={showCaption}
              icon={
                <Icon
                  icon="healthicons:construction-worker"
                  color="#0291C8"
                />
              }
              title="Total active workers"
            />
            <AttendanceStat
              loading={loading}
              numbers={aggregates?.total_shifts}
              showLastWeekText={showCaption}
              icon={<Icon icon="fa6-solid:person-digging" color="#0291C8" />}
              title="Total shifts"
            />
            <AttendanceStat
              loading={loading}
              numbers={aggregates?.total_day_shifts}
              showLastWeekText={showCaption}
              icon={<Icon icon="fa-solid:sun" color="#0291C8" />}
              title="Total Day shifts"
            />
            <AttendanceStat
              loading={loading}
              numbers={aggregates?.total_night_shifts}
              icon={<Icon icon="bi:moon-stars-fill" color="#0291C8" />}
              title="Total Night shifts"
            />
          </StatsContainer>
        </div>

        {/* Attendance table */}
        <DynamicTable
          rowKey={`id`}
          data={attendances}
          columns={AttendanceTableColumns}
          extra_right={[
            <StyledExportStyled key={0}>
              {entityAccess ? <Button
                type="primary"
                className="primaryBtn"
                style={{ width: "100%" }}
                icon={<Icon icon="uil:file-export" color="white" height={18} />}
                // loading={loading}
                onMouseOver={(e) => { e.target.style.color = '#fff' }}
              >
                <CSVLink
                  data={attendances && attendances.length > 0 ? attendances : []}
                  headers={ExportAttendanceColumns}
                  filename={`${capitalizeAll(name)} ${lastWeek} - ${thisWeek} Attendance List.csv`}
                  disabled={attendances && attendances.length > 0 ? false : true}
                  className="primaryBtn"
                  color="white"
                >
                  Export Attendances
                </CSVLink>
              </Button> : ""}
            </StyledExportStyled>
          ]}
          attendanceTable={true}
          loading={loading}
          setLoading={setLoading}
          pagination={{
            total: total,
            current: currentPage,
            defaultCurrent: currentPage,
            pageSize: limit,
            defaultPageSize: limit,
          }}
          onChange={(value) => handleTableChange(value)}
        />
      </div>
    </StyledAttendance>
  );
};

export default Attendance;
