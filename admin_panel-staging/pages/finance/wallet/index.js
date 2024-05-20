import { useRouter } from "next/router";
import Layout from "../../../components/Layouts/DashboardLayout/Layout";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import { Button, Collapse, Input, Space } from "antd";
import { Icon } from "@iconify/react";
import DynamicTable from "@/components/Tables/Projects/ProjectsDynamicTable";
import { SearchOutlined } from "@ant-design/icons";
import { ContactUsContent, TopUpModal, WalletCard } from "@/components/Cards/Finance/TopUp";
import { useCallback, useEffect, useState } from "react";
import { getAllTransactions, momoTopupRequest } from "@/helpers/payments/wallet";
import { RequestWalletModal } from "@/components/Modals/Wallet/RequestWalletModal";
import RenderLoader from "@/components/Loaders/renderLoader";
import dayjs from "dayjs";
import { getWalletrequestStatus } from "@/helpers/wallet/wallet";
import { useSelector } from "react-redux";
import { toMoney } from "@/helpers/excelRegister";
import { accessRouteRetrieval, accessSubpageEntityRetrieval } from "@/utils/accessLevels";

const { Search } = Input;

const SearchField = ({ onSearch }) => {
    return (
        <Search
            placeholder="Search Transactions"
            className="w-96 rounded-md"
            allowClear
            onSearch={onSearch}
            prefix={<SearchOutlined style={{ color: "#A8BEC5" }} />}
        />);
};

const transactionsCols = [
    {
        title: "DATE",
        dataIndex: "submition_date",
        key: "date",
        render: (text) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
        title: "TYPE",
        dataIndex: "transaction_type",
        key: "transaction_type",
        width: 90,
    },
    {
        title: "PREVIOUS BALANCE",
        dataIndex: "balance_before_is_loaded",
        key: "balance_before_is_loaded",
        render: (text) =>
            new Intl.NumberFormat("en").format(
                text
            ) +
            " " +
            "RWF ",
    },
    {
        title: "DETAILS",
        dataIndex: "transaction_desc",
        key: "transaction_desc",
        render: (text, record) => String(record?.status).toLowerCase() === 'processing' ? "-".repeat(10) : text
    },
    {
        title: "AMOUNT",
        dataIndex: "top_up_balance",
        key: "top_up_balance",
        render: (text, record) => String(record?.status).toLowerCase() === 'processing' ? "-".repeat(10) :
            new Intl.NumberFormat("en").format(
                text
            ) +
            " " +
            "RWF ",
    },
    {
        title: "CURRENT BALANCE",
        dataIndex: "balance_after_is_loaded",
        key: "balance_after_is_loaded",
        render: (text, record) => String(record?.status).toLowerCase() === 'processing' ? "-".repeat(10) :
            new Intl.NumberFormat("en").format(
                text
            ) +
            " " +
            "RWF ",
    },
    {
        title: "APPROVAL STATUS",
        dataIndex: "status",
        key: "status",
        render: (_, record) =>
            record.status && String(record.status).toLowerCase() === "initiated" ? (
                <Space className="flex p-1 items-center rounded-2xl justify-center bg-wallet_initiated_bg w-fit h-8">
                    <Button type="secondary" className="capitalize text-bder-red ">{record.status}</Button>
                </Space>
            ) : record.status && String(record.status).toLowerCase() === "processing" ? (
                <Space className="flex p-1 items-center rounded-2xl justify-center bg-wallet_processing_bg w-fit h-8">
                    <Button type="secondary" className="capitalize text-wallet_processing_text ">{record.status}</Button>
                </Space>
            ) : record.status && String(record.status).toLowerCase() === "cancelled" ? (
                <Space className="flex p-1 items-center rounded-2xl justify-center bg-wallet_processing_bg w-fit h-8">
                    <Button type="secondary" className="capitalize text-wallet_processing_text ">{record.status}</Button>
                </Space>
            )
                : record.status && String(record.status).toLowerCase() === "completed" ? (
                    <Space className="flex p-1 items-center rounded-2xl justify-center bg-wallet_loaded_bg w-fit h-8">
                        <Button type="secondary" className="capitalize text-wallet_loaded_text ">{record.status}</Button>
                    </Space>
                ) : (
                    ""
                ),
    },
];

