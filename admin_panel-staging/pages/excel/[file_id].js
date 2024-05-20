import { Col, Row, Table } from "antd";
import { withRouter } from "next/router";
import { Component } from "react";
import Header from "../../components/Header/Header";
import AccountLayout from "../../components/Layouts/AccountLayout/AccountLayout";
import { Content } from "../../components/shared/Content";
import SkeletonTable from "../../components/Tables/SkeletonTable";
import { getRemoteData } from "../../helpers/remote";
import Excel from "./index";

const columns = [
  {
    title: "First Name",
    dataIndex: "first_name",
    key: "first_name",
  },
  {
    title: "Last Name",
    dataIndex: "last_name",
    key: "last_name",
  },
  {
    title: "MoMo Account",
    dataIndex: "momo_account",
    key: "momo_account",
  },
  {
    title: "Total Shifts",
    dataIndex: "total_shifts",
    key: "total_shifts",
  },
  {
    title: "Default Rate",
    dataIndex: "default_rate",
    key: "default_rate",
  },
  {
    title: "Negotiated Rate",
    dataIndex: "negotiated_rate",
    key: "negotiated_rate",
  },
  {
    title: "Deduction Equipments",
    dataIndex: "deduction_equipment",
    key: "deduction_equipment",
  },
  {
    title: "Deduction Meals",
    dataIndex: "deduction_meals",
    key: "deduction_meals",
  },
  {
    title: "Total Deductions",
    dataIndex: "total_deductions",
    key: "total_deductions",
  },
  {
    title: "Total Earnings",
    dataIndex: "total_earnings",
    key: "total_earnings",
  },
];
let READONINITIAL = false;

class ExcelView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sheetData: [],
    };
    this.initializePage = this.initializePage.bind(this);
    this.renderSheetData = this.renderSheetData.bind(this);
  }

  componentDidMount() {
    const { file_id } = this.props.router.query;
    if (!file_id) {
      console.log("no");
    } else {
      console.log("yes");
    }

    if (READONINITIAL || Object.keys(this.props.router.query).length !== 0) {
      this.initializePage(this.props.router.query);
    }
  }

  componentDidUpdate() {
    if (!READONINITIAL) {
      /**
       * Set initial
       * call data
       */
      console.log("here it is ", this.props.router.query);
      READONINITIAL = true;
      this.initializePage(this.props.router.query);
    }
  }

  initializePage = async (query) => {
    try {
      const { file_id, access_key, secret_key } = query;
      const response = await getRemoteData(
        `https://api.apispreadsheets.com/data/${file_id}/?accessKey=${access_key}&secretKey=${secret_key}`,
        "GET",
        "initializePage",
        false
      );
      console.log("response is", response);
      if (!response.has_error) {
        this.setState({
          sheetData: response.data.data,
        });
      }
    } catch (error) {
      console.log("Error happened in pages/excel-initializePage()", error);
    }
  };

  renderSheetData() {
    if (this.state.sheetData.length === 0) {
      return <SkeletonTable columns={columns} rowCount={10} />;
    }

    return <Table columns={columns} dataSource={this.state.sheetData} size="large" />;
  }

  render() {
    return (
      <>
        <Header />

        <Content>
          <Row
            style={{
              marginBottom: "1rem",
            }}
          >
            {/* <Col span={6}>
                {this.renderPayrollSelector()}
              </Col> */}
            <Col span={6}>
              <button type="button" className="ant-btn" onClick={() => this.props.router.back()}>
                Go back to View All Files
              </button>
            </Col>
          </Row>
          {this.renderSheetData()}
        </Content>
      </>
    );
  }
}
Excel.getLayout = function getLayout(page) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default withRouter(ExcelView);
