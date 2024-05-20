import React, { useEffect, useState } from 'react';
import { Tabs, Checkbox, Form, Radio, Space, Switch, Table, Button } from 'antd';
import DynamicTable from '../Tables/DynamicTable';
import { accessRouteRetrieval, actionAccessUITransformer, actionsAccessApiTransformer, generateGenericPageActionsAccess, generateGenericSubPageActionsAccess, generateGenericSubPageDefaultAccess, generateGenericSubPageRadioChecks, pageAccessUITransformer } from '@/utils/accessLevels';
import { updateUserAccess } from '@/helpers/settings/settings';
import { useRouter } from 'next/router';

// page labels
const projectPageChecks = [
  {
    label: 'Full Access',
    value: 'project-Full Access',
  },
  {
    label: 'View Only',
    value: 'project-View Only',
  },
  {
    label: 'No Access',
    value: 'project-No Access',
  }
]
const workforcePageChecks = [
  {
    label: 'Full Access',
    value: 'workforce-Full Access',
  },
  {
    label: 'View Only',
    value: 'workforce-View Only',
  },
  {
    label: 'No Access',
    value: 'workforce-No Access',
  }
]

const financePageChecks = [
  {
    label: 'Full Access',
    value: 'finance-Full Access',
  },
  {
    label: 'View Only',
    value: 'finance-View Only',
  },
  {
    label: 'No Access',
    value: 'finance-No Access',
  }
]

const settingsPageChecks = [
  {
    label: 'Full Access',
    value: 'settings-Full Access',
  },
  {
    label: 'View Only',
    value: 'settings-View Only',
  },
  {
    label: 'No Access',
    value: 'settings-No Access',
  }
]

const SettingsAccess = ({ userAccess, inviteUser, handleAccess }) => {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [accessPayload, setAccessPayload] = useState([]);
  const [showSaveBtn, setShowSaveBtn] = useState(false);
  const [activeTabs, setActiveTabs] = useState({
    pageActiveTabs: "1",
    subPageTabs: {
      workforceActiveTabs: "1",
      financeActiveTabs: "1"
    }
  });

  const router = useRouter();

  const { user_id } = router.query;

  // console.log("userAccess ====>", userAccess, "accessPayload =====",accessPayload )
  // console.log("accessRouteRetrieval ====>", accessRouteRetrieval(userAccess, 'finance', 'taxes'))

  const [projectAccess, setProjectAccess] = useState({
    pageAccess: projectPageChecks,
    actionsAccess: [],
    pageDefaultAccess: []
  });
  const [financeAccess, setFinanceAccess] = useState({
    pageAccess: financePageChecks,
    actionsAccess: [],
    pageDefaultAccess: [],
    subPageDefaultAccess: {
      paymentDefaultAccess: [],
      taxesDefaultAccess: [],
      walletDefaultAccess: [],
    },
    subPageActionsAccess: {
      paymentActionsAccess: [],
      taxesActionsAccess: [],
      walletActionsAccess: [],
    }
  });
  const [workforceAccess, setWorkforceAccess] = useState({
    pageAccess: workforcePageChecks,
    actionsAccess: [],
    pageDefaultAccess: [],
    subPageDefaultAccess: {
      workersDefaultAccess: [],
      leaderboardDefaultAccess: []
    },
    subPageActionsAccess: {
      workersActionsAccess: [],
      leaderboardActionsAccess: []
    }
  });
  const [settingsAccess, setSettingsAccess] = useState({
    pageAccess: settingsPageChecks,
    actionsAccess: [],
    pageDefaultAccess: []
  });

  /* ===== START sub page UI tab checks ===== */
  const [financeSubPageChecks, setFinanceSubPageChecks] = useState({
    financePaymentSubPageChecks: [
      {
        label: 'Full Access',
        value: 'payment-Full Access',
        disabled: false
      },
      {
        label: 'View Only',
        value: 'payment-View Only',
        disabled: false
      },
      {
        label: 'No Access',
        value: 'payment-No Access',
        disabled: false
      }
    ],
    financeTaxesSubPageChecks: [{
      label: 'Full Access',
      value: 'taxes-Full Access',
      disabled: false
    },
    {
      label: 'View Only',
      value: 'taxes-View Only',
      disabled: false
    },
    {
      label: 'No Access',
      value: 'taxes-No Access',
      disabled: false
    }],
    financeWalletSubPageChecks: [
      {
        label: 'Full Access',
        value: 'wallet-Full Access',
        disabled: false
      },
      {
        label: 'View Only',
        value: 'wallet-View Only',
        disabled: false
      },
      {
        label: 'No Access',
        value: 'wallet-No Access',
        disabled: false
      }
    ],
  })
  const [workforceSubPageChecks, setWorkforceSubPageChecks] = useState({
    workforceWorkersSubPageChecks: [
      {
        label: 'Full Access',
        value: 'workers-Full Access',
        disabled: false
      },
      {
        label: 'View Only',
        value: 'workers-View Only',
        disabled: false
      },
      {
        label: 'No Access',
        value: 'workers-No Access',
        disabled: false
      }
    ],
    workforceLeaderboardSubPageChecks: []
  })

  /* ===== END of sub page UI tab checks ==== */

  // setting initial access for the page
  useEffect(() => {
    if (userAccess && typeof userAccess === 'object' && Object.keys(userAccess).length > 0) {
      setAccessPayload(userAccess)
      // update the pagedefault access
      setFinanceAccess(prevState => ({
        ...prevState,
        actionsAccess: actionAccessUITransformer(userAccess, 'finance'),
        pageDefaultAccess: pageAccessUITransformer(userAccess, 'Finance'),
        subPageActionsAccess: {
          paymentActionsAccess: actionAccessUITransformer(userAccess, 'finance', 'payment'),
          taxesActionsAccess: actionAccessUITransformer(userAccess, 'finance', 'taxes'),
          walletActionsAccess: actionAccessUITransformer(userAccess, 'finance', 'wallet'),
        },
        subPageDefaultAccess: {
          paymentDefaultAccess: pageAccessUITransformer(userAccess, 'finance', 'payment'),
          taxesDefaultAccess: pageAccessUITransformer(userAccess, 'finance', 'taxes'),
          walletDefaultAccess: pageAccessUITransformer(userAccess, 'finance', 'wallet'),
        }
      }))
      setProjectAccess(prevState => ({
        ...prevState,
        actionsAccess: actionAccessUITransformer(userAccess, 'project'),
        pageDefaultAccess: pageAccessUITransformer(userAccess, 'Project')
      }));
      setWorkforceAccess(prevState => ({
        ...prevState,
        //actionsAccess: actionAccessUITransformer(userAccess, 'workforce'),
        pageDefaultAccess: pageAccessUITransformer(userAccess, 'Workforce'),
        subPageActionsAccess: {
          workersActionsAccess: actionAccessUITransformer(userAccess, 'workforce', 'workers'),
          leaderboardActionsAccess: actionAccessUITransformer(userAccess, 'workforce', 'leaderboard'),
        },
        subPageDefaultAccess: {
          workersDefaultAccess: pageAccessUITransformer(userAccess, 'workforce', 'workers'),
          leaderboardDefaultAccess: pageAccessUITransformer(userAccess, 'workforce', 'leaderboard'),
        }
      }));
      setSettingsAccess(prevState => ({
        ...prevState,
        actionsAccess: actionAccessUITransformer(userAccess, 'settings'),
        pageDefaultAccess: pageAccessUITransformer(userAccess, 'settings')
      }))

    }

  }, [userAccess])

  // Effect to change the payload
  useEffect(() => {
    if (accessPayload.length > 0 && projectAccess) {
      setAccessPayload(actionsAccessApiTransformer(accessPayload, 'project', projectAccess));
    }
  }, [projectAccess])

  useEffect(() => {
    if (accessPayload.length > 0 && workforceAccess) {
      setAccessPayload(actionsAccessApiTransformer(accessPayload, 'workforce', workforceAccess));
    }
  }, [workforceAccess])

  useEffect(() => {
    if (accessPayload.length > 0 && financeAccess) {
      setAccessPayload(actionsAccessApiTransformer(accessPayload, 'finance', financeAccess));
    }
  }, [financeAccess])

  useEffect(() => {
    if (accessPayload.length > 0 && settingsAccess) {
      setAccessPayload(actionsAccessApiTransformer(accessPayload, 'settings', settingsAccess));
    }
  }, [settingsAccess])

  // handling the user access payload as a component
  useEffect(() => {
    if (inviteUser && accessPayload.length > 0) {
      handleAccess(accessPayload);
    }
  }, [inviteUser, accessPayload])


  // Handle saving user access
  const saveUserAccess = () => {
    setBtnLoading(true)
    updateUserAccess(user_id, accessPayload).then((res) => {
      setShowSaveBtn(false)
    }).finally(() => {
      setBtnLoading(false)
    })
  }

  // handle tabs changes
  const handleTabChange = (key, tabType) => {
    if (tabType === 'page') {
      setActiveTabs({
        ...activeTabs,
        pageActiveTabs: key
      });
    } else if (tabType === 'workforce') {
      setActiveTabs({
        ...activeTabs,
        subPageTabs: {
          ...activeTabs.subPageTabs,
          workforceActiveTabs: key
        }
      });
    } else if (tabType === 'finance') {
      setActiveTabs({
        ...activeTabs,
        subPageTabs: {
          ...activeTabs.subPageTabs,
          financeActiveTabs: key
        }
      });
    }
  };


  const UserActionsContent = ({ tableData, setFunction, isSubPage, subPageActionsName }) => {

    // Handle changing actions states
    /**
     * Handles the change event for the checkbox.
     * @param {string} key - The unique key of the record.
     * @param {string} field - The field to be updated ('edit' in this case).
     * @param {boolean} val - The current value of the checkbox.
    */
    const onChangeActions = (key, field, val) => {
      setShowSaveBtn(true);
      const updatedData = tableData.map(item => {
        if (item.key === key) {
          return {
            ...item,
            [field]: val,
          };
        }
        return item;
      });

      // Update the state or handle the updated data as needed
      if (isSubPage) {
        setFunction(prevState => ({
          ...prevState,
          subPageActionsAccess: {
            ...prevState.subPageActionsAccess,
            [subPageActionsName]: updatedData
          }
        }));
      } else {
        setFunction(prevState => ({
          ...prevState,
          actionsAccess: updatedData
        }));
      }
    };

    // Actions columns
    const columns = [
      {
        title: 'EDIT',
        dataIndex: 'edit',
        render: (val, record) => <Checkbox checked={val} value={val} disabled={record?.disabled}
          onChange={() => onChangeActions(record.key, 'edit', !val)}
        />
      },
      {
        title: 'Access details',
        dataIndex: 'access',
        render: (val, record) => {
          const parentEntities = ['Attendance', 'Trades', 'Supervisors', 'Suppliers'];
          const isParentIncluded = parentEntities.some(entity => record.parent && record.parent.includes(entity));
          return (
            <p className='capitalize'>
              {String(val).replace(/_/g, " ")}{' '}
              {isParentIncluded && record.parent}
            </p>
          );
        }
      },
    ];

    return (
      <>
        <DynamicTable
          columns={columns}
          data={tableData}
          pagination={false}
          isAccess={true}
        />
      </>
    );
  };

  const TabContent = ({ pageAccess, pageDefaultAccess, pageActions, setFunction, isSubPage, subPageActionsName }) => {

    // handle change page access
    const onChangePageAccess = (checkedValues) => {
      setShowSaveBtn(true);

      let [page, accessLevel] = String(checkedValues.target.value).split('-')

      if (page) {
        switch (page) {
          case 'project':
            setFunction(prevState => ({
              ...prevState,
              pageDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value,
              actionsAccess: generateGenericPageActionsAccess(accessLevel.toLowerCase(), pageActions)
            }))
            break;

          case 'workers':
            // update the workforce access sub actions
            setFunction(prevState => ({
              ...prevState,
              // workforceAccess.subPageActionsAccess.workersActionsAccess
              subPageDefaultAccess: {
                ...prevState.subPageDefaultAccess,
                workersDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value
              },
              subPageActionsAccess: {
                ...prevState.subPageActionsAccess,
                workersActionsAccess: generateGenericPageActionsAccess(accessLevel.toLowerCase(), pageActions)
              }

            }))
            break;

          case 'leaderboard':
            setFunction(prevState => ({
              ...prevState,
              subPageDefaultAccess: {
                ...prevState.subPageDefaultAccess,
                leaderboardDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value
              }
            }))
            break;

          case 'payment':
            setFunction(prevState => ({
              ...prevState,
              subPageDefaultAccess: {
                ...prevState.subPageDefaultAccess,
                paymentDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value
              },
              subPageActionsAccess: {
                ...prevState.subPageActionsAccess,
                paymentActionsAccess: generateGenericPageActionsAccess(accessLevel.toLowerCase(), pageActions)
              }
            }))
            break;

          case 'taxes':
            setFunction(prevState => ({
              ...prevState,
              subPageDefaultAccess: {
                ...prevState.subPageDefaultAccess,
                taxesDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value
              },
              subPageActionsAccess: {
                ...prevState.subPageActionsAccess,
                taxesActionsAccess: generateGenericPageActionsAccess(accessLevel.toLowerCase(), pageActions)
              }
            }))
            break;

          case 'wallet':
            setFunction(prevState => ({
              ...prevState,
              subPageDefaultAccess: {
                ...prevState.subPageDefaultAccess,
                walletDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value
              },
              subPageActionsAccess: {
                ...prevState.subPageActionsAccess,
                walletActionsAccess: generateGenericPageActionsAccess(accessLevel.toLowerCase(), pageActions)
              }
            }))
            break;

          case 'settings':
            // Update settings access state based on accessLevel
            setFunction(prevState => ({
              ...prevState,
              pageDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value,
              actionsAccess: generateGenericPageActionsAccess(accessLevel.toLowerCase(), pageActions)
            }))
            break;
          default:
            break;
        }

      } else {
        return;
      }
    };

    return (
      <div className='flex flex-col gap-4'>
        {/* <Checkbox.Group options={pageAccess} defaultValue={[pageDefaultAccess]} onChange={onChangePageAccess} /> */}
        <Radio.Group options={pageAccess} value={pageDefaultAccess} onChange={onChangePageAccess} />
        <h2 className='text-xl leading-normal'>User actions</h2>
        <UserActionsContent tableData={pageActions} setFunction={setFunction} isSubPage={isSubPage} subPageActionsName={subPageActionsName} />
      </div>
    )
  }


  // sub page Content
  /**
   * Sub Page Tab content
   * @param {Array<Object>} pageAccess - array of page access levels of the radio buttons.
   * @returns 
   */
  const SubPageTabContent = ({ pageAccess, pageDefaultAccess, pageActions, subPageDefaultAccess, setFunction, hasSubPage, subPageItems, uiAccessChecks, subPageActiveTabs }) => {
    let allNull = subPageItems.every(element => element === null);

    // handle change page access
    const onChangeSubPageAccess = (checkedValues) => {
      setShowSaveBtn(true);

      let [page, accessLevel] = String(checkedValues.target.value).split('-')
      if (page) {
        switch (page) {
          case 'workforce':
            // Update the labels of radio buttons of the sub pages to enable/disable
            setWorkforceSubPageChecks(generateGenericSubPageRadioChecks(checkedValues.target.value, workforceSubPageChecks));
            // Update workforce access state based on accessLevel
            setFunction(prevState => ({
              ...prevState,
              pageDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value,
              subPageActionsAccess: generateGenericSubPageActionsAccess(accessLevel.toLowerCase(), pageActions),
              subPageDefaultAccess: generateGenericSubPageDefaultAccess(accessLevel.toLowerCase(), subPageDefaultAccess, uiAccessChecks)
            }))
            break;
          case 'finance':
            // Update the labels of radio buttons of the sub pages to enable/disable
            setFinanceSubPageChecks(generateGenericSubPageRadioChecks(checkedValues.target.value, financeSubPageChecks));
            // Update finance access state based on accessLevel
            setFunction(prevState => ({
              ...prevState,
              pageDefaultAccess: accessLevel.toLowerCase() === 'full access' ? pageAccess[0].value : accessLevel.toLowerCase() === 'view only' ? pageAccess[1].value : pageAccess[2].value,
              subPageActionsAccess: generateGenericSubPageActionsAccess(accessLevel.toLowerCase(), pageActions),
              subPageDefaultAccess: generateGenericSubPageDefaultAccess(accessLevel.toLowerCase(), subPageDefaultAccess, uiAccessChecks)
            }))
            break;
          default:
            break;
        }

      } else {
        return;
      }
    };

    return (
      <div className='flex flex-col gap-4'>
        {/* <Checkbox.Group options={pageAccess} defaultValue={[pageDefaultAccess]} onChange={onChangePageAccess} /> */}
        <Radio.Group options={pageAccess} value={pageDefaultAccess} onChange={onChangeSubPageAccess} />
        {hasSubPage && !allNull && <h2 className='text-xl leading-normal'>Sub pages</h2>}
        <Tabs
          // defaultActiveKey="1"
          activeKey={subPageActiveTabs}
          items={subPageItems}
          tabBarGutter={90}
          onChange={(key) => handleTabChange(key, subPageItems[0].tabType)}
        />
      </div>
    )
  }


  // finance sub page items
  const financeItems = [
    accessRouteRetrieval(userAccess, 'finance', 'payment') ? {
      key: '1',
      label: 'Payments',
      tabType: 'finance',
      children: <TabContent
        pageAccess={financeSubPageChecks.financePaymentSubPageChecks}
        pageDefaultAccess={financeAccess.subPageDefaultAccess.paymentDefaultAccess}
        pageActions={financeAccess.subPageActionsAccess.paymentActionsAccess}
        setFunction={setFinanceAccess}
        isSubPage={true}
        subPageActionsName="paymentActionsAccess"
      />
    } : null,
    accessRouteRetrieval(userAccess, 'finance', 'taxes') ? {
      key: '2',
      label: 'Taxes',
      tabType: 'finance',
      children: <TabContent
        pageAccess={financeSubPageChecks.financeTaxesSubPageChecks}
        pageDefaultAccess={financeAccess.subPageDefaultAccess.taxesDefaultAccess}
        pageActions={financeAccess.subPageActionsAccess.taxesActionsAccess}
        setFunction={setFinanceAccess}
        isSubPage={true}
        subPageActionsName="taxesActionsAccess"
      />
    } : null,
    accessRouteRetrieval(userAccess, 'finance', 'wallet') ? {
      key: '3',
      label: 'Wallet',
      tabType: 'finance',
      children: <TabContent
        pageAccess={financeSubPageChecks.financeWalletSubPageChecks}
        pageDefaultAccess={financeAccess.subPageDefaultAccess.walletDefaultAccess}
        pageActions={financeAccess.subPageActionsAccess.walletActionsAccess}
        setFunction={setFinanceAccess}
        isSubPage={true}
        subPageActionsName="walletActionsAccess"
      />
    } : null,
  ];

  const workforceItems = [
    accessRouteRetrieval(userAccess, 'workforce', 'workers') ? {
      key: '1',
      label: 'Workers',
      tabType: 'workforce',
      children: <TabContent
        pageAccess={workforceSubPageChecks.workforceWorkersSubPageChecks}
        pageDefaultAccess={workforceAccess.subPageDefaultAccess.workersDefaultAccess}
        pageActions={workforceAccess.subPageActionsAccess.workersActionsAccess}
        setFunction={setWorkforceAccess}
        isSubPage={true}
        subPageActionsName="workersActionsAccess"
      />
    } : null,
    accessRouteRetrieval(userAccess, 'workforce', 'leaderboard') ? {
      key: '2',
      label: 'Leaderboard',
      tabType: 'workforce',
      children: <TabContent
        pageAccess={workforceSubPageChecks.workforceLeaderboardSubPageChecks}
        pageDefaultAccess={workforceAccess.subPageDefaultAccess.leaderboardDefaultAccess}
        pageActions={financeAccess.subPageActionsAccess.leaderboardActionsAccess}
        setFunction={setWorkforceAccess}
        isSubPage={true}
        subPageActionsName="leaderboardActionsAccess"
      />
    } : null,
  ];

  /* ====== MAIN Tabs items ======== */
  const items = [
    {
      key: '1',
      label: 'Projects',
      children: <TabContent
        pageAccess={projectAccess.pageAccess}
        pageDefaultAccess={projectAccess.pageDefaultAccess}
        pageActions={projectAccess.actionsAccess}
        setFunction={setProjectAccess}
        isSubPage={false}
      />
    },
    {
      key: '2',
      label: 'Workforce',
      children: <SubPageTabContent
        pageAccess={workforceAccess.pageAccess}
        pageDefaultAccess={workforceAccess.pageDefaultAccess}
        // this will be default access on the subPages
        subPageDefaultAccess={workforceAccess.subPageDefaultAccess}
        // this will be actions on the subPages
        pageActions={workforceAccess.subPageActionsAccess}
        setFunction={setWorkforceAccess}
        hasSubPage={true}
        subPageItems={workforceItems}
        subPageActiveTabs={activeTabs.subPageTabs.workforceActiveTabs}
        uiAccessChecks={workforceSubPageChecks.workforceWorkersSubPageChecks}
      />
    },
    {
      key: '3',
      label: 'Finance',
      children: <SubPageTabContent
        pageAccess={financeAccess.pageAccess}
        pageDefaultAccess={financeAccess.pageDefaultAccess}
        pageActions={financeAccess.subPageActionsAccess}
        subPageDefaultAccess={financeAccess.subPageDefaultAccess}
        setFunction={setFinanceAccess}
        hasSubPage={true}
        subPageItems={financeItems}
        subPageActiveTabs={activeTabs.subPageTabs.financeActiveTabs}
        uiAccessChecks={financeSubPageChecks.financePaymentSubPageChecks}
      />
    },
    {
      key: '4',
      label: 'Settings',
      children: <TabContent
        pageAccess={settingsAccess.pageAccess}
        pageDefaultAccess={settingsAccess.pageDefaultAccess}
        pageActions={settingsAccess.actionsAccess}
        setFunction={setSettingsAccess}
        isSubPage={false}
      />
    },
  ];


  return (
    <div className='p-6 rounded-md bg-white flex flex-col gap-4'>
      {/* tabs */}
      <Tabs
        // defaultActiveKey="1"
        items={items}
        tabBarGutter={90}
        activeKey={activeTabs.pageActiveTabs}
        onChange={(key) => handleTabChange(key, 'page')}
      />
      <div className='flex items-center justify-center w-full'>
        {inviteUser === false && showSaveBtn && (
          <Button
            type="primary"
            className="primaryBtnCustom w-32 rounded-lg"
            loading={btnLoading}
            onClick={saveUserAccess}
          >
            Save
          </Button>
        )}
      </div>

    </div>
  )
}

export default SettingsAccess;