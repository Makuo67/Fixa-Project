import { useEffect, useState } from "react";
import { CloseOutlined } from "@ant-design/icons"
import OnboardSteps from "./OnboardSteps";
import SiteInfoForm from "./Forms/SiteInfoForm";
import SiteStaff from "./Forms/SiteStaff";
import ShiftTypes from "./Forms/ShiftTypes";
import WorkerRates from "./Forms/WorkerRates";
import SiteCreateSuccess, { clearCookiesRequest } from "./Forms/SiteCreateSuccess";
import localforage from "localforage";
import { useRouter } from "next/router";
import { clearSteps } from "@/utils/clearSteps";

const steps = [
    {
        title: <span className='stepTitle'>Site Info</span>,
    },
    {
        title: <span className='stepTitle'>Shift Types</span>,
    },
    {
        title: <span className='stepTitle'>Worker Rates</span>,
    },
];

const CreateSite = ({ handleShow }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const router = useRouter();

    useEffect(() => {
        // Persist current step
        localforage.getItem('childStep').then(data => {
            if (data) {
                setCurrentStep(parseInt(data));
            } else {
                setCurrentStep(0);
            }
        });
    }, [])

    const handleNextStep = async () => {
        setCurrentStep(currentStep + 1);
        if (router.pathname === "/projects" || router.pathname === "/") {
            await clearSteps();
        } else {
            localforage.setItem('childStep', currentStep + 1);
        }
    };

    const handleSkipAll = () => {
        setCurrentStep(steps.length);
    };

    const handleSiteSkipAll = async () => {
        clearCookiesRequest()
        await clearSteps();
        router.replace('/');
    }

    const onChange = (value) => {
        setCurrentStep(value);
        localforage.setItem('childStep', value);
    };


    return (
        <>
            {currentStep == steps.length ? (
                <SiteCreateSuccess />
            ) : (
                <div className="w-[500px] h-screen overflow-y-auto scrollbar-hide space-y-8">
                    <div className="header">
                        {/* === title and sub ==== */}
                        <div className="flex justify-between">
                            <h1 className='heading-1'>Create a project</h1>
                            {/* <span className="cursor-pointer space-x-2 text-sub-title" onClick={handleShow}>
                                <CloseOutlined />
                                Close
                            </span> */}
                        </div>
                        <h1 className='sub-heading-1'>Create and configure a new project</h1>
                    </div>
                    <div>
                        {/* === steps ==== */}
                        <OnboardSteps steps={steps} currentStep={currentStep} onChange={onChange} />
                    </div>
                    <div className="w-full">
                        {/* === FORMS ==== */}
                        {currentStep == 0 ? (
                            <SiteInfoForm handleNextStep={handleNextStep} handleSkipAll={handleSiteSkipAll} />
                        ) : currentStep == 1 ? (
                            <ShiftTypes handleNextStep={handleNextStep} />
                        ) : currentStep == 2 ? (
                            <WorkerRates handleNextStep={handleNextStep} handleShow={handleShow} />
                        ) : null}

                    </div>
                </div>
            )}
        </>
    )
}

export default CreateSite;