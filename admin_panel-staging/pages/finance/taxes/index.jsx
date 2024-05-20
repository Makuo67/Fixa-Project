import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { StyledTaxes } from "../../../components/Taxes/StyledTaxes.styled";
import { Button, Col, DatePicker, Form, Progress, Row, Select, Tooltip, message, notification } from "antd";
import { Icon } from "@iconify/react";
import moment from "moment";
import { LoadingOutlined } from "@ant-design/icons";
import { ExportCasualTaxColumns, ExportPermanentTaxColumns } from "../../../components/Export/ExportPaymentsColumns";
import { CSVLink } from "react-csv";
import { toMoney } from "../../../helpers/excelRegister";
import { capitalizeAll } from "../../../helpers/capitalize";
import { generateTaxes, getTaxesProjects } from "../../../helpers/payments/taxes";
import { StyledExportStyled } from "../../../components/Export/StyledExport.styled";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import { PaymentsEmptyOnboarding } from "@/components/Sections/PaymentsEmptyOnboarding";
import dayjs from "dayjs";
import { usePusher } from "@/context/PusherContext";
import Layout from "@/components/Layouts/DashboardLayout/Layout";
import { StyledPaymentTitle } from "@/components/Stats/Stats";
import { accessRouteRetrieval, accessSubpageEntityRetrieval } from "@/utils/accessLevels";
import { useDispatch } from "react-redux";
import RenderLoader from "@/components/Loaders/renderLoader";

const { Option } = Select

