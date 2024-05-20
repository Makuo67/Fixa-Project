import { Icon } from '@iconify/react';
import { useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import CreateSite from '../Onboarding/CreateSite';
import InviteStaff from '../Onboarding/InviteStaff';
import { useUserAccess } from '../Layouts/DashboardLayout/AuthProvider';
import { Empty } from 'antd';
import { useRouter } from 'next/router';

export const EmptyOnboarding = ({ companyStatusLoading, companyStatus, setCompanyStatusLoading }) => {
    const [showCreateSite, setShowCreateSite] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const { userProfile } = useUserAccess();

    const router = useRouter();

    const handleSiteShow = () => {
        // console.log("Clear empty state 188");
        setShowCreateSite(!showCreateSite)
        setCompanyStatusLoading(true)
    }
    return (
        <div className='h-full flex flex-col items-center justify-center  gap-10'>
            {!companyStatus.is_site_created && showCreateSite ?
                <CreateSite handleShow={handleSiteShow} />
                :
                <div className='flex flex-col items-center justify-center gap-4'>
                    {!companyStatusLoading && !companyStatus?.is_site_created || !companyStatusLoading && !companyStatus?.is_workforce_added ?
                        <div className="header flex flex-col items-center justify-center">
                            <h1 className="heading-1 capitalize">Welcome, {userProfile.username}</h1>
                            <p className="sub-heading-1 w-1/2 text-center">
                                Your dashboard is currently empty. Please follow the setup guide and record your first attendance to get some insights.
                            </p>
                        </div> : ""
                    }
                    <div className='flex gap-8'>
                        {!companyStatusLoading && !companyStatus?.is_site_created ? <div className='flex flex-col gap-4 items-center justify-center bg-white h-60 w-60 rounded-md border hover:border-2 border-primary cursor-pointer' onClick={() => setShowCreateSite(!showCreateSite)}>
                            <Icon icon="tabler:plus" className='text-primary' height={24} />
                            <span className='text-primary text-xl font-normal'>Create a project</span>
                        </div> : ""
                        }

                        {!companyStatusLoading && !companyStatus?.is_workforce_added ? <div className='flex flex-col gap-4 items-center justify-center bg-white h-60 w-60 rounded-md border hover:border-2 border-primary cursor-pointer' onClick={() => router.push("/workforce/worker-registration?type=bulk")}>
                            <Icon icon="heroicons:users-20-solid" className='text-primary' height={24} />
                            <span className='text-primary text-xl font-normal'>Register Workers</span>
                        </div> : ""
                        }
                    </div>
                    {!companyStatusLoading && companyStatus?.is_site_created && companyStatus?.is_workforce_added && !companyStatus?.is_dashboard_available ? <div className='flex flex-col gap-4 items-center justify-center h-60 w-fit cursor-pointer'>
                        <Empty description="No attendances found, please record your first attendance to get started." />
                    </div> : ""
                    }
                </div>
            }
        </div>
    )
}