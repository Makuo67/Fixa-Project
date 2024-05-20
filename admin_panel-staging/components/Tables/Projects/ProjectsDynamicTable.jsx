import { Col, Row, Table, ConfigProvider, Empty, notification } from "antd";
import { useRouter } from "next/router";
import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";
import { StyledPayrollTable } from "../PayrollTable.styled";
import SkeletonTable from "../SkeletonTable";
import Error from "../../Error/Error";
import { StyledPaymentsTable } from "../StyledPaymentsTable.styled";
import { useContext, useState } from "react";
import { StyledSupervisorTable } from "./supervisorTable.styled";
import { PusherContext } from "../../../context/PusherContext";
import ExpandedAttendance from "./ExpandedAttendance";

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

export default function DynamicTable({
  data,
  columns,
  error,
  loading,
  extra_left,
  extra_middle,
  extra_right,
  size,
  rowSelection,
  rowKey,
  pagination,
  supervisorTable,
  selectionType,
  showHeader,
  onChange,
  supervisors,
  workerClicked,
  attendanceTable,
  setLoading,emptyStateText
}) {
  const router = useRouter();
  const { client } = useContext(PusherContext);
  const handleInvoiceClicked = (record, event) => {
    if (typeof event.target.className === "object") {
      event.preventDefault();
      return;
    } else if (
      event.target.className &&
      event.target.className.includes("ant-table-cell")
    ) {
      if (client === "" || client === undefined || client === null) {
        notification.error({
          message: "Can not create an invoice for a project with no manager",
        });
      } else {
        event.preventDefault();
        router.push({
          pathname: `/projects/[${router.query?.name}]/invoice`,
          query: { id: record.id, invoice_id: record.invoice_id },
        });
      }
      return;
    } else {
      event.preventDefault();
      return;
    }
  };

  return (
    <StyledPayrollTable>
      {(extra_left || extra_middle || extra_right) && (
        <Row className="extra-nodes" justify="space-between" align="middle">
          <Col span={8}>
            <Row justify="start" gutter={[8, 8]}>
              {extra_left?.map((node, index) => {
                return <Col key={index}> {node} </Col>;
              })}
            </Row>
          </Col>
          <Col span={8}>
            <Row justify="center" gutter={[8, 8]}>
              {extra_middle?.map((node, index) => {
                return <Col key={index}> {node} </Col>;
              })}
            </Row>
          </Col>
          <Col span={8}>
            <Row justify="end" gutter={[8, 8]}>
              {extra_right?.map((node, index) => {
                return <Col key={index}> {node} </Col>;
              })}
            </Row>
          </Col>
        </Row>
      )}
      {loading ? (
        <SkeletonTable columns={columns} rowCount={10} />
      ) : error ? (
        <Error status={error} backHome={true} />
      ) : (
        <StyledPaymentsTable>
          {supervisorTable ? (
            <StyledSupervisorTable>
              <Table
                rowSelection={{
                  type: selectionType,
                  ...rowSelection,
                }}
                columns={columns}
                dataSource={data}
                showHeader={showHeader}
              
              />
            </StyledSupervisorTable>
          ) : attendanceTable ?
            <>
              <Table
                rowKey={rowKey || "id"}
                columns={columns}
                dataSource={data}
                size={size || "large"}
                rowSelection={rowSelection}
                pagination={{
                  total: pagination?.total,
                  defaultCurrent: pagination?.defaultCurrent || 1,
                  defaultPageSize: pagination?.defaultPageSize || 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
                }}
               
                onChange={(pagination) => onChange(pagination)}
                rowClassName={(record) => {
                  if (
                    record?.is_verified === false ||
                    record?.service_available === false
                  )
                    return rowClassName?.error;
                  return "";
                }}
                expandRowByClick
                expandable={{
                  expandedRowRender: (record) => (
                    <ExpandedAttendance
                      status={record?.status}
                      data={record}
                      setLoading={setLoading}
                    />
                  ),
                  expandIcon: ({ expanded, onExpand, record }) =>
                    expanded ? (
                      <CaretUpFilled
                        style={{ color: "#798C9A" }}
                        onClick={(e) => onExpand(record, e)}
                      />
                    ) : (
                      <CaretDownFilled
                        style={{ color: "#798C9A" }}
                        onClick={(e) => onExpand(record, e)}
                      />
                    ),
                }}
              />
            </> : (
              <>
                {" "}
                <Table
                  rowKey={rowKey || "id"}
                  columns={columns}
                  dataSource={data}
                  size={size || "large"}
                  rowSelection={rowSelection}
                  pagination={{
                    total: pagination?.total,
                    defaultCurrent: pagination?.defaultCurrent || 1,
                    defaultPageSize: pagination?.defaultPageSize || 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
                  }}
                  locale={{
                  
                    emptyText: emptyStateText ?? "No Data",
                  }}
                  onChange={(pagination) => onChange(pagination)}
                  rowClassName={(record) => {
                    if (
                      record?.is_verified === false ||
                      record?.service_available === false
                    )
                      return rowClassName?.error;
                    return "";
                  }}
                  onRow={
                    supervisors
                      ? null
                      : (record, index) => ({
                        onClick: (event) => handleInvoiceClicked(record, event),
                      })
                  }
                />
              </>
            )}
        </StyledPaymentsTable>
      )}
    </StyledPayrollTable>
  );
}
