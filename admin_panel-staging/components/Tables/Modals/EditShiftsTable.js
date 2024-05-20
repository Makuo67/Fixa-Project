import { Skeleton, Table } from "antd";
import ShiftsModalStyles from "../../Modals/PaymentsModals/EditShiftsModalStyles";
import SkeletonTable from "../SkeletonTable";
import EditShiftsTableSkeleton from "./editShiftsTableSkeleton";

const EditShiftsTable = (props) => {
  return (
    <div>
      <ShiftsModalStyles>
        {props.loading ? (
          <EditShiftsTableSkeleton columns={props.columns} />
        ) : (
          <Table
            columns={props.columns}
            dataSource={props.data}
            showHeader={false}
            pagination={{
              pageSize: 6,
            }}
          />
        )}
      </ShiftsModalStyles>
    </div>
  );
};

export default EditShiftsTable;
