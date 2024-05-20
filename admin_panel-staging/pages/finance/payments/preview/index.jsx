import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Button, Input, Tabs, Form, Popconfirm} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  InfoCircleFilled
} from "@ant-design/icons";
import { del, get, set } from "idb-keyval";
import { Icon } from "@iconify/react";

import ErrorComponent from "@/components/Error/Error";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { getAllServices } from "@/redux/actions/services.actions";
import ExcelErrors from "@/components/Error/ExcelErrors";
import DynamicTable from "@/components/Tables/DynamicTable";
import Layout from "@/components/Layouts/DashboardLayout/Layout";
import { deletePayeePayoutTemp, deletePayoutTemp, payoutGetBulkTemp, payoutSaveBulk, searchPayoutTemplList } from "@/helpers/payments/payout/payout";
import { TempBulkPayoutColumns } from "@/components/Columns/TempBulkPayoutColumns";
import RenderLoader from "@/components/Loaders/renderLoader";
import { itemStyles } from "@/components/Forms/WorkerRegistrationForm";
import { encodeJSONBase64 } from "@/utils/decodeBase";
import { accessRouteRetrieval } from "@/utils/accessLevels";

//Search component
const SearchField = ({ query, handleSearch }) => {
  return (
    <div className="flex gap-1">

      <Input size="middle"
        className="!w-[350px]"
        style={itemStyles.inputStyles}
        placeholder="Search Payees by Account Name or Account Number"
        prefix={< SearchOutlined style={{ color: '#A8BEC5' }} />}
        onChange={(e) => handleSearch(e.target.value)}
        value={query}
        name='search'
        allowClear

      />

    </div>
  )
};

const PreviewPayoutTemp = () => {
  const [tempData, setTempData] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [disabled, setDisabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [tableActions, setTableActions] = useState(false);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [recentFile, setRecentFile] = useState({});
  const [service, setServices] = useState([]);
  const [table, setTable] = useState('all');
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(-1);
  const [disableRecent, setDisableRecent] = useState(false);
  const [saveBtnLoading, setSaveBtnLoading] = useState(false);
  const [deleteBtnLoading, setDeleteBtnLoading] = useState(false);

  const { userProfile, companyStatusLoading } = useUserAccess();

  const router = useRouter();
  const { paymentId, paymentName } = router.query

  const dispatch = useDispatch()
  const date = new Date(),
    dateString = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const fetch_temp_Data = (payload) => {
    setTableLoading(true);
    payoutGetBulkTemp(payload).then((res) => {
      if (res?.data?.data?.payees?.length === 0 && table === "all") {
        setTempData([]);
        setTotalWorkers(0);
        router.push(`/finance/payments/${paymentId}`)
      }
      set(`payoutTemp_${paymentId}_${paymentName.split("#")[1]}`, encodeJSONBase64(res?.data?.data?.payees))
      setTempData(res?.data?.data?.payees);
      setTotalWorkers(res?.data?.meta?.pagination?.count);
    }).catch((err) => {
      //setDisabled(true)
      setTempData([]);
      setTotalWorkers(0);
      router.push(`/finance/payments/${paymentId}`)
    })
    setTableLoading(false);
  }

  useEffect(() => {
    if (router.isReady && paymentId) {
      const payload = {
        start: 0,
        limit: -1,
        payment_id: paymentId,
        table
      }
      fetch_temp_Data(payload);
      if (tempData?.length === 0) {
        setDisabled(true);
      }
      // Get recent file from IndexDB
      get('recent_file').then((recent) => {
        //setRecent File here instead
        if (recent) {
          setRecentFile(recent);

        } else {
          setRecentFile([]);
          setDisableRecent(true);
        }
      });
      // get all trades
      dispatch(getAllServices()).then((data) => setServices(data))
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (table === 'valid' || table === 'invalid' || table === 'all' && paymentId) {
      const payload = {
        start: 0,
        limit: limit,
        payment_id: paymentId,
        table
      }
      // setTempCountStart(0);
      fetch_temp_Data(payload);
    }
  }, [table])

  /* FEtch after saving */

  useEffect(() => {
    if (tableActions) {
      const payload = {
        start: 0,
        limit: limit,
        payment_id: paymentId,
        table: table
      }
      fetch_temp_Data(payload);
      setTableActions(false);
    }
    setTableActions(false);
  }, [tableActions])

  const handleSearch = (value) => {
    if (value.length >= 1) {
      setCurrentPage(1);
      setQuery(value);
      // setTableLoading(true);

      searchPayoutTemplList(value, paymentId, paymentName.split("#")[1])
        .then((res) => {
          setTempData(res)
        }).finally(() => {
          setTableLoading(false)
          setIsSearching(false)
        })
    } else {
      setQuery(value);
      setIsSearching(false);
      setCurrentPage(1);

      const payload = {
        start: 0,
        limit: -1,
        payment_id: paymentId
      }
      fetch_temp_Data(payload);
    }
  };

  /* deleting the file at apispreadsheet */
  const saveRecentFile = () => {
    setSaveBtnLoading(true);
    payoutSaveBulk(paymentId).then((res) => {
      console.log("errorororo", res)
      setSaveBtnLoading(false);
      // Clear payout temp local data
      if (res) {
        router.push(`/finance/payments/${paymentId}`);
        del(`payoutTemp_${paymentId}_${paymentName.split("#")[1]}`)
      }

    }).catch(() => {
      setSaveBtnLoading(false);
    });
  }

  const cancelAddingPayees = () => {
    setDeleteBtnLoading(true);
    deletePayoutTemp(paymentId).then((res) => {
      setDeleteBtnLoading(false);
      // Clear payout temp local data
      del(`payoutTemp_${paymentId}_${paymentName.split("#")[1]}`)
      router.push(`/finance/payments/${paymentId}`);
    }).catch(() => {
      setDeleteBtnLoading(false);
    });
  }

  const handleTableChange = (pagination) => {
    console.log("pagination", pagination)
  };

  const onDeleteWorker = async (record) => {
    if (record) {
      await deletePayeePayoutTemp(record).then((res) => {
        setTableActions(true);
      }).catch((err) => {
        console.log(err)
      })
    }
  }

  const onTabChange = (value) => {
    switch (value) {
      case 'valid_payees':
        setTable('valid');
        break;
      case 'invalid_payees':
        setTable('invalid');
        break;
      default:
        setTable('all');
        break;
    }
  };

  const total = <div>
    <h3 className="text-xl">Total Payees:{" "} <span className="font-medium text-primary">{totalWorkers}</span>
    </h3>
  </div>

  const TempButtons = (
    <div className="flex justify-end mb-4">
      <div className="flex gap-4">
        <Popconfirm
          placement="top"
          title='This action will delete all your unregistered payees, Are you sure?'
          onConfirm={cancelAddingPayees}
          okText='Yes'
          cancelText='No'
          okButtonProps={{
            className: "bg-primary"
          }}

        >
          <Button
            size={"large"}
            style={{ border: "1px solid red", color: "white", borderRadius: "5px", backgroundColor: 'red' }}
            className="cursor-pointer"
            loading={deleteBtnLoading}
          >
            Delete All
          </Button>
        </Popconfirm>
        {table === 'invalid' ? '' : (
          <Popconfirm
            placement="top"
            title='This action will save only the Valid Payees, Are you sure?'
            onConfirm={saveRecentFile}
            okText='Yes'
            cancelText='No'
            okButtonProps={{
              className: "bg-primary"
            }}
          >
            <Button
              type="primary"
              size="large"
              className="primaryBtn"
              loading={saveBtnLoading}
            >
              Save
            </Button>
          </Popconfirm>
        )}
      </div>
    </div>);
  if (companyStatusLoading) {
    return <RenderLoader />
  } else if (accessRouteRetrieval(userProfile?.user_access, 'finance', 'payment') === false) {
    return <ErrorComponent status={403} backHome={true} />
  }

  return (
    <>
      <div className="flex flex-col box-border gap-2 w-full" >
        <div className="flex items-center justify-start hover:cursor-pointer">
          <div className="flex gap-4 items-center">
            <Button className="secondaryBtn !border-none !bg-secondary !shadow-none" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/finance/payments/${paymentId}`)}>
              Back
            </Button>
            <span className="capitalize">
              {paymentName}
            </span>
            <InfoCircleFilled className="text-primary" />
          </div>
        </div>
        <div
          style={{ maxWidth: "100%" }}>
          <ExcelErrors tableActions={tableActions} type="payout_momo" paymentId={paymentId} />
        </div>
        {/* TABS */}
        {/* TABLES */}
        <Tabs defaultActiveKey="all_payees" onChange={(e) => onTabChange(e)} tabBarExtraContent={total} destroyInactiveTabPane={true}
          style={{ maxWidth: "100%" }}>
          <Tabs.TabPane tab="All Payees" key="all_payees">
            {TempButtons}
            {/* ALL WORKERS TABLES */}
            <DynamicTable
              rowKey="id"
              isPayoutTemp={true}
              loading={tableLoading}
              extra_left={[`Date: ${dateString}`]}
              extra_middle={[<SearchField key={0} query={query} handleSearch={handleSearch} />]}
              // columns={TempBulkPayoutColumns}
              columns={TempBulkPayoutColumns.map(column => {
                if (column.key === 'action') {
                  return {
                    ...column,
                    render: (record) => (
                      <Button type="link" onClick={async () => {
                        const results = await column.onDeleteWorker(record?.id)
                        if (results) {
                          setTableActions(true);
                        }
                      }}
                        icon={<Icon
                          icon="material-symbols:delete-outline-rounded"
                          color="#f5222d"
                          height="25px"
                          className="icon"
                        />}
                        danger>
                      </Button>
                    ),
                  };
                }
                return column;
              })}
              data={tempData}
              onChange={(value) => handleTableChange(value)}
              rowClassName={{ error: 'error-class-name' }}
            />
          </Tabs.TabPane>
          {/* VALID WORKERS TABLE */}
          <Tabs.TabPane tab="Valid Payees" key="valid_payees">
            {TempButtons}
            <DynamicTable
              rowKey="id"
              isPayoutTemp={true}
              loading={tableLoading}
              extra_left={[`Date: ${dateString}`]}
              extra_middle={[<SearchField key={0} query={query} handleSearch={handleSearch} />]}
              columns={TempBulkPayoutColumns}
              data={tempData}
              onChange={(value) => handleTableChange(value)}
              rowClassName={{ warning: 'warning-class-name', error: 'error-class-name' }}
            />
          </Tabs.TabPane>
          {/* INVALID WORKERS TABLE */}
          <Tabs.TabPane tab="Invalid Workers" key="invalid_payees">
            {TempButtons}
            <DynamicTable
              rowKey="id"
              isPayoutTemp={true}
              loading={tableLoading}
              extra_left={[`Date: ${dateString}`]}
              extra_middle={[<SearchField key={0} query={query} handleSearch={handleSearch} />]}
              columns={TempBulkPayoutColumns}
              data={tempData}
              onChange={(value) => handleTableChange(value)}
              rowClassName={{ warning: 'warning-class-name', error: 'error-class-name' }}
            />
          </Tabs.TabPane>
        </Tabs>
      </div >
    </>
  );
};

PreviewPayoutTemp.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default PreviewPayoutTemp;
