import { Button, Modal } from "antd";
import { useRouter } from "next/router";
import { StyledConfirmationModal } from "../../../Modals/PaymentsModals/ConfirmationModal.styled";

const Confirm = (props) => {
  const router = useRouter();

  const closeModal = () => {
    props.closeConfirm();
  };

  return (
    <>
      <StyledConfirmationModal>
        <Modal
          centered
          okText="Yes"
          cancelText="No"
          // closeIcon={<Icon icon="fe:close" className="close" />}
          open={props.openConfirmModal}
          onOk={props.handleOk}
          onCancel={props.closeConfirm}
          styles={{
            body: {
              height: 130,
            }
          }}
          footer={null}
        >
          <div style={{ paddingTop: "12px" }}>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "500",
                fontSize: "18px",
                padding: "10px 2px",
              }}
            >
              {props.message}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                padding: "10px 20px 0px 2px",
              }}
            >
              <Button
                style={{
                  background: "white",
                  border: "1px solid #798C9A",
                  width: "fit-content",
                  height: "40px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  lineHeight: "22px",
                  color: "#2C3336",
                  fontWeight: "500",
                  filter: "drop-shadow(0px 2px 0px rgba(0, 0, 0, 0.043))",
                }}
                onClick={closeModal}
              >
                {props.cancelText}
              </Button>
              <Button
                style={{
                  background:
                    props.buttonText === "Activate" ? "#00A1DE" : "#F5222D",

                  boxShadow: " 0px 0px 5px rgba(0, 0, 0, 0.2)",
                  width: "fit-content",
                  height: "40px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  lineHeight: "22px",
                  color: "white",
                  fontWeight: "500",
                  boxShadow: "0px 2px 0px rgba(0, 0, 0, 0.043)",
                }}
                loading={props.loading}
                onClick={props.handleOk}
              >
                {props.buttonText}
              </Button>
            </div>
          </div>
        </Modal>
      </StyledConfirmationModal>
    </>
  );
};
export default Confirm;
