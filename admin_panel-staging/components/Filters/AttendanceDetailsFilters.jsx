import {
    ArrowRightOutlined,
    ClearOutlined,
    CloseOutlined,
    DownOutlined,
    FilterOutlined,
} from "@ant-design/icons";
import { Button, Form, Select, Space } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FilteredFields from "./FilteredFields";
import { StyledCardTabs, StyledFilterButton } from "./StyledCardTabs";
import { getServices } from "@/redux/actions/workforce.actions";
import { get } from "idb-keyval";

const { Option } = Select;

export default function AttendanceDetailsFilters({
    isExpandable,
    filter_fields,
    initial_queries,
    hasPagination,
}) {
    const { trades } = useSelector((state) => state.workforce.filters);
    const [attendanceDetails, setAttendanceDetails] = useState({})
    const [filter_expanded, set_filter_expanded] = useState(!isExpandable);

    const router = useRouter();
    const dispatch = useDispatch();
    const { gender, service } = router.query;

    const [form] = Form.useForm();

    const getPropsAttendance = async () => {
        const data = await get("attendanceProps")
        setAttendanceDetails(data)
    }


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
            query["current_page"] = 1;
            query["_start"] = 0;
            // query["_limit"] = -1;
        }
        form.resetFields();
        router.replace({
            pathname: router.pathname,
            query,
        });
    };

    // dispatch select options
    useEffect(() => {
        dispatch(getServices())
        getPropsAttendance()
    }, []);

    // set default form values
    useEffect(() => {
        const values = {
            gender,
            service,
        };
        form.setFieldsValue(values);
    }, [router.isReady, router.query]);

    const applyFiters = (values) => {
        // delete empty fields
        Object.keys(values).forEach((key) => {
            if (values[key] === undefined || values[key] === null) {
                delete values[key];
            }
        });

        const query = { ...router.query, ...values };
        if (hasPagination) {
            query["current_page"] = 1;
            query["_start"] = 0;
            // query["_limit"] = -1;
        }
        router.replace({
            pathname: router.pathname,
            query,
        });

        if (isExpandable) set_filter_expanded(false);
    }
    const onFinish = (values) => {
        applyFiters(values)
    };
    const onFormChange = (values) => {
        applyFiters(values)
    };

    const filterFormItems = [
        {
            name: "service",
            label: "Service",
            node: (
                <Select
                    mode={"multiple"}
                    allowClear={true}
                    placeholder="Please trade"
                    style={{ width: "100%" }}
                >
                    {trades?.map((item) => {
                        return (
                            <Option
                                value={item.name.toString()}
                                key={item.name}
                                title={item.name}
                                style={{ textTransform: "capitalize" }}
                            >
                                {item.name}
                            </Option>
                        );
                    })}
                </Select>
            ),
        },
        {
            name: "gender",
            label: "Gender",
            node: (
                <Select
                    allowClear={true}
                    placeholder="Please select"
                    style={{ width: "100%" }}
                    key="0"
                >
                    <Option value="male">Male</Option>
                    <Option value="female">Female</Option>
                </Select>
            ),
        }
    ];

    return (
        <>
            <StyledCardTabs>
                {isExpandable && (
                    <StyledFilterButton
                        onClick={() => set_filter_expanded(!filter_expanded)}
                        filter_expanded={filter_expanded}
                    >
                        <Space>
                            <FilterOutlined />
                            FILTER BY
                            {filter_expanded ? (
                                // <Button className="clear border-bder-color flex items-center" type="secondary" onClick={() => clearForm()}>
                                //     <CloseOutlined /> Clear
                                // </Button>
                                <></>
                            ) : (
                                <DownOutlined />
                            )}
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
                            <div className="buttons-container">
                                <div className="submit-button">
                                    <Space>
                                        <Button htmlType="submit"
                                            type="primary"
                                            className="primaryBtn"
                                        >
                                            Apply
                                        </Button>
                                    </Space>
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
