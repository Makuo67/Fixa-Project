import { Skeleton } from 'antd';
import Image from 'next/image';

import Logo from "../shared/Logo";
import { capitalizeAll } from '../../utils/capitalizeAll';
import { useUserAccess } from './DashboardLayout/AuthProvider';

export default function OnboardingLayout({ children }) {
    const { userProfile } = useUserAccess();

    return (
        <>
            <header
                className="h-[80px] w-full bg-primary flex items-center justify-between rounded-b-md px-8 sticky top-0 z-40 shadow-md">
                <Logo />
                <div className='flex space-x-4'>
                    {userProfile.userProfileLoading ? (
                        <div className='flex flex-col'>
                            <Skeleton.Button active={true} block />
                        </div>
                    ) : (
                        <div className='flex flex-col'>
                            <h1 className="text-base font-bold text-white">{userProfile && userProfile.username ? capitalizeAll(userProfile.username) : '---'}</h1>
                            <p className="text-xs font-bold text-white">
                                {userProfile && userProfile.title ? capitalizeAll(userProfile.title) : '---'}
                            </p>
                        </div>
                    )}

                    {userProfile && userProfile.profile_image ? (
                        <Image
                            className="object-cover rounded-full"
                            src={userProfile?.profile_image}
                            alt="User Avatar"
                            width={50}
                            height={50}
                            priority
                        />
                    ) : (
                        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-full border border-secondary cursor-pointer">
                            <span className="text-white font-bold text-lg">
                                {userProfile && userProfile?.username && userProfile.username.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
            </header>
            <main>
                {children}
            </main>
        </>
    )
}