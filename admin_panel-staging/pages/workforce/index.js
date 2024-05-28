import { Button, Flex, Input, Modal, Progress, Select, Space } from "antd";
import DynamicTable from "../../components/Tables/DynamicTable";
import {
  SettingOutlined,
  MessageOutlined,
  UsergroupAddOutlined,
  PlusOutlined,
  DollarCircleOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

import Layout from "../../components/Layouts/DashboardLayout/Layout";
import AssignToProjectModal from "../../components/Modals/AssignToProjectModal";
import SendMessageModal from "../../components/Modals/SendMessageModal";
import WorkforceFilters from "../../components/Filters/WorkforceFilters";
import {
  getWorkforceList,
  getWorkforceAggregates,
} from "../../redux/actions/workforce.actions";
import objectToQuery from "../../components/Filters/helpers";
import Stats, { StyledStatsContainer } from "../../components/Stats/Stats";
import { ExportFile } from "../../components";
import { getPhoneNumbers } from "../../helpers/workforce";
import { toMoney } from "../../helpers/excelRegister";
import { capitalizeAll } from "../../helpers/capitalize";
import AssignModal from "../../components/Modals/workforce/AssignModal";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import { WorkforceEmptyOnboarding } from "@/components/Sections/WorkforceEmptyOnboarding";
import RenderLoader from "@/components/Loaders/renderLoader";
import {
  accessRouteRetrieval,
  accessSubEntityRetrieval,
  accessSubpageEntityRetrieval,
} from "@/utils/accessLevels";
import { WorforceColumns } from "@/components/Columns/WorkforceColumns";
import { usePusher } from "@/context/PusherContext";
import { replaceSpacesWithUnderscores } from "@/utils/regexes";
import { Icon } from "@iconify/react";
import { SearchField } from "@/components/Search/SearchField";

const { Search } = Input;
const { Option } = Select;

const AddWorkerModal = ({ open, close, addWorker, bulkWorkers }) => {
  return (
    <Modal
      title={false}
      open={open}
      centered={true}
      onCancel={close}
      footer={false}
      closeIcon={false}
      styles={{
        body: { height: 250 },
      }}
    >
      <div className="flex flex-col items-center justify-center gap-2 h-full">
        <h1 className="text-black font-inter text-2xl md:text-3xl font-medium leading-normal">
          Add Worker
        </h1>
        <div className="flex flex-col gap-2">
          <Button
            type="primary"
            className="addWorkerModalBtn"
            onClick={addWorker}
          >
            Add a single worker
          </Button>
          <Button
            type="primary"
            className="addWorkerModalBtn"
            onClick={bulkWorkers}
          >
            Bulk Import
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default function Workforce() {
  const { list, exportList, loading, error, meta, aggregates, aggregatez } =
    useSelector((state) => state.workforce);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [sms_recipients, setSms_recipients] = useState([]);
  const [smsFilters, setSmsFilters] = useState("");
  const router = useRouter();
  const [showModal, setShowModal] = useState(-1);
  const [assignRateData, setAssignRateData] = useState([]);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const { companyStatus, companyStatusLoading, userAccess, userProfile } =
    useUserAccess();
  const [progressVerify, setProgressVerify] = useState(0);
  const [progressSave, setProgressSave] = useState(0);
  const [progressAssign, setProgressAssign] = useState(0);
  const [verifyData, setVerifyData] = useState({});
  const [saveData, setSaveData] = useState({});
  const [assignData, setAssignData] = useState({});
  const [showVerifying, setShowVerifying] = useState(false);
  const [showSaving, setShowSaving] = useState(false);
  const [showAssigning, setShowAssigning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const dispatch = useDispatch();
  const pusher = usePusher();

  const pusher_env = process.env.NEXT_PUBLIC_PUSHER_ENV;
  const { user_access, user_level, id } = userProfile;
  const { company_name } = companyStatus;

  // Call the dispatch once and not on every re-render
  useEffect(() => {
    const fetchData = async () => {
      // await dispatch(getWorkforceAggregates());
      router.replace(router.pathname, undefined, { shallow: true });
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (router.isReady) {
      const storedPage = localStorage.getItem("currentPage");
      const storedLimit = localStorage.getItem("limit");

      if (parseInt(storedLimit) > 10 && router.asPath === "/workforce") {
        setLimit(10);
      }
      if (storedPage) {
        setCurrentPage(parseInt(storedPage));
      }

      const { _start, _limit, _currentpage } = router.query;

      if (_currentpage === undefined || _start === "0") setCurrentPage(1);
      if (_limit === "10") setLimit(parseInt(_limit));
      delete router.query["_currentpage"];

      const filters = objectToQuery(router.query);

      const aggregate_filters = {};
      Object.assign(aggregate_filters, router.query);
      if (Object.hasOwn(aggregate_filters, "search"))
        delete aggregate_filters["search"];

      dispatch(getWorkforceList(filters));
      setSmsFilters(filters);
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (
      progressVerify === 100 &&
      verifyData?.action?.toLowerCase()?.includes("verification")
    ) {
      const filters = objectToQuery(router.query);
      dispatch(getWorkforceList(filters));
      // dispatch(getWorkforceAggregates())
    }
  }, [progressVerify]);

  useEffect(() => {
    if (router.isReady && company_name && pusher_env) {
      const channelVerify = `workforce-verification-status-${pusher_env}-${replaceSpacesWithUnderscores(
        company_name
      )}-${id}`;
      const eventVerify = `workforce-verification-status-${pusher_env}-${replaceSpacesWithUnderscores(
        company_name
      )}-${id}-event`;

      const channelSave = `workforce-saving-status-${pusher_env}-${replaceSpacesWithUnderscores(
        company_name
      )}-${id}`;
      const eventSave = `workforce-saving-status-${pusher_env}-${replaceSpacesWithUnderscores(
        company_name
      )}-${id}-event`;

      const channelAssign = `workforce-assigning-status-${pusher_env}-${replaceSpacesWithUnderscores(
        company_name
      )}-${id}`;
      const eventAssign = `workforce-assigning-status-${pusher_env}-${replaceSpacesWithUnderscores(
        company_name
      )}-${id}-event`;

      let channelVerifySubscribe = pusher.subscribe(channelVerify);
      let channelSaveSubscribe = pusher.subscribe(channelSave);
      let channelAssignSubscribe = pusher.subscribe(channelAssign);

      channelVerifySubscribe.bind(eventVerify, function (data) {
        if (data.status) {
          setShowVerifying(true);
          setProgressVerify(parseInt(data.status));
          setVerifyData(data);
          if (data.status === "100") {
            setShowVerifying(false);
          }
        }
      });

      channelSaveSubscribe.bind(eventSave, function (data) {
        if (data.status) {
          setShowSaving(true);
          setProgressSave(parseInt(data.status));
          setSaveData(data);
          if (data.status === "100") {
            setShowSaving(false);
          }
        }
      });

      channelAssignSubscribe.bind(eventAssign, function (data) {
        if (data.status) {
          setShowAssigning(true);
          setProgressAssign(parseInt(data.status));
          setAssignData(data);
          if (data.status === "100") {
            setShowAssigning(false);
          }
        }
      });

      return () => {
        pusher.unsubscribe();
      };
    }
  }, [router.isReady, company_name, pusher_env]);

  const onSearch = (value) => {
    const query = {};
    Object.assign(query, router.query);
    if (value) {
      query["search"] = value;
    } else {
      if (Object.hasOwn(query, "search")) {
        delete query["search"];
      }
    }

    // query["current_page"] = 1;
    query["_start"] = 0;
    // query["_limit"] = 10;

    router.replace({
      pathname: "/workforce",
      query,
    });
    setSearchValue(value);
  };

  // Updated text for "Unselect All Rows" option
  const onSelectChange = async (newSelectedRowKeys, tableData) => {
    // console.log("selectedRowKeys changed: ", newSelectedRowKeys, tableData);
    setSelectedRowKeys(newSelectedRowKeys);
    setAssignRateData(tableData); //saving the selection

    const phones = await getPhoneNumbers(list, newSelectedRowKeys);

    setSms_recipients(phones);
  };

  const clearSelection = () => {
    setSelectedRowKeys([]); // clear selected row keys after the action is completed
    setAssignRateData([]);
  };

  const transformRateData = (data) => {
    const mappedData = data.map((item) => {
      return {
        assigned_worker_id: item.assigned_worker_id,
        service_id: item.trade_id,
      };
    });
    return mappedData;
  };

  const rowSelection = {
    selectedRowKeys, // fixed: true,
    columnWidth: 60,
    onChange: (selectedRowKeys, selectedRows) => {
      const mappedData = transformRateData(selectedRows);
      onSelectChange(selectedRowKeys, mappedData);
    },
    selections: [
      {
        key: "all",
        text: "Select all", // Updated text for "Select All Rows" option
        onSelect: () => {
          const allRowKeys = list.map((item) => item.id);

          const mappedData = transformRateData(list);
          onSelectChange(allRowKeys, mappedData);
        },
      },
      {
        key: "unselectAll",
        text: "Unselect all",
        onSelect: () => {
          onSelectChange([], []);
        },
      },
    ],
    preserveSelectedRowKeys: true,
  };

  // Modal functions
  const addWorker = () => {
    router.push({
      pathname: "/workforce/worker-registration",
      query: { type: "single" },
    });
  };

  const bulkWorkers = () => {
    router.push({
      pathname: "/workforce/worker-registration",
      query: { type: "bulk" },
    });
  };

  const openWorkerModal = () => {
    setWorkerModalOpen(true);
  };

  const closeWorkerModal = () => {
    setWorkerModalOpen(false);
  };

  const BulkAction = () => {
    return (
      <Select
        placeholder={
          <Space>
            <SettingOutlined />
            Bulk Action
          </Space>
        }
        style={{ width: "200px" }}
        allowClear
        onSelect={(value) => setShowModal(value)}
      >
        {userProfile &&
          accessSubpageEntityRetrieval(
            userProfile?.user_access,
            "workforce",
            "workers",
            "send message"
          ) && (
            <Option value="0">
              <Space>
                <MessageOutlined />
                Send message
              </Space>
            </Option>
          )}
        <Option value="1">
          <Space>
            <UsergroupAddOutlined />
            Assign to project
          </Space>
        </Option>
        <Option value="2">
          <Space>
            <DollarCircleOutlined />
            Assign Rate Type
          </Space>
        </Option>
      </Select>
    );
  };

  const handleTableChange = (pagination) => {
    setLimit(pagination.pageSize);
    setCurrentPage(pagination.current);
    localStorage.setItem("limit", pagination.pageSize);
    localStorage.setItem("currentPage", pagination.current);
    if (pagination.current === 1) {
      const offset =
        pagination.current * pagination.pageSize - pagination.pageSize;
      router.replace({
        pathname: "/workforce",
        query: {
          ...router.query,
          _start: offset,
          _limit: pagination.pageSize,
          _currentpage: currentPage,
        },
      });
    } else {
      const pageStrt = pagination.pageSize * (pagination.current - 1);
      router.replace({
        pathname: "/workforce",
        query: {
          ...router.query,
          _start: pageStrt,
          _limit: pagination.pageSize,
          _currentpage: currentPage,
        },
      });
    }
  };

  const Modals = [
    <SendMessageModal
      key={0}
      isVisible={showModal}
      hideModal={() => setShowModal(-1)}
      selected_workers={selectedRowKeys}
      allWorkForce={sms_recipients}
      workers={list}
      filters={smsFilters}
      clearSelection={clearSelection}
    />,
    <AssignToProjectModal
      key={1}
      isVisible={showModal}
      hideModal={() => setShowModal(-1)}
      selected_workers={selectedRowKeys}
      clearSelection={clearSelection}
    />,
    <AssignModal
      key={2}
      title={"Assign Rate Type to selected workers"}
      isVisible={showModal}
      hideModal={() => setShowModal(-1)}
      selected_workers={assignRateData}
      clearSelection={clearSelection}
    />,
  ];

  if (companyStatus?.company_name === "" || user_access?.length === 0) {
    return <RenderLoader />;
  } else if (!accessRouteRetrieval(user_access, "workforce")) {
    return <ErrorComponent status={403} backHome={true} />;
  }
  return (
    <>
      {/* {console.log("companyStatus", companyStatus && companyStatus.is_workforce_added)} */}
      {!companyStatus.is_workforce_added ? (
        <WorkforceEmptyOnboarding
          addWorkers={openWorkerModal}
          title={"Workforce"}
        />
      ) : (
        <>
          {Modals[showModal]}
          <WorkforceFilters
            isExpandable
            showAdvancedFilters
            hasPagination
            filter_fields={[
              "date_onboarded",
              "project_id",
              "district",
              "trade_id",
              "attendance",
              "is_assessed",
            ]}
          />
          <StyledStatsContainer>
            {/* <Stats
                            title="Total workers"
                            value={toMoney(aggregates.data?.total_workers)}
                            loading={aggregates.loading}
                        /> */}
            <Stats
              title="Total workers"
              value={toMoney(aggregatez?.total_worker)}
              loading={loading}
            />
            <Stats
              title="New workers"
              value={toMoney(aggregatez?.total_new_worker)}
              // sub_title="last month"
              loading={loading}
            />
            <Stats
              title="Active workers"
              value={toMoney(aggregatez?.total_active)}
              // sub_title="last month"
              loading={loading}
            />
            <Stats
              title="Assessements"
              value1={toMoney(aggregatez?.total_assessed)}
              value2={toMoney(
                parseInt(aggregatez?.total_worker) -
                  parseInt(aggregatez?.total_assessed)
              )}
              sub_title="Assessed / Not Assessed"
              loading={loading}
              isAssessment={true}
            />
          </StyledStatsContainer>
          <div className="flex flex-col gap-12 mt-20">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex w-full justify-end gap-4">
                {showSaving && (
                  <div className="flex justify-end">
                    <Flex
                      gap="small"
                      className="flex items-center border border-primary rounded-lg p-4 w-fit h-[40px] cursor-pointer"
                    >
                      <Progress
                        percent={progressSave}
                        type="circle"
                        status="active"
                        strokeColor={"#08AD36"}
                        strokeWidth={14}
                        size={20}
                      />
                      <span className="capitalize">{saveData?.action}: </span>
                      <span className="text-primary text-xl">
                        {saveData.current} / {saveData.total}
                      </span>
                    </Flex>
                  </div>
                )}
                {showVerifying && (
                  <div className="flex justify-end">
                    <Flex
                      gap="small"
                      className="flex items-center border border-primary rounded-lg p-4 w-fit h-[40px] cursor-pointer"
                    >
                      <Progress
                        percent={progressVerify}
                        type="circle"
                        status="active"
                        strokeColor={"#08AD36"}
                        strokeWidth={14}
                        size={20}
                      />
                      <span className="capitalize">{verifyData?.action}: </span>
                      <span className="text-primary text-xl">
                        {verifyData.current} / {verifyData.total}
                      </span>
                    </Flex>
                  </div>
                )}
                {showAssigning && (
                  <div className="flex justify-end">
                    <Flex
                      gap="small"
                      className="flex items-center border border-primary rounded-lg p-4 w-fit h-[40px] cursor-pointer"
                    >
                      <Progress
                        percent={progressAssign}
                        type="circle"
                        status="active"
                        strokeColor={"#08AD36"}
                        strokeWidth={14}
                        size={20}
                      />
                      <span className="capitalize">{assignData?.action}: </span>
                      <span className="text-primary text-xl">
                        {assignData.current} / {assignData.total}
                      </span>
                    </Flex>
                  </div>
                )}
              </div>
              <DynamicTable
                rowKey="worker_id"
                data={list}
                columns={WorforceColumns}
                loading={loading}
                error={error}
                workerClicked={true}
                rowSelection={rowSelection}
                extra_left={
                  userProfile &&
                  accessSubpageEntityRetrieval(
                    userProfile?.user_access,
                    "workforce",
                    "workers",
                    "bulk_actions"
                  )
                    ? [<BulkAction key={0} />]
                    : null
                }
                extra_middle={[
                  <SearchField
                    key={0}
                    defaultValue={router.query?.search}
                    handleSearch={onSearch}
                  />,
                ]}
                extra_right={
                  userProfile &&
                  accessSubpageEntityRetrieval(
                    userProfile?.user_access,
                    "workforce",
                    "workers",
                    "register workers"
                  ) && [
                    <Button
                      key={0}
                      onClick={openWorkerModal}
                      type="primary"
                      icon={<PlusOutlined color="var(--button-color)" />}
                      className="primaryBtn"
                    >
                      Register workers
                    </Button>,
                    <ExportFile key={0} data={exportList} loading={false} />,
                  ]
                }
                onChange={(value) => handleTableChange(value)}
                pagination={{
                  total: meta?.pagination?.total,
                  current: currentPage,
                  defaultCurrent: currentPage,
                  pageSize: limit,
                  defaultPageSize: limit,
                }}
              />
            </div>
          </div>
        </>
      )}
      <AddWorkerModal
        open={workerModalOpen}
        close={closeWorkerModal}
        addWorker={addWorker}
        bulkWorkers={bulkWorkers}
      />
    </>
  );
}

Workforce.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
