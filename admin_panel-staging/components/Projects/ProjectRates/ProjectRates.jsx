import { StyledProjectRates } from "./StyledProjectRates.styled";
import { Button, Form, notification, Select, message, InputNumber } from "antd";
import { Icon } from "@iconify/react";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import {
  createRate,
  deleteRate,
  getRatesServices,
  getSingleProjectDetails,
  transformRatesObject,
} from "../../../helpers/projects/projects";
import { useRouter } from "next/router";
import { PusherContext } from "../../../context/PusherContext";
import Confirm from "../Modals/Invoice/confirmation";
import { addService } from "../../../redux/actions/services.actions";
import { useRef } from "react";
import { useDispatch } from "react-redux";
import moment from "moment";
import { capitalizeAll } from '../../../helpers/capitalize';
import { NotFoundContent } from "@/components/Onboarding/Forms/WorkerRates";
import ErrorComponent from "@/components/Error/Error";
import { checkUserAccessToEntity, checkUserAccessToSubEntity } from "@/utils/accessLevels";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";

const { Option } = Select;

export const ProjectRates = () => {
  const [rates, setRates] = useState([]);
  const [services, setServices] = useState([]);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState(null);
  const [addedService, setAddedService] = useState(false);
  const [projectRates, setProjectRates] = useState({
    service_id: "",
    maximum_rate: "",
    name: "",
  });
  const [tradesAccess, setTradesAccess] = useState(false)
  const [deleteTradeAccess, setDeleteTradeAccess] = useState(false)
  const [newTradeAccess, setNewTradeAccess] = useState(false)

  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch()
  const serviceNameRef = useRef(null);

  const { id } = router.query;

  const { ratesLoading, setRatesLoading } = useContext(PusherContext);
  const {  userProfile } = useUserAccess();
  const { user_access, user_level } = userProfile

  let newRates = [];
  let singleRate;
  let finalRates;

  const onFinish = (values) => {
    const { rates, ...newObject } = values;
    newRates = transformRatesObject(newObject);
    setLoading(true);
    if (values.rates != undefined && values.rates.length > 0) {
      values.rates.map((item) => {
        singleRate = {
          service_id: item.name,
          maximum_rate: item.rate,
        };
        newRates.push(singleRate);
        finalRates = {
          rates: newRates,
        };
      });
      createRate(id, finalRates).then((res) => {
        setRatesLoading(true);
        form.resetFields();
        setLoading(false);
      });
    } else {
      finalRates = {
        rates: newRates,
      };
      createRate(id, finalRates).then((res) => {
        setRatesLoading(true);
        form.resetFields();
        setLoading(false);
      });
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const handleDeleteRate = () => {
    setOpenConfirmModal(false);
    deleteRate(deleteId)
      .then((res) => {
        setRatesLoading(true);
        notification.success({
          message: `Success`,
          description: `Rate Deleted`,
        });
      })
      .catch((error) => {
        notification.error({
          message: `Failed`,
          description: `${error.message}`,
        });
      });
  };

  const onCancel = () => {
    setAddedService(true);
  };

  const showConfirm = (deleteId) => {
    setDeleteId(deleteId);
    setOpenConfirmModal(true);
  };

  const closeConfirm = () => {
    setOpenConfirmModal(false);
  };

  useEffect(() => {
    if (user_access) {
      setTradesAccess(checkUserAccessToEntity("project", "trades", user_access))
      setDeleteTradeAccess(checkUserAccessToSubEntity("project", "trades", "delete", user_access))
      setNewTradeAccess(checkUserAccessToSubEntity("project", "trades", "add new", user_access))
    }
  }, [user_access]);

  useEffect(() => {
    getRatesServices(id).then((res) => {
      setServices(res);
      setAddedService(false)
    });
  }, [addedService]);

  useEffect(() => {
    getSingleProjectDetails(id).then((res) => {
      setRates(res?.data?.rates);
      setRatesLoading(false);
    });
  }, [ratesLoading]);

  const onSearchChange = (value) => {
    setServiceName(value);
  }
  const onSaveService = () => {
    serviceNameRef.current = serviceName;
    setServiceModal(true)
  }

  const handleAddService = () => {
    const payload = {
      "name": serviceNameRef.current,
      "icon_class": null,
      "service_status": "on",
      "locale": "en",
      "published_at": moment(),
      "created_at": moment(),
      "updated_at": moment(),
      "localizations": []
    }
    dispatch(addService(payload)).then((res) => {
      setAddedService(true)
      setProjectRates({ ...projectRates, service_id: res?.id.toString() })
      form.setFieldValue("name", capitalizeAll(res?.name))
      message.success(`Created service ${serviceNameRef.current} successfully`);
    })
    setServiceModal(false);
  };
  const handleCancel = () => {
    setServiceModal(false);
  };
  if (ratesLoading) {
    return (
      <div className="w-full flex items-center justify-center">
        <LoadingOutlined />
      </div>
    )
  } 
  // else if (!tradesAccess) {
  //   return <ErrorComponent status={403} backHome={true} />
  // }
  return (
    <StyledProjectRates>
      <div className="container">
        <div className="project-rates-header">
          <span>Trade</span>
          <span>Maximum Rate</span>
          <span>Action</span>
        </div>

        <div className="project-rates-form">
          <Form
            name="basic"
            initialValues={{
              remember: true,
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="on"
          >
            {rates?.map((item, index) => (
              <div key={index} className="rate-container">
                <Form.Item
                  name={`service_id_${index}`}
                  initialValue={item?.service?.id}
                >
                  <Select
                    allowClear={true}
                    size="large"
                    defaultValue={"Service"}
                    style={{
                      width: "550px",
                      borderRadius: "8px !important",
                    }}
                    placeholder="Select"
                    showArrow={false}
                    disabled
                  >
                    {services.map((item, index) => (
                      <Option key={index} value={item.id}>
                        {capitalizeAll(item.name)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name={`maximum_rate_${index}`}
                  initialValue={item?.maximum_rate || 0}
                  rules={[
                    {
                      required: true,
                      message: "Rate is required",
                    },
                    {
                      pattern: /^[0-9]*$/,
                      message: "Must be a number",
                    },
                  ]}
                >
                  <InputNumber
                    bordered={false}
                    disabled={false}
                    keyboard={false}
                    controls={false}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    defaultValue={item?.maximum_rate || 0}
                    value={item?.maximum_rate}
                    addonAfter="RWF"
                    size="large"
                    placeholder={item?.maximum_rate}
                  />
                </Form.Item>
                {deleteTradeAccess && (<div className="icon-container">
                  <Icon
                    icon="material-symbols:delete-outline-rounded"
                    color="#f5222d"
                    height="25px"
                    className="icon"
                    // onClick={() => handleDeleteRate(item.id)}
                    onClick={() => showConfirm(item.id)}
                  />
                </div>)}
              </div>
            ))}
            {newTradeAccess && (
              <>
                <Form.List name="rates">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} className="add-rates-container">
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            rules={[
                              {
                                required: true,
                                message: "Service is required",
                              },
                            ]}
                          >
                            <Select
                              style={{
                                width: "550px",
                                borderRadius: "8px !important",
                                opacity: "0.5",
                              }}
                              // allowClear={true}
                              showSearch
                              placeholder="Search to Select"
                              optionFilterProp="children"
                              size="large"
                              value={projectRates.service_id}
                              onChange={(value) => setProjectRates({ ...projectRates, service_id: value.toString() })}
                              filterOption={(input, option) =>
                                option.label.includes(
                                  input.slice(1).toLowerCase()
                                )
                              }
                              options={services.map((item, index) => ({
                                label: capitalizeAll(item.name),
                                value: item.id,
                                key: index,
                              }))}
                              onSearch={onSearchChange}
                              notFoundContent={
                                <NotFoundContent
                                  handleCancel={handleCancel}
                                  serviceModal={serviceModal}
                                  serviceNameRef={serviceNameRef}
                                  serviceLoading={addedService}
                                  handleAddService={handleAddService}
                                  onSaveService={onSaveService} />
                              }
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "rate"]}
                            rules={[
                              { required: true, message: "Amount is required" },
                            ]}
                          >
                            <InputNumber
                              bordered={false}
                              disabled={false}
                              keyboard={false}
                              controls={false}
                              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              defaultValue={0}
                              addonAfter="RWF"
                              placeholder={"Enter Maximum rate"}
                              size="large"
                            />
                          </Form.Item>
                          <div
                            className="icon-container"
                            onClick={() => remove(name)}
                          >
                            <Icon
                              icon="mdi:minus-circle-outline"
                              color="#f5222d"
                              height="20px"
                              className="icon"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="add-button-container">
                        <Form.Item>
                          <Button className="secondaryBtn" onClick={() => add()}>
                            <PlusOutlined />
                            <span className="addText">Add</span>
                          </Button>
                        </Form.Item>
                      </div>
                    </>
                  )}
                </Form.List>
                <Form.Item>
                  <div className="submit-buttons-container">
                    <Button
                      type="secondary"
                      className={"secondaryBtn"}
                      // htmlType="submit"
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      loading={loading}
                      className={"primaryBtn"}
                      htmlType="submit"
                    //   style={{
                    //     color: 'var(--button-color)',
                    // }}
                    >
                      Save
                    </Button>
                  </div>
                </Form.Item>
              </>
            )}
          </Form>
        </div>

      </div>
      <Confirm
        openConfirmModal={openConfirmModal}
        closeConfirm={closeConfirm}
        message={`Are you sure you want to remove this rate?`}
        buttonText={`Yes`}
        cancelText={`No`}
        handleOk={handleDeleteRate}
      />
    </StyledProjectRates>
  );
};