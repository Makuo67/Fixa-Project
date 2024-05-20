'use client'
import { Icon } from "@iconify/react";
import { useRouter } from 'next/router';

import ContinueSkipBtn from "../../Buttons/ContinueSkipBtn";
import { useEffect, useState } from "react";
import { clearSteps } from "@/utils/clearSteps";

export const clearCookiesRequest = () => {
    fetch('/api/adminProfile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
const SiteCreateSuccess = () => {
    // const [loadingBtn, setLoadingBtn] = useState(true);
    const [disabledBtn, setDisabledBtn] = useState(false);

    const router = useRouter();
    // console.log(invitationData);

    // Function to redirect to root page
    const redirectToRoot = async () => {
        // router.replace(invitationData.link_platform);
        clearCookiesRequest();
        await clearSteps();
        router.replace("/");
    };

    return (
        <div className="flex flex-col items-center justify-center w-[500px] h-full gap-8 p-10">
            {/* Icon and text */}
            <div className="flex flex-col items-center gap-4">
                <Icon icon="icon-park-solid:check-one" width={138} height={138} className="text-green-1" />
                <h2 className="text-2xl font-normal text-title">Site created Successfully</h2>
            </div>
            {/* Button */}
            <div className="w-full bg">
                <ContinueSkipBtn
                    btnText={"Continue to dashboard"}
                    onClick={redirectToRoot}
                    // loading={loadingBtn}
                    disable={disabledBtn}
                />
            </div>
        </div>
    )
}

export default SiteCreateSuccess;