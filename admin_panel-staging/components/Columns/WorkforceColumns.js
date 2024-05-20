import { Badge, Col, Tag, Tooltip } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { capitalizeAll } from "../../helpers/capitalize";

export const WorforceColumns = [{
    title: "id", dataIndex: "assigned_worker_id", key: "assigned_worker_id", render: (id) => {
        return (<Tooltip title="Assigned worker ID.">
            <div>{id ? id : "No ID"}</div>
        </Tooltip>);
    },
    responsive: ['md'],
}, {
    title: "names", dataIndex: "names", key: "worker_name", render: (name, data) => {
        // return (<Tooltip
        //     title={data.is_rssb_verified === "green" ? "This name is verified."
        //         : data.is_rssb_verified === "nothing" ? "This name is not verified." : ""}
        //     style={{ textTransform: "capitalize" }}
        // >
        //     <span className="names cursor-pointer">{capitalizeAll(name)}{" "}</span>
        //     {data.is_rssb_verified === "green" ? (
        //         <CheckCircleTwoTone twoToneColor="#52c41a" />)
        //         : data.is_rssb_verified === "nothing" ? (
        //             <CloseCircleTwoTone twoToneColor="#F5222D" />)
        //             : ""}
        // </Tooltip>);
        return (<span className="names cursor-pointer">{capitalizeAll(name)}{" "}</span>);
    },
    responsive: ['md'],
},
{
    title: "PAYMENT METHOD", dataIndex: "default_payment_method", key: "default_payment_method", render: (value, data, index) => {
        return (<Tooltip
            title={value === null || !value?.id || value?.account_number === "" ? "" : value.account_verified_desc}
        >
            {value?.account_number}{" "}
            {value === null || !value.id || value?.account_number === "" ? (
                <Tag color={"orange"} key={index}>
                    <Badge
                        status={"warning"}
                        text={<span
                            style={{
                                color: "orange", textTransform: "capitalize",
                            }}
                        >
                            {"No Payment method"}
                        </span>}
                    />
                </Tag>
            ) : value.is_verified === "green" ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />) 
                : value.is_verified === "blue" ? (
                    <CheckCircleTwoTone twoToneColor="#0063F8" />)
                    : (<CloseCircleTwoTone twoToneColor="#F5222D" />)
            }
        </Tooltip>);
    },
    responsive: ['md'],
},
{
    title: "NID NUMBER", dataIndex: "national_id", key: "national_id", render: (value, data, index) => {
        return (<Tooltip
            title={
                value === "" || !value ? "" :
                    data.is_rssb_verified === "green"
                        ? "This NID number is verified."
                : data.is_rssb_verified === "nothing"
                    ? "This NID number is not verified."
                    : ""
            }
        >
            {value}{" "}
            {
                value === "" || !value ? (
                    <Tag color={"orange"} key={index}>
                        <Badge
                            status={"warning"}
                            text={<span
                                style={{
                                    color: "orange", textTransform: "capitalize",
                                }}
                            >
                                {"No NID number"}
                            </span>}
                        />
                    </Tag>
                )
                    : data.is_rssb_verified === "green" ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" />) 
                        : data.is_rssb_verified === "nothing" ? (
                            <CloseCircleTwoTone twoToneColor="#F5222D" />)
                            : ""
            }
        </Tooltip>)
    },
    responsive: ['md'],
},
{
    title: "service", dataIndex: "trade", key: "trade",
    render: (trade) => {
        return trade ? <span style={{ textTransform: "capitalize" }}>{trade} </span> : "-";
    },
    responsive: ['md'],
},

{
    title: "status",
    dataIndex: "is_active",
    key: "is_active",
    width: 250,
    render: (is_active, worker, index) => {
        return (<div>
            <div>
                <Tag color={is_active ? "green" : "red"} key={index}>
                    <Badge
                        status={is_active ? "success" : "error"}
                        text={<span
                            style={{
                                color: is_active ? "green" : "red", textTransform: "capitalize",
                            }}
                        >
                            {is_active ? "active" : "inactive"}
                        </span>}
                    />
                </Tag>
            </div>
            <Col>
                <span className="text-gray">
                    Last attendance: {worker.last_attendance}
                </span>
            </Col>
        </div>);
    },
    responsive: ['md'],
}, {
    title: "project", dataIndex: "project_name", key: "project_name",
    render: (name) => {
        return name ? <span style={{ textTransform: "capitalize" }}>{name} </span> : "-";
    },
    responsive: ['md'],
},

];