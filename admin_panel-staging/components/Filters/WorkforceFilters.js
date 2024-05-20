import {
  ArrowRightOutlined,
  ClearOutlined,
  CloseOutlined,
  DownOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Form, Segmented, Select, Space } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDistricts,
  getProjects,
  getServices,
  getProvinces
} from "../../redux/actions/workforce.actions";
import AdvancedFiltersModal from "./AdvancedFiltersModal";
import FilteredFields from "./FilteredFields";
import { StyledCardTabs, StyledFilterButton } from "./StyledCardTabs";
import {
  getDistrictsCode,
} from "../../helpers/workforce";
import { capitalizeAll } from "../../helpers/capitalize";
import { saveIndexDB } from "@/utils/indexDBUtils";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function WorkforceFilters({
  isExpandable,
  showAdvancedFilters,
  filter_fields,
  initial_queries,
  hasPagination,
  date_title,
}) {
  const format = "YYYY-MM-DD";
  const { projects, districts, trades } = useSelector(
    (state) => state.workforce.filters
  );

  const [filter_expanded, set_filter_expanded] = useState(!isExpandable);
  const [show_advanced_filters_modal, set_show_advanced_filters_modal] =
    useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    date_onboarded_lte,
    date_onboarded_gte,
    project_id,
    district,
    trade_id,
  } = router.query;

  const [form] = Form.useForm();

  const pagination_empty = {
    // current_page: 1,
    _start: 0,
    _limit: -1,
  };

  const get_initial_queries = (raw) => {
    return Object.keys(raw)
      .filter((key) => initial_queries?.includes(key))
      .reduce((obj, key) => {
        obj[key] = raw[key];
        return obj;
      }, {});
  };

  // clear filters but keep pagination data
  const clearForm = () => {
    const query = get_initial_queries(router.query);
    if (hasPagination) {
      // query["current_page"] = 1;
      query["_start"] = 0;
      query["_limit"] = 10;
    }
    form.resetFields();
    router.replace({
      pathname: router.pathname,
      query,
    });
  };

  const getFiltersData = useCallback(() => {
    if (router.isReady) {
      dispatch(getProjects());
      dispatch(getDistricts());
      dispatch(getServices());
      dispatch(getProvinces());
    }
  }, [router.isReady]);

  useEffect(() => {
    getFiltersData();
  }, [getFiltersData]);

  // set default form values
  useEffect(() => {
    const values = {
      project_id,
      district,
      trade_id,
    };
    if (date_onboarded_lte && date_onboarded_gte) {
      values["date_onboarded"] = [
        dayjs(date_onboarded_gte),
        dayjs(date_onboarded_lte),
      ];
    }
    saveIndexDB("services", trades);
    form.setFieldsValue(values);
  }, [router.isReady, router.query]);

  const onFinish = (values) => {
    // delete empty fields
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
        delete router.query.date_onboarded_lte;
        delete router.query.date_onboarded_gte;
        delete router.current_page;
      }
    });

    // set query params
    if (values["date_onboarded"]) {
      values["date_onboarded_gte"] = dayjs(values["date_onboarded"][0]).format(format);
      values["date_onboarded_lte"] = dayjs(values["date_onboarded"][1]).format(format);
      delete values["date_onboarded"];
    }
    if (values["attendance"]) {
      values["_sort"] = "attendance:" + values["attendance"]
      delete values["attendance"];
    }
    const query = { ...router.query, ...values };

    if (values.district) {
      query.district = getDistrictsCode(districts, values);
    }
    if (hasPagination) {
      // query["current_page"] = 1;
      query["_start"] = 0;
      // query["_limit"] = 10;
    }

    router.replace({
      pathname: router.pathname,
      query,
    });

    if (isExpandable) set_filter_expanded(false);
  };
  const onFormChange = (values) => {
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
        delete router.query.date_onboarded_lte;
        delete router.query.date_onboarded_gte;
        delete router.current_page;
      }
    });

    // set query params
    if (values["date_onboarded"]) {
      values["date_onboarded_gte"] = dayjs(values["date_onboarded"][0]).format(format);
      values["date_onboarded_lte"] = dayjs(values["date_onboarded"][1]).format(format);
      delete values["date_onboarded"];
    }
    if (values["attendance"]) {
      values["_sort"] = "attendance:" + values["attendance"]
      delete values["attendance"];
    }

    const query = { ...router.query, ...values };
    if (values.district) {
      query.district = getDistrictsCode(districts, values);
    }

    if (hasPagination) {
      /// query["current_page"] = 1;
      query["_start"] = 0;
      // query["_limit"] = 10;
    }

    router.replace({
      pathname: router.pathname,
      query,
    });
  };

  const filterFormItems = [
    date_title
      ? {
        name: "date_onboarded",
        label: date_title,
        node: <RangePicker allowClear={true} />,
      }
      : {
        name: "date_onboarded",
        label: "Date Onboarded",
        node: <RangePicker allowClear={true} />,
      },
    {
      name: "project_id",
      label: "Project",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
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
      ),
    },
    {
      name: "district",
      label: "District",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
        >
          {districts?.map((item) => {
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
      ),
    },
    {
      name: "trade_id",
      label: "Service",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
        >
          {trades?.map((item) => {
            return (
              <Option value={item.id.toString()} key={item.id}>
                {item.name.charAt(0).toUpperCase() +
                  item.name.slice(1).toLowerCase()}
              </Option>
            );
          })}
        </Select>
      ),
    },
    // {
    //   name: "attendance",
    //   label: "Attendance %",
    //   node: (
    //     <Segmented options={['ASC', 'DESC']} />
    //   ),
    // },
    {
      name: "is_assessed",
      label: "Assessment",
      node: (
        <Select
          mode={"single"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
        >
          <Option value={true} key={0}>Assessed</Option>
          <Option value={false} key={0}>Not Assessed</Option>
        </Select>
      ),
    },

  ];

  return (
    <>
      <AdvancedFiltersModal
        isVisible={show_advanced_filters_modal}
        hideModal={() => set_show_advanced_filters_modal(false)}
      />
      <StyledCardTabs>
        {isExpandable && (
          <StyledFilterButton
            onClick={() => set_filter_expanded(!filter_expanded)}
            filter_expanded={filter_expanded}
          >
            <Space>
              <FilterOutlined />
              Filter
              {filter_expanded ? <CloseOutlined /> : <DownOutlined />}
            </Space>
          </StyledFilterButton>
        )}
        {filter_expanded && (
          <div className="filter-body">
            <Form
              form={form}
              onFinish={onFinish}
              onValuesChange={onFormChange}
              name="basic"
              autoComplete="off"
              layout="vertical"
              className="form-container"
            >
              <div className="filter-fields">
                {filterFormItems
                  .filter((o) => filter_fields?.includes(o.name))
                  .map((item) => {
                    return (
                      <Form.Item
                        label={item.label}
                        name={item.name}
                        key={item.name}
                      >
                        {item.node}
                      </Form.Item>
                    );
                  })}

              </div>
              <div className="flex justify-between p-2">
                {showAdvancedFilters ? (
                  <Button
                    onClick={() => {
                      set_show_advanced_filters_modal(true);
                      set_filter_expanded(false);
                    }}
                    type="primary"
                    className="primaryBtn"
                  >
                    <Space>
                      <FilterOutlined />
                      Advanced Filters
                      <ArrowRightOutlined />
                    </Space>
                  </Button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="secondary"
                    className="secondaryBtn"
                    icon={<ClearOutlined />}
                    onClick={() => clearForm()}
                  >
                    Clear Filters
                  </Button>
                  <Button htmlType="submit"
                    type="primary"
                    className="primaryBtn"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )}
      </StyledCardTabs>
      <FilteredFields onClear={clearForm} />
    </>
  );
}
