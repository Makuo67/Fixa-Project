import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { retriveAuthTokenFromLocalStorage, isUserLoggedIn } from "../../../helpers/auth";
import Header from "../../Header/Header";
import { Content } from "../../shared/Content";
import BreadCrumbs from "../BreadCrumbs/BreadCrumbs";
import SideBar from "../Sidebar/SideBar";
import { StyledLayout } from "./Layout.styled";
import Head from "next/head";
import { Divider } from "antd";

const Layout = ({ children, isPayment, isSinglePayment }) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  const router = useRouter();

  useEffect(() => {
    isUserLoggedIn().then((res) => {
      if (!res) {
        router.push("/login");
      } else {
        retriveAuthTokenFromLocalStorage()
          .then((res) => {
            setLoading(false);
            setToken(res);
          })
          .catch((error) => {
            console.log("TOKEN ERROR ===>", error);
          });
      }
    });
  }, []);

  if (loading) {
    return (
      <>
        <Head>
          <title>{process.env.COMPANY_TITLE}</title>
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
            key="title"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {/* <div className="loader">
          <Spin size="small" style={{ transform: "scale(1.5)" }} />
        </div> */}
      </>
    );
  } else {
    return (
      <StyledLayout isPayment={children?.type?.name === "Payments"}>
        <Header />
        <div>
          <div className="content-layout h-[80vh]">
            <SideBar />

            <Content isWorkerProfile={children?.type?.name == "WorkerProfile"}>
              <BreadCrumbs
                isWorkerProfile={children.type.name == "WorkerProfile"}
                isPayment={isPayment}
                isSinglePayment={isSinglePayment}
              />
              <Divider />
              {children}
            </Content>
          </div>
        </div>
      </StyledLayout>
    );
  }
};
export default Layout;
