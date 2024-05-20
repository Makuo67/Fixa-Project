import { Badge, Button, Space, Table, Tag, Tooltip } from "antd";
import moment from "moment";
import { Icon } from "@iconify/react";
import { capitalize, toMoney } from "../../helpers/excelRegister";
import { capitalizeSentenceWords } from "../../helpers/capitalizeWOrdInSentence";
import {
    CheckCircleTwoTone,
    CloseCircleTwoTone,
} from "@ant-design/icons";

const PayrollTableColumns = [
    {
        title: "ID",
        dataIndex: "id",
        key: "id",
    },
    {
        title: "NAME",
        dataIndex: "worker_name",
        key: "worker_name",
        render: (worker_name) => <span className="names">{capitalizeSentenceWords(worker_name)}</span>,
    },
    {
        title: "ACCOUNT NUMBER",
        dataIndex: "account_number",
        key: "account_number",
        render: (_, data, index) => {
            return (
                <Tooltip
                    title={
                        data.account_number === "" || !data.account_number ? "This worker have no phone number"
                            : data.payment_method_verification_desc
                    }
                    style={{ textTransform: "capitalize" }}
                >
                    {data.account_number}{" "}
                    {data.account_number && data.account_number !== "" ?
                        data.is_payment_method === "green" ? (
                            <CheckCircleTwoTone twoToneColor="#52c41a" />)
                            : data.is_payment_method === "blue" ? (
                                <CheckCircleTwoTone twoToneColor="#0063F8" />)
                                : (<CloseCircleTwoTone twoToneColor="#F5222D" />)
                        : (
                            <Tag color={"red"} key={index}>
                                <Badge
                                    status={"error"}
                                    text={<span
                                        style={{
                                            color: "red", textTransform: "capitalize",
                                        }}
                                    >
                                        {"No Account number"}
                                    </span>}
                                />
                            </Tag>
                        )}
                </Tooltip>
            )
        },
    },
    {
        title: "PAYMENT METHOD",
        dataIndex: "payment_method",
        key: "payment_method",
        render: (payment_method) => <span className="names capitalize">{payment_method ? payment_method : "-"}</span>,
    },
    {
        title: "EARNINGS (Rwf)",
        dataIndex: "take_home",
        key: "take_home",
        render: (take_home) => <span>{toMoney(take_home)}</span>,
    },
    {
        title: "STATUS",
        dataIndex: "status",
        key: "status",
        width: 300,
        render: (status) => (
            <>
                {status.toString() === "successful" ? (
                    <Space className="statusSpace">
                        <Button className="closed">
                            <Icon
                                icon="material-symbols:check-circle-outline-rounded"
                                color="#389e0d"
                                className="iconStatus"
                            />
                            <span>{capitalize(status.toString())}</span>
                        </Button>
                        <span className="date">
                            {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                        </span>
                    </Space>
                ) : status.toString() === "unpaid" ||
                    status.toString() === "initiated" ? (
                    <Space className="statusSpace">
                        <Button className="unpaid" type="secondary">
                            {status === "unpaid" ? (
                                <Icon
                                    icon="mdi:clock-time-four-outline"
                                    height="15px"
                                    className="iconStatus"
                                />
                            ) : (
                                <Icon
                                    icon="icon-park-outline:loading-one"
                                    height="15px"
                                    color="#505E64"
                                />
                            )}
                            <span>{capitalize(status.toString())}</span>
                        </Button>
                        <span className="date">
                            {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                        </span>
                    </Space>
                ) : status.toString() === "pending" ?
                    (
                        <Space className="statusSpace">
                            <Button className="!bg-[#FFF1B8] unpaid" type="secondary">
                                    <Icon
                                        icon="icon-park-outline:loading-one"
                                        height="15px"
                                        color="#FA8C16"
                                    />
                                <span className="!text-[#FA8C16]">{capitalize(status.toString())}</span>
                            </Button>
                            <span className="date">
                                {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                            </span>
                        </Space>
                    )
                    : status.toString() === "failed" || status.toString() === "error" ? (
                        <Space className="statusSpace">
                            <Button className="failed" type="secondary">
                                <Icon
                                    icon="ion:close-circle-outline"
                                    color="#f5222d"
                                    height="20px"
                                    className="iconStatus"
                                />
                                <span>{capitalize("failed")}</span>
                            </Button>
                            <span className="date">
                                {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                            </span>
                        </Space>
                    ) : ""}
            </>
        ),
    },
    Table.EXPAND_COLUMN,
];
export default PayrollTableColumns;
