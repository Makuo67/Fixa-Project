import { useEffect, useState } from "react";
import { Button, Input, Space, Table, Tooltip, Tag, Badge } from "antd";
import { SearchOutlined, CheckCircleTwoTone, CloseCircleTwoTone, } from "@ant-design/icons";
import { usePusher } from "../../context/PusherContext";
import PaymentsPageHeader from "../Header/PaymentsPageHeader";
import Stats from "../Stats/Stats";
import { PayoutPageStyles } from "./PayoutPage.styled";
import DynamicTable from "../Tables/DynamicTable";
import PayoutButtons from "../Buttons/PayoutButtons";
import moment from "moment";
import { capitalize, toMoney } from "../../helpers/excelRegister";
import { Icon } from "@iconify/react";
import { StyledPayment } from "../Tables/PayrollTable.styled";
import PayoutModals from "../Modals/PayoutModals";
import PayoutProgress from "../shared/PayoutProgress";
import {
    getPayeeNames,
    getPayoutDetails,
    getPayoutList,
    getWorkforce,
    searchPayoutList,
} from "../../helpers/payments/payout/payout";
import { useRouter } from "next/router";
import PayoutFilters from "../Filters/PayoutFilters";
// import Pusher from "pusher-js";
import PayoutStatsSkeleton from "./PayoutStatsSkeleton";
import PaymentSummaryModal from "../Modals/PaymentSummaryModal";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import NetAmount from "../Modals/PaymentsModals/NetAmountModal";
import { getNetAmountDetails, getNetAmountDetailsPayout } from "@/helpers/deduction/deduction";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";
// import { SocketContext } from "../../context/socketContext";

const pusher_env = process.env.NEXT_PUBLIC_PUSHER_ENV;

//Search component
const SearchField = ({ query, handleSearch }) => {
    return (
        <Input
            size="middle"
            style={{ width: "350px", borderRadius: "6px" }}
            placeholder="Search Name, M.M. Account"
            prefix={<SearchOutlined style={{ color: "#A8BEC5" }} />}
            onChange={(e) => handleSearch(e.target.value)}
            value={query}
            name="search"
            allowClear
        />
    );
};

