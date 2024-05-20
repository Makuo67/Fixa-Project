import { Icon } from '@iconify/react';
import { useUserAccess } from '../Layouts/DashboardLayout/AuthProvider';

export const ProjectEmptyOnboarding = ({ setShowCreateSite, showCreateSite }) => {
    const { companyStatus, companyStatusLoading } = useUserAccess();

    const handleSiteShow = (event) => {
        event.preventDefault()
        setShowCreateSite(!showCreateSite)
    }
    return (
        <div className='h-full flex flex-col items-center justify-center  gap-10'>
            <div className="header text-center">
                <h1 className="heading-1 capitalize">Projects</h1>
                <p className="sub-heading-1">
                    Create projects to your company to get started.
                </p>
            </div>
            <div className='flex gap-8'>
                {companyStatusLoading === false && !companyStatus?.is_site_created ? <div className='flex flex-col gap-4 items-center justify-center bg-white h-60 w-60 rounded-md border hover:border-2 border-primary cursor-pointer' onClick={(e) => handleSiteShow(e)}>
                    <Icon icon="tabler:plus" className='text-primary' height={24} />
                    <span className='text-primary text-xl font-normal'>Create a project</span>
                </div> : ""
                }
            </div>
        </div>
    )
}