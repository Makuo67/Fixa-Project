import { Col, Row, Table, ConfigProvider, Empty } from "antd";
import { useRouter } from "next/router";
import Error from "../../Error/Error";
import { StyledSupervisorTable } from "./supervisorTable.styled";
import SkeletonTable from "../SkeletonTable"

/**
 *
 * Required params:
 * @param data
 * @param columns
 * @param error
 * @param loading
 *
 * Optional params:
 * @param extra_left
 * @param extra_middle
 * @param extra_right
 * @param size (defaults to "large")
 * @param rowSelection
 * @param rowKey
 * @param pagination
 */

export default function SupervisorTable({
  data,
  columns,
  error,
  loading,
  size,
  rowSelection,
  selectionType,
  showHeader,
}) {
  const router = useRouter();
  return (
    <StyledSupervisorTable>
      {loading ? (
        <SkeletonTable columns={columns} rowCount={10} />
      ) : error ? (
        <Error status={error} backHome={true} />
      ) : (
        <StyledSupervisorTable>
          <StyledSupervisorTable>
            <Table
              rowKey={"id"}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={data}
              showHeader={showHeader}
            />
          </StyledSupervisorTable>
        </StyledSupervisorTable>
      )}
    </StyledSupervisorTable>
  );
}
