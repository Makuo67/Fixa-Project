import { Button, Modal, Result, Typography } from "antd";
import { useRouter } from "next/router";
import { useState } from "react";
import NumberFormat from "../../shared/NumberFormat";
import { StyledModal } from "../PayrollTable.styled";
const { Title } = Typography;

const SummaryModal = ({ amount_disbursed, total_workers }) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(true);
  return (
    <Modal centered visible={modalVisible} width={500} footer={null} onCancel={() => setModalVisible(false)}>
      <StyledModal>
        <p>Total amount to be disbursed:</p>
        <Title level={1}>
          <NumberFormat value={amount_disbursed} /> RWF
        </Title>
        <Result
          status="success"
          title="All done!"
          subTitle={`Disbursed money for a total of ${total_workers} workers.`}
          extra={[
            <Button onClick={() => router.push("/")} key="back" type="primary" shape="round" size="large">
              Return to Homescreen
            </Button>,
          ]}
        />
      </StyledModal>
    </Modal>
  );
};

export default SummaryModal;
