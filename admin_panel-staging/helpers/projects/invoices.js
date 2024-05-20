import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api";
import AWS from "aws-sdk";
import queryString from "query-string";
import { notification } from "antd";

/* ==== Configure AWS object */
AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

export const getAllInvoices = async (id, query) => {
  const newQuery = {
    status: query.invoice_status,
    date_gte: query.invoice_added_on_gte,
    date_lte: query.invoice_added_on_lte,
  };

  try {
    let query_string = "&" + queryString.stringify(newQuery, { encode: false });

    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `new-invoices/app?_limit=-1&project_id=${id}&_sort=id:DESC` + query_string,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

export const singleInvoice = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(`new-invoices/app/${id}`, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const updateInvoiceStatus = async (id, status) => {
  const payload = {
    status: status,
  };

  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.put(`new-invoices/app/${id}`, payload, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

export const downloadFile = async (key) => {
  try {
    const s3 = new AWS.S3();
    const signedUrlExpireSeconds = 60 * 5;
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_INVOICE_CERTIFICATE_BUCKET_NAME,
      Key: key,
      Expires: signedUrlExpireSeconds,
    };

    // check if the object exists in the bucket
    await s3
      .headObject({
        Key: key,
        Bucket: process.env.NEXT_PUBLIC_AWS_INVOICE_CERTIFICATE_BUCKET_NAME,
      })
      .promise();
    const url = s3.getSignedUrl("getObject", params);
    window.open(url, "_blank");
  } catch (error) {
    if (error.name === "NotFound") {
      console.error("File not found");
      notification.error({ message: "Error", description: "File not found" });
    } else {
      console.error("Error in downloading file");
      notification.error({
        message: "Error",
        description: "Error in downloading file, Try again!",
      });
    }
  }
};
export const createInvoice = async (payload, status) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    await fixaAPI
      .post(`new-invoices/app/`, payload, {
        headers: { authorization },
      })
      .then(() => {
        if (status === "unpaid") {
          notification.success({
            message: "Success",
            description: "Invoice sent successfuly",
          });
        } else {
          notification.success({
            message: "Success",
            description: "Invoice added successfuly",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        notification.error({
          message: `Failed`,
          description: `${err?.message}`,
        });
      });
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

export const updateInvoice = async (payload, id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    await fixaAPI
      .put(`new-invoices/app/${id}`, payload, {
        headers: { authorization },
      })
      .then(() => {
        notification.success({
          message: "Success",
          description: "Invoice sent successfuly",
        });
      })
      .catch((err) => {
        console.log(err);
        notification.error({
          message: `Failed`,
          description: `${err?.message}`,
        });
      });
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

export const editInvoice = async (payload, id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    await fixaAPI
      .put(`new-invoices/${id}`, payload, {
        headers: { authorization },
      })
      .then(() => {
        notification.success({
          message: "Success",
          description: "Invoice edited successfuly",
        });
      })
      .catch((err) => {
        console.log(err);
        notification.error({
          message: `Failed`,
          description: `${err?.message}`,
        });
      });
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

// url => $baseurl/new-invoices/update (POST)
//    body: {"amount":"","invoice_id":0} 

/* ============== REGISTER PAYMENT ============== */
export const registerPayment = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`new-invoices/update`, payload, {
      headers: { authorization },
    });
    if (responses?.data) {
      notification.success({
        message: "SUCCESS",
        description: "Payment Registered Successfully.",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again.",
      });
    } else if (err?.response?.data && err?.response?.data?.error) {
      notification.error({
        message: `${err?.response?.data?.error}`,
        description: "Payment Registration Failed.",
      });
    }
    else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Payment Registration Failed!",
      });
    }

    return responses;
  }
};