import React from "react";
import { StyledPaymentsPageHeader } from "../../../Header/PaymentsPageHeader.styled";
import { PageHeader } from "antd";
import { InfoIconSvg } from "../../../Icons/CustomIcons";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";

export default function InvoiceHeader(props) {
  const router = useRouter();
  const Title = ({ type }) => (
    <h1 style={{ fontSize: "20px" }}>{props?.invoice}</h1>
  );
  return (
    <StyledPaymentsPageHeader>
      <div className="main">
        <div className="header">
          <div>
            <PageHeader
              onBack={() => {
                router.back();
              }}
              subTitle={<Title />}
              backIcon={
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "7px",
                    color: "#798C9A",
                  }}
                >
                  <Icon icon="material-symbols:arrow-back-rounded" width="25" />
                  <h3
                    style={{
                      marginTop: "5px",
                      color: "#798C9A",
                    }}
                  >
                    Back
                  </h3>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </StyledPaymentsPageHeader>
  );
}
