import { Button, Modal, Select, notification, DatePicker } from "antd";
import React, { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { buildExportList } from "../../helpers/workforce";
import { assignToProject } from "../../redux/actions/bulk-actions.actions";
import { getAllProjects } from "../../redux/actions/project.actions";
import { assignWorkerToProject } from "../../redux/actions/workerprofile.actions";
import { getAllWorkforce } from "../../redux/actions/workforce.actions";
import { capitalizeAll } from "../../helpers/capitalize";

const { Option } = Select;

// Date range Picker
const { RangePicker } = DatePicker;

const AssignToProjectModal = (props) => {
  const dispatch = useDispatch();
  const [project_id, set_project_id] = useState(null);
  const [worker_list, setWorker_list] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  // Date and Shift Type
  const [dateRange, setDateRange] = useState([]);
  const [shiftType, setShiftType] = useState(null);

  const projects = useSelector((state) => state.project.list);
  var workersLength = 0;

  const router = useRouter();
  const query = router.query;

  useEffect(() => {
    buildExportList(query).then((response) => {
      setWorker_list(response);
      setFiltersApplied(true);
    });
  }, [router.query]);
  var worker_ids = [];
  if (props.selected_workers.length > 0) {
    workersLength = props.selected_workers.length;
    //---message has selecting
    for (var i = 0; i < worker_list.length; i++) {
      for (var j = 0; j < props.selected_workers.length; j++) {
        if (worker_list[i].worker_id == props.selected_workers[j])
          worker_ids.push(`${worker_list[i].worker_id}`);
      }
    }
  }
  const openNotificationSuccess = () => {
    notification.success({
      message: "Success",
      description: `Assigned ${props.selected_workers.length} worker${
        props.selected_workers.length > 1 ? "s" : ""
      } to project ${projects.find((o) => o.id == project_id).name}!`,
    });
  };

  const openNotificationError = () => {
    notification.error({
      message: "Error",
      description: `Could not assign ${props.selected_workers.length} worker${
        props.selected_workers.length > 1 ? "s" : ""
      } to project ${projects.find((o) => o.id == project_id).name}!`,
    });
  };

  const handleCancel = () => {
    props.hideModal();
  };
  const handleOk = () => {
    if (dateRange.length < 2 || !shiftType) {
      openNotificationError();
      return;
    }
    // Adding date range and shift type
    const scheduleData = {
      worker_ids,
      project_id,
      start_date: dateRange[0].format("YYYY-MM-DD"),
      end_date: dateRange[1].format("YYYY-MM-DD"),
      shift_type: shiftType,
    };

    dispatch(assignToProject(scheduleData)).then((data) => {
      if (data.status == "success") {
        props.clearSelection();
        openNotificationSuccess();
        // dispatch(getAllWorkforce());
        router.replace({
          pathname: "/workforce",
          query: {
            ...router.query,
            current_page: 1,
            _start: 0,
            _limit: -1,
          },
        });
      } else openNotificationError();
    });

    props.hideModal();
  };

  const handleProjectChange = (value) => {
    set_project_id(value);
  };

  // Addition to Handle Date change and Shift Change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleShiftTypeChange = (value) => {
    setShiftType(value);
  };

  useEffect(() => {
    dispatch(getAllProjects());
  }, []);

  const shouldBeVisible = props.isVisible;

  return (
    <Modal
      title="Assign to Project"
      okText="Assign"
      visible={shouldBeVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <div className="flex gap-4 justify-end" key={0}>
          <Button
            type="secondary"
            className="secondaryBtn"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            className={`${
              project_id && dateRange.length === 2 && shiftType
                ? "primaryBtn"
                : "primaryBtnDisabled"
            }`}
            onClick={handleOk}
            disabled={!project_id || dateRange.length !== 2 || !shiftType}
          >
            Assign
          </Button>
        </div>,
      ]}
    >
      <p className="text-gray py-2">
        Assign {workersLength} worker
        {workersLength > 1 && "s"} to project:
      </p>
      <Select
        allowClear
        placeholder="Select project"
        style={{ width: "100%" }}
        size="large"
        onChange={handleProjectChange}
      >
        {projects?.map((item) => {
          return (
            <Option value={item.id} key={item.id} project_name={item.name}>
              {capitalizeAll(item.name)}
            </Option>
          );
        })}
      </Select>

      <RangePicker
        style={{ width: "100%", marginTop: "16px" }}
        onChange={handleDateRangeChange}
      />
      <Select
        allowClear
        placeholder="Select shift type"
        style={{ width: "100%", marginTop: "16px" }}
        size="large"
        onChange={handleShiftTypeChange}
      >
        <Option value="day">Day</Option>
        <Option value="night">Night</Option>
      </Select>
    </Modal>
  );
};
export default AssignToProjectModal;
