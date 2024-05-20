import { Input, Modal, Tag, notification } from "antd";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { sendSMS } from "../../redux/actions/bulk-actions.actions";
import {
  buildExportList,
  fetchAllWorkForce,
  getAbsentValues,
  getPhoneNumbers,
} from "../../helpers/workforce";
const { htmlToText } = require("html-to-text");

const ReactRTE = dynamic(() => import("../shared/Editor"), {
  ssr: false,
});

const MAX_CHARS = 160;

const SendMessageModal = (props, { }) => {
  const workers = useSelector((state) => state.workforce.list);
  const [message, setMessage] = useState("");
  const [messageLength, setMessageLength] = useState(0);
  var smsLength = 0;
  const [messageRecievers, setMessageRecievers] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [workerProfilePhone, setWorkerProfilePhone] = useState(null);
  var message_reciepients = 0;

  const router = useRouter();
  const query = router.query;

  useEffect(() => {
    if (!props?.isProfile) {
      buildExportList(query).then((response) => {
        setMessageRecievers(props.workers);
        setFiltersApplied(true);
        setWorkerProfilePhone(props.phoneNumber);
      });
    }
  }, [router.query, props]);
  var worker_phones = [];

  if (props.phoneNumber) {
    worker_phones.push(`+25${props.phoneNumber}`);
  } else {
    if (props.selected_workers?.length !== 0) {
      smsLength = props.selected_workers?.length;
      for (var i = 0; i < messageRecievers?.length; i++) {
        for (var j = 0; j < props.selected_workers?.length; j++) {
          if (messageRecievers[i].worker_id === props?.selected_workers[j]) {
            worker_phones.push(`+25${messageRecievers[i].phone_number}`);
          }
        }
      }
    }
  }

  const validNumbers = worker_phones.filter((phone) => {
    if (
      phone?.length === 13 &&
      phone !== "null" &&
      typeof phone !== "undefined"
    ) {
      return phone;
    }
  });
  message_reciepients = validNumbers;

  const dispatch = useDispatch();
  const openNotificationSuccess = () => {
    notification.success({
      message: "Success",
      description: `${props.title
        ? "Message sent"
        : `Message sent to ${message_reciepients.length} worker${props.selected_workers.length > 1 ? "s" : ""
        }!`
        }`,
    });
  };

  const openNotificationError = () => {
    notification.error({
      message: "Error",
      description: `Could not send a message to ${props?.selected_workers?.length
        } worker${props?.selected_workers?.length > 1 ? "s" : ""}!`,
    });
  };

  const handleCancel = () => {
    props.hideModal();
  };
  const handleOk = async () => {
    if (htmlToText(message.toString("html")) === "") {
      notification.error({
        message: "Error",
        description: `Message cannot be empty`,
      });
    } else {
      dispatch(
        sendSMS(worker_phones, htmlToText(message.toString("html")))
      ).then((data) => {
        if (data.status == "success") {
          props.clearSelection();
          openNotificationSuccess();
        } else {
          openNotificationError();
        }
      });
      props.hideModal();
    }
  };
  const shouldBeVisible = props.isVisible;
  const onMessageChange = (e) => {
    setMessageLength(htmlToText(e.toString("html")).length);
    setMessage(e);
  };

  return (
    <Modal
      title="Send Message"
      okText="Send"
      visible={shouldBeVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      okButtonProps={{
        style: {
          height: "40px",
          background: "var(--primary)",
          borderRadius: "5px",
          border: "none",
          "&:hover": {
            opacity: "0.75",
            color: "var(--secondary)",
          },
        }
      }}
      cancelButtonProps={{
        style: {
          height: "40px",
          borderRadius: "5px",
          // color: "var(--button-color)",
          color: "var(--primary)",
          border: "1px solid var(--primary)",
          "&:hover": {
            color: "var(--primary)",
          }
        },
      }}

    >
      {props.title ? (
        <p className="text-gray">{props.title}</p>
      ) : (
        <p className="text-gray">
          Send message to {smsLength} worker
          {smsLength > 1 && "s"}:
        </p>
      )}
      <ReactRTE message={message} setMessage={(e) => onMessageChange(e)} />
      <Tag
        color={messageLength <= MAX_CHARS ? "green" : "red"}
        style={{ marginTop: 20 }}
      >
        {messageLength}/{MAX_CHARS} chars
      </Tag>
      {parseInt(messageLength / MAX_CHARS) + 1 < 2 ? (
        <Tag
          color={messageLength <= MAX_CHARS ? "blue" : "red"}
          style={{ marginTop: 20 }}
        >
          1 message sent
        </Tag>
      ) : (
        <Tag
          color={messageLength <= MAX_CHARS ? "blue" : "red"}
          style={{ marginTop: 20 }}
        >
          {parseInt(messageLength / MAX_CHARS) + 1} messages sent
        </Tag>
      )}
    </Modal>
  );
};
export default SendMessageModal;
