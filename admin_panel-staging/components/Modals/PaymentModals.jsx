import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Modal, Select, DatePicker, Button, Input, notification, Skeleton } from "antd";
import moment from 'moment';

import Content from "../Uploads/WorkerExcel.styled";
import { useDispatch, useSelector } from "react-redux";
import { createPayroll } from "../../helpers/payments/payments_home";
import { createClaim, createPayout, getClaims } from "../../helpers/payments/payout/payout";
import { storePaymentData } from "../../helpers/auth";
import DynamicTable from "../Tables/DynamicTable";
import { ClaimsTableColumns } from "../Columns/PaymentsTableColumns";
import { StyledPayment } from "../Tables/PayrollTable.styled";
import MissingData from "../shared/MissingData";
import { capitalizeAll } from "../../helpers/capitalize";
import { getProjects } from "@/redux/actions/workforce.actions";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider"
import { getAllProjects } from "@/redux/actions/project.actions";

const { Option } = Select;

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const dateFormat = "YYYY-MM-DD";

const styles = {
  modalTitle: "flex justify-start text-center w-full",
}

export const ModalTitle = ({ title, style }) => (
  <Content>
    {style ? (
      <h1 className={`import ${style}`}>{title}</h1>
    ) :
      (
        <h1 className={`import ${styles.modalTitle} `}>{title}</h1>
      )}
  </Content>
);

// Payroll Modal content and states
const PayrollContent = ({
  handlePaymentClicked,
  type,
  loadingButton,
  nextDisabled,
  setNextDisabled,
  projects
}) => {
  // const { projects } = useSelector((state) => state.workforce.filters);
  // const [projects, setProjects] = useState([])
  const [payrollData, setPayrollData] = useState({
    project: "",
    start_date: "",
    end_date: "",
  });
  //const [nextDisabled, setNextDisabled] = useState(true);

  // const dispatch = useDispatch();

  // useEffect(() => {
  //   // dispatch(getProjects()).then((response) => {
  //   //   setProjects(response)
  //   // });
  //   dispatch(getAllProjects()).then((response) => {
  //     setProjects(response.filter((project) => project.progress_status === "ongoing"))
  //   })
  // }, [])

  useEffect(() => {
    handlePayrollPeriod();
  }, [payrollData]);

  //Handling the payout input change
  const handlePayrollPeriod = () => {
    if (
      payrollData.project.toString().length > 0 &&
      payrollData.start_date.length > 0 &&
      payrollData.end_date.length > 0
    ) {
      setNextDisabled(false);
    } else {
      setNextDisabled(true);
    }
  };
  const disabledDate = (current) => {
    return current && current.valueOf() > Date.now();
  };

  return (
    <Content>
      <div className="payrollContent">
        <div className="contentTitle">
          <h2 className={`text-2xl ${styles.modalTitle}`}>
            Select Payroll period
          </h2>
          <p className="subTitle text-lg">
            Generate a payroll from project attendance
          </p>
        </div>

        <div className="payrollBody">
          <div className="payrollProject">
            <h3>Project</h3>

            <Select
              allowClear={true}
              placeholder="Please select"
              className="formInput"
              onChange={(e) => {
                setPayrollData((pre) => {
                  return { ...pre, project: e };
                });
              }}
            >
              {projects?.map((item) => {
                return (
                  <Option
                    value={item.id.toString()}
                    key={item.id}
                    title={item.name}
                  >
                    {capitalizeAll(item.name)}
                  </Option>
                );
              })}
            </Select>
          </div>
          <div className="payrollPeriod">
            <h3>Pay Period</h3>
            <RangePicker
              format={dateFormat}
              onCalendarChange={(dates, dateStrings) => {
                setPayrollData((pre) => {
                  return {
                    ...pre,
                    start_date: dateStrings[0],
                    end_date: dateStrings[1],
                  };
                });
              }}
              allowClear={true}
              disabledDate={disabledDate}
              className="formInput"
            />
          </div>
        </div>

        <div>
          <Button
            type="primary w-32 h-12 rounded-md text-white"
            className="primaryBtn"
            disabled={nextDisabled}
            onClick={() => handlePaymentClicked(type, payrollData)}
            loading={loadingButton}
          >
            Next
          </Button>
        </div>
      </div>
    </Content>
  );
};

//Payout Modal and states
const PayoutContent = ({
  handlePaymentClicked,
  type,
  loadingButton,
  setLoadingButton,
  nextDisabled,
  setNextDisabled,
  data,
  projects,
  handleCancel,
  router,
}) => {
  const [payoutData, setpayoutData] = useState({
    payoutTitle: "",
    project: "",
    description: "",
  });
  // const [projects, setProjects] = useState([])
  // const { projects } = useSelector((state) => state.workforce.filters);
  const [claimTableLoading, setClaimTableLoading] = useState(false);
  const [claimTableData, setClaimTableData] = useState([]);
  const [claimTableError, setClaimTableError] = useState(false);
  const [claimBtnLoading, setClaimBtnLoading] = useState(false);
  const [claimData, setClaimData] = useState({
    title: "",
    project_id: "",
    description: "",
    payment_id: "",
  });

  const dispatch = useDispatch();

  // useEffect(() => {
  //   // dispatch(getProjects()).then((response) => {
  //   //   setProjects(response)
  //   // });
  //   dispatch(getAllProjects()).then((response) => {
  //     setProjects(response.filter((project) => project.progress_status === "ongoing"))
  //   })
  // }, [])

  useEffect(() => {
    handlePayoutTitle();
  }, [payoutData]);

  useEffect(() => {
    const fetchClaimsData = async (id) => {
      setClaimTableLoading(true);
      const response = await getClaims(id);
      if (response?.data && response?.data?.length > 0) {
        setClaimTableData(response?.data)
        setClaimTableLoading(false);
      } else {
        setClaimTableData([]);
        setClaimTableError(true);
      }
    }

    if (type === 'claims_table') {
      fetchClaimsData(data?.id);
    }
  }, [type]);

  // prefilling claims data
  useEffect(() => {

    if (type === 'claims') {
      setClaimData((pre) => {
        return {
          ...pre,
          title: `claims for ${data.title}`,
          project_id: data.project_id,
          payment_id: data.id,
        };
      });
    }
  }, [type]);


  //Handling the payout input change
  const handlePayoutTitle = () => {
    if (payoutData.payoutTitle.length > 2) {
      setNextDisabled(false);
    } else {
      setNextDisabled(true);
    }
  };

  // handling creation of payment claim
  const handleCreateClaim = async () => {
    setClaimBtnLoading(true);
    const response = await createClaim(claimData);
    if (response?.data) {
      setClaimBtnLoading(false);
      router.push(`/finance/payments/${response?.data?.id}?payment=Payout`);
      await storePaymentData({
        payment: `${response?.data?.title}`,
        paymentType: "Payout",
        payout_id: response?.data?.id,
        start_date: "",
        end_date: "",
      });
      handleCancel();
    } else {
      setClaimBtnLoading(false);
      handleCancel();
    }

  }

  return (
    <Content>
      {type === 'Payout' ? (
        <div className="payoutContent">
          <div className="payoutBody">
            <div className="payoutInputSection">
              <h3>
                Payout Title <span style={{ color: "red " }}>*</span>
              </h3>
              <Input
                type={"text"}
                placeholder="Enter Title"
                className="formInput"
                value={payoutData.payoutTitle}
                onChange={(e) => {
                  setpayoutData((pre) => {
                    return { ...pre, payoutTitle: e.target.value };
                  });
                }}
              />
            </div>
            <div className="payoutInputSection">
              <h3>Project </h3>
              <Select
                className="formInput"
                value={payoutData.project}
                onChange={(e) => {
                  setpayoutData((pre) => {
                    return { ...pre, project: e };
                  });
                }}
              >
                {projects?.map((item) => {
                  return (
                    <Option
                      value={item.id.toString()}
                      key={item.id}
                      title={item.name}
                    >
                      {capitalizeAll(item.name)}
                    </Option>
                  );
                })}
              </Select>
            </div>
            <div className="payoutInputSection payoutTextAreaSection">
              <h3>Description</h3>
              <TextArea
                placeholder="Add Description"
                maxLength={200}
                style={{
                  height: 150,
                  resize: "none",
                }}
                value={payoutData.description}
                onChange={(e) => {
                  setpayoutData((pre) => {
                    return { ...pre, description: e.target.value };
                  });
                }}
              />
            </div>
          </div>
          <div
            style={{
              alignSelf: "center",
            }}
          >
            <Button
              className="primaryBtn w-32 h-12 rounded-md text-white"
              type="primary"
              onClick={() => {
                handlePaymentClicked(type, payoutData)
              }}
              disabled={nextDisabled}
              loading={loadingButton}
            >
              Next
            </Button>
          </div>
        </div>
      ) : type === 'claims_table' ? (
        <div className="claimTableContent">
          {
            claimTableError ? (
              <MissingData />
            ) : claimTableLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <Skeleton.Input active size={'large'} style={{ width: '1000px' }} />
                <Skeleton.Input active size={'large'} style={{ width: '1000px' }} />
                <Skeleton.Input active size={'large'} style={{ width: '1000px' }} />
                <Skeleton.Input active size={'large'} style={{ width: '1000px' }} />
                <Skeleton.Input active size={'large'} style={{ width: '1000px' }} />
              </div>
            ) : (
              <StyledPayment >
                {/* === Claim TABLE ==== */}
                {/* {console.log("Claims table data", claimTableData)} */}
                <DynamicTable
                  rowKey={`id`}
                  columns={ClaimsTableColumns}
                  data={claimTableData}
                  isClaims={true}
                  pagination={{
                    total: claimTableData?.length,
                  }}
                />
              </StyledPayment>
            )
          }
        </div>
      ) : (
        <div className="claimContent">
          {/* ===== Adding CLAIM ===== */}
          <div className="flex flex-col items-start gap-3 w-full">
            <h3 className="subTitle text-black">
              {
                `Add claims to ${capitalizeAll(data.payment_type_name)}, ${data.project_name ? capitalizeAll(data.project_name) : '-'} for ${moment(data.start_date).format("DD-MM-YYYY")} and ${moment(data.end_date).format("DD-MM-YYYY")}`
              }
            </h3>
            <div className="claimDescriptionSection claimTextAreaSection">
              <h3>Description</h3>
              <TextArea
                placeholder="Add Description"
                maxLength={200}
                style={{
                  height: 250,
                  resize: "none",
                }}
                value={claimData.description}
                onChange={(e) => {
                  setClaimData((pre) => {
                    return { ...pre, description: e.target.value };
                  });
                }}
              />
            </div>
          </div>

          <div className="w-full flex justify-center">
            <Button
              className="primaryBtn"
              type="primary"
              onClick={() => handleCreateClaim(claimData)}
              loading={claimBtnLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )
      }

    </Content >
  );
};

