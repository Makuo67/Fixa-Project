import { DownloadOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Col, Modal, Row, Select, Table } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Pusher from "pusher-js";
import {
  getAllInstantPayrolls,
  postInstantPayout,
} from "../../../redux/actions/instant-payroll.actions";
import { getAllProjects } from "../../../redux/actions/project.actions";
import Error from "../../Error/Error";
import { StyledPayrollTable } from "../PayrollTable.styled";
import SkeletonTable from "../SkeletonTable";
import Notify from "../../Error/Toast";
import { closeAPIsheetModal } from "../../../helpers/excelRegister";

const { Option } = Select;

const FilesTable = ({ data, loading, error, payout_types }) => {
  const projects = useSelector((state) => state.project.list);
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState({});
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    dispatch(getAllProjects()).then((data) => {
      setSelectedProject({ name: data[0].name, id: data[0].id });
    });
  }, []);

  /* Listening the excel payout pusher */
  useEffect(() => {
    if (uploadModal) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });
      const channel = pusher.subscribe("excel-payout");
      setUploadModal(false);
      channel.bind("close-form", (data) => {
        if (data.message === "file saved") {
          Notify("Your file Has been saved", "success");
          // closing all modals
          closeAPIsheetModal();
          setModalVisible(false);
          setTimeout(() => {
            window.location.reload(false);
          }, "1500");
        }
      });
      return () => {
        pusher.unsubscribe("close-form");
      };
    }
  }, [uploadModal]);

  const onSelect = (project_id, other) => {
    // console.log(other);
    setSelectedProject({ name: other.project_name, id: project_id });
    dispatch(getAllInstantPayrolls(project_id));
  };

  const capitalize = (string) => {
    const str = string;
    const str2 = str?.charAt(0).toUpperCase() + str?.slice(1);
    return str2;
  };

  const columns = [
    {
      title: "Payroll ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
    },
    {
      title: "Added on",
      dataIndex: "added_on",
      key: "added_on",
    },

    {
      title: "Payroll Type",
      dataIndex: "payroll_type",
      key: "payroll_type",
      render: (_, data) => {
        return capitalize(data.payroll_type);
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_, data) => {
        return capitalize(data.status);
      },
    },
    {
      title: "Action",
      dataIndex: "",
      key: "",
      width: 200,
      render: (_, data) => {
        return (
          <Button
            type="link"
            onClick={() => {
              router.push({
                pathname: "/instant-payroll/view/[project_name]",
                query: {
                  project_name: selectedProject.name,
                  project_id: selectedProject.id,
                  payroll_type: data.payroll_type_id,
                  instant_payroll_id: data.id,
                },
              });
            }}
          >
            View
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Modal
        centered
        visible={modalVisible}
        closable={false}
        title="New Instant Payroll"
        width={"50vw"}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose={true}
      >
        <Row justify="space-between">
          <Col>
            <Row>
              <Col>
                <Select
                  style={{ width: "200px" }}
                  placeholder="Payroll Type"
                  size="large"
                  onSelect={(e, data) => {
                    setButtonDisabled(false);
                    dispatch(postInstantPayout(selectedProject.id, data.id));
                  }}
                >
                  {payout_types.map((item) => {
                    return (
                      <Option value={item.name} key={item.id} id={item.id}>
                        {item.name}
                      </Option>
                    );
                  })}
                </Select>
              </Col>
              <Col>
                <Button
                  size="large"
                  type="primary"
                  disabled={buttonDisabled}
                  onClick={() => {
                    new APISpreadsheetsImporter(
                      process.env.NEXT_PUBLIC_API_SPREADSHEETS_KEY
                    ).importFiles();
                    setUploadModal(true);
                  }}
                >
                  Upload
                </Button>
              </Col>
            </Row>
          </Col>
          <Col>
            <a style={{ width: "100%" }} href="https://datadumpfixa.s3.eu-central-1.amazonaws.com/Instant_payout_template.xlsx">
              <DownloadOutlined /> Download Excel Template
            </a>
          </Col>
        </Row>
      </Modal>
      <Row justify="space-between" style={{ marginBottom: 24 }}>
        <Col>
          <Select
            placeholder="Select project"
            style={{ width: 250 }}
            size="large"
            value={selectedProject?.id}
            onSelect={(value, other) => onSelect(value, other)}
          >
            {projects.map((item) => {
              // console.log(selectedProject);
              return (
                <Option value={item.id} key={item.id} project_name={item.name}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </Col>
        <Col>
          <Button
            style={{ width: 250 }}
            type="primary"
            shape="round"
            icon={<PlusCircleOutlined />}
            size="large"
            onClick={() => setModalVisible(true)}
          >
            Add new
          </Button>
        </Col>
      </Row>
      <StyledPayrollTable>
        {loading ? (
          <SkeletonTable columns={columns} rowCount={10} />
        ) : error ? (
          <Error status={error} backHome={true} />
        ) : (
          <Table columns={columns} dataSource={data} rowKey="id" />
        )}
      </StyledPayrollTable>
    </>
  );
};

export default FilesTable;
