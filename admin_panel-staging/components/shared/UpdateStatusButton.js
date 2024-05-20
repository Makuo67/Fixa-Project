import { Button, notification } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { getInstantPayrollStatus } from "../../redux/actions/instant-payroll.actions";

const UpdateStatusButton = ({ loading, payroll_id, onClick }) => {
  const dispatch = useDispatch();
  return (
    <Button
      size="large"
      // type={size !== "large" && "primary"}
      shape="round"
      icon={<SyncOutlined spin={loading} />}
      onClick={() => onClick()}
    >
      Update Statuses
    </Button>
  );
};

export default UpdateStatusButton;