const PaymentModals = ({ show, type, handleCancel, paymentTypes, title, data }) => {
  const router = useRouter();
  const [loadingButton, setLoadingButton] = useState(false);
  const [nextDisabled, setNextDisabled] = useState(true);
  const { setCompanyStatusLoading } = useUserAccess();
  const [projects, setProjects] = useState([]);

  const dispatch = useDispatch()


  useEffect(() => {
    dispatch(getAllProjects()).then((response) => {
      setProjects(response.filter((project) => project.progress_status === "ongoing"))
    })
  }, [])
  
  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handlePaymentClicked = (payment, payrollData) => {
    setLoadingButton(true);
    setNextDisabled(true);
    if (payment === "Payout") {
      const { payoutTitle, project, description } = payrollData;
      const id = paymentTypes.find((item) => item.label == "payout")?.key;
      const payoutPayload = {
        title: payoutTitle,
        project_id: project,
        description: description,
        payment_type_id: id,
      };
      createPayout(payoutPayload).then(async (res) => {
        setLoadingButton(false);
        await storePaymentData({
          payment: res?.data?.title,
          paymentType: "Payout",
          payout_id: res?.data?.id,
          start_date: "",
          end_date: "",
        });
        // setCompanyStatusLoading(true)
        router.push(`/finance/payments/${res?.data?.id}?payment=Payout`);
      });
    } else {
      const id = paymentTypes.find((item) => item.label === "payroll")?.key;

      const { project, start_date, end_date } = payrollData;

      const payload = {
        project_id: project,
        payment_type_id: id,
        start_date: start_date,
        end_date: end_date,
      };

      createPayroll(payload).then(async (response) => {
        setLoadingButton(false);
        if (response.status === "success") {
          const payroll_id = response.data.payment?.id;
          const status = response.data.payment?.status;
          const { query } = router
          delete query.tab
          // setCompanyStatusLoading(true)
          router.push({
            pathname: `/finance/payments/${response?.data?.payment?.id}`,
            query: {
              ...router.query,
            },
          });
          await storePaymentData({
            project: response?.data?.payment?.project_name,
            project_id: response?.data?.payment?.project_id,
            start_date,
            end_date,
            payroll_id,
            paymentType: "Payroll",
            payment: "Payroll",
            status,
          });
        } else {
          setNextDisabled(false);
          notification.error({
            message: "Error",
            description: response.data,
          });
        }
      });
    }
  };

  if (type && show) {
    return (
      <Modal
        title={<ModalTitle title={title} />}
        okText="Next"
        open={show}
        onOk={handleOk}
        onCancel={handleCancel}
        width={type === "claims_table" ? 1100 : type === "claims" ? 820 : 600}
        styles={{
          body: {
            height: type === "Payroll" || type === 'claims' ? 280 : 400,
          }
        }}
        footer={null}
      //closeIcon={<Icon icon="fe:close" className="close" />}
      >
        {type === "Payroll" ? (
          <PayrollContent
            handlePaymentClicked={handlePaymentClicked}
            type={type}
            loadingButton={loadingButton}
            setLoadingButton={setLoadingButton}
            nextDisabled={nextDisabled}
            setNextDisabled={setNextDisabled}
            title={title}
            projects={projects}
          />
        ) : (
          <PayoutContent
            handlePaymentClicked={handlePaymentClicked}
            type={type}
            loadingButton={loadingButton}
            setLoadingButton={setLoadingButton}
            nextDisabled={nextDisabled}
            setNextDisabled={setNextDisabled}
            title={title}
            projects={projects}
            data={data}
            handleCancel={handleCancel}
            router={router}
          />
        )}
      </Modal>
    );
  }
};

export default PaymentModals;
