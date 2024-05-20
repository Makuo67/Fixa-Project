import React from "react";
import { useEffect } from "react";
import { Button, Modal, Select, DatePicker, Form, Space, Row, Col, Input, Radio, Segmented } from "antd";
import objectToQuery from "./helpers";
import {
  getAllWorkforce,
} from "../../redux/actions/workforce.actions";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import moment from "moment";
import { getDistrictsCode, getProvincesCode } from "../../helpers/workforce";
import { capitalizeAll } from "../../helpers/capitalize";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AdvancedFiltersModal = (props) => {
  const pagination_empty = {
    // current_page: 1,
    _start: 0,
    _limit: 10,
  };

  const format = "YYYY-MM-DD";
  const { projects, districts, trades, provinces } = useSelector((state) => state.workforce.filters);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    date_onboarded_lte,
    date_onboarded_gte,
    last_attendance_lte,
    last_attendance_gte,
  } = router.query;

  const clearForm = () => {
    form.resetFields();
    router.replace({
      pathname: "/workforce",
      query: pagination_empty,
    });
    dispatch(getAllWorkforce(objectToQuery(pagination_empty)));
  };

  const handleCancel = () => {
    // clearForm();
    props.hideModal();
  };
  const handleOk = () => {
    props.hideModal();
    const values = form.getFieldsValue();
    // delete empty fields
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key]
        delete router.query.date_onboarded_lte
        delete router.query.date_onboarded_gte
        delete router.query.current_page
      }
    });

    // set query params
    if (values["date_onboarded"]) {
      values["date_onboarded_gte"] = dayjs(values["date_onboarded"][0]).format(format);
      values["date_onboarded_lte"] = dayjs(values["date_onboarded"][1]).format(format);
      delete values["date_onboarded"];
    }
    if (values["last_attendance"]) {
      values["last_attendance_gte"] = dayjs(values["last_attendance"][0]).format(format);
      values["last_attendance_lte"] = dayjs(values["last_attendance"][1]).format(format);
      delete values["last_attendance"];
    }

    const query = { ...router.query, ...values, ...pagination_empty };
    if (values.district) {
      query.district = getDistrictsCode(districts, values)
    }
    if (values.province) {
      query.province = getProvincesCode(provinces, values)
    }

    router.replace({
      pathname: "/workforce",
      query
    });

  };

  useEffect(() => {
    const values = {};
    Object.assign(values, router.query);

    if (date_onboarded_lte && date_onboarded_gte) {
      values["date_onboarded"] = [dayjs(date_onboarded_gte), dayjs(date_onboarded_lte)];
      delete values["date_onboarded_gte"];
      delete values["date_onboarded_lte"];
    }
    if (last_attendance_lte && last_attendance_gte) {
      values["last_attendance"] = [dayjs(last_attendance_gte), dayjs(last_attendance_lte)];

      delete values["last_attendance_gte"];
      delete values["last_attendance_lte"];
    }
    form.resetFields();
    form.setFieldsValue(values);
  }, [router.isReady, router.query]);

  const shouldBeVisible = props.isVisible;

  const onCheckAssigned = (checkedValues) => {
    // console.log('checked = ', checkedValues);
  };

  return (
    <Modal
      title="Advanced Filters"
      okText="Apply Filters"
      visible={shouldBeVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <div className="flex gap-4 justify-center" key={0}>
          <Button type="secondary" className="secondaryBtn" onClick={handleCancel}>Cancel</Button>
          <Button type="primary" className="primaryBtn" onClick={handleOk}>Apply Filters</Button>
        </div>
      ]}
    >
      <Form form={form} name="basic" autoComplete="off" layout="vertical">
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item label="Service" name="trade_id">
              <Select mode={"multiple"} allowClear={true} placeholder="Please select" style={{ width: "100%" }}>
                {trades?.map((item) => {
                  return (
                    <Option value={item.id.toString()} key={item.id}>
                      {item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase()}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item label="Date Onboarded" name="date_onboarded" style={{ width: "100%" }}>
              <RangePicker />
            </Form.Item>
            <Form.Item label="District" name="district">
              <Select mode={"multiple"} allowClear={true} placeholder="Please select" style={{ width: "100%" }}>
                {districts?.map((item) => {
                  return (
                    <Option value={item.id.toString()} key={item.id}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item label="Projects" name="project_id">
              <Select mode={"multiple"} allowClear={true} placeholder="Please select" style={{ width: "100%" }}>
                {projects?.map((item) => {
                  return (
                    <Option value={item.id.toString()} key={item.id} title={item.name}>
                      {capitalizeAll(item.name)}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item label="Worker Type" name="worker_type">
              <Select mode={"single"} allowClear={true} placeholder="Please select" style={{ width: "100%" }}>
                <Option value={"casual"} title={"casual"}>
                  Casual
                </Option>
                <Option value={"permanent"} title={"permanent"}>
                  Permanent
                </Option>
              </Select>
            </Form.Item>
            <Form.Item label="Rate Type" name="rate_type">
              <Select mode={"single"} allowClear={true} placeholder="Please select" style={{ width: "100%" }}>
                <Option value={"standard"} title={"standard"}>
                  Standard
                </Option>
                <Option value={"negotiated"} title={"negotiated"}>
                  Negotiated
                </Option>
              </Select>
            </Form.Item>

          </Col>
          <Col span={12}>
            <Form.Item label="Attendance" name="last_attendance">
              <RangePicker />
            </Form.Item>

            <Form.Item label="Daily Earnings">
              <Input.Group compact>
                <Form.Item name="daily_earnings_gte" style={{ width: "calc(50% - 15px)", marginBottom: 0 }}>
                  <Input placeholder="Minimum" />
                </Form.Item>
                <Input
                  className="site-input-split"
                  style={{
                    width: 30,
                    pointerEvents: "none",
                  }}
                  placeholder="~"
                  disabled
                />
                <Form.Item name="daily_earnings_lte" style={{ width: "calc(50% - 15px)", marginBottom: 0 }}>
                  <Input placeholder="Maximum" />
                </Form.Item>
              </Input.Group>
            </Form.Item>
            <Form.Item label="Gender" name="gender">
              <Select mode={"single"} allowClear={true} placeholder="Please select" style={{ width: "100%" }}>
                <Option value="male">
                  Male
                </Option>
                <Option value="female">
                  Female
                </Option>
              </Select>
            </Form.Item>
            <Form.Item label="Assignment" name="assigned">
              <Radio.Group onChange={onCheckAssigned}>
                <Radio value="true">Assigned</Radio>
                <Radio value="false">Unassigned</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Status" name="is_active">
              <Select mode={"single"} allowClear={true} placeholder="Please select" style={{ width: "100%" }}>
                <Option value="true">
                  Active
                </Option>
                <Option value="false">
                  Inactive
                </Option>
              </Select>
            </Form.Item>
            <Form.Item label="Attendance %" name="attendance">
              <Segmented options={['ASC', 'DESC']} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
export default AdvancedFiltersModal;
