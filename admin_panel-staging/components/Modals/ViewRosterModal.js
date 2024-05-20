import React, { useState, useEffect } from "react";
import { Button, Modal, Select, DatePicker, Table, Form } from "antd";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  getAllWorkforce,
  fetchFilteredWorkers,
} from "../../redux/actions/workforce.actions";
import { getAllProjects } from "../../redux/actions/project.actions";
import { capitalizeAll } from "../../helpers/capitalize";

const { Option } = Select;
const { RangePicker } = DatePicker;

const ViewRosterModal = (props) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [workerList, setWorkerList] = useState([]);
  const projects = useSelector((state) => state.project.list);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [isFilteredModalVisible, setIsFilteredModalVisible] = useState(false);

  const [filters, setFilters] = useState({
    dateRange: [],
    project_id: null,
    shiftType: null,
  });

  // useEffect(() => {
  //   dispatch(getAllProjects());
  //   dispatch(getAllWorkforce({}, 1, 10));
  // }, [dispatch]);

  const handleCancel = () => {
    props.hideModal();
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const query = {
        project_id: values.project_id,
        start_date: dayjs(values.dateRange[0]).format("YYYY-MM-DD"),
        end_date: dayjs(values.dateRange[1]).format("YYYY-MM-DD"),
        shift_type: values.shiftType,
      };

      dispatch(fetchFilteredWorkers(query)).then((response) => {
        setWorkerList(response.data);
        setFiltersApplied(true);
        setIsFilteredModalVisible(true);
      });
    });
  };

  const handleFilteredModalCancel = () => {
    setIsFilteredModalVisible(false);
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Service", dataIndex: "service", key: "service" },
    {
      title: "Daily Earnings",
      dataIndex: "daily_earnings",
      key: "daily_earnings",
    },
    { title: "Phone Number", dataIndex: "phone_number", key: "phone_number" },
    { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Project", dataIndex: "project", key: "project" },
  ];

  const filteredColumns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Service", dataIndex: "service", key: "service" },
    { title: "Shift", dataIndex: "shift", key: "shift" },
  ];

  return (
    <>
      <Modal
        title="View Roster"
        visible={props.isVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="ok" type="primary" onClick={handleOk}>
            View
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: "Please select a date range" }]}
          >
            <RangePicker />
          </Form.Item>
          <Form.Item
            name="project_id"
            label="Project"
            rules={[{ required: true, message: "Please select a project" }]}
          >
            <Select placeholder="Select project">
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {capitalizeAll(project.name)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="shiftType"
            label="Shift Type"
            rules={[{ required: true, message: "Please select a shift type" }]}
          >
            <Select placeholder="Select shift type">
              <Option value="day">Day</Option>
              <Option value="night">Night</Option>
            </Select>
          </Form.Item>
        </Form>

        {filtersApplied && (
          <Table dataSource={workerList} columns={columns} rowKey="id" />
        )}
      </Modal>

      <Modal
        title="Filtered Roster"
        visible={isFilteredModalVisible}
        onCancel={handleFilteredModalCancel}
        footer={[
          <Button key="cancel" onClick={handleFilteredModalCancel}>
            Close
          </Button>,
        ]}
      >
        <Table dataSource={workerList} columns={filteredColumns} rowKey="id" />
      </Modal>
    </>
  );
};

export default ViewRosterModal;
