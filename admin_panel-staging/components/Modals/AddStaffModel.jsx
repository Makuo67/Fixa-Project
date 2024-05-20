import { Button, Input, Modal, Select, notification } from 'antd';
import { useState } from 'react'
import { Icon } from '@iconify/react';
import { capitalizeAll } from '../../utils/capitalizeAll';
import { createJobPosition } from '@/helpers/onboarding/staff';
import SettingsAccess from '../Settings/SettingsAccess';
import { userInviteSteps } from '../UserProfile/Modals/edit';
import OnboardSteps from '../Onboarding/OnboardSteps';

const AddStaffTtitle = () => (
  <div className='flex flex-col'>
    <h1 className='heading-1'>Add Staff</h1>
    <p className='subTitle'>Enter staff position, email and setup their access level below</p>
  </div>
)

/* confirmation modal */
export const ConfirmationModal = ({ openConfirm, handleOk, confirmLoading, handleCancel, title, content, value }) => (
  <Modal
    title={title}
    open={openConfirm}
    onOk={handleOk}
    // confirmLoading={confirmLoading}
    onCancel={handleCancel}
    okButtonProps={{
      className: 'bg-primary',
      loading: confirmLoading
    }}
  >
    <p>{content}</p>
  </Modal>
)

const AddStaffModel = ({ open, handleOk, handleCancel, loading, positions, setPositionChanged, dashboardInvite, initialAccess }) => {
  const [staffToInvite, setStaffToInvite] = useState({
    job_title: '',
    job_title_name: '',
    email: '',
    "user_access": initialAccess
  });
  const [emailError, setEmailError] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [resetState, setResetState] = useState(false);
  const [userInviteStep, setUserInviteStep] = useState(0);
  // console.log("initialAccess === ", initialAccess)

  const { Option } = Select;

  const handleCloseModal = () => {
    setStaffToInvite({
      job_title: '',
      job_title_name: '',
      email: '',
      "user_access": [],
    });
    setUserInviteStep(0)
    setEmailError(false);
    setResetState(true);
    handleCancel();
  }

  // Handle Selecting access levels

  const titleChanged = (e) => {
    setStaffToInvite((pre) => {
      const [id, name] = e.split('-');
      return {
        ...pre,
        job_title: id,
        job_title_name: name,
      };
    });
  };

  const onSearch = (e) => {
    setNewJobTitle(e);
  };

  const showPopconfirm = (value) => {
    setOpenConfirm(true);
    setNewTitle(value);
  };

  const cancelCreateTitle = (e) => {
    setOpenConfirm(false);
    console.log("");
  };

  // Create a position
  const confirmCreateTitle = async () => {
    let body = {
      "title_name": newTitle
    }
    setConfirmLoading(true);
    setNewJobTitle('');
    try {
      let response = []
      if (dashboardInvite) {
        response = await createJobPosition(body);
      } else {
        response = await fetch('api/onboarding/staff/titles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }

      let data = []
      if (dashboardInvite) {
        data = response
      } else {
        data = await response.json();
      }


      if (data && data.status === 'success') {
        notification.success({
          message: "Success",
          description: "Job position created successfully",
        })
        setConfirmLoading(false);
        setOpenConfirm(false);
        setPositionChanged(true);
        setStaffToInvite({
          ...staffToInvite,
          job_title: data?.data?.id,
          job_title_name: data?.data?.title_name,
        });
      } else {
        notification.warning({
          message: data?.message,
        })
        setConfirmLoading(false);
        setOpenConfirm(false);
      }
    } catch (error) {

      notification.error({
        message: "Error",
        description: "Job position creation failed, Try again.",
      })
      setConfirmLoading(false);
      setOpenConfirm(false);
      console.error('Error fetching data:', error);
    }
  };

  const handleNextStep = () => {
    setUserInviteStep(userInviteStep + 1)
  }

  const handleBackStep = () => {
    setUserInviteStep(userInviteStep - 1)
  }

  const handleUserAccessChanges = (access) => {
    setStaffToInvite((pre) => {
      return {
        ...pre,
        user_access: access,
      };
    })
  }

  return (
    <>
      <Modal
        open={open}
        title={<AddStaffTtitle />}
        onCancel={handleCloseModal}
        footer={() => userInviteStep == 1 && (
          <div className='w-full h-full flex justify-center gap-3'>
            <Button
              className='secondaryCustomBtn w-32 border-none'
              loading={loading}
              onClick={handleBackStep}
            >
              Back
            </Button>
            <Button
              className='primaryBtnCustom w-32 border-none'
              loading={loading}
              onClick={() => {
                handleOk(staffToInvite)
                handleCloseModal()
              }}
              disabled={staffToInvite.email === '' || emailError}
            >
              <span className='text-white text-base'>Add Staff</span>
            </Button>
          </div>
        )
        }
        width={600}
      >
        <div className='flex flex-col gap-4'>
          <OnboardSteps steps={userInviteSteps} currentStep={userInviteStep} />
          {/* ==== inputs ===== */}
          {userInviteStep === 0 && (
            <>

              <div className='flex flex-row gap-4'>
                <div className='w-full flex flex-col gap-2'>
                  {/* === position ==== */}
                  <p className='inputLabel'>Position</p>

                  <Select
                    className='formInput'
                    showSearch
                    placeholder="Select a position"
                    onChange={titleChanged}
                    value={capitalizeAll(staffToInvite.job_title_name)}
                    onSearch={onSearch}
                    optionFilterProp="children"
                    filterOption={(input, option) => option.children.toLowerCase().includes(input?.toLowerCase())}
                    filterSort={(optionA, optionB) =>
                      optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                    }
                    notFoundContent={
                      <Button
                        className='text-primary flex flex-row items-center justify-center gap-2'
                        onClick={() => { showPopconfirm(newJobTitle) }} >
                        <Icon icon="fe:plus" width={15} height={15} />
                        Create Position : {capitalizeAll(newJobTitle)}
                      </Button>
                    }
                  >
                    {positions?.map((item) => {
                      return (
                        <Option
                          value={`${item.id.toString()}-${item.title_name}`}
                          key={item.id}
                          title={item?.title_name}
                        >
                          {capitalizeAll(item?.title_name)}
                        </Option>
                      );
                    })}
                  </Select>

                  <ConfirmationModal
                    value={newTitle}
                    handleOk={confirmCreateTitle}
                    handleCancel={cancelCreateTitle}
                    openConfirm={openConfirm}
                    confirmLoading={confirmLoading}
                    title="Confirm creating a position."
                    content="Are you sure you want to create this position?"
                  />
                </div>
                <div className='w-full flex flex-col gap-2'>
                  <p className='inputLabel'>Email</p>
                  <div>
                    <Input type="email" name="email"
                      onChange={(e) => setStaffToInvite({ ...staffToInvite, email: e.target.value })}
                      value={staffToInvite.email}
                      placeholder='Enter email'
                      autoComplete="off"
                      required
                      onBlur={() => {
                        // Validate the email input
                        const isValidEmail = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(staffToInvite.email);
                        setEmailError(!isValidEmail);
                      }}
                      minLength={5}
                      maxLength={50}
                      className='formInput'
                    />
                    {emailError && <p className="text-bder-red">Invalid email address</p>}
                  </div>
                </div>
              </div>
              <div className='flex items-center w-full justify-center'>
                <Button
                  className='primaryBtnCustom w-32 border-none'
                  loading={loading}
                  onClick={handleNextStep}
                  disabled={staffToInvite.email === '' || emailError}
                >
                  Next
                </Button>
              </div>
            </>
          )}

          {userInviteStep === 1 && (
            <div className='w-full h-full'>
              <SettingsAccess inviteUser={true} userAccess={initialAccess} handleAccess={handleUserAccessChanges} />
            </div>
          )}
        </div >
      </Modal >
    </>
  )
}

export default AddStaffModel;