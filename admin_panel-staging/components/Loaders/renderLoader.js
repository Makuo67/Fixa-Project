import { Spin } from "antd";
import Head from "next/head";

const RenderLoader = () => (
  <>
    <Head>
      <title>Fixa admin panel</title>
      <meta
        name="viewport"
        content="initial-scale=1.0, width=device-width"
        key="title"
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className="loader">
      <Spin size="small" style={{ transform: "scale(1.5)" }} />
    </div>
  </>
);

export default RenderLoader;
