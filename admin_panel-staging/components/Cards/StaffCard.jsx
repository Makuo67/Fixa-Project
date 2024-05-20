import { capitalizeAll } from "../../utils/capitalizeAll";
import { Icon } from "@iconify/react";

const StaffCard = ({ staff, onRemove, index }) => {
  return (
    <div className='w-full h-[70px] bg-white rounded-md border border-solid border-primary flex items-center justify-between px-3'>
      <div className='flex flex-col justify-start'>
        <h1 className='text-base font-medium text-gray-1'>{capitalizeAll(staff.job_title_name)}</h1>
        <p className='text-sub-title text-sm font-medium'>{staff.email ? staff.email : "XXXXXXX"}</p>
      </div>
      <div
        className='flex items-center p-[2px] rounded border-bder-red w-[27px] h-[27px] border border-solid cursor-pointer'
        onClick={()=> onRemove(index)}
      >
        <Icon icon="la:trash-alt-solid" width={20} height={20} className='text-bder-red' />
      </div>
    </div>
  );
}

export default StaffCard;