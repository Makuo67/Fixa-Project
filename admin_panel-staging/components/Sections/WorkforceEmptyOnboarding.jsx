import { Icon } from '@iconify/react';

export const WorkforceEmptyOnboarding = ({ addWorkers, title }) => {
    return (
        <div className='h-full flex flex-col items-center justify-center  gap-10'>

            <div className="header text-center">
                <h1 className="heading-1 capitalize">{title}</h1>
                <p className="sub-heading-1">
                    Register workers to your company and assign them to projects to get started.
                </p>
            </div>
            <div className='flex gap-8'>
                <div className='flex flex-col gap-4 items-center justify-center bg-white h-60 w-60 rounded-md border hover:border-2 border-primary cursor-pointer' onClick={() => {
                    addWorkers()
                }}>
                    <Icon icon="heroicons:users-20-solid" className='text-primary' height={24} />
                    <span className='text-primary text-xl font-normal'>Register Workers</span>
                </div>
            </div>
        </div>
    )
}