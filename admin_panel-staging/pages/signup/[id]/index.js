import { Col, Row } from 'antd'
import Image from 'next/image';
import { useEffect, useState } from 'react';
// import dayjs from 'dayjs'
import { useRouter } from 'next/router';
import { serialize } from "cookie";

// import banner from '../../../public/images/onboarding-banner.png'
import banner from '../../../public/images/onboarding-banner.webp'
import fixaLogo from '../../../public/logos/logo_white.png'
import { AdminProfile } from '../../../components/Sections/AdminProfile'
// import OnboardingSkeleton from '@/components/Skeletons/OnboardingSkeleton'
import { checkUserExistance } from '@/helpers/onboarding/staff';
import ExpiredLink from '@/components/shared/ExpiredLink';
import { clearIndexDB, clearSteps } from '@/utils/clearSteps';
import { decodeBase64 } from '@/utils/decodeBase';

const Page = ({ decodedBody, linkError }) => {
    const [loading, setLoading] = useState(true);
    const [invitationData, setInvitationData] = useState([]);
    const [isLinkExpired, setLinkExpired] = useState(false);

    const router = useRouter();
    const { id } = router.query;

    const isDateExpired = async (date) => {
        // dynamic importing dayjs
        const dayjs = (await import('dayjs')).default;
        const now = dayjs()
        const dateLocale = dayjs(date);
        // if (now <= dateLocale) {
        //     if (dateLocale.isAfter(now)) {
        //     return false;
        // } else {
        //     return true;
        // }
        // the passed date should be bigger than today.
        setLinkExpired(!dateLocale.isAfter(now));
    }

    const checkUserEmail = async (email) => {
        await checkUserExistance({ email: email }).then((res) => {
            if (res?.emailExists || res.length === 0) {
                setLinkExpired(true);
            }
        })
    }

    // TODO: To be removed!
    // const handleGetInvite = async () => {
    //     fetch('/api/invite', {
    //         method: 'GET',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //     })
    //         .then(response => response.json())
    //         .then(async (data) => {
    //             // console.log("data ====>", data)
    //             if (data) {
    //                 setInvitationData(data);
    //                 if (data?.expirationTime) {
    //                     let expirationStatus = isDateExpired(data?.expirationTime);
    //                     // console.log("expirationStatus ====>", expirationStatus)
    //                     setLinkExpired(expirationStatus);
    //                 }
    //                 if (data?.email) {
    //                     await checkUserEmail(data?.email);
    //                 }
    //                 setLoading(false);
    //             }
    //         })
    //         .catch(error => {
    //             // Handle any errors here
    //             console.error("handleGetInvite ()==>", error);
    //             setLoading(false);
    //         });
    // };

    // const handleDecodingID = async (id) => {
    //     const decodedCookieValue = decodeURIComponent(id);
    //     const decodedBody = decodeBase64(decodedCookieValue);
    //     // handleSaveInvitation(id)
    //     setInvitationData(decodedBody);
    //     if (decodedBody?.expirationTime) {
    //         let expirationStatus = isDateExpired(decodedBody?.expirationTime);
    //         setLinkExpired(expirationStatus);
    //     }
    //     if (decodedBody?.email) {
    //         await checkUserEmail(decodedBody?.email);
    //     }
    //     setLoading(false);
    // }

    // TODO: to be optimized
    // const handleSaveInvitation = async (invitationId) => {
    //     fetch('/api/invite', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(invitationId),
    //     })
    //         .then(response => response.json())
    //         .then(data => {
    //             // handleGetInvite()
    //         })
    //         .catch(error => {
    //             // Handle any errors here
    //             console.error(error);
    //         });
    // };

    // params useEffect
    useEffect(() => {
        if (decodedBody && decodedBody.length > 0) {
            setInvitationData(decodedBody);
            if (JSON.parse(decodedBody)?.expirationTime) {
                isDateExpired(JSON.parse(decodedBody)?.expirationTime);
                // setLinkExpired(expirationStatus);
            }

            if (JSON.parse(decodedBody)?.email) {
                checkUserEmail(JSON.parse(decodedBody)?.email);
            }
        }
        setLoading(false);
    }, [router.isReady, decodedBody]);

    useEffect(() => {
        if (router.isReady) {
            clearSteps();
            clearIndexDB();
        }
    }, [router.isReady, id]);

    if (isLinkExpired || linkError) {
        return <ExpiredLink title={'Oops, this link is not valid'} subTitle={'This link has expired, or it has been used before.'} />
    }

    return (
        <main>
            <Row className='h-screen flex'>
                {/* {loading ? (
                    <>
                        <Col span={12} className='px-5 py-2'>
                            <OnboardingSkeleton photo={true} />
                        </Col>
                        <Col span={12} className='p-5'>
                            <OnboardingSkeleton form={true} />
                        </Col>
                    </>
                ) : isLinkExpired || linkError ? (
                    <ExpiredLink title={'Oops, this link is not valid'} subTitle={'This link has expired, or it has been used before.'} />
                ) : ( */}
                <>
                    <Col span={10}>
                        <div className='relative h-full w-full'>
                            <Image
                                className="w-full"
                                src={banner}
                                alt="Onboarding Banner Image"
                                priority
                                layout='fill'
                                quality={60}
                            // placeholder='blur'
                            />
                        </div>
                        <div className='absolute bottom-0 left-0 bg-gradient-to-t from-gradient-primary from-30% h-[300px] w-full flex items-end justify-center'>
                            <div className='w-full md:w-[720px] h-[200px] flex items-center justify-center'>
                                <Image
                                    src={fixaLogo}
                                    alt="Fixa Logo"
                                    priority={true}
                                    layout='fill'
                                    quality={60}
                                // placeholder='blur'
                                />
                            </div>
                        </div>
                    </Col>
                    <Col span={14}>
                        <AdminProfile invitationData={invitationData} loading={loading} />
                    </Col>
                </>
            </Row>
        </main >
    )
}
export default Page;


export async function getServerSideProps({ params, res }) {
    const { id } = params
    const cookieName = '_invite_admin';

    try {
        let decodedBody = [];
        // GET request
        const decodedCookieValue = decodeURIComponent(id);
        const cookie = serialize(cookieName, id, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        decodedBody = decodeBase64(decodedCookieValue);
        res.setHeader("Set-Cookie", cookie);
        return {
            props: {
                decodedBody,
                linkError: false
            }
        };
    } catch (error) {
        // Handle any errors here
        console.error(error);
        return {
            props: {
                linkError: true,
                errorMessage: "Error handling invitation"
            }
        };
    }
}