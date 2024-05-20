import { Icon } from '@iconify/react';
import { Button, notification } from 'antd';
import React, { useEffect, useState } from 'react';

import ContinueSkipBtn from '../Buttons/ContinueSkipBtn';
import AddStaffModel from '../Modals/AddStaffModel';
import StaffCard from '../Cards/StaffCard';
import { useRouter } from 'next/router';
import { getCurrentToken } from '@/helpers/getCurrentToken';
import { useUserAccess } from '../Layouts/DashboardLayout/AuthProvider';
import { getJobPositions, inviteStaffMembers } from '@/helpers/onboarding/staff';
import { getDefaultLevelAccess } from '../../utils/accessLevels';
import { getAccessLevels } from '../../helpers/settings/settings';

const InviteStaff = ({ dashboardInvite, handleNextStep }) => {
  const [open, setOpen] = useState(false);
  const [staffToInvite, setStaffToInvite] = useState([]);
  const [positions, setPositions] = useState([]);
  const [positionChanged, setPositionChanged] = useState(false);
  const [btnDisable, setBtnDisable] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [token, setToken] = useState("");
  const [initialAccess, setInitialAccess] = useState([]);

  const router = useRouter();

  const { setCompanyStatusLoading } = useUserAccess();
  const pathname = router.asPath;

  const fetchPositions = async () => {
    await getJobPositions().then((res) => {
      setPositions(res)
    }).catch((error) => {
      setPositions([]);
    })
  };

  // init position fetch
  useEffect(() => {
    if (router.isReady) {
      fetchPositions();
      getAccessLevels().then((res) => {
        const defaultAccess = getDefaultLevelAccess('level_1', res);
        setInitialAccess(defaultAccess);
      })
    }
    pathname !== "/onboarding" && getCurrentToken().then(data => {
      setToken(data)
    })
  }, [router.isReady]);

  // disabling next btn
  useEffect(() => {
    if (staffToInvite.length > 0) {
      setBtnDisable(false)
    }
  }, [staffToInvite]);

  useEffect(() => {
    if (positionChanged) {
      fetchPositions();
    }
    return () => {
      setPositionChanged(false)
    }
  }, [positionChanged]);

  const showModal = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleAddStaff = (staff) => {
    setStaffToInvite([...staffToInvite, staff]);
  };

  const handleRemoveStaff = (index) => {
    const updatedStaff = [...staffToInvite];
    updatedStaff.splice(index, 1);
    setStaffToInvite(updatedStaff);
  };

  const handleSkip = () => {
    // setCurrent(current + 1);
    handleNextStep()
  }

  // inviting staff members
  const handleInviteStaff = async () => {
    // destructuring the body
    const body = staffToInvite.map(staff => {
      const { job_title_name, ...rest } = staff;
      return rest;
    });

    setBtnLoading(true);

    try {
      let response = [];
      if (dashboardInvite) {
        response = await inviteStaffMembers(staffToInvite);
      } else {
        response = await fetch('api/onboarding/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(staffToInvite),
        });
      }
      let data = []

      if (dashboardInvite) {
        data = response;

      } else {
        data = await response.json();
      }

      // router.asPath === "/onboarding" ? "" : setCompanyStatusLoading(true)

      if (data && data?.data.status === 'success') {
        setBtnLoading(false);
        setCompanyStatusLoading(true);
        pathname === "/onboarding" && handleNextStep();
        notification.success({
          message: data?.data?.data || 'Staff members invited successfully',
        });

      } else if (data && data?.data?.status === 'failed') {
        setBtnLoading(false);
        data?.data?.error.forEach(err => {
          const errorMessage = `${err.reason} : ${err.email}`;
          notification.warning({
            message: errorMessage,
          });
        });

      }

    } catch (error) {
      setBtnLoading(false);
      notification.error({
        message: 'Inviting staff members failed, Try again.',
      });
    }
  };

  return (
    <>
      <div className='createsiteWrapper'>
        {/* heading and sub */}
        <div>
          <h1 className='heading-1'>Invite staff members</h1>
          <p className='subTitle'>
            Invite your team members with key staff roles you can change this later in settings
          </p>
        </div>
        {/* ==== list of members ==== */}
        <div className='flex flex-col gap-2 w-full'>
          {staffToInvite && staffToInvite.map((staff, index) => (
            <StaffCard key={index} staff={staff} onRemove={handleRemoveStaff} index={index} />
          ))}
        </div>

        {/* ==== Add another btn==== */}
        <Button className='secondaryCustomBtn gap-2' onClick={showModal} >
          <Icon icon="charm:plus" width={20} height={20} />
          <p className='text-base font-medium'>Add another</p>
        </Button>


        {/* ==== Send and skip btn ==== */}
        <ContinueSkipBtn
          skip={pathname === '/onboarding' ? true : false}
          btnText={'Send invites'}
          onClick={handleInviteStaff}
          onSkip={handleSkip}
          disable={btnDisable}
          loading={btnLoading}
        />

      </div>
      <AddStaffModel
        open={open}
        handleOk={handleAddStaff}
        handleCancel={handleCancel}
        positions={positions}
        setPositionChanged={setPositionChanged}
        dashboardInvite={dashboardInvite}
        initialAccess={initialAccess} />
    </>
  )
}

export default InviteStaff;