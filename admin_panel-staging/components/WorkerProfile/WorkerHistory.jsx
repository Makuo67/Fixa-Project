import React, { Suspense, useEffect, useState } from 'react'
import { StyledWorkHistory } from './Tabs/WorkHistory.styled';
import { Button, DatePicker, Empty, Form, Select, Space, Spin } from 'antd';
import { LoadingOutlined, ClearOutlined } from '@ant-design/icons';
import DynamicTable from '../Tables/DynamicTable';
import Stats, { StyledStatsContainer } from '../Stats/Stats';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { GetWorkHistory } from '@/redux/actions/workerprofile.actions';
import objectToQuery from '../Filters/helpers';
import ErrorComponent from '../Error/Error';
import { accessRouteRetrieval } from '@/utils/accessLevels';
import { capitalizeAll } from '@/utils/capitalizeAll';
import { toMoney } from '@/helpers/excelRegister';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export const WorkerHistory = ({
    worker_id,
    data,
    user_access,
    initial_queries,
}) => {
    const { workHistory, loading } = useSelector((state) => state.worker_profile);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const [filteringParams, setFilteringParams] = useState("");
    const [searchedText, setSearchedText] = useState("");

    const router = useRouter();
    const dispatch = useDispatch();
    const { query: { name, date_title } } = router
    const format = "YYYY-MM-DD";

    // worker history EFFECT
    useEffect(() => {
        const filters = objectToQuery(router.query);
        if (!worker_id) return
        const fetchWorkerHistory = async (worker_id, params) => {
            try {
                dispatch(GetWorkHistory(worker_id, params));
            } catch (error) {
                console.log(error);
            }
        }
        fetchWorkerHistory(worker_id, filters)
    }, [worker_id, router.query])


    const clearForm = () => {
        form.resetFields();
        const { working_date_gte, working_date_lte, service_id, project_id, ...query } = router.query;

        const updatedQuery = { ...query };
        if (working_date_gte) {
            delete updatedQuery.working_date_gte;
        }
        if (working_date_lte) {
            delete updatedQuery.working_date_lte;
        }
        if (service_id) {
            delete updatedQuery.service_id;
        }
        if (project_id) {
            delete updatedQuery.project_id;
        }

        router.replace({
            pathname: router.pathname,
            query: updatedQuery,
        });
    };
    const filterFormItems = [
        date_title
            ? {
                name: "date_onboarded",
                label: date_title,
                node: (
                    <RangePicker
                        disabledDate={disabledDate}
                        style={{ width: "100%" }}
                        className="formInput"
                    />
                ),
            }
            : {
                name: "date_onboarded",
                label: "Date Onboarded",
                node: (
                    <RangePicker
                        disabledDate={disabledDate}
                        style={{ width: "100%" }}
                        className="formInput"
                    />
                ),
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
                    className="formInput"
                >
                    {workHistory?.all_projects?.map((item) => {
                        return (
                            <Option
                                value={item?.id?.toString()}
                                key={item?.id}
                                title={item?.name}
                            >
                                {capitalizeAll(item?.name)}
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
                    className="formInput"
                >
                    {workHistory?.all_services?.map((item) => {
                        return (
                            <Option value={item?.service_id.toString()} key={item?.service_id}>
                                {capitalizeAll(item?.name)}
                            </Option>
                        );
                    })}
                </Select>
            ),
        },
    ];
    const filter_fields = ["date_onboarded", "project_id", "trade_id"];
    const columns = [
        {
            title: "DATE",
            dataIndex: "date",
            key: "date",
            render: (date) => {
                return dayjs(date).format("YYYY-MM-DD");
            },
            filteredValue: [searchedText],
            onFilter: (value, record) => {
                return record?.date?.includes(value);
            },
        },
        {
            title: "SHIFT",
            dataIndex: "shift",
            key: "shift",
            render: (shift, record) => {
                if (record?.shift?.working_time == "half") {
                    return capitalizeAll(record?.shift?.working_time);
                } else if (shift.name == null || shift.name == "") {
                    return "-";
                } else {
                    return capitalizeAll(shift.name);
                }
            },
        },
        {
            title: "PROJECT",
            dataIndex: "project",
            key: "project",
            render: (project) => {
                if (project.name == null || project.name == "") {
                    return "-";
                } else {
                    return capitalizeAll(project.name);
                }
            },
            filteredValue: [searchedText],
            onFilter: (value, record) => {
                return record.project.name.includes(value);
            },
        },
        {
            title: "SITE ADMIN",
            dataIndex: "supervisor",
            key: "supervisor",
            render: (supervisor) => {
                if (supervisor.name == null || supervisor.name == "" || supervisor?.name?.includes("null")) {
                    return "-";
                } else {
                    return supervisor.name;
                }
            },
        },
        {
            title: "SERVICE",
            dataIndex: "service",
            key: "service",
            render: (service) => {
                if (service.name == null || service.name == "") {
                    return "-";
                } else {
                    return capitalizeAll(service.name);
                }
            },
        },
        {
            title: "RATE",
            dataIndex: "daily_earnings",
            key: "daily_earnings",
            render: (daily_earnings) => {
                if (daily_earnings == null || daily_earnings == "") {
                    return "-";
                } else {
                    return toMoney(daily_earnings);
                }
            },
        },
    ];
    const disabledDate = (current) => {
        return current && current.valueOf() > Date.now();
    };

    const handlePagination = (pagination) => {
        // console.log("--handle pagination--");
    };
    const onFinishFiltering = (values) => {

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
            values["working_date_gte"] = values["date_onboarded"][0].format(format);
            values["working_date_lte"] = values["date_onboarded"][1].format(format);
            delete values["date_onboarded"];
        }

        if (values["trade_id"]) {
            values["service_id"] = values["trade_id"];
            delete values["trade_id"];
        }

        const query = { ...router.query, ...values };
        router.replace({
            pathname: router.pathname,
            query,
        });

        setFilteringParams(params);
    };

    if (loading) {
        return (
            <div className=" w-full flex flex-col items-center justify-center">
                <Spin indicator={
                    <LoadingOutlined spin />
                } />
            </div>
        )
    }
    return (
        <>
            <StyledWorkHistory>
                <div className="worker-history">
                    <div className="filter-body">
                        <h4 className="filter_by">FILTER BY</h4>
                        <Form
                            form={form}
                            onFinish={onFinishFiltering}
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
                                {" "}
                                <div className="submit-button">
                                    <Space>
                                        <Button
                                            onClick={() => clearForm()}
                                            type="secondary" className="secondaryBtn"
                                            icon={<ClearOutlined />}
                                        // loading={loading}
                                        >
                                            Clear Filters
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            className="primaryBtn"
                                        // loading={loading}
                                        >
                                            Apply
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        </Form>
                    </div>
                    {!workHistory || workHistory?.history?.length === 0 ?
                        (<div className="h-60 flex items-center justify-center">
                            <Empty description="No attendances found, please record your first attendance to get started."
                                className="flex flex-col items-center justify-center">
                                <Button
                                    type="primary"
                                    className="primaryBtn"
                                    onClick={() => router.push("/workforce")}
                                >
                                    Back to Workforce
                                </Button>
                            </Empty>
                        </div>) : (
                            <Suspense fallback={<div>Loading...</div>}>
                                <StyledStatsContainer className="mt-20">
                                    <Stats
                                        title={"DAY SHIFTS/NIGHT SHIFTS"}
                                        value={workHistory?.statistics?.shift && `${workHistory?.statistics.shift[0]?.day} / ${workHistory?.statistics.shift[0]?.night}`}
                                    />
                                    <Stats
                                        title={" TOTAL PROJECTS"}
                                        value={workHistory?.statistics?.total_projects && `${workHistory?.statistics?.total_projects}`}
                                    />
                                    <Stats
                                        title={"DEDUCTIONS"}
                                        value={workHistory?.statistics?.total_deduction && `${toMoney(workHistory?.statistics?.total_deduction)} RWF`}
                                        info={true}
                                    />
                                    <Stats
                                        title={"TOTAL EARNINGS"}
                                        value={workHistory?.statistics?.total_earnings && `${toMoney(workHistory?.statistics?.total_earnings)} RWF`}
                                    />
                                </StyledStatsContainer>
                                <div className="history-table">
                                    <DynamicTable
                                        data={workHistory?.history}
                                        columns={columns}
                                        loading={loading}
                                        extra_left={[`Total Shifts: ${workHistory?.statistics?.shift && Array.isArray(workHistory?.statistics.shift) ? workHistory?.statistics?.shift?.reduce((total, shift) => total + shift.day + shift.night, 0) : '-'}`]}
                                        pagination={{
                                            defaultCurrent: currentPage,
                                            total: data?.length,
                                            defaultPageSize: 10,
                                        }}
                                        onChange={(value) => handlePagination(value)}
                                    />
                                </div>
                            </Suspense>
                        )}
                </div>
            </StyledWorkHistory>
        </>
    )
}