const Wallet = () => {
    const { userProfile, companyStatusLoading } = useUserAccess();
    const router = useRouter();
    const [showCreateWallet, setShowCreateWallet] = useState(false)
    const [walletRequests, setWalletRequests] = useState([])
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [tableLoading, setTableLoading] = useState(false)
    const [transactions, setTransactions] = useState([])
    const [submitLoading, setSubmitLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const [reloadRequests, setReloadRequests] = useState(false);
    const [mtnPaymentMethodWallet, setMtnmtnPaymentMethodWallet] = useState({})
    const [topUpRequirements, setTopRequirements] = useState({
        balance_receipt_link: ''
    })

    const balance = useSelector((state) => state.user.balance?.availableBalance) || 0;

    const fetchData = useCallback(() => {
        setTableLoading(true);
        getAllTransactions().then((res) => {
            setTransactions(res.data);
        }).finally(() => {
            setTableLoading(false);
            setReload(false)
        });
    }, [reload, tableLoading]);

    const fetchRequests = useCallback(
        () => {
            getWalletrequestStatus().then((res) => {
                setWalletRequests(res)
                const momo = res.find(item => item.payment_method && item.payment_method.name && String(item.payment_method.name).toLowerCase().includes('mtn'))
                setMtnmtnPaymentMethodWallet(momo)
            }).finally(() => {
                // setReload(false)
                setReloadRequests(false)
            })
        },
        [reloadRequests],
    )


    useEffect(() => {
        if (router.isReady) {
            fetchData();
            fetchRequests()
        }
    }, [router.isReady])

    useEffect(() => {
        if (reload === true) {
            fetchData();
        }
        if (reloadRequests === true) {
            fetchRequests()
        }
    }, [reload, reloadRequests])



    const showTopupModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleReceipt = (receiptLink) => {
        setTopRequirements({ ...topUpRequirements, balance_receipt_link: receiptLink })
    }

    const handleMomoTopup = () => {
        setSubmitLoading(true)
        momoTopupRequest(topUpRequirements).then(() => {
            setReload(true)
            setTopRequirements({ ...topUpRequirements, balance_receipt_link: '' })
            setIsModalVisible(false);
        }).finally(() => {
            setSubmitLoading(false)
            setIsModalVisible(false);
            // setReload(false)
        })
    }

    const handleActions = (action) => {
        if (action === 'new_payroll') {
            router.push('/finance/payments');
        } else if (action === 'new_payout') {
            router.push('/finance/payments');
        } else if (action === 'new_tax_report') {
            router.push('/finance/taxes');
        }
    }

    const TopUpContent = () => (
        <div className="grid grid-cols-2 h-full">
            <h1 className="title text-title">{String(toMoney(balance) + " " + "RWF")}</h1>
            {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'wallet', 'wallet top up') && (
                <Button
                    type="primary"
                    className="primaryBtnCustom w-32 rounded-lg flex gap-2 place-self-end"
                    onClick={showTopupModal}
                >
                    <Icon icon="mingcute:add-line" className="text-white w-4 h-4" />
                    Top up
                </Button>
            )}
        </div>
    )

    const WalletRejectContent = () => (
        <div className="flex flex-col place-content-between h-full pl-7">
            <div className="flex flex-col gap-2">
                <h2 className="sub-heading-1 text-bder-red">Rejected</h2>
                <p className="sub-heading-1">Your wallet request has been rejected</p>
                <Collapse className="w-full"
                    expandIconPosition="end"
                    defaultActiveKey={'rejection_reason_0'}
                    // onChange={()=> {}}
                    items={[
                        {
                            key: 'rejection_reason_0',
                            label: <><h2>Reason</h2></>,
                            children: <p>{mtnPaymentMethodWallet && mtnPaymentMethodWallet.reason ? mtnPaymentMethodWallet.reason : ''}</p>,
                        },
                    ]}
                />
            </div>
            {userProfile?.payment_edit && (
                <Button
                    type="primary"
                    className="primaryBtnCustom w-44 rounded-lg flex gap-2"
                    onClick={() => setShowCreateWallet(true)}
                >
                    <Icon icon="mingcute:add-line" className="text-white w-4 h-4" />
                    New Submission
                </Button>
            )}
        </div>
    )

    const StatusContent = () => (
        <div className="flex flex-col items-start justify-center h-full pl-7">
            {/* Showing only MTN request message */}
            <div className="flex flex-col gap-2">
                <h2 className="sub-heading-1 text-black">Request Submitted</h2>
                <p>
                    {String(mtnPaymentMethodWallet?.request_status).toLowerCase() === "pending" ?
                        "Your wallet is being processed.It will be ready in less than 24 hours." :
                        ""}
                </p>
            </div>
        </div>
    )

    const ActionsContent = () => (
        <div className="flex flex-col h-full pl-3 pt-5 gap-3">
            <div className="flex gap-2">
                <Button
                    type="primary"
                    className="secondaryCustomBtn w-36 rounded-lg flex gap-2"
                    onClick={() => handleActions('new_payroll')}
                >
                    <Icon icon="mingcute:add-line" className="text-primary w-4 h-4" />
                    New Payroll
                </Button>

                <Button
                    type="primary"
                    className="secondaryCustomBtn w-36 rounded-lg flex gap-2"
                    onClick={() => handleActions('new_payout')}
                >
                    <Icon icon="mingcute:add-line" className="w-4 h-4" />
                    New Payout
                </Button>

            </div>

            <Button
                type="primary"
                className="secondaryCustomBtn w-44 rounded-lg flex gap-2"
                onClick={() => handleActions('new_tax_report')}
            >
                <Icon icon="mingcute:add-line" className="text-primary w-4 h-4" />
                New Tax Report
            </Button>
        </div>
    )

    if (companyStatusLoading || reload || reloadRequests) {
        return <RenderLoader />
    }
    else if (accessRouteRetrieval(userProfile?.user_access, 'finance', 'wallet') === false) {
        return <ErrorComponent status={403} backHome={true} />
    }

    return (
        <>
            {/* Wallet request  */}
            <div>
                {showCreateWallet && <RequestWalletModal isModalOpen={showCreateWallet} setShowModal={setShowCreateWallet} setReloadRequests={setReloadRequests} />}
                <section className="py-3">
                    <header className="title">Wallet</header>
                    {walletRequests?.length !== 0 && walletRequests?.some(item => item.request_status.toLowerCase() === "approved") &&
                        <header className="sub-heading-1">Top up your wallet to make automated payouts and payrolls.</header>
                    }
                </section>
                {walletRequests?.length === 0 && (
                    <section className="h-full flex items-center justify-center p-4">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <header className="heading-1 capitalize">Create a new wallet </header>
                            <p className="sub-heading-1 w-1/2 text-center">
                                Create and manage wallets to Pay workers and suppliers, run Payrolls or Payouts directly from our platform.
                            </p>
                            <div className='h-full flex flex-col items-center justify-center  gap-10'>
                                <div className='flex gap-8'>
                                    {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'wallet', 'wallet request') && (

                                        <div className='flex flex-col gap-4 items-center justify-center bg-white h-60 w-60 rounded-md border hover:border-2 border-primary cursor-pointer' onClick={() => setShowCreateWallet(!showCreateWallet)}>
                                            <Icon icon="tabler:plus" className='text-primary' height={24} />
                                            <span className='text-primary text-xl font-normal'>Create a wallet</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>)
                }

                <>
                    {mtnPaymentMethodWallet?.length !== 0 && String(mtnPaymentMethodWallet?.request_status).toLowerCase() === "pending" ?
                        <section className="h-fit flex p-4 gap-8">
                            <WalletCard title={'Creation Status'} key={'creation_Status_0'}
                                Content={StatusContent}
                                width={'w-1/2'} height={'h-[150px]'} border={true}
                            />
                            <WalletCard title={'Contact Us'} key={'contact_us'} Content={ContactUsContent} width={'w-1/2'} height={'h-[150px]'} border={true} />
                        </section>
                        : walletRequests?.length !== 0 && walletRequests?.some(item => item.request_status.toLowerCase() === "declined") ?
                            // rejected UI
                            <div className="flex gap-5">

                                <WalletCard title={'Creation Status'} Content={WalletRejectContent} border={true} width={'w-1/2'} height={'h-96'} />
                                <WalletCard title={'Contact Us'} key={'contact_us'} Content={ContactUsContent} width={'w-1/2'} height={'h-[150px]'} border={true} />
                            </div>
                            : walletRequests?.length !== 0 ? <div className=" space-y-8">
                                {/* ===== Wallets card ====== */}
                                <div className="flex gap-5 w-full">
                                    <WalletCard title={'Wallet Balance'} Content={TopUpContent} border={true} width={'w-1/2'} />
                                    {/* {userProfile?.payment_edit && (
                                    <WalletCard title={'Actions'} Content={ActionsContent} border={true} />
                                )} */}
                                </div>
                                {/* ===== Transactions table ======  */}
                                <DynamicTable
                                    loading={tableLoading}
                                    columns={transactionsCols}
                                    data={transactions}
                                    extra_left={[<h1 className="title text-title" key={'transaction_title'}>Transactions</h1>]}
                                    extra_middle={[<SearchField key={0} />]}
                                />
                                <TopUpModal
                                    isModalVisible={isModalVisible}
                                    handleOk={handleMomoTopup}
                                    handleCancel={handleCancel}
                                    handleReceipt={handleReceipt}
                                    submitLoading={submitLoading}
                                    topUpRequirements={topUpRequirements}
                                />
                            </div> : ""}
                </>

            </div>
        </>
    )
}
export default Wallet;

Wallet.getLayout = function getLayout(page) {
    return <Layout isPayment={true}>{page}</Layout>;
};
