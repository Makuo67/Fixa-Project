import Script from "next/script";
import Pusher from "pusher-js";
import NextNProgress from "nextjs-progressbar";
import React from "react";
import { Provider } from "react-redux";
import { createGlobalStyle } from "styled-components";
import { ConfigProvider } from "antd";

import store from "../redux/store";
import "react-toastify/dist/ReactToastify.css";
import "../globals.css";
import AuthProvider from "../components/Layouts/DashboardLayout/AuthProvider";
import { PusherProvider } from "../context/PusherContext";
import ErrorBoundary from "@/components/Error/ErrorBoundary";

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  forceTLS: true,
});

const GlobalStyles = createGlobalStyle`
:root {
  --primary: #${process.env.NEXT_PUBLIC_PRIMARY_COLOR};
  --secondary: #${process.env.NEXT_PUBLIC_SECONDARY_COLOR};
  --tertiary: #${process.env.NEXT_PUBLIC_TERTIARY_COLOR};
  --button-color: #${process.env.NEXT_PUBLIC_BUTTON_COLOR};
  --avatar: #fde3cf;
  --black: #000;
}
`
function MyApp({ Component, pageProps, }) {
  const getLayout = Component.getLayout || ((page) => page);
  return (
    <ErrorBoundary>
      <PusherProvider pusher={pusher}>
        <AuthProvider>
          <ConfigProvider
            theme={{
              token: {
                colorInfo: '#00A1DE',
              },
              components: {
                Button: {
                  colorPrimary: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Input: {
                  colorPrimary: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                InputNumber: {
                  colorPrimary: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Select: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Radio: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Checkbox: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                },
                DatePicker: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Tabs: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Steps: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Spin: {
                  colorPrimary: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Pagination: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Upload: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Progress: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Dropdown: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Tag: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Result: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                },
                Upload: {
                  colorPrimary: '#00A1DE',
                  colorPrimaryHover: '#00A1DE',
                  algorithm: true, // Enable algorithm
                }
              },
            }}
          >
            <Provider store={store}>
              <Script
                type="text/javascript"
                src="https://www.apispreadsheets.com/import.js"
                id="apispreadsheets-import"
              ></Script>

              {/* <!-- Google tag (gtag.js) --> */}
              <Script async src="https://www.googletagmanager.com/gtag/js?id=G-KMG42SBG6R" />
              <Script id="google-analytics">
                {` window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-KMG42SBG6R', {'send_page_view': true });`}
              </Script>
              <GlobalStyles />
              <NextNProgress height={5} color="#ffffff" />
              {getLayout(<Component {...pageProps} />)}
            </Provider>
          </ConfigProvider>
        </AuthProvider>
      </PusherProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
