import { Tabs } from "antd";
import PersonalDetails from "./PersonalDetails";
import WorkHistory from "./WorkHistory";
import { StyledProfileTabs } from "./ProfileTabs .styled";
import PaymentHistory from "./PaymentHistory";

const ProfileTabs = () => {
  // const toggleClass = () => {
  //   // setActive(!isActive);
  //   console.log("tab clieck ----");
  // };
  return (
    <>
      <StyledProfileTabs>
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane
            tab="DETAILS"
            key="1"
            style={{ height: "fit-content" }}
          >
            <PersonalDetails />
          </Tabs.TabPane>
          <Tabs.TabPane tab="WORK HISTORY" key="2">
            <WorkHistory />
          </Tabs.TabPane>
          <Tabs.TabPane tab="PAYMENT HISTORY" key="3">
            <PaymentHistory />
          </Tabs.TabPane>
        </Tabs>
      </StyledProfileTabs>
    </>
  );
};

export default ProfileTabs;
