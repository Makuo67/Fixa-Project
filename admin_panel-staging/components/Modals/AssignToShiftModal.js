import { Button, Modal, Select, notification, DatePicker } from "antd";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { assignToShift } from "../../redux/actions/shift.actions";
import { getWorkersWithNames} from "../../redux/actions/workforce.actions";
import { capitalizeAll } from "../../helpers/capitalize";

const { Option } = Select;
const { RangePicker } = DatePicker;

const AssignToShiftModal = ({
  isVisible,
  hideModal,
  selected_workers,
  clearSelection,
  project_id,
}) => {
  const dispatch = useDispatch();
  const [worker_list, setWorker_list] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [shiftType, setShiftType] = useState(null);

  const workers = useSelector((state) => state.workforce.list);
  const router = useRouter();
  const query = router.query;

  useEffect(() => {
    dispatch(getWorkersWithNames());
  }, [dispatch]);

  const openNotificationSuccess = () => {
    notification.success({
      message: "Success",
      description: `Assigned worker to shift!`,
    });
  };

  const openNotificationError = () => {
    notification.error({
      message: "Error",
      description: `Could not assign to shift!`,
    });
  };

  const handleCancel = () => {
    hideModal();
  };

  const handleOk = () => {
    if (dateRange.length < 2 || !shiftType) {
      openNotificationError();
      return;
    }

    // const worker_names = selected_workers.map(
    //   (workerId) =>
    //     worker_list.find((worker) => worker.worker_id === workerId)?.name
    // );
    const scheduleData = {
      worker_names,
      project_id,
      start_date: dateRange[0].format("YYYY-MM-DD"),
      end_date: dateRange[1].format("YYYY-MM-DD"),
      shift_type: shiftType,
    };

    dispatch(assignToShift(scheduleData)).then((data) => {
      if (data.status === "success") {
        clearSelection();
        openNotificationSuccess();
        router.replace({
          pathname: "/shifts",
          query: { ...router.query, current_page: 1, _start: 0, _limit: -1 },
        });
      } else {
        openNotificationError();
      }
    });

    hideModal();
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleShiftTypeChange = (value) => {
    setShiftType(value);
  };

  return (
    <Modal
      title="Assign to Shift"
      okText="Assign"
      visible={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <div className="flex gap-4 justify-end" key="footer">
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
              selected_workers.length && dateRange.length === 2 && shiftType
                ? "primaryBtn"
                : "primaryBtnDisabled"
            }`}
            onClick={handleOk}
            disabled={
              !selected_workers.length || dateRange.length !== 2 || !shiftType
            }
          >
            Assign
          </Button>
        </div>,
      ]}
    >
      <Select
        allowClear
        mode="multiple"
        placeholder="Select workers"
        style={{ width: "100%" }}
        size="large"
        onChange={(selected) => setWorker_list(selected)}
      >
        {workers?.map((worker) => (
          <Option value={worker.name} key={worker.worker_names}>
            {capitalizeAll(worker.name)}
          </Option>
        ))}
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

export default AssignToShiftModal;
