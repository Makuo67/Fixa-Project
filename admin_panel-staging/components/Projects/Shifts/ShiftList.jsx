import React, { useEffect, useState } from "react";
import { Form, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import { StyledAttendance } from "./../ProjectAttendance/Attendancelist.styled";
import { Icon } from "@iconify/react";
import { ClearOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import DynamicTable from "../../Tables/Projects/ProjectsDynamicTable";
import { ShiftTableColumns } from "../../Columns/ShiftTableColumns";
import { getProjectAttendances } from "../../../helpers/projects/projects";
import { StyledExportStyled } from "../../Export/StyledExport.styled";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { checkUserAccessToEntity } from "@/utils/accessLevels";
import AssignToShiftModal from "../../Modals/AssignToShiftModal";
import objectToQuery from "@/components/Filters/helpers";

const { RangePicker } = DatePicker;

const ShiftList = () => {
  const router = useRouter();
  const { id, name } = router.query;

  const [form] = Form.useForm();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityAccess, setEntityAccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const [paginationQueries, setPaginationQueries] = useState({
    _sort: "date:DESC",
    date_gte: "",
    date_lte: "",
    project_id: id,
    _start: 0,
    _limit: 10,
  });

  const { userProfile } = useUserAccess();
  const { user_access } = userProfile;

  useEffect(() => {
    setEntityAccess(checkUserAccessToEntity("project", "attendance", user_access));
  }, [user_access]);

  useEffect(() => {
    if (id && loading) {
      const filters = objectToQuery({
        ...paginationQueries,
        date_gte: paginationQueries.date_gte || undefined,
        date_lte: paginationQueries.date_lte || undefined,
      });
      getProjectAttendances(filters).then((response) => {
        setAttendances(response?.attendances);
        setTotal(response?.meta?.pagination?.total);
        setLoading(false);
      });
    }
  }, [id, loading, paginationQueries]);

  const onFinish = (values) => {
    const date_gte = values.date ? dayjs(values.date[0]).format("YYYY-MM-DD") : "";
    const date_lte = values.date ? dayjs(values.date[1]).format("YYYY-MM-DD") : "";
    setPaginationQueries({ ...paginationQueries, date_gte, date_lte });
    setLoading(true);
  };

  const handleTableChange = (pagination) => {
    const pageStrt = pagination.pageSize * (pagination.current - 1);
    setPaginationQueries({ ...paginationQueries, _start: pageStrt, _limit: pagination.pageSize });
    setLimit(pagination.pageSize);
    setCurrentPage(pagination.current);
    setLoading(true);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const clearSelection = () => {
    setSelectedWorkers([]);
  };

  return (
    <StyledAttendance>
      {entityAccess && (
        <Form
          form={form}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
          className="form"
        >
          <Form.Item name="date">
            <RangePicker format={"YYYY-MM-DD"} allowClear={true} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Filter
          </Button>
        </Form>
      )}

      <Button
        type="primary"
        icon={<Icon icon="carbon:add" width={24} />}
        onClick={showModal}
        style={{ display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        paddingBottom: '7px', }}
      >
        Assign to Shift
      </Button>
      <DynamicTable
        columns={ShiftTableColumns}
        dataSource={attendances}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: limit,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        onChange={handleTableChange}
      />

      <AssignToShiftModal
        isVisible={isModalVisible}
        hideModal={handleModalClose}
        selected_workers={selectedWorkers}
        clearSelection={() => setSelectedWorkers([])}
        project_id={id}
      />
    </StyledAttendance>
  );
};

export default ShiftList;