export default function Taxes() {
  const [loading, setLoading] = useState(false)
  const [rraTax, setRraTax] = useState(null)
  const [rraTaxCasual, setRraTaxCasual] = useState(null)
  const [excellData, setExcellData] = useState(null)
  const [excellDataCasual, setExcellDataCasual] = useState(null)
  const [isGenerated, setIsGenerated] = useState(true)
  const [month, setMonth] = useState("")
  const [declaredMonth, setDeclaredMonth] = useState("")
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false)

  const pusher = usePusher();
  const router = useRouter();
  const dispatch = useDispatch();
  const { companyStatusLoading, companyStatus, userProfile } = useUserAccess();

  const pusher_env = process.env.NEXT_PUBLIC_PUSHER_ENV;
  const { tab } = router.query;
  const [form] = Form.useForm();

  useEffect(() => {
    getTaxesProjects().then((response) => {
      // response?.unshift({"id":'-1', name: 'All projects'})
      setProjects(response)
    })
  }, [])

  useEffect(() => {

    if (router.isReady && declaredMonth !== '' && projectId && showProgress) {
      let channel = pusher.subscribe(
        `calculate-taxes-${pusher_env}-${declaredMonth}-${projectId}`
      );

      channel.bind(
        `calculate-taxes-${pusher_env}-${declaredMonth}-${projectId}-event`,
        function (data) {
          if (data.status) {
            setProgress(parseInt(data.status))
            if (data.status === '100') {
              setShowProgress(false)
              // setProgress(0)
              // call to update
            }
          }
        }
      );

      return () => {
        // channel.unbind(`calculate-taxes-${pusher_env}-${declaredMonth}-${projectId}-event`);
        pusher.unsubscribe();
      };
    }
  }, [router.isReady, progress, declaredMonth, projectId, showProgress, router.query]);

  // call to fetch new data
  useEffect(() => {
    if (progress === 100) {
      onGenerate()
    }
  }, [progress])

  const onDateChange = (date) => {
    if (date) {
      setRraTax(null)
      setExcellData(null)
      setRraTaxCasual(null)
      setExcellDataCasual(null)
      setMonth(dayjs(date).format('MMMM'))
      setDeclaredMonth(dayjs(date).format('YYYY-MM'))
    }
  }

  const onProjectChange = (value) => {
    setRraTax(null)
    setExcellData(null)
    setRraTaxCasual(null)
    setExcellDataCasual(null)
    setProjectId(value)
    setProjectName(projects?.find(item => item.id === value)?.name)
  }

  const onGenerate = (values) => {
    if (declaredMonth && projectId) {
      setLoading(true)
      // show once clicked and start listening

      const data = {
        "declared_month": declaredMonth,
        "project_id": projectId.toString()
      }
      generateTaxes(data).then((response) => {
        if (response === false) {
          setShowProgress(false)
          setProgress(0)
        }

        if (response) {
          setMonth(moment(declaredMonth).format('MMMM'))
          setRraTax(response.taxes.find(item => item?.taxe_type === "permanent" && item.is_data_available)?.rra_taxe)
          setRraTaxCasual(response.taxes.find(item => item?.taxe_type === "casual" && item.is_data_available)?.rra_taxe)
          setExcellData(response.taxes.find(item => item?.taxe_type === "permanent" && item.is_data_available)?.excel_data)
          setExcellDataCasual(response.taxes.find(item => item?.taxe_type === "casual" && item.is_data_available)?.excel_data)
          if (response?.progress === 'started') {
            setShowProgress(true)
          }
          else if (response.taxes && response?.taxes[0]?.excel_data && response?.progress === 'finished') {
            setShowProgress(false)
            setProgress(0)
          }
        }
      }).finally(() => {
        setLoading(false)
      }
      )
    }
  }
  const onGenerateFailed = (errorInfo) => {
    message.error("Failed to generate! ")
  }

  if (companyStatus?.company_name === "" || companyStatusLoading) {
    return <RenderLoader />
  } else if (accessRouteRetrieval(userProfile?.user_access, 'finance', 'taxes') === false) {
    return <ErrorComponent status={403} backHome={true} />
  } else if (companyStatus && !companyStatus.is_payment_added) {
    return <PaymentsEmptyOnboarding />
  }

  return (
    <>
      <StyledPaymentTitle>
        <span className="title">Taxes</span>
      </StyledPaymentTitle>
      <StyledTaxes>
        <main className="container">
          <div className="form-container">
            <header>Select month</header>
            <Form
              onFinish={onGenerate}
              onFinishFailed={onGenerateFailed}
              form={form}
              initialValues={{
                remember: true,
              }}
              autoComplete="off"
              className="form"
            >
              <Form.Item name="date"
                rules={[{ required: true, message: 'Please select month' }]}
              >
                <DatePicker
                  onChange={onDateChange}
                  picker="month" className="datepicker"
                  format="MMMM, YYYY"
                  value={declaredMonth}
                  // defaultValue={dayjs().subtract(1, 'months')}
                  disabledDate={(current) => {
                    return current && current >= dayjs().endOf('month')
                  }}
                  suffixIcon={<Icon icon="akar-icons:chevron-down" />}
                  allowClear={false}
                />

              </Form.Item>
              <Form.Item name="project_id" className="w-64"
                rules={[{ required: true, message: 'Please select project' }]}
              >
                <Select
                  className="formInput"
                  suffixIcon={<Icon icon="akar-icons:chevron-down" />}
                  bordered={true}
                  onChange={(e) => onProjectChange(e)}
                  placeholder={'Select project'}
                >
                  {/* <Option value={0}>All Proje</Option> */}
                  {projects.map((item, index) => (
                    <Option key={index} value={item.id}>
                      {capitalizeAll(item?.name)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'taxes', 'generate') && (

                <Form.Item>
                  <Button
                    htmlType="submit"
                    className="primaryBtnCustom"
                    hidden={isGenerated}
                    loading={loading}
                    onMouseOver={(e) => { e.target.style.color = 'var(--button-color)' }}
                    disabled={progress > 0}
                  >
                    <Icon icon="uil:file-export" height={18} />
                    <span>Generate</span>
                  </Button>
                </Form.Item>
              )}

            </Form>
          </div>
          {showProgress && (
            <div className="flex flex-col gap-2">
              <p>Please wait while we are processing your taxes</p>
              <Progress
                percent={progress}
                status="active"
                strokeColor={'#00A1DE'}
              />
            </div>
          )}

          <div className="card-container">
            <header>Permanent workers</header>
            <Row gutter={16}>
              <Col span={10}>
                <div className="card">
                  <header className="header">TAX ELIGIBLE Workers</header>
                  {loading ? <div><LoadingOutlined /></div> : <p className="value">{rraTax && parseInt(rraTax.total_worker) > 0 ? toMoney(rraTax.total_worker.toString()) : "-"}</p>}
                </div>
              </Col>
              <Col span={10}>
                <div className="card">
                  <header className="header">Total Grosss Amount</header>
                  {loading ? <div><LoadingOutlined /></div> : <p className="value">{rraTax && parseInt(rraTax.total_gross) > 0 ? toMoney(rraTax.total_gross.toString()) : "-"}</p>}
                </div>
              </Col>
              <Col span={4} className="export">
                <Tooltip title={`${excellData && excellData.length > 0 ? "Export Permanent Worker's Earnings excel" : "No Workers found"}`} placement="top">
                  <StyledExportStyled>
                    <Button
                      className="primaryBtn"
                      icon={<Icon icon="uil:file-export" height={18} />}
                      loading={exportLoading}
                      disabled={excellData && excellData.length > 0 ? false : true}
                      onMouseOver={(e) => { e.target.style.color = 'var(--button-color)' }}
                    >
                      <CSVLink
                        data={excellData && excellData.length > 0 ? excellData : []}
                        headers={ExportPermanentTaxColumns}
                        filename={`${projectName}_${declaredMonth}_Tax_Eligible_Permanent_Workers.xls`}
                        disabled={excellData && excellData.length > 0 ? false : true}
                        className="export-btn"
                      >
                        <span style={{ color: "var(--button-color)" }}>Export Worker Earnings</span>
                      </CSVLink>
                    </Button>
                  </StyledExportStyled>
                </Tooltip>
              </Col>
            </Row>
          </div>
          {projects.find(item => item?.id === projectId)?.taxes?.casual && <div className="card-container">
            <header>Casual workers</header>
            <Row gutter={16}>
              <Col span={10}>
                <div className="card">
                  <header className="header">TAX ELIGIBLE Workers</header>
                  {loading ? <div><LoadingOutlined /></div> : <p className="value">{rraTaxCasual && parseInt(rraTaxCasual.total_worker) > 0 ? toMoney(rraTaxCasual.total_worker.toString()) : "-"}</p>}
                </div>
              </Col>
              <Col span={10}>
                <div className="card">
                  <header className="header">Total Grosss Amount</header>
                  {loading ? <div><LoadingOutlined /></div> : <p className="value">{rraTaxCasual && parseInt(rraTaxCasual.total_gross) > 0 ? toMoney(rraTaxCasual.total_gross.toString()) : "-"}</p>}
                </div>
              </Col>
              <Col span={4} className="export">
                <Tooltip title={`${excellDataCasual && excellDataCasual.length > 0 ? "Export Casual Worker's Earnings excel" : "No Workers found"}`} placement="top">
                  <StyledExportStyled>
                    <Button
                      className="primaryBtn"
                      icon={<Icon icon="uil:file-export" height={18} />}
                      loading={exportLoading}
                      disabled={excellDataCasual && excellDataCasual.length > 0 ? false : true}
                      onMouseOver={(e) => { e.target.style.color = 'var(--button-color)' }}
                    >
                      <CSVLink
                        data={excellDataCasual && excellDataCasual.length > 0 ? excellDataCasual : []}
                        headers={ExportCasualTaxColumns}
                        filename={`${projectName}_${declaredMonth}_Tax_Eligible__Casual_Workers.xls`}
                        disabled={excellDataCasual && excellDataCasual.length > 0 ? false : true}
                        className="export-btn"
                      >
                        <span style={{ color: "var(--button-color)" }}>Export Worker Earnings</span>
                      </CSVLink>
                    </Button>
                  </StyledExportStyled>
                </Tooltip>
              </Col>
            </Row>
          </div>}
        </main>
      </StyledTaxes>
    </>
  );
}

Taxes.getLayout = function getLayout(page) {
  return <Layout isPayment={true}>{page}</Layout>;
};