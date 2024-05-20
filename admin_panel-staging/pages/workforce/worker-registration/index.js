import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from "../../../components/Layouts/DashboardLayout/Layout";
import { Button, Input, Card } from 'antd';

import StyledCard from "./Card.styled";
import { submitNIDToRSSB } from '../../../helpers/workforce/workforce';
import WorkerRegistrationForm from '../../../components/Forms/WorkerRegistrationForm';
import { useUserAccess } from '@/components/Layouts/DashboardLayout/AuthProvider';
import OnboardSteps from '@/components/Onboarding/OnboardSteps';
import { ContactDetails } from '@/components/WorkerRegistration/ContactDetails';
import { getCountries } from '@/helpers/projects/projects';
import { TradeRates } from '@/components/WorkerRegistration/TradeRates';
import { PaymentMethods } from '@/components/WorkerRegistration/PaymentMethods';
import { clearIndexDB } from '@/utils/indexDBUtils';
import BulkRegistration from '@/components/Modals/workforce/BulkRegistration';
import ErrorComponent from '@/components/Error/Error';
import RenderLoader from '@/components/Loaders/renderLoader';
import { accessRouteRetrieval, accessSubpageEntityRetrieval } from '@/utils/accessLevels';

const validateID = (id) => {
  if (id?.target?.value?.match(/\D/g)) {
    return {
      validateStatus: 'error',
      errorMsg: 'NID Number is not valid',
    }
  }
  if (id?.target?.value?.length === 16 || !id?.target?.value.includes(" ")) {
    return {
      validateStatus: 'success',
      errorMsg: null,
    }
  }
  return {
    validateStatus: 'error',
    errorMsg: 'NID Number is not valid',
  };
}

// Nationlity component
const WorkerNationalitySelector = ({ handleNationalitySelect }) => (
  <div className="flex flex-col items-center justify-center gap-5 h-full w-full">
    <h1 className="text-black font-inter text-xl md:text-2xl font-medium leading-normal">Worker Nationality</h1>
    <div className="flex flex-col gap-2 w-72">
      <Button
        type="primary"
        className='addWorkerModalBtn'
        onClick={() => handleNationalitySelect('rwandan')}
      >
        Rwandan
      </Button>
      <Button
        type="primary"
        className='addWorkerModalBtn'
        onClick={() => handleNationalitySelect('foreigner')}
      >
        Foreigner
      </Button>
    </div>
  </div>
)

// Rwandan NID component
const RwandanIdSubmit = ({ userAccess, rwandanId, setRwandanId, submitRwandanId, rssbLoading, onBack }) => (
  <div className="flex flex-col items-center justify-center gap-5 h-full w-full">
    <h1 className="text-black font-inter text-xl md:text-2xl font-medium leading-normal">Enter NID</h1>
    <div className="flex flex-col items-center gap-2 w-72">
      <Input
        placeholder='Enter NID number'
        value={rwandanId.value}
        maxLength={16}
        // type='number'
        onChange={(e) => setRwandanId({ ...rwandanId, ...validateID(e), value: e.target.value })}
        className='flex border rounded-md border-primary p-4 h-12 items-center justify-center bg-white'
      />
      {rwandanId.validateStatus === 'error' && <p className='text-bder-red'>{rwandanId.errorMsg}</p>}
      {/* ===== buttons ==== */}
      <div className='flex flex-col gap-3 w-1/2 items-center justify-center'>
        {userAccess && accessSubpageEntityRetrieval(userAccess, 'workforce', 'workers', 'register workers') && (
          <Button
            type='primary'
            className={`${rwandanId.validateStatus === 'success' && rwandanId?.value?.length === 16 ? 'primaryBtn' : 'primaryBtnDisabled'} !w-full`}
            onClick={submitRwandanId}
            loading={rssbLoading}
            disabled={rwandanId.validateStatus === 'success' && rwandanId?.value?.length === 16 ? false : true}
          >
            Submit
          </Button>
        )}
        <Button className='backButton h-12' onClick={onBack}>Back</Button>

      </div>
    </div>

  </div>
)

// worker registrations steps
const workerRegistrationSteps = [
  {
    title: <span className='stepTitle'>Profile details</span>,
  },
  {
    title: <span className='stepTitle'>Contact details</span>,
  },
  {
    title: <span className='stepTitle'>Trade and Rates</span>,
  },
  {
    title: <span className='stepTitle'>Payment methods</span>,
  },
];

export default function SingleWorker() {
  const [workerNationality, setWorkerNationality] = useState('');
  const [rwandanId, setRwandanId] = useState({ value: '' });
  const [rssbLoading, setrssbLoading] = useState(false);
  const [rssbData, setRssbData] = useState({});
  const [idSubmitted, setIdSubmitted] = useState('');
  const [registrationStep, setRegistrationStep] = useState(0);
  const [showId, setShowId] = useState(null);
  const [workerRegisteredId, setWorkerRegisteredId] = useState(null);
  const [countryId, setCountryId] = useState(null);
  const [countries, setCountries] = useState([]);
  const [rwandanCountryId, setRwandanCountryId] = useState(null);
  const [registrationType, setRegistrationType] = useState(null);

  // console.log("workerNationality ====", workerNationality, "registrationStep ====", registrationStep, "show ID === ", showId)
  const router = useRouter()
  const { userProfile, companyStatus } = useUserAccess();
  const { user_access, user_level } = userProfile;

  const oncancel = () => {
    router.push("/workforce")
  }

  useEffect(() => {
    getCountries().then((data) => {
      setCountries(data)
    }).catch((err) => setCountries([]));

  }, []);

  // get router parameter
  useEffect(() => {
    if (router.isReady) {
      if (router.query.type) {
        setRegistrationType(router.query.type)
      }
      else {
        setRegistrationType('single');
      }
    }
  }, [router])

  useEffect(() => {
    if (countries.length > 0) {
      const rwandanCountry = countries.find(country => country.alpha_2_code === 'RW');

      if (rwandanCountry) {
        setRwandanCountryId(rwandanCountry.id)
      } else {
        setRwandanCountryId(null)
      }
    }
  }, [countries]);

  const handleNextStep = () => {
    setRegistrationStep(registrationStep + 1);
  }

  const handleBackStep = () => {
    if (registrationStep > 0) setRegistrationStep(registrationStep - 1);
    // rwandan after submitting ID
    if (workerNationality === 'rwandan' && registrationStep === 0) {
      clearIndexDB("regForm");
      clearIndexDB("tradeRateForm")
      clearIndexDB("contactFormData")
      setRssbData({});
      setShowId(true);
      setIdSubmitted(false)
    } else if (workerNationality === 'foreigner' && registrationStep === 0) {
      setWorkerNationality('');  // set the nationality to empty This one is trriggering the display of selecting worker nationality
      setShowId(false)
      setRssbData({});
      // trigger form reset
      setIdSubmitted(false)
      clearIndexDB("regForm")
      clearIndexDB("tradeRateForm")
      clearIndexDB("contactFormData")
    }
  }

  // change nationality tab
  const handleNationalitySelect = (nationality) => {
    // clear reg form in indexDB
    clearIndexDB("regForm")
    clearIndexDB("tradeRateForm")
    clearIndexDB("contactFormData")
    setWorkerNationality(nationality);
    if (nationality === 'rwandan') {
      setShowId(true);
    }
    else if (nationality !== 'rwandan' && nationality !== '') {
      setIdSubmitted(false);
      setShowId(false)
    } else if (nationality == '') {
      setIdSubmitted(false)
    }
  }

  // extracting masked phone numbers
  function extractPhoneNumbers(data) {
    const phoneNumbers = [];
    if (data)
      data.phoneNumbers.forEach(item => {
        phoneNumbers.push(item.phoneNumber);
      });

    return phoneNumbers;
  }

  // submit the id to rssb
  const submitRwandanId = () => {
    setrssbLoading(true);
    // send the id to rssb
    submitNIDToRSSB(rwandanId.value).then((response) => {
      if (response?.data && Object.keys(response?.data).length > 0) {
        setIdSubmitted(true);
        const updatedResponse = {
          firstName: response?.data?.firstName,
          lastName: response?.data?.lastName,
          phoneNumbersMasked: extractPhoneNumbers(response?.data),
          dateOfBirth: response?.data?.dateOfBirth,
          nidNumber: rwandanId.value,
          country: rwandanCountryId,
        };
        setRssbData(updatedResponse);
        setShowId(false)
      }
    }).catch((error) => {
      console.log("submitNIDToRSSB error ====", error);
      setRssbData([]);
    }).finally(() => {
      setrssbLoading(false);
    });
  }

  if (companyStatus?.company_name === "" || user_access?.length === 0) {
    return <RenderLoader />
  } else if (!accessRouteRetrieval(user_access, 'workforce')) {
    return <ErrorComponent status={403} backHome={true} />
  }
  return (
    <>
      <StyledCard>
          <div className='flex flex-col w-full h-full items-center'>
            <h1 className='text-2xl md:text-3xl font-medium text-center text-black'>
              {router?.query?.type === 'bulk' ? `Register workers` : `Register Worker`}
            </h1>
            {showId === false && (
              <OnboardSteps steps={workerRegistrationSteps} currentStep={registrationStep} />
            )}
            <Card
              className="card text-left mt-4 rounded-lg w-full h-fit md:w-3/4"
              bordered={true}
            >
              {registrationType === 'bulk' ? (
                <BulkRegistration onBack={oncancel} />
              ) : (

                <div className='flex flex-col w-full h-full'>

                  <div className='w-32 h-10'>
                    {workerNationality == '' && (
                      <Button className='backButton' onClick={oncancel}>Back</Button>
                    )}
                  </div>
                  {/* ===== Nationality selector ===== */}
                  {workerNationality === '' && (
                    <WorkerNationalitySelector handleNationalitySelect={handleNationalitySelect} key={1} />
                  )}

                  {/* ===== Submit ID ===== */}
                  {workerNationality === 'rwandan' && showId && (
                    <RwandanIdSubmit
                      key={2}
                      rwandanId={rwandanId}
                      setRwandanId={setRwandanId}
                      userAccess={user_access}
                      submitRwandanId={submitRwandanId}
                      rssbLoading={rssbLoading}
                      onBack={() => {
                        setWorkerNationality('')
                        setShowId(null)
                        //clear the Nid
                        setRwandanId({ value: '' })
                      }}
                    />
                  )}
                  {workerNationality !== '' && showId == false && registrationStep === 0 ? (
                    <WorkerRegistrationForm
                      rssbData={rssbData}
                      idSubmitted={idSubmitted}
                      handleNationalitySelect={handleNationalitySelect}
                      handleNextStep={handleNextStep}
                      setWorkerRegisteredId={setWorkerRegisteredId}
                      setCountryId={setCountryId}
                      handleBackStep={handleBackStep}
                      workerRegisteredId={workerRegisteredId}
                    />
                  )
                    : registrationStep === 1 && workerRegisteredId !== null ?
                      (
                        <ContactDetails
                          handleNextStep={handleNextStep} workerRegisteredId={workerRegisteredId} countryId={countryId} handleBackStep={handleBackStep} />
                      )
                      : workerRegisteredId !== null && registrationStep === 2 ?
                        (
                          <TradeRates
                            workerRegisteredId={workerRegisteredId}
                            handleBackStep={handleBackStep}
                            handleNextStep={handleNextStep}
                          />
                        )
                        : workerRegisteredId !== null && registrationStep === 3 ?
                          (
                            <PaymentMethods
                              workerRegisteredId={workerRegisteredId}
                              handleBackStep={handleBackStep}
                            />
                          )
                          : null
                  }

                </div>

              )}
            </Card>
          </div>
        </StyledCard >
    </>
  )
}

SingleWorker.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
