import { useEffect, useState } from 'react';
import { Col, Row, Skeleton, Steps } from 'antd';
import { useRouter } from 'next/router';
import localforage from 'localforage';

import { CompanyProfile } from '../../components/Sections/CompanyProfile'
import { CompanyProfileContent } from '../../components/Sections/CompanyProfileContent';
import CreateSite from '../../components/Onboarding/CreateSite';
import InviteStaff from '../../components/Onboarding/InviteStaff';
import { capitalizeAll } from '../../utils/capitalizeAll';
import OnboardingLayout from '../../components/Layouts/OnboardingLayout';
import { useUserAccess } from '@/components/Layouts/DashboardLayout/AuthProvider';

const OnboardingPage = () => {
  const router = useRouter();

  const [user, setUser] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  const { userProfile, companyStatus } = useUserAccess();

  useEffect(() => {
    // Check if user has fully onboarded
    if (companyStatus?.is_site_created && companyStatus?.is_staff_members_added && companyStatus?.is_workforce_added) {
      router.push('/');
    }

    // Persist current step
    localforage.getItem('parentStep').then(data => {
      if (data) {
        setCurrent(parseInt(data));
      } else {
        setCurrent(0);
      }
    });
    // fetch admin data
    const fetchData = async () => {
      const response = await fetch('/api/adminProfile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      const results = await response.json();
      if (results.status === 'success' && results?.data?.user) {
        setUser(results.data.user);
        setUserLoading(false);
      } else {
        setUser([])
        setUserLoading(false);
      }
    };
    fetchData();
  }, []);

  const onChange = (value) => {
    setCurrent(value);
    localforage.setItem('parentStep', value);
  };

  const handleNextStep = () => {
    setCurrent(current + 1);
    localforage.setItem('parentStep', current + 1);
  };

  const items = [
    {
      key: 0,
      title: 'Create company profile',
      content: <CompanyProfileContent handleNextStep={handleNextStep} />,
    },
    {
      key: 1,
      title: 'Invite staff members',
      content: <InviteStaff handleNextStep={handleNextStep} />,
    },
    {
      key: 2,
      title: 'Create project',
      content: <CreateSite />,
    },
  ];

  return (
    <main>
      <Row className="h-screen px-20 py-20" gutter={[16, 16]}>
        <Col span={12}>
          {userLoading ? (
            <div className='space-y-2'>
              <Skeleton paragraph={{ rows: 1 }} active />
            </div>
          ) : (
            <div className='space-y-2'>
              <header className="heading-1">Welcome, {userProfile && userProfile?.username ? capitalizeAll(userProfile?.username) : '---'}</header>
              <p className="sub-heading-1">This guide will help you setup everything you need to make this platform your own.</p>
            </div>
          )}
          <div>
            <div className="w-5/6 py-2 lg:py-4">
              <Steps
                type='navigation'
                // onChange={onChange}
                current={current}
                // direction='vertical' 
                labelPlacement='horizontal'
                progressDot={false}
                responsive={true}
                className={`site-navigation-steps flex flex-col gap-10`}
                items={items}
              />
            </div>
          </div>
        </Col>
        <Col span={12} className='col'>
          <CompanyProfile current={current} steps={items} />
        </Col>
      </Row>
    </main>
  )
}
export default OnboardingPage;

OnboardingPage.getLayout = function getLayout(page) {
  return <OnboardingLayout>{page}</OnboardingLayout>;
};
