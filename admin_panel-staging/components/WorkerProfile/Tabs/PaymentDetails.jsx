import { Icon } from "@iconify/react";
import React, { useState } from "react";
import { CheckCircleFilled, CloseCircleTwoTone, CheckCircleTwoTone } from "@ant-design/icons"
import { Button, Empty, Tooltip } from "antd";
import { EditPaymentMethods } from "../Modals/EditPaymentMethods";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { accessSubpageSubEntityRetrieval } from "@/utils/accessLevels";
import { useRouter } from "next/router";
import { set } from "idb-keyval";

const PaymentDetails = ({ paymentMethods, setPaymentMethodUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userProfile } = useUserAccess();

  const router = useRouter();
  const showModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <EditPaymentMethods isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} paymentMethods={paymentMethods} setPaymentMethodUpdated={setPaymentMethodUpdated} />
      {!paymentMethods || paymentMethods?.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <Empty description="No payments method found for this worker, please add them." className="flex flex-col items-center justify-center capitalize" >
            <Button
              type="primary"
              className="primaryBtn"
              onClick={showModal}
              icon={<Icon icon="mingcute:add-line" />}
            >
              Add Payment Method
            </Button>
          </Empty>
        </div>)}
      {paymentMethods && paymentMethods?.length > 0 && (
        <div className="flex flex-col gap-4 border border-primary rounded-lg w-fit p-4 m-4">
          <div className="flex justify-between">
            <h1 className="text-xl uppercase">Payment Methods</h1>

            {userProfile && accessSubpageSubEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'payment details', 'edit payment method') && (
              <Icon
                icon="material-symbols:edit-outline"
                height={20}
                className="text-sub-title cursor-pointer"
                onClick={showModal}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {paymentMethods?.map((item, index) =>
              <div key={index} className="flex flex-col gap-2 border border-primary rounded-lg p-2">
                <p className="flex gap-2">
                  <span className="text-md text-sub-title font-thin uppercase">
                    {item?.provider || "-"}
                  </span>
                  {item?.is_active && <Tooltip title="Primary payment method">
                    <span className="w-20 text-xs text-white text-center bg-green-1 p-1 rounded-full cursor-pointer">
                      PRIMARY
                    </span>
                  </Tooltip>}
                </p>
                <p className="flex gap-8">
                  <h2 className="text-md font-bold">Account number:</h2>
                  <span className="flex items-center justify-center text-md text-sub-title space-x-2">
                    <span> {item?.account_number}  </span> <Tooltip title={item?.account_verified_desc}>
                      {item?.is_verified === "green" ? <CheckCircleTwoTone twoToneColor="#52c41a" className=" cursor-pointer" /> : item?.is_verified === "blue" ? <CheckCircleTwoTone twoToneColor="#0063F8" className=" cursor-pointer" /> : <CloseCircleTwoTone twoToneColor="#F5222D" className=" cursor-pointer" />}
                    </Tooltip>

                  </span>
                </p>
                <p className="flex gap-8">
                  <h2 className="text-md font-bold">Account name:</h2>
                  <span className="text-md text-sub-title capitalize">{item?.account_name || "-"}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentDetails;
