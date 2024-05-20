import { Col, Row, Select, Table } from "antd";
import Link from "next/link";
import { Component } from "react";
import Layout from "../../components/Layouts/DashboardLayout/Layout";
import { Content } from "../../components/shared/Content";
import SkeletonTable from "../../components/Tables/SkeletonTable";
import { getRemoteData } from "../../helpers/remote";

const { Option } = Select;

const columns = [
  {
    title: "File Name",
    dataIndex: "file_name",
    key: "file_name",
  },
  {
    title: "Added on",
    dataIndex: "created_at",
    key: "created_at",
  },
  {
    title: "File Name",
    dataIndex: "file_name",
    key: "file_name",
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <Link href={`/excel/${record.file_id}?access_key=${record.access_key}&secret_key=${record.secret_key}`}>
        <a>View</a>
      </Link>
    ),
  },
];

class Excel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      payrollData: [],
      payrollExcelFiles: [],
    };
    this.initializePage = this.initializePage.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.renderPayrollSelector = this.renderPayrollSelector.bind(this);
    this.renderExcelFileList = this.renderExcelFileList.bind(this);
    this.reloadData = this.reloadData.bind(this);
  }

  componentDidMount() {
    this.initializePage();
  }

  initializePage = async () => {
    try {
      let payrollData = getRemoteData(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/payrolls?_sort=updated_at:DESC`,
        "GET",
        "initializePage",
        true
      );
      let excelFile = getRemoteData(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/excels?feature=payroll-checking&_sort=created_at:DESC`,
        "GET",
        "initializePage",
        true
      );
      payrollData = await payrollData;
      excelFile = await excelFile;
      if (!payrollData.has_error && !excelFile.has_error) {
        console.log("excel", excelFile.data);
        this.setState({
          payrollData: payrollData.data,
          payrollExcelFiles: excelFile.data,
        });
      }
    } catch (error) {
      console.log("Error happened in pages/excel-initializePage()", error);
    }
  };

  reloadData = () => {
    this.setState(
      {
        payrollExcelFiles: [],
      },
      () => {
        this.initializePage();
      }
    );
  };

  handleChange(value) {
    console.log(`selected ${value}`);
  }

  renderPayrollSelector() {
    if (this.state.payrollData.length === 0) {
      return <SkeletonTable columns={columns} rowCount={10} />;
    }

    const selectorOptions = this.state.payrollData.map((payroll) => {
      return (
        <Option key={`key-option-${payroll.id}`} value={payroll.id}>
          {payroll.date_range}
        </Option>
      );
    });

    return (
      <Select
        //defaultValue="lucy"
        style={{
          width: 120,
        }}
        onChange={this.handleChange}
      >
        {selectorOptions}
      </Select>
    );
  }

  renderExcelFileList() {
    if (this.state.payrollExcelFiles.length === 0) {
      return <SkeletonTable columns={columns} rowCount={10} />;
    }

    return <Table columns={columns} dataSource={this.state.payrollExcelFiles} size="large" />;
  }

  render() {
    return (
      <>
        <Content>
          <Content>
            <Row
              style={{
                marginBottom: "1rem",
              }}
            >
              <Col span={6}>
                <button type="button" onClick={this.reloadData} className="ant-btn">
                  View Recent Files
                </button>
              </Col>
              <Col span={6}>
                <a
                  className="ant-btn ant-btn-primary ant-btn-block"
                  href="https://www.apispreadsheets.com/import/upload/c5e813f3173b207699373f68f2adc149"
                  target="_blank"
                  rel="noreferrer"
                >
                  Upload File
                </a>
              </Col>
              <Col
                span={6}
                style={{
                  marginLeft: "1rem",
                }}
              >
                <Link href="/payroll">
                  <a className="ant-btn ant-btn-primary ant-btn-block">Run Payroll</a>
                </Link>
              </Col>
            </Row>
            {this.renderExcelFileList()}
          </Content>
        </Content>
      </>
    );
  }
}

Excel.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
export default Excel;
