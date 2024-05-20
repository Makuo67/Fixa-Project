import { useRouter } from 'next/router';
import { Button } from "antd";
import Image from "next/image";

import timeManagement from '../../assets/svgs/time_management.svg';

const ExpiredLink = ({ title, subTitle, btnText, redirectLink }) => {
    const router = useRouter();

    return (
        <div className="flex flex-col md:flex-row-reverse md:h-screen md:w-screen items-center justify-center w-full h-full gap-2 p-4 md:p-40">
            <div className="w-full h-full">
                <Image
                    src={timeManagement}
                    alt="link_expired image"
                    priority
                    fill="true"
                />
            </div>

            <div className="flex flex-col items-center justify-center md:items-start gap-1 md:w-full md:h-full">
                {/* ===== description of expired link =====  */}
                {title && (
                    <h1 className="title text-black">{title}</h1>
                )}
                {subTitle && (
                    <p className="sub-heading-1 text-wrap">{subTitle}
                    </p>
                )}
                {btnText && redirectLink && (
                    <div className="w-40">
                        <Button
                            className="primaryBtn"
                            type="primary"
                            onClick={() => router.push(redirectLink)}>
                            {btnText}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExpiredLink;