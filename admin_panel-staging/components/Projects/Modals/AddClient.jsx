import { Button, Modal } from "antd";
import React from "react";
import StyledEditor from "../../Settings/Modals/StyleEditor";
import { Icon } from "@iconify/react";
import ProgressDIsplay from "../Steps";
import { StyledAddClient } from "./StyledAddClient.styled";
import { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import { useEffect } from "react";
import { retriveUserDataFromLocalStorage } from "../../../helpers/auth";

export default function AddClient(props) {
  const [payload, setPayload] = useState({
    company_name: "",
    country_id: 0,
    industry_type_id: 0,
    province_id: 0,
    company_phone_number: "",
    company_email: "",
    company_logo_url: "",
    user_first_name: "",
    user_last_name: "",
    user_email: "",
    user_phone_number: "",
    user_title: "",
    createdBy_name: "test",
    createdBy_email: "test@mail.com",
  });

  const close = () => {
    console.log("close");
    setStep(0);
    props.setOpenClientModal(false);
  };
  const [step, setStep] = useState(0);

  const ModalTitle = () => (
    <StyledEditor>
      <h1 className="import modalTitle">New Client</h1>
    </StyledEditor>
  );
  const changeStep = () => {
    setStep(step + 1);
    console.log(payload);
  };
  useEffect(() => {
    retriveUserDataFromLocalStorage().then((data) => {
      setPayload({ ...payload, createdBy_name: data.firstname + " " + data.lastname, createdBy_email: data.email });
    });
  }, []);

  return (
    <StyledAddClient>
      <Modal
        centered
        title={<ModalTitle />}
        okText="Yes"
        cancelText="No"
        open={props.addClient}
        onOk={close}
        onCancel={close}
        // closeIcon={<Icon icon="fe:close" className="close" />}
        bodyStyle={{
          height: 680,
        }}
        width={820}
        footer={null}
      >
        <StyledAddClient>
          <div className="progress">
            <ProgressDIsplay step={step} />
          </div>
          {step === 0 ? (
            <div>
              <Step1 changeStep={changeStep} close={close} payload={payload} setPayload={setPayload} />
            </div>
          ) : (
            <div>
              <Step2 getModalData={props.getModalData} close={close} payload={payload} setPayload={setPayload} />
            </div>
          )}
        </StyledAddClient>
      </Modal>
    </StyledAddClient>
  );
}
