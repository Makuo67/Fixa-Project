import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api";
import queryString from "query-string";

export const getAllPayments = async (filters) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `/payments/all_payments` + filters,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e.message);
  }
};

export const getPaymentDetails = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(`/payments/details/${id}`, {
      headers: { authorization },
    });
    return response.data.data;
  } catch (error) {
    console.log(error.message);
  }
};

export const createPayroll = async (data) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(`/payments/payroll`, data, {
      headers: { authorization },
    });
    return response.data;
  } catch (error) {
    console.log(error.message);
  }
};

export const getPaymentTypes = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(`/payment-types`, {
      headers: { authorization },
    });
    return response.data;
  } catch (error) {
    console.log(error.message);
  }
};

export const deletePayment = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.delete(`/payments/${id}`, {
      headers: { authorization },
    });
    return response.data;
  } catch (error) {
    console.log(error.message);
  }
};

export const sendMail = async (user_email, attachment) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(
      `/emails/sendMail`,
      {
        from: `${user_email}`,
        emails: [
          // "david.neza@fixarwanda.com",
          // "jean.paul@fixarwanda.com",
          // "willy@fixarwanda.com",
          "florien.niyongabo@fixarwanda.com",
        ],
        subject: ` shift was declined`,
        template: "corporate-email",
        text: `Hello, there is a discrepancy in the  shift attendance of  reviewed by `,
        // attachments: [
        //   {
        //     content: attachment,
        //     filename: attachment.name,
        //     type: "application/csv",
        //     disposition: "attachment",
        //   },
        // ],
      },
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error.message);
  }
};
