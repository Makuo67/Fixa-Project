import React, { useEffect, useState } from 'react'
import Image from 'next/image';
import { useRouter } from 'next/router';
import DeductionsLayout from '@/components/Layouts/DeductionsLayout/DeductionsLayout';
import { capitalizeAll } from '@/helpers/capitalize';
import InfoIconSvg from '@/assets/svgs/info-circle.svg';
import { getWorkers } from '@/helpers/deduction/deduction';
import RenderLoader from '@/components/Loaders/renderLoader';
import { toMoney } from '@/helpers/excelRegister';
import { useUserAccess } from '@/components/Layouts/DashboardLayout/AuthProvider';
import ErrorComponent from '@/components/Error/Error';

export default function DeductionList() {
  const [allWorkers, setAllWorkers] = useState([])
  const [headers, setHeaders] = useState({})
  const [payee, setPayee] = useState({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { userAccess, userProfile } = useUserAccess();

  const { payment_id, payee_id } = router.query
  useEffect(() => {
    const fetchWorkersDeductions = async () => {
      try {
        if (payment_id && payee_id) {
          const res = await getWorkers(payment_id, payee_id);

          if (res.data.deduction_state === "submitted") {
            setAllWorkers(res?.data?.workers)
            setHeaders(res?.data?.payment_info)
            setPayee(res?.data?.payee_info)
            setLoading(false)
          } else {
            router.push("/404")
          }
        }

      } catch (error) {
        console.log(error)
      }
    }
    fetchWorkersDeductions()

  }, [payee_id, payment_id])

  if (loading) {
    return <RenderLoader />
  }
  // else if (!userProfile?.payment_view) {
  //   return <ErrorComponent status={403} backHome={true} />
  // }
  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-row gap-3 items-center justify-start">
          <span className='font-bold text-xl capitalize'>payroll #{allWorkers[0]?.payment_id}</span>
          <Image src={InfoIconSvg} priority alt='' />
          <span className='deductions-header'>{headers?.project_name}</span>
          <span className='deductions-header'>{headers?.start_date} - {headers?.end_date}</span>
          <span className='deductions-header'>{payee.length > 0 ? payee[0]?.names : ''}</span>

        </div>
        <div className='h-fit flex flex-col gap-2.5 bg-white px-2.5 py-5 rounded-md'>
          <span className='heading-3'>Workers list</span>
          <div className='bg-[#DFF3FB] flex items-center justify-between  gap-2.5 py-1 px-2 w-full h-10 rounded-md'>
            <span className='deductions-column'>Name</span>
            <span className='deductions-column'>MoMo Number</span>
            <span className='deductions-column'>Shifts</span>
            <span className='deductions-column'>Amount</span>
          </div>
          {allWorkers.map((item, index) =>
            <div key={index} className='flex items-start justify-between gap-2.5 px-0.5 py-1 w-full h-16 !important'>
              <span className='deductions-input'>
                {capitalizeAll(item.worker_name)}
              </span>
              <span className='deductions-input'>
                {item?.phone_number}
              </span>
              <span className='deductions-input'>
                {parseInt(item?.total_shifts)}
              </span>
              <span className='flex gap-3 items-center justify-between px-3 py-6 w-full h-10 rounded-md border border-[#d4d7d9]'
              >
                {item?.deduction_amount && toMoney(item?.deduction_amount)}
              </span>
            </div>)}
        </div>
      </div>
    </>
  )
}

DeductionList.getLayout = function getLayout(page) {
  return <DeductionsLayout>{page}</DeductionsLayout>;
};
