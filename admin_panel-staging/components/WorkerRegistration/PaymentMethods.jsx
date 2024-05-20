import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { PlusOutlined } from "@ant-design/icons";
import { Content } from "../shared/Content";
import { itemStyles } from "../Forms/WorkerRegistrationForm";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import { Icon } from "@iconify/react";
import { transformPaymentsInfoObject } from "@/utils/transformObject";
import { clearIndexDB } from "@/utils/indexDBUtils";
import { get } from "idb-keyval";
import { decodeJSONBase64 } from "@/utils/decodeBase";
import { getCompanyPaymentMethods, updateWorkerPaymentMethods } from "@/helpers/payment-methods/payment-methods";
import { PaymentMethods as PymntMethods } from "../shared/PaymentMethods";
import { findPaymentMethodLogo } from "@/constants/paymentMethodsLogos";
import Image from "next/image";

export const PlaceHolder = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-full w-8 h-8 bg-gray-1"></div>
      <h1>{"Select provider"}</h1>
    </div>
  );
};

export const renderOption = (option) => {
  return (
    <div className="flex items-center gap-4">
      <div className='rounded-full w-8 h-8'>
        <Image src={findPaymentMethodLogo(option)} alt={option.label} width={50} height={50} />
      </div>
      <span>{option.label}</span>
    </div>
  );
};

export const PaymentMethods = ({ handleBackStep, workerRegisteredId }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const {  userProfile } = useUserAccess();
  const { user_access } = userProfile;

  const [btnLoading, setBtnLoading] = useState(false);
  const [defaultPayment, setDefaultPayment] = useState({
    account_number: "",
  });

  useEffect(() => {
    get("contactFormData").then((data) => {
      if (data) {
        const formInfo = decodeJSONBase64(data);
        setDefaultPayment({
          ...defaultPayment,
          account_number: formInfo?.personal_contacts?.phone_number,
        });
      }
    });
  }, []);

  async function handleSave(payment_methods) {
    // console.log('Saving ---->',payment_methods);
    const contactDetails = {
      payment_methods: payment_methods,
    };

    setBtnLoading(true);

    await updateWorkerPaymentMethods(workerRegisteredId, contactDetails)
      .then((response) => {
        if (
          response.status == "success" &&
          Object.keys(response?.data).length > 0
        ) {
          clearIndexDB("regForm");
          clearIndexDB("tradeRateForm");
          clearIndexDB("contactFormData");
          setBtnLoading(false);
          router.replace("/workforce");
          // setCompanyStatusLoading(true)
        } else {
          setBtnLoading(false);
        }
      })
      .catch((error) => {
        console.log("errors", error);
        setBtnLoading(false);
      });
  }
  return (
    <Content>
      <div className="flex flex-col items-center">
        <div className="w-1/2 space-y-8">
          <h1 className="text-xl md:text-2xl font-medium text-black text-center">
            Payment Methods{" "}
          </h1>
          <div>
            <PymntMethods handleCancel={handleBackStep} handleSave={handleSave} cancelText={'Back'} saveLoading={btnLoading} paymentMethods={[]} />
          </div>
        </div>
      </div>
    </Content>
  );
};