const PayoutPage = (props) => {
    // const socket = useContext(SocketContext);
    const pusher = usePusher();
    const [payoutData, setPayoutData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [exportEnabled, setExportEnabled] = useState(false);
    const [showPayoutButtons, setShowPayoutButtons] = useState(false);
    const [payoutStatus, setPayoutStatus] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingWorker, setEditingWorker] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [payoutInfo, setPayoutInfo] = useState({
        project: "",
        payout_name: "",
        payout_status: "",
        payout: [],
        meta_data: [],
        project_id: ""
    });
    const [paymentRun, setPaymentRun] = useState(false);
    const [totalPayees, setTotalPayees] = useState(0);
    const [payoutAggregates, setPayoutAggregates] = useState([]);
    const [tableActions, setTableActions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(true);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryModalData, setSummaryModalData] = useState([]);
    const [netAmountData, setNetAMountData] = useState([]);
    const [showNetAmountModal, setShowNetAmountModal] = useState(false);

    const router = useRouter();
    const { userProfile } = useUserAccess();

    const fetch_payout_Data = (id, query) => {
        setTableLoading(true);
        setLoading(true);
        getPayoutList(id, query)
            .then((res) => {
                setPayoutStatus(res.meta?.payment?.status);
                setPayoutData(res.data?.transactions);
                setPayoutAggregates(res.data?.aggregates);
                setTableLoading(false);
                setLoading(false);
                setPayoutInfo({
                    ...payoutInfo,
                    payout: res?.data,
                    project: res.meta?.payment?.project_name,
                    payout_status: res?.meta?.payment?.status,
                    payout_name: `${res?.meta?.payment?.title} #${props.name}`,
                    meta_data: res?.meta,
                    project_id: res?.meta?.payment?.project_id
                });
                setTotalPayees(res.data?.aggregates?.total_transactions);
            })
            .catch((err) => {
                setPayoutData([]);
                setTotalPayees(0);
                setLoading(false);
                setTableLoading(false);
            });
    };

    /* Called when Paying -- */
    const handleInstantChanges = (
        payee_id,
        status,
        whole_payout,
        payout_aggregates
    ) => {
        /**
         * 1. get the actual data.
         * 2. Get id from pusher and the updated status
         * 3. map throuh actual data and update the status according to the returned pusher ID
         * 4. Changing aggregates
         * @whole_payout from states
         *
         */
        // console.log('Failed ===', payout_aggregates?.failed);

        let updatedPayoutData = whole_payout.map((obj) => {
            if (obj.id.toString() === payee_id) {
                return { ...obj, status }; // Update the status of payee
            } else {
                return obj; // Return the original object if it doesn't have id
            }
        });

        //Check the aggregates update
        let successful_num = updatedPayoutData.filter(
            (item) => item.status === "successful"
        );
        let successful_amount = successful_num.reduce((sum, item) => {
            return sum + parseInt(item.amount);
        }, 0);

        let failed_num = updatedPayoutData.filter(
            (item) => item.status === "failed"
        );

        // console.log('success num ===', successful_num, 'amount success:', successful_amount, 'Failed num:', failed_num);
        let aggregates = {
            failed: failed_num.length,
            successful: successful_num.length,
            total_disbursed: successful_amount,
            total_payout: payout_aggregates?.total_payout,
            total_transactions: payout_aggregates?.total_transactions,
        };
        // console.log('===payoutdata',updatedPayoutData );
        setPayoutData(updatedPayoutData);
        setPayoutAggregates(aggregates);
        setPayoutStatus("open");
    };

    // console.log('=== socket', socket );
    const finalChecks = (id, query) => {
        getPayoutList(id, query).then((res) => {
            setPayoutStatus(res.meta?.payment?.status);
            setPayoutData(res.data?.transactions);
            setPayoutAggregates(res.data?.aggregates);
            setPayoutInfo({
                ...payoutInfo,
                payout: res?.data,
                project: res.meta?.payment?.project_name,
                payout_status: res?.meta?.payment?.status,
                payout_name: `${res?.meta?.payment?.title} #${props.name}`,
            });
            setTotalPayees(res.data?.aggregates?.total_transactions);
        });
    };

    /*  INITIAL useEffect */
    useEffect(() => {
        //get workforce and Payees on first load
        getWorkforce();
        getPayeeNames();
    }, []);

    // useEffect(()=>{
    //     console.log('Socket Data ====> ',socket);
    //     socket.on(`transaction-status-${pusher_env}-${props.name}-event`,(dataEvent)=>{
    //         console.log('Data event ',dataEvent);
    //     })

    // },[]);

    useEffect(() => {
        if (router.isReady) {
            fetch_payout_Data(props.name, router.query);
            if (payoutInfo.meta_data?.payment?.total_payees === "0") {
                setExportEnabled(true);
                setShowPayoutButtons(true);
            } else {
                setExportEnabled(false);
                setShowPayoutButtons(false);
            }
        }
        getNetAmountDetailsPayout(props?.name).then((response) => {
            setNetAMountData(response?.data)
        })
    }, [router.isReady, router.query]);

    useEffect(() => {
        if (showSummaryModal) {
            getPayoutDetails(props.name).then((data) => {
                setSummaryModalData(data)
            })
        }
    }, [router.isReady, showSummaryModal])


    useEffect(() => {
        if (props.name || router.isReady) {
            // var currentState = pusher.connection.state
            // console.log("pusher state >>>>>",currentState);

            let channel = pusher.subscribe(
                `transaction-status-${pusher_env}-${props.name}`
            );
            // channel.bind('pusher:subscription_succeeded', function() {
            //   console.log("pusher state yesssss");
            // });

            // channel.bind('pusher:subscription_error', function() {
            //   console.log("pusher state noooo");
            // });
            // console.log(' OUT PUSHER payoutData =====', payoutData);

            channel.bind(
                `transaction-status-${pusher_env}-${props.name}-event`,
                function (data) {
                    // console.log(" IN PUSHER payoutData =====", data);

                    handleInstantChanges(
                        data?.entity_id.toString(),
                        data?.status,
                        payoutData,
                        payoutAggregates
                    );
                }
            );

            return () => {
                // window.
                // channel.unbind(`transaction-status-${pusher_env}-${props.name}`);
                pusher.unsubscribe();
                // pusher.disconnect(`transaction-status-${pusher_env}-${props.name}`);
            };
        }
    }, [router.isReady, props.name, payoutData, payoutAggregates]);

    /* Request after edit, delete */
    useEffect(() => {
        if (tableActions) {
            fetch_payout_Data(props.name, router.query);
        }
        if (payoutInfo.meta_data?.payment?.total_payees === "0") {
            setExportEnabled(true);
            setShowPayoutButtons(true);
        } else {
            setExportEnabled(false);
            setShowPayoutButtons(false);
        }
        setTableActions(false);
    }, [tableActions, payoutData]);

    const handlePayoutPay = () => {
        //setPayoutStatus('success');
        setPaymentRun(true);
        setPayoutInfo({ ...payoutInfo, payout_status: payoutInfo.payout_status });
        setPayoutInfo((pre) => {
            return {
                ...pre,
                payout_status: "processing",
            };
        });
    };

    //Trigger editing worker
    const onEditPayee = (record) => {
        setIsEditing(true);
        setEditingWorker({ ...record });
    };
    //Trigger delete payee
    const onDeletePayee = (record) => {
        setIsDeleting(true);
        setEditingWorker({ ...record });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleCancelDelete = () => {
        setIsDeleting(false);
    };

    // handling search
    const handleSearch = (value) => {
        if (value.length >= 1) {
            // setCurrentPage(0);
            setQuery(value);
            setTableLoading(true);
            searchPayoutList(value).then((res) => {
                // console.log('Searching...', res);
                setPayoutData(res);
                setTableLoading(false);
                setTotalPayees(res.length);
                setIsSearching(true);
            });
        } else {
            setQuery(value);
            setTableLoading(false);
            setQuery(value);
            setIsSearching(false);
            // setCurrentPage(1);
            fetch_payout_Data(props.name, router.query);
        }
    };

    // Handle Table changes& pagination
    const handleTablePagination = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    const payoutColumns = [
        {
            title: "PAYEE NAME",
            dataIndex: "payee_name",
            key: "name",
            width: 255,
            render: (value, record) => {
                return <p>{capitalize(record.payee_name)}</p>;
            },
        },
        {
            title: "TYPE OF PAYEE",
            dataIndex: "payee_type_name",
            key: "payee_type_name",
            render: (value, record) => {
                return <p>{capitalize(record.payee_type_name)}</p>;
            },
        },
        {
            title: "ACCOUNT NUMBER",
            dataIndex: "account_number",
            key: "account_number",
            render: (value, data, index) => {

                return (<Tooltip
                    title={value === "" || !value ? "This payee have no account number" : data.payment_method_verification_desc}
                >
                    {value}{" "}
                    {value === "" || !value ? (
                        <Tag color={"orange"} key={index}>
                            <Badge
                                status={"warning"}
                                text={<span
                                    style={{
                                        color: "orange", textTransform: "capitalize",
                                    }}
                                >
                                    {"No Phone number"}
                                </span>}
                            />
                        </Tag>
                    ) : data.is_payment_method === "green" ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" />)
                        : data.is_payment_method === "blue" ? (
                            <CheckCircleTwoTone twoToneColor="#0063F8" />)
                            : (<CloseCircleTwoTone twoToneColor="#F5222D" />)
                    }
                </Tooltip>);
            }
        },
        {
            title: "PAYMENT METHOD",
            dataIndex: "payment_method",
            key: "payment_method",
        },
        {
            title: "AMOUNT",
            dataIndex: "amount",
            key: "amount",
            render: (text) =>
                new Intl.NumberFormat("en").format(text) + " " + "RWF ",
        },
        {
            title: "STATUS",
            dataIndex: "status",
            key: "status",
            render: (_, record) =>
                record.status.toString() === "successful" ? (
                    <StyledPayment>
                        <Space className="statusSpace">
                            <Button className="closed">
                                <Icon
                                    icon="carbon:dot-mark"
                                    height="20px"
                                    className="iconStatus"
                                />{" "}
                                <span>{capitalize(record.status.toString())}</span>
                            </Button>
                            <span className="date">
                                {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                            </span>
                        </Space>
                    </StyledPayment>
                ) : record.status.toString() === "pending" ||
                    record.status.toString() === "initiated" ? (
                    <StyledPayment>
                        <Space className="statusSpace">
                            <Button className="unpaid" type="secondary">
                                {record.status === "unpaid" ? (
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
                                <span>{capitalize(record?.status)}</span>
                            </Button>
                            <span className="date">
                                {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                            </span>
                        </Space>
                    </StyledPayment>
                ) : record.status.toString() === "unpaid" ? (
                    <StyledPayment>
                        <Space className="statusSpace">
                            <Button className="unpaid">
                                <Icon
                                    icon="mdi:clock-time-four-outline"
                                    height="15px"
                                    className="iconStatus"
                                />{" "}
                                <span>{capitalize(record.status)}</span>
                            </Button>
                            <span className="date">
                                {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                            </span>
                        </Space>
                    </StyledPayment>
                ) : record.status.toString() === "failed" ||
                    record.status.toString() === "error" ? (
                    <StyledPayment>
                        <Space className="statusSpace">
                            <Button className="failed">
                                <Icon
                                    icon="ion:close-circle-outline"
                                    color="#f5222d"
                                    height="20px"
                                    className="iconStatus"
                                />{" "}
                                <span>{capitalize("failed")}</span>
                            </Button>
                            <span className="date">
                                {capitalize(`updated ${moment().format("DD/MM/YYYY ")}`)}
                            </span>
                        </Space>
                    </StyledPayment>
                ) : (
                    ""
                ),
        },
        {
            title: "",
            key: "action",
            render: (_, record) => (
                <>
                    {payoutStatus === "unpaid" ? (
                        <StyledPayment>
                            <div className="payoutActions">
                                <Button
                                    icon={
                                        <Icon
                                            icon="material-symbols:edit-square-outline"
                                            color="#fa8c16"
                                            height={20}
                                        />
                                    }
                                    style={{
                                        borderColor: "#fa8c16",
                                        borderRadius: "5px",
                                        padding: "3px 2px",
                                    }}
                                    onClick={() => {
                                        onEditPayee(record);
                                    }}
                                />
                                {
                                    userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'delete worker in payment')
                                    && (

                                        <Button
                                            icon={
                                                <Icon
                                                    icon="material-symbols:delete-outline-rounded"
                                                    color="#f5222d"
                                                    height={20}
                                                />
                                            }
                                            style={{
                                                borderColor: "#f5222d",
                                                borderRadius: "5px",
                                                padding: "5px 3px",
                                            }}
                                            onClick={() => {
                                                onDeletePayee(record);
                                            }}
                                        />
                                    )
                                }
                            </div>
                        </StyledPayment>
                    ) : (
                        ""
                    )}
                </>
            ),
        },
        Table.EXPAND_COLUMN,
    ];

    return (
        <PayoutPageStyles>
            <div className="payoutContainer">
                {/* Container */}
                {/* ==== page header ==== */}
                <div>
                    <PaymentsPageHeader
                        title={capitalize(payoutInfo.payout_name)}
                        pay={"pay"}
                        payout={true}
                        handlePayoutPay={handlePayoutPay}
                        //project={projectName}
                        //paymentHeader={`${props.start_date} - ${props.end_date}`}
                        payoutStatus={payoutStatus}
                        paymentRun={paymentRun}
                        payment_id={props.name}
                        payoutData={payoutInfo.payout}
                        setLoading={setTableActions}
                        showPayoutButtons={showPayoutButtons}
                        loading={loading}
                        project_id={payoutInfo?.project_id}
                    />
                </div>
                {/* ==== Progress bar ==== */}
                <PayoutProgress
                    payment_id={props.name}
                    // payoutInfo={payoutInfo}
                    payoutStatus={payoutStatus}
                    loading={loading}
                    payoutAggregates={payoutAggregates}
                />
                {/* ==== Filters ==== */}
                <div className="filterSection">
                    <PayoutFilters
                        isExpandable
                        showAdvancedFilters
                        hasPagination
                        filter_fields={["status", "amount", "payee_type_name"]}
                        id={props.name}
                    />
                </div>

                {/* ==== Aggregates ==== */}
                {loading ? (
                    <PayoutStatsSkeleton />
                ) : (
                    <div className="aggregatesSection">
                        <Stats
                            isPayment={true}
                            title="TOTAL PAYEES"
                            value={
                                payoutAggregates?.total_transactions?.length < 0
                                    ? "-"
                                    : payoutAggregates?.total_transactions
                            }
                            loading={tableLoading}
                        />
                        {/*  ==== After Paying ==== */}
                        {payoutStatus !== "unpaid" && (
                            <>
                                <Stats
                                    isPayroll={true}
                                    title="SUCCESSFUL"
                                    info={true}
                                    infoText="Total successfull transactions"
                                    value={
                                        payoutAggregates?.successful?.length < 0
                                            ? "-"
                                            : toMoney(payoutAggregates?.successful)
                                    }
                                    loading={tableLoading}
                                    tooltip={"Number Of Successful Transactions"}
                                />
                                <Stats
                                    isPayroll={true}
                                    title="FAILED"
                                    info={true}
                                    infoText="Total failed transactions"
                                    tooltip={"Number Of Failed Transactions"}
                                    value={
                                        payoutAggregates?.failed?.length < 0
                                            ? "-"
                                            : toMoney(payoutAggregates?.failed)
                                    }
                                    loading={tableLoading}
                                />
                            </>
                        )}
                        {/* <Stats
                            isPayment={true}
                            title="PAYOUT AMOUNT (Rwf)"
                            info={true}
                            infoText=""
                            value={
                                payoutAggregates?.total_payout?.length < 0
                                    ? "-"
                                    : toMoney(payoutAggregates?.total_payout)
                            }
                            loading={tableLoading}
                            onClick={() => setShowSummaryModal(true)}
                        /> */}
                        {/* {payoutStatus !== "unpaid" && ( */}
                        <Stats
                            isPayroll={true}
                            title="NET AMOUNT TO BE DISBURSED (RWF)"
                            info="true"
                            infoText="Total net amount to be disbursed"
                            value={
                                payoutAggregates?.total_disbursed?.length < 0
                                    ? "-"
                                    : toMoney(payoutAggregates?.total_payout)
                            }
                            loading={tableLoading}
                            onClick={() => setShowNetAmountModal(true)}
                        />
                        {/* )} */}
                    </div>
                )}

                {/* ==== Table ==== */}
                <div className="tableSection">
                    {showPayoutButtons && (
                        <div className="inTable">
                            <PayoutButtons
                                key={2}
                                exportEnabled={exportEnabled}
                                showExport={false}
                                payoutInfo={payoutInfo}
                                payment_id={props.name}
                                setTableActions={setTableActions}
                                payoutStatus={payoutStatus}
                            />
                        </div>
                    )}
                    <div>
                        <DynamicTable
                            rowKey={`id`}
                            data={payoutData}
                            expandable={payoutData}
                            columns={payoutColumns}
                            loading={tableLoading}
                            extra_left={[
                                <SearchField
                                    key={0}
                                    handleSearch={handleSearch}
                                    query={query}
                                />,
                            ]}
                            extra_right={[
                                <PayoutButtons
                                    key={1}
                                    exportEnabled={exportEnabled}
                                    showExport={true}
                                    payoutInfo={payoutInfo}
                                    payment_id={props.name}
                                    setTableActions={setTableActions}
                                    payoutData={payoutData}
                                    payout={true}
                                    payoutStatus={payoutStatus}
                                />,
                            ]}
                            expandState={payoutStatus === "unpaid" ? false : true}
                            isPayout={true}
                            pagination={{
                                current: currentPage,
                                defaultCurrent: currentPage,
                                defaultPageSize: pageSize,
                                total: totalPayees,
                                onChange: handleTablePagination,
                                showSizeChanger: totalPayees >= 10 ? true : false,
                            }}
                            onChange={handleTablePagination}
                        />
                    </div>
                </div>
            </div>
            <PayoutModals
                isEditing={isEditing}
                show={false}
                editingWorker={editingWorker}
                handleCancelEdit={handleCancelEdit}
                setIsEditing={setIsEditing}
                isDeleting={isDeleting}
                handleCancelDelete={handleCancelDelete}
                setIsDeleting={setIsDeleting}
                payment_id={props.name}
                setTableActions={setTableActions}
                payoutInfo={payoutInfo}

            />
            <PaymentSummaryModal
                payout={true}
                modalData={summaryModalData}
                handleCancel={() => setShowSummaryModal(false)}
                handleOk={() => setShowSummaryModal(false)}
                show={showSummaryModal}
            />
            <NetAmount
                title={<h3>Net amount to be disbursed</h3>}
                showModal={showNetAmountModal}
                handleCancel={() => setShowNetAmountModal(false)}
                // data={data}
                payrollId={props?.name}
                payrollType={"Payroll"}
                data={netAmountData}
                isPayout={true}
            />
        </PayoutPageStyles>
    );
};

export default PayoutPage;
