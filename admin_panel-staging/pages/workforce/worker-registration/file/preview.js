import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Button, Input, Tooltip, Dropdown, Tabs, Modal, Form, Popconfirm, Select, notification, InputNumber, Tag } from "antd";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { Icon } from '@iconify/react';
import { del, get } from "idb-keyval";
import dayjs from "dayjs";

import Layout from "../../../../components/Layouts/DashboardLayout/Layout";
import DynamicTable from "../../../../components/Tables/DynamicTable";
import ExcelErrors from "../../../../components/Error/ExcelErrors";
import { getAllServices } from "../../../../redux/actions/services.actions";

import {
  getTemporaryTable, saveTempTable, deleteTempTable, searchTempTable, saveTempWorker, deleteTempWorker, deleteRecentFile, getRecentFile, capitalize, toMoney
} from "../../../../helpers/excelRegister";
import { capitalizeAll } from "@/utils/capitalizeAll";
import { ConfirmationModal } from "@/components/Modals/AddStaffModel";
import { createNewService } from "@/helpers/workforce/workforce";
import ErrorComponent from "@/components/Error/Error";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import RenderLoader from "@/components/Loaders/renderLoader";
import { accessEntityRetrieval, checkAccessToPage } from "@/utils/accessLevels";
import { validateDailyEarnings, validateName, validateNidNumber, validatePhoneNumber } from "@/utils/regexes";

//Search component
const SearchField = ({ query, handleSearch }) => {
  return (
    <div className="flex gap-1">

      <Input size="middle"
        style={{ width: "350px" }}
        placeholder="Search Users by Name or Phone"
        prefix={< SearchOutlined style={{ color: '#A8BEC5' }} />}
        onChange={(e) => handleSearch(e.target.value)}
        value={query}
        name='search'
        allowClear

      />
      {/* {isSearching && (
        <Tooltip title='Clear search'>
          <Button
            shape="circle"
            icon={<ClearOutlined />}
            onClick={() => { setIsSearching(false) }}
          />

        </Tooltip>
      )} */}
    </div>
  )
};

