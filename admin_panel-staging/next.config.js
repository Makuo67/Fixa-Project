/** @type {import('next').NextConfig} */

// const withAntdLess = require("next-plugin-antd-less");

module.exports = {
  // antd config
  // lessVarsFilePath: "./styles/antd-variables.less",
  // cssLoaderOptions: {},


  // other config
  reactStrictMode: false,
  // swcMinify: true,
  webpack5: true,
  images: {
    disableStaticImages: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ["fixaimages.s3.eu-central-1.amazonaws.com","wallpapers.com","upload.wikimedia.org","datadumpfixa.s3.eu-central-1.amazonaws.com","adminpanel.fixarwanda.com","rwanda.adhicorp.com","igihe.com"],
  },
};
