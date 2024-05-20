import { Layout, Menu } from "antd";
import { useRouter } from "next/router";
import * as React from "react";
import { useState } from "react";
import Icon, { RightOutlined, LeftOutlined } from "@ant-design/icons";

import {
  HomeSvg,
  PaySvg,
  SettingSvg,
  WorkSvg,
  ProjectsSvg,
} from "../../Icons/CustomIcons";
import { StyledSideBar } from "./SideBar.styled";
import { useUserAccess } from "../DashboardLayout/AuthProvider";
import { accessRouteRetrieval } from "@/utils/accessLevels";

const { Sider } = Layout;

const HomeIcon = (props) => <Icon component={HomeSvg} {...props} />;
const WorkIcon = (props) => <Icon component={WorkSvg} {...props} />;
const SettingsIcon = (props) => <Icon component={SettingSvg} {...props} />;
const PayIcon = (props) => <Icon component={PaySvg} {...props} />;

const ProjectsIcon = (props) => <Icon component={ProjectsSvg} {...props} />;

const { SubMenu } = Menu;

const CustomSubMenu = (props) => {
  const { children, ...rest } = props;
  return (
    <SubMenu {...rest} theme="light" defaultselectedKeys={[]}>
      {children}
    </SubMenu>
  );
};
const SideBar = () => {
  const [collapsed, setCollapsed] = useState(true);

  // auth context
  const { userProfile } = useUserAccess();

  const router = useRouter();

  const onClick = (e) => {
    router.push({
      pathname: e.key,
      query: e.key === "/finance" ? { tab: "1" } : {},
    });
  };

  const menuListGeneral = [
    {
      title: "Dashboard",
      icon: HomeIcon,
      link: "/",
    },
    userProfile && accessRouteRetrieval(userProfile?.user_access, "project")
      ? {
          title: "Projects",
          icon: ProjectsIcon,
          link: "/projects",
        }
      : null,
    userProfile && accessRouteRetrieval(userProfile?.user_access, "workforce")
      ? {
          title: "Workforce",
          icon: WorkIcon,
          children: [
            userProfile &&
              accessRouteRetrieval(
                userProfile?.user_access,
                "workforce",
                "workers"
              ) && {
                label: "Workers",
                key: "/workforce",
                icon: WorkIcon,
              },
            userProfile &&
              accessRouteRetrieval(
                userProfile?.user_access,
                "workforce",
                "leaderboard"
              ) && {
                label: "Leaderboard",
                key: "/workforce/leaderboard",
                icon: WorkIcon,
              },
          ].filter(Boolean),
        }
      : null,
    userProfile && accessRouteRetrieval(userProfile?.user_access, "finance")
      ? {
          title: "Finance",
          icon: PayIcon,
          children: [
            userProfile &&
            accessRouteRetrieval(userProfile?.user_access, "finance", "payment")
              ? {
                  label: "Payments",
                  key: "/finance/payments",
                  icon: PayIcon,
                }
              : null,
            userProfile &&
            accessRouteRetrieval(userProfile?.user_access, "finance", "taxes")
              ? {
                  label: "Taxes",
                  key: "/finance/taxes",
                  icon: PayIcon,
                }
              : null,
            userProfile &&
            accessRouteRetrieval(userProfile?.user_access, "finance", "wallet")
              ? {
                  label: "Wallet",
                  key: "/finance/wallet",
                  icon: PayIcon,
                }
              : null,
            // userProfile && accessRouteRetrieval(userProfile?.user_access, 'finance', 'billing') ?
            //   {
            //     label: "Billing",
            //     key: "/finance/billing",
            //     icon: PayIcon,
            //   } : null
          ].filter(Boolean),
        }
      : null,
    userProfile && accessRouteRetrieval(userProfile?.user_access, "settings")
      ? {
          title: "Settings",
          icon: SettingsIcon,
          link: "/settings",
        }
      : null,
  ].filter(Boolean);

  const menuList = menuListGeneral.map((item, index) => ({
    key: item.link,
    icon: <item.icon />,
    label: item.title,
    children: item?.children,
  }));

  // Get the primary route from the router pathname
  const getPrimaryRoute = () => {
    // Remove any query strings from the pathname
    const primaryLink = router.pathname.replace(/(\?.*)|(\#.*)/, "");
    return primaryLink;
  };

  return (
    <StyledSideBar>
      <Layout>
        <Sider
          breakpoint="lg"
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={"100"}
          // onBreakpoint={(broken) => {
          //   // console.log(broken);
          // }}
          // onCollapse={(collapsed, type) => {
          //   // console.log(collapsed, type);
          // }}
          className="aside"
        >
          <div className="h-fit bg-[#F2FAFD] shadow-r-lg space-y-11">
            <Menu
              onClick={onClick}
              // style={{ color: "black", fontSize: "16px", minHeight: "100%" }}
              subMenuOpenDelay={0.2}
              theme="none"
              mode="inline"
              defaultSelectedKeys={["1"]}
              selectedKeys={[getPrimaryRoute()]}
              // items={menuList}
              className="h-fit border-b-0"
            >
              <>
                {menuList.map((item, index) => (
                  <>
                    {item.key && (
                      <Menu.Item
                        key={item?.key}
                        icon={item.icon}
                        className={`menuItem text-base ${
                          router.pathname === item?.key ||
                          `/${router.pathname.split("/")[1]}` === item?.key
                            ? "menuItemActive"
                            : ""
                        }`}
                      >
                        {item.label}
                      </Menu.Item>
                    )}
                    {item.children && (
                      <CustomSubMenu
                        key={`sub${index}`}
                        icon={item.icon}
                        title={item.label}
                        className={`menuItem text-base ${
                          router.pathname === `/${item.label.toLowerCase()}` ||
                          `/${router.pathname.split("/")[1]}` ===
                            `/${item.label.toLowerCase()}`
                            ? "menuItemActive"
                            : ""
                        }`}
                      >
                        {item?.children?.map((child, index) => (
                          <Menu.Item
                            key={child?.key}
                            icon={child?.icon}
                            className={`menuItem text-sm ${
                              router.pathname === child?.key
                                ? "menuItemActive"
                                : ""
                            }`}
                          >
                            {child?.label}
                          </Menu.Item>
                        ))}
                      </CustomSubMenu>
                    )}
                  </>
                ))}
              </>
            </Menu>
            <div className="bg-[#F2FAFD] border-none text-center flex justify-end">
              {collapsed ? (
                <RightOutlined
                  onClick={() => setCollapsed(!collapsed)}
                  style={{ color: "#ABB5BA" }}
                />
              ) : (
                <LeftOutlined
                  onClick={() => setCollapsed(!collapsed)}
                  style={{ color: "#ABB5BA" }}
                />
              )}
            </div>
          </div>
        </Sider>
      </Layout>
    </StyledSideBar>
  );
};

export default SideBar;