const PreviewExcel = () => {
  const [tempData, setTempData] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [tempCountStart, setTempCountStart] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingWorker, setEditingWorker] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    nid_number: '',
    service: '',
    service_id: '',
    daily_earnings: ''
  });
  const [tableActions, setTableActions] = useState(false);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [recentFile, setRecentFile] = useState({});
  const [service, setServices] = useState([]);
  const [table, setTable] = useState('all');
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [disableRecent, setDisableRecent] = useState(false);
  const [saveBtnLoading, setSaveBtnLoading] = useState(false);
  const [modalSaveBtnLoading, setModalSaveBtnLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [newService, setNewService] = useState("");
  const [newServiceSearch, setNewServiceSearh] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { userProfile, setCompanyStatusLoading } = useUserAccess();
  const { user_access } = userProfile;

  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch()
  const date = new Date(),
    dateString = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const fetch_temp_Data = (page, pageSize = limit) => {
    setTableLoading(true);
    getTemporaryTable(page, pageSize, table).then((res) => {
      setTempData(res.data);
      setTotalWorkers(res.count);
    }).catch((err) => {
      //setDisabled(true)
      setTempData([]);
      setTotalWorkers(0);

    })
    setTableLoading(false);
  }

  // Deleting recent file
  const cancelRegistration = () => {
    if (recentFile.file_id && recentFile.file_name) {
      deleteRecentFile(recentFile.file_id, recentFile.file_name).then(() => {
        del('recent_file')
        router.push('/workforce');
      }).catch((err) => {
        notification.error({
          description: `Could not delete file:${recentFile.name}`,
          message: 'File Deletion Error'
        });
      });
    }
    else {
      notification.error({
        description: `Could not delete file:${recentFile.name}`,
        message: 'File Deletion Error'
      });
    }
  }

  useEffect(() => {
    if (router.isReady) {
      fetch_temp_Data(0, limit, table);
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

  // useEffect(() => {
  //   if (!isSearching) {
  //     setCurrentPage(1)
  //     setTempCountStart(0);
  //     setCurrentPage(1);
  //     fetch_temp_Data(0, limit, table);
  //   }
  // }, [isSearching]);

  useEffect(() => {
    if (table === 'valid' || table === 'invalid' || 'all') {
      setTempCountStart(0);
      setCurrentPage(1);
      fetch_temp_Data(0, limit, table);
    }
  }, [table])

  /* FEtch after saving */

  useEffect(() => {
    if (tableActions) {
      fetch_temp_Data(tempCountStart);
      setTableActions(false);
    }
    setTableActions(false);
  }, [tableActions])

  const handleSearch = (value) => {
    if (value.length >= 1) {
      setCurrentPage(1);
      setQuery(value);
      setTableLoading(true);
      searchTempTable(value, table, limit).then((res) => {
        setTempData(res.data);
        setTotalWorkers(res.count);
        setTableLoading(false);
        setIsSearching(true);
      });
    } else {
      setQuery(value);
      setIsSearching(false);
      setCurrentPage(1);

      fetch_temp_Data(0, table, limit);
    }
  };

  const discardTable = () => {
    deleteTempTable().then((res) => {
      notification.success({
        description: `${res?.message}`,
        message: 'Success'
      });
      //deleteAPITable(file_id)
    }).catch((err) => {
      notification.error({
        description: `${res?.message}`,
        message: 'Error'
      });

    });
    router.push('/workforce');
  }

  /* deleting the file at apispreadsheet */
  const saveRecentFile = () => {
    setSaveBtnLoading(true);
    saveTempTable().then((res) => {
      setSaveBtnLoading(false);
      if (res?.statusCode === 200 && !res?.error) {
        notification.success({
          message: 'Success',
          description: `${res?.message}.`,
        })
        router.push('/workforce');
      } else {
        notification.error({
          message: 'Failed',
          description: `${res?.message}.`,
        });
      }
    })
  }

  const handleTableChange = (pagination) => {
    const startPage = tempCountStart + pagination.pageSize;
    setTempCountStart(startPage);
    setCurrentPage(pagination.current);
    setLimit(pagination.pageSize);
    if (pagination.current === 1) {
      //fetch table
      fetch_temp_Data(0, pagination.pageSize, table);
    } else {
      const pageStrt = pagination.pageSize * (pagination.current - 1);
      /* setpage here */
      setTempCountStart(pageStrt);
      //fetch data
      fetch_temp_Data(pageStrt, pagination.pageSize, table);
    }

  };

  const onChangePage = (page) => {
    setCurrentPage(page);
  }

  const onSearch = (e) => {
    setNewServiceSearh(e);
  };

  // creating new service
  const showPopconfirm = (value) => {
    setOpenConfirm(true);
    setNewService(value);
  };

  const cancelCreateService = (e) => {
    setOpenConfirm(false);
    setNewService('');
  };

  // Create a position
  const confirmCreateService = async () => {
    const payload = {
      "name": newService,
      "icon_class": null,
      "service_status": "on",
      "locale": "en",
      "published_at": dayjs(),
      "created_at": dayjs(),
      "updated_at": dayjs(),
      "localizations": []
    }
    setConfirmLoading(true);
    createNewService(payload).then((res) => {
      dispatch(getAllServices()).then((data) => setServices(data))
      // add results in editing worker
      if (res?.id) {
        setEditingWorker((pre) => {
          return { ...pre, service: res?.name };
        });
        setEditingWorker((pre) => {
          return { ...pre, service_id: res?.id };
        });
        form.setFieldsValue({ service: capitalizeAll(res?.name), service_id: res?.id })
      }
    }).catch((err) => {
      // console.log(err);
    }).finally(() => {
      setOpenConfirm(false);
      setNewService('');
      setConfirmLoading(false);
    });

  };

  // table columns
  const workers_columns = [
    {
      title: "FIRSTNAME",
      dataIndex: "first_name",
      render: (value, record) => {
        return (
          <Tooltip
            title={value === "" ? "Name not found" : record?.first_name_error ? "This name is not valid." : ""}
            style={{ textTransform: "capitalize" }}
          >
            {value ? capitalize(value) : "-"}{" "}
            {(record?.first_name_error || value === "") && (<ExclamationCircleOutlined twoToneColor="#000000" />)}
          </Tooltip>
        )
      },
      key: "first_name",
    },

    {
      title: "LASTNAME",
      dataIndex: "last_name",
      render: (value, record) => {
        return (
          <Tooltip
            title={value === "" ? "Name not found" : record?.last_name_error ? "This name is not valid." : ""}
            style={{ textTransform: "capitalize" }}
          >
            {value ? capitalize(value) : "-"}{" "}
            {(record?.last_name_error || value === "") && (<ExclamationCircleOutlined twoToneColor="#000000" />)}
          </Tooltip>
        )
      },
      key: "last_name",
    },

    {
      title: "PHONE NUMBER",
      dataIndex: "phone_number",
      key: "phone_number",
      render: (value, record) => {
        return (
          <Tooltip className="flex gap-1 items-center"
            title={value === "" ? "Phone number not found" : record.phone_number_exist ? "This phone number exists" : !record?.phone_number_verified ? "This phone number is not Valid" : ""}
          >
            {value ? value : "-"}{" "}
            {(record.phone_number_exist || !record?.phone_number_verified || value === "") && <ExclamationCircleOutlined twoToneColor="#000000" />}
          </Tooltip>
        )
      }
    },
    {
      title: "NID NUMBER",
      dataIndex: "nid_number",
      key: "nid_number",
      render: (value, record) => {
        return (
          <Tooltip className="flex gap-1 items-center"
            title={value === "" ? "NID number not found" : record.nid_exist ? "This NID number exists" : !record?.valid_nid ? "This NID number is not valid" : ""}>
            {value ? value : "-"}{" "}
            {(record.nid_exist || !record?.valid_nid || value === "") && (<ExclamationCircleOutlined twoToneColor="#000000" />)}
          </Tooltip>
        )
      }
    },
    {
      title: "SERVICE",
      dataIndex: "service",
      key: "service",
      render: (value, record) => {
        return (
          <Tooltip title={value === "" ? "Service not found" : !record?.service_available ? "The Service does not exist" : ""}>
            {value ? capitalize(value) : "-"}{" "}
            {(value === "" || !record?.service_available) && <ExclamationCircleOutlined twoToneColor="#000000" />}
          </Tooltip>
        )
      }
    },
    {
      title: "DAILY EARNINGS",
      dataIndex: "daily_earnings",
      key: "daily_earnings",
      // render: (text) => String('RWF ' + toMoney(text)),
      render: (value, record) => {
        return (
          <Tooltip title={value === "" ? "Name not found" : !record?.valid_daily_earnings ? 'This rate is not valid.' : ""}>
            {value ? String('RWF ' + toMoney(value)) : "-"}{" "}
            {value === "" || !record?.valid_daily_earnings && <ExclamationCircleOutlined twoToneColor="#000000" />}
          </Tooltip>
        )
      }
    },
    {
      key: "action",
      width: '5%',
      render: (record) => (
        <Dropdown
          menu={{

            items: [
              {
                key: "0",
                label: (
                  <Button
                    type="link"
                    icon={<EditOutlined style={{ color: "#fb923c" }} />}
                    onClick={() => {
                      onEditWorker(record);
                    }}
                  >
                    Edit
                  </Button>
                )
              },
              {
                type: 'divider',
              },
              {
                key: "1",
                label: (
                  <Button type="link" onClick={() => {
                    onDeleteWorker(record)
                  }}
                    icon={<DeleteOutlined />}
                    danger>
                    Remove
                  </Button>
                )
              },
            ]
          }}

          trigger={["click"]}>
          <a onClick={(e) => e.preventDefault()}>

            <MoreOutlined style={{ fontSize: "20px" }} />
          </a>
        </Dropdown>
      )
    },
  ];

  const onTabChange = (value) => {
    switch (value) {
      case 'valid_workers':
        setCurrentPage(1);
        router.replace({
          query: {
            ...router.query,
            table: 'valid'
          },
        });
        setTable('valid');
        break;
      case 'invalid_workers':
        setCurrentPage(1);
        router.replace({
          query: {
            ...router.query,
            table: 'invalid'
          },
        });
        setTable('invalid');
        break;
      default:
        setCurrentPage(1);
        setTable('all');
        router.replace({
          query: {
            ...router.query,
            table: 'all'
          },
        });
        break;
    }
  };

  const onEditWorker = (record) => {
    form.setFieldsValue({
      first_name: record?.first_name,
      last_name: record?.last_name,
      phone_number: record?.phone_number,
      nid_number: record?.nid_number,
      service: capitalizeAll(record?.service),
      daily_earnings: record?.daily_earnings,
    })
    setEditingWorker({ ...record });
    setIsEditing(true);
  }

  const onDeleteWorker = async (record) => {
    if (record) {
      await deleteTempWorker(record).then((res) => {
        setTableActions(true);
      }).catch((err) => {
        console.log(err)
      })
    }
  }

  // console.log("editing worker", editingWorker)

  const resetEditing = () => {
    form.resetFields();
    setEditingWorker({
      first_name: '',
      last_name: '',
      phone_number: '',
      nid_number: '',
      service: '',
      daily_earnings: '',
      service_id: '',
    });
    setIsEditing(false);
  };

  const handleSaveBtn = async () => {
    setModalSaveBtnLoading(true);
    await saveTempWorker(editingWorker)
      .then(() => {
        setTableActions(true);
      })
    resetEditing();
    // setCompanyStatusLoading(true);
    setModalSaveBtnLoading(false);
  }

  const total = <div><h3 className="text-xl">Total workers:{" "}<span className="font-medium text-primary">{totalWorkers}</span></h3></div>

  const TempButtons = <div className="flex justify-end mb-4">
    <div className="flex gap-4">
      <Popconfirm
        placement="top"
        title='This action will delete all your unregistered workers, Are you sure?'
        onConfirm={discardTable}
        okText='Yes'
        cancelText='No'
        okButtonProps={{
          className: "bg-primary"
        }}

      >
        <Button size={"large"} style={{ border: "1px solid red", color: "white", borderRadius: "5px", backgroundColor: 'red' }}
        >
          Delete All
        </Button>
      </Popconfirm>
      <Popconfirm
        placement="top"
        title='This action will clean the current upload, Are you sure?'
        onConfirm={cancelRegistration}
        okText='Yes'
        cancelText='No'
        disabled={disableRecent}
        okButtonProps={{
          className: "bg-primary"
        }}
      >
        <Button size={"large"} style={{ border: "1px solid red", color: "red", borderRadius: "5px" }} disabled={disableRecent}
        >
          Cancel and re-upload
        </Button>
      </Popconfirm>
      {table === 'invalid' ? '' : (
        <Popconfirm
          placement="top"
          title='This action will save only the Valid workers, Are you sure?'
          onConfirm={saveRecentFile}
          okText='Yes'
          cancelText='No'
          okButtonProps={{
            className: "bg-primary",
            loading: saveBtnLoading
          }}
        >
          <Button
            type="primary"
            size="large"
            className="primaryBtn w-36"
            loading={saveBtnLoading}
          >
            Save
          </Button>
        </Popconfirm>
      )}
    </div>
  </div>;


  if (user_access?.length === 0) {
    return <RenderLoader />
  } else if (!checkAccessToPage("workforce", user_access)) {
    return <ErrorComponent status={403} backHome={true} />
  }
  return (
    <>
      <div className="flex flex-col box-border gap-2 w-full" >
        {/* <h2>Preview and validating</h2> */}
        <div
          style={{ maxWidth: "100%" }}>
          <ExcelErrors tableActions={tableActions} />
        </div>
        <Tabs defaultActiveKey="all_workers" onChange={(e) => onTabChange(e)} tabBarExtraContent={total} destroyInactiveTabPane={true}
          style={{ maxWidth: "100%" }}>
          <Tabs.TabPane tab="All Workers" key="all_workers">
            {/* Buttons */}
            {TempButtons}

            {/* ALL WORKERS TABLES */}
            <DynamicTable
              rowKey="id"
              loading={tableLoading}
              extra_left={[`Date: ${dateString}`]}
              extra_middle={[<SearchField key={0} query={query} handleSearch={handleSearch} />]}
              columns={workers_columns}
              //rowSelection={{ ...rowSelection }}
              data={tempData}
              pagination={{
                current: currentPage,
                defaultCurrent: currentPage,
                defaultPageSize: limit,
                total: totalWorkers,
                onChange: onChangePage,
                showSizeChanger: true
              }}
              onChange={(value) => handleTableChange(value)}
              rowClassName={{ error: 'error-class-name' }}
            />
          </Tabs.TabPane>
          {/* VALID WORKERS TABLE */}
          <Tabs.TabPane tab="Valid Workers" key="valid_workers">
            {TempButtons}
            <DynamicTable
              rowKey="id"
              loading={tableLoading}
              extra_left={[`Date: ${dateString}`]}
              extra_middle={[<SearchField key={0} query={query} handleSearch={handleSearch} />]}
              columns={workers_columns}
              //rowSelection={{ ...rowSelection }}
              data={tempData}
              pagination={{
                current: currentPage,
                defaultCurrent: currentPage,
                defaultPageSize: limit,
                total: totalWorkers,
                onChange: onChangePage,
                showSizeChanger: true
              }}
              onChange={(value) => handleTableChange(value)}
              rowClassName={{ warning: 'warning-class-name', error: 'error-class-name' }}
            />
          </Tabs.TabPane>
          {/* INVALID WORKERS TABLE */}
          <Tabs.TabPane tab="Invalid Workers" key="invalid_workers">
            {TempButtons}
            <DynamicTable
              rowKey="id"
              loading={tableLoading}
              extra_left={[`Date: ${dateString}`]}
              extra_middle={[<SearchField key={0} query={query} handleSearch={handleSearch} />]}
              columns={workers_columns}
              //rowSelection={{ ...rowSelection }}
              data={tempData}
              pagination={{
                current: currentPage,
                defaultCurrent: currentPage,
                defaultPageSize: limit,
                total: totalWorkers,
                onChange: onChangePage,
                showSizeChanger: true
              }}
              onChange={(value) => handleTableChange(value)}
              rowClassName={{ warning: 'warning-class-name', error: 'error-class-name' }}
            />
          </Tabs.TabPane>
        </Tabs>

        {/* Modal for editing */}


      </div >
      <Modal
        title="Edit Worker"
        open={isEditing}
        onCancel={resetEditing}
        footer={false}

      >
        <Form
          labelCol={{
            span: 6,
            offset: 2
          }}
          wrapperCol={{
            span: 15,
            offset: 0
          }}
          layout="horizontal"
          size={'middle'}
          form={form}
          onFinish={handleSaveBtn}
          autoComplete="off"
        >
          <Form.Item name="first_name" label="First Name" initialValue={editingWorker?.first_name}>
            <Input
              defaultValue={editingWorker?.first_name}
              value={editingWorker?.first_name}
              onChange={(e) => {
                setEditingWorker((pre) => {
                  return { ...pre, first_name: e.target.value };
                });
              }}
              disabled={editingWorker?.is_rssb_verified === 'green' ? true : false}
            />
          </Form.Item>

          <Form.Item name="last_name" label="Last Name" initialValue={editingWorker?.last_name}>
            <Input
              value={editingWorker?.last_name}
              onChange={(e) => {
                setEditingWorker((pre) => {
                  return { ...pre, last_name: e.target.value };
                });
              }}
              disabled={editingWorker?.is_rssb_verified === 'green' ? true : false}
            />
          </Form.Item>

          <Form.Item name="phone_number" label="Phone Number" initialValue={editingWorker?.phone_number}
            rules={[
              {
                required: true,
                message: 'Please input the phone number!',
              },
              {
                pattern: /^07\d{8}$/,
                message: 'Please input a valid 10-digit phone number.',
              },
            ]}
          >
            <Input
              defaultValue={editingWorker?.phone_number}
              value={editingWorker?.phone_number}
              onChange={(e) => {
                setEditingWorker((pre) => {
                  return { ...pre, phone_number: e.target.value };
                });
              }}
              maxLength={10}
              disabled={editingWorker?.is_momo_verified_and_rssb === 'green' ? true : false}
            />
          </Form.Item>

          <Form.Item name="nid_number" label="NID Number" initialValue={editingWorker?.nid_number}
            rules={[
              {
                required: true,
                message: 'Please input the NID number!',
              },
              {
                pattern: /^\d{16}$/,
                message: 'Please input a valid 16-digit NID number.',
              },
            ]}>
            <Input
              value={editingWorker?.nid_number}
              onChange={(e) => {
                setEditingWorker((pre) => {
                  return { ...pre, nid_number: e.target.value };
                });
              }}
              showCount maxLength={16}
              disabled={editingWorker?.is_rssb_verified === 'green' ? true : false}
            />
          </Form.Item>

          <Form.Item label="Service" name="service" initialValue={capitalizeAll(editingWorker?.service)}>

            <Select
              value={capitalizeAll(editingWorker?.service)}
              showSearch
              onSearch={onSearch}
              optionFilterProp="children"
              filterOption={(input, option) => option.label.includes(input.charAt(0).toUpperCase() + input.slice(1).toLowerCase())}
              filterSort={(optionA, optionB) =>
                optionA.label.toLowerCase().localeCompare(optionB.label.toLowerCase())}
              onChange={(e) => {
                setEditingWorker((pre) => {
                  return { ...pre, service: e.split(",")[0].toLowerCase() };
                });
                setEditingWorker((pre) => {
                  return { ...pre, service_id: e.split(",")[1] };
                });
              }}
              options={(service || []).map((d) => ({
                value: `${d.name}, ${d.id}`,
                label: capitalizeAll(d?.name),
              }))}
              notFoundContent={
                <Button
                  className='text-primary flex flex-row items-center justify-center gap-2'
                  onClick={() => { showPopconfirm(newServiceSearch) }} >
                  <Icon icon="fe:plus" width={15} height={15} />
                  Create Service : {capitalizeAll(newServiceSearch)}
                </Button>
              }
            />
          </Form.Item>

          <ConfirmationModal
            handleCancel={cancelCreateService}
            handleOk={confirmCreateService}
            openConfirm={openConfirm}
            confirmLoading={confirmLoading}
            title={'Confirm creating new service'}
            content={'Are you sure you want to create this service?'}
          />

          <Form.Item label="Daily Earnings" name="daily_earnings" initialValue={editingWorker?.daily_earnings}
            rules={[
              {
                required: true,
                message: 'Please input the daily earnings!',
              },
              {
                pattern: /^\d+$/,
                message: 'Daily Earnings must be numbers',
              },
            ]}
          >
            <InputNumber
              disabled={false}
              keyboard={false}
              controls={false}
              defaultValue={editingWorker?.daily_earnings}
              value={editingWorker?.daily_earnings}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              className="flex flex-col justify-center w-full"
              onChange={(e) => {
                setEditingWorker((pre) => {
                  return { ...pre, daily_earnings: e ? e?.toString() : "" };
                });
              }}
            />
          </Form.Item>

          <div className="flex flex-row items-center justify-center w-full gap-2 py-3 pb-2">
            <Form.Item>
              <Button key="cancel"
                type="default"
                className="secondaryBtn w-32"
                onClick={resetEditing}
              >
                Cancel
              </Button>
            </Form.Item>
            <Form.Item>
              <Button key="submit" className="primaryBtnCustom w-32" type="primary"
                loading={modalSaveBtnLoading}
                htmlType="submit"
              // onClick={handleSaveBtn}
              >
                Save
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
};

PreviewExcel.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default PreviewExcel;
