import { Col, Row, Table, ConfigProvider, Empty } from "antd";
import Error from "../Error/Error";
import { StyledPayrollTable } from "./PayrollTable.styled";
import SkeletonTable from "./SkeletonTable";
import { useRouter } from "next/router";
import { StyledWorkForceTable } from "./StyledWorkForceTable";
import { ExpandedPayment } from "../index";
import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";
import { StyledPaymentsTable } from "./StyledPaymentsTable.styled";
import ExpandedPayroll from "../Expand/ExpandedPayroll";
import ExpandedPayout from "../Expand/ExpandedPayout";
import { storePaymentData } from "../../helpers/auth";
import localforage from "localforage";

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
 * @param onChange
 * @param rowClassName
 * @param profileTable
 * @param workerClicked
 * @param isPayment
 * @param paymentsEdit
 * @param isSettings
 * @param isPayroll
 * @param payrollEdit
 * @param expandState
 * @param isPayout
 * @param setLoading
 * @param payrollTableExpanded
 * @param changeExpandedState
 * @param project_id
 * @param loadPayrollInfo
 * @param startDate
 * @param endDate
 * @param isClaims
 * @param isLeaderboard
 * @param isAccess
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
  onChange,
  rowClassName,
  profileTable,
  workerClicked,
  isPayment,
  paymentsEdit,
  isSettings,
  isPayroll,
  payrollEdit,
  expandState,
  isPayout,
  setLoading,
  payrollTableExpanded,
  changeExpandedState,
  project_id,
  loadPayrollInfo,
  startDate,
  endDate,
  isClaims,
  isLeaderboard,
  isAccess,
  isPayoutTemp,
}) {
  const router = useRouter();

  /**
   * This function handles when a worker is clicked.
   * 
   * @param {Object} record - The record object containing worker details.
   * @param {number} index - The index of the clicked row.
   * @param {Object} event - The event object from the click event.
   * @param {string} tab - The tab to be redirected to.
   */
  const handleWorkerClicked = (record, index, event, tab) => {
    // Prevent default action if the target class name includes 'ant-table-selection-column'
    if (typeof event.target.className !== 'string' || !event.target.className.includes('names')) {
      event.preventDefault();
      return;
    } else {
      // Redirect to the workforce page with the worker and project ids
      router.push(
        `/workforce/[${record.names}]?worker_id=${record.worker_id}&tab=${tab}`,
      );
    }
  };

  const handlePayrollWorkerClicked = (record, index, event, tab) => {
    // console.log("record", event.target.className)
    if (event.target.className !== "names") {
      event.preventDefault();
      return;
    } else {
      // router.push( 
      //   `/workforce/[${record.worker_name}]?worker_id=${record.worker_id}&project_id=${record.project_id}&tab=${tab}`,
      // );
      console.log("redirecting to profile")
    }
  }

  // This function handles when a claim is clicked
  const handleClaimClicked = async (record, index, event) => {
    // Prevent default action if the target class name includes 'ant-table-selection-column'
    if (event.target.className.includes('ant-table-selection-column')) {
      event.preventDefault();
      return;
    }
    // Redirect to the payout page
    await storePaymentData({
      payment: record.title,
      paymentType: "Payout",
      payout_id: record.id,
      start_date: "",
      end_date: "",
    });
    localforage.setItem("claim_project", record.project_id);
    router.push(`/finance/payments/${record.id}?payment=Payout`);

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
          <Col span={isPayout ? 4 : 8}>
            <Row justify="center" gutter={[8, 8]}>
              {extra_middle?.map((node, index) => {
                return <Col key={index}> {node} </Col>;
              })}
            </Row>
          </Col>
          <Col span={isPayout ? 12 : 8} >
            <Row justify="end" gutter={[8, 8]}>
              {extra_right && extra_right?.map((node, index) => {
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
        <>
          {profileTable ? (
            <Table
              rowKey={rowKey || "key"}
              columns={columns}
              dataSource={data}
              size={size || "large"}
              rowSelection={rowSelection}
              pagination={{
                total: pagination?.total,
                defaultCurrent: pagination?.defaultCurrent || 1,
                defaultPageSize: pagination?.defaultPageSize,
              }}
            />
          ) : (
            <div>
              {workerClicked ? (
                <StyledWorkForceTable>
                  <Table
                    rowKey={rowKey || "key"}
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
                    onRow={(record, index) => ({
                      onClick: (event) => handleWorkerClicked(record, index, event, "1"),
                    })}
                    // scroll={{
                    //   // x: 0,
                    //   y: 500,
                    // }}
                  />
                </StyledWorkForceTable>
              ) : isPayment ? (
                <StyledPaymentsTable>
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
                    expandRowByClick={true}
                    expandable={{
                      expandedRowRender: (record) => (
                        <ExpandedPayment
                          status={record.status}
                          data={record}
                          setLoading={setLoading}
                          paymentsEdit={paymentsEdit}
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
                </StyledPaymentsTable>
              ) : isClaims ? (
                // ==== CLAIMS TABLE ==== 
                <Table
                  rowKey={rowKey || "id"}
                  columns={columns}
                  dataSource={data}
                  scroll={{ y: 300 }}
                  size={size || "large"}
                  pagination={{
                    total: pagination?.total,
                    defaultCurrent: pagination?.defaultCurrent || 1,
                    defaultPageSize: pagination?.defaultPageSize || 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                  }}
                  onRow={(record, index) => ({
                    onClick: (event) => handleClaimClicked(record, index, event),
                  })}
                //  ==== END OF CLAIMS TABLE ====
                />

              ) : isPayroll ? (
                <StyledPaymentsTable>
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
                    expandRowByClick={expandState}
                    onRow={(record, index) => ({
                      onClick: (event) => handlePayrollWorkerClicked(record, index, event, "1"),
                    })}
                    expandable={{
                      expandedRowRender: (record) => (
                        <ExpandedPayroll
                          status={record.status}
                          data={record}
                          expanded={true}
                          payrollTableExpanded={payrollTableExpanded}
                          changeExpandedState={changeExpandedState}
                          project_id={project_id}
                          setLoading={setLoading}
                          loadPayrollInfo={loadPayrollInfo}
                          startDate={startDate}
                          endDate={endDate}
                          payrollEdit={payrollEdit}
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
                </StyledPaymentsTable>
              ) : isPayout ? (
                <StyledPaymentsTable>
                  <ConfigProvider
                    renderEmpty={() => (
                      <Empty
                        description=""
                        image={""}
                        style={{
                          height: "500px",
                        }}
                      />
                    )}
                  >
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
                        showSizeChanger: pagination?.showSizeChanger,
                        pageSizeOptions: [
                          "10",
                          "20",
                          "50",
                          "100",
                          "500",
                          "1000",
                        ],
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
                      expandRowByClick={expandState}
                      expandable={
                        expandState && {
                          expandedRowRender: (record) => (
                            <ExpandedPayout
                              status={record.status}
                              data={record}
                            // statusChange={handleStatus}
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
                        }
                      }
                    />
                  </ConfigProvider>
                </StyledPaymentsTable>
              ) : isSettings ? (
                <StyledPaymentsTable>
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
                      pageSizeOptions: ["10", "20", "50", "100"],
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
                    expandRowByClick={false}
                  />
                </StyledPaymentsTable>
              ) : isAccess ? (
                <StyledPaymentsTable>
                  <Table
                    rowKey={rowKey || "id"}
                    columns={columns}
                    dataSource={data}
                    size={size || "large"}
                    pagination={false}
                    footer={false}
                    onChange={(pagination) => onChange(pagination)}
                  />
                </StyledPaymentsTable>
              ) : isPayoutTemp ? (
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
                  scroll={{
                    y: 500,
                  }}
                  onChange={(pagination) => onChange(pagination)}
                  rowClassName={(record) => {
                    if (
                      // !record?.is_verified ||
                      record?.is_account_number_exist ||
                      !record?.is_account_number_valid
                    )
                      return rowClassName?.error;
                    return "";
                  }}
                  onRow={isLeaderboard ? (record, index) => ({
                    onClick: (event) => handleWorkerClicked(record, index, event, "3"),
                    // style: { cursor: 'pointer' },
                  }) : null}
                />
              ) : (
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
                  scroll={{
                    y: 500,
                  }}
                  onChange={(pagination) => onChange(pagination)}
                  rowClassName={(record) => {
                    if (
                      //// !record?.is_verified ||
                      // !record?.service_available ||
                      record?.phone_number_exist ||
                      //// record?.is_account_number_exist ||
                      //// !record?.is_account_number_valid ||
                      // !record?.phone_number_verified ||
                      record?.first_name_error ||
                      record?.last_name_error  ||
                      // !record?.valid_nid ||
                      record?.nid_exist
                    )
                      return rowClassName?.error;
                    return "";
                  }}
                  onRow={isLeaderboard ? (record, index) => ({
                    onClick: (event) => handleWorkerClicked(record, index, event, "3"),
                    // style: { cursor: 'pointer' },
                  }) : null}
                />
              )}
            </div>
          )}
        </>
      )}
    </StyledPayrollTable>
  );
}
