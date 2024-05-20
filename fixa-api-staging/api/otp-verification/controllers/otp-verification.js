"use strict";
let Validator = require("validatorjs");
const { sendSMSToWorker } = require("../../service-providers/services/service-providers");
const { sendSmsCompasationToWorkers, authAdminLogin, authAdminLoginToken } = require("../services/otp-verification");
const { makePayment } = require("../../payments/services/payments");
const { updateDeductionTransactionWithPayrollWorkersOTP } = require('../../deductions-transactions/services/deductions-transactions');
const { getUserLevel } = require("../../user-admin-access/services/user-admin-access");

const OTP_LOGIN_ENABLED = process.env.OTP_LOGIN_ENABLED;
const api_key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
const utils = require("../../../config/functions/utils");
const Format = require('response-format');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  // verifying otp for payment
  async paymentVerifyOtp(ctx) {
    let response;
    try {
      let rules = {
        otp_type_id: "required|integer",
        otp_pin: "required|integer",
        payment_id: "required|integer",
        payment_method_id: "required|integer",
      };
      let user = ctx.state.user;
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, otp_pin, payment_id, payment_method_id } = ctx.request.body;
        const wallet_request = await strapi.query('wallet-request').findOne({ payment_method: payment_method_id });
        if (wallet_request && wallet_request.request_status === 'approved') {
          const opt_verification = await strapi.query("otp-verification").findOne({ is_paying: true, payment_id: payment_id, is_verified: false, is_runned: false, payment_method_id: payment_method_id });
          if (opt_verification) {
            if (opt_verification.pin_sent.toString() === otp_pin.toString()) {
              let new_body = {
                pin_received: otp_pin,
                is_verified: true,
              };
              await strapi.query("otp-verification").update({ id: opt_verification.id }, { is_running: true, is_runned: true });
              const payment = await strapi.query("payments").findOne({ id: payment_id });
              if (payment) {
                makePayment(payment, opt_verification.id, payment_method_id);
                await strapi.query("otp-verification").update({ id: opt_verification.id }, new_body);
                ctx.response.status = 200;
                response = {
                  status: "success",
                  data: `Payment initiated`,
                  error: "",
                  meta: "",
                };
              } else {
                ctx.response.status = 400;
                response = {
                  status: "failed",
                  data: `Payment not found`,
                  error: "",
                  meta: "",
                };
              }
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: `Incorrect OTP PIN`,
                error: "",
                meta: "",
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: `entry otp not found`,
              error: "",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Wallet not found or available",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: utils.getErrors(validation.errors),
          meta: "",
        };
      }
    } catch (error) {
      console.log('Error in paymentVerifyOtp()', error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // sending otp for payment
  async paymentSendOtp(ctx) {
    let response;
    try {
      let rules = {
        otp_type_id: "required|integer",
        payment_id: "required|integer",
        phone_number: "required|string",
        payment_method_id: "required|integer",
      };
      let user = ctx.state.user;
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, phone_number, payment_id, payment_method_id } = ctx.request.body;
        let otp_types = await strapi.query("opt-verification-types").findOne({ id: otp_type_id });

        if (phone_number.toString() === user.username.toString()) {

          if (otp_types && otp_types.type_name === "pay") {
            let company = await strapi.query('companies').find();
            if (company.length > 0) {
              if (company[0].payment_methods.length > 0) {
                let company_payment_ids = company[0].payment_methods.map((item) => item.payment_method.id.toString());
                if (company_payment_ids.includes(payment_method_id.toString())) {
                  // check for running payment 
                  let otp_verification_running = await strapi.query("otp-verification").findOne({ is_paying: true, payment_id: payment_id, is_running: true });
                  if (otp_verification_running) {
                    ctx.response.status = 400;
                    response = {
                      status: "failed",
                      data: "",
                      error: `Payment running, waiting for payment to finish`,
                      meta: "",
                    };
                  } else {
                    // check if wallet is available
                    let wallet_request = await strapi.query('wallet-request').findOne({ payment_method: payment_method_id });
                    if (wallet_request && wallet_request.request_status === 'approved') {

                      let opt_verification = await strapi.query("otp-verification").findOne({ is_paying: true, payment_id: payment_id, is_runned: false, payment_method_id: payment_method_id });
                      if (opt_verification) {

                        let check_payments = await strapi.query("payments").findOne({ id: payment_id });
                        if (check_payments && check_payments.status != "closed") {
                          const randomNumber =
                            Math.floor(Math.random() * 90000) + 10000;
                          // update pin and re-run sms sending
                          let opt_verification_body = {
                            pin_sent: randomNumber,
                            is_paying: true,
                            user_id: user.id,
                            time_created: new Date(),
                            payment_id: payment_id,
                            opt_verification_type_id: otp_types.id,
                            is_verified: false,
                            payment_method_id: payment_method_id
                          };

                          let phone_number_to_send = [phone_number];
                          let message = `Your OTP PIN is ${randomNumber}`;
                          await sendSMSToWorker(phone_number_to_send, message);

                          await strapi.query("otp-verification").update({ id: opt_verification.id }, opt_verification_body);
                          ctx.response.status = 200;
                          response = {
                            status: "success",
                            data: "",
                            error: `Pin Re-Sent successfully , check  your phone number starts with ${phone_number.substring(0, 5)}`,
                            meta: "",
                          };


                        } else {
                          ctx.response.status = 400;
                          response = {
                            status: "failed",
                            data: `SMS can't be sent because the payment is closed`,
                            error: "",
                            meta: "",
                          };
                        }
                      } else {

                        const randomNumber = Math.floor(Math.random() * 90000) + 10000;

                        let opt_verification_body = {
                          pin_sent: randomNumber,
                          is_sms: false,
                          is_running: false,
                          is_verified: false,
                          runned_by: `${user.firstname} ${user.lastname}`,
                          is_runned: false,
                          is_paying: true,
                          user_id: user.id,
                          time_created: new Date(),
                          payment_id: payment_id,
                          opt_verification_type_id: otp_types.id,
                          payment_method_id: payment_method_id
                        };
                        //To do send OTP-sms
                        let phone_number_to_send = [phone_number];
                        let message = `Your OTP PIN is ${randomNumber}`;
                        await sendSMSToWorker(phone_number_to_send, message);
                        await strapi.query("otp-verification").create(opt_verification_body);
                        ctx.response.status = 200;
                        response = {
                          status: "success",
                          data: "",
                          error: `Pin Sent successfully , check  your phone number starts with ${phone_number.substring(0, 5)}`,
                          meta: "",
                        };
                      }

                    } else {
                      ctx.response.status = 400;
                      response = {
                        status: "failed",
                        data: "",
                        error: "Wallet not found or available",
                        meta: "",
                      };
                    }

                  }

                } else {
                  ctx.response.status = 400;
                  response = {
                    status: "failed",
                    data: "",
                    error: `Payment method not available in company`,
                    meta: "",
                  };
                }
              } else {
                ctx.response.status = 400;
                response = {
                  status: "failed",
                  data: "",
                  error: `Company Payment methods not available`,
                  meta: "",
                };
              }
            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "",
                error: `Company not available`,
                meta: "",
              };
            }

          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "",
              error: `Otp type with id ${otp_type_id} not a pay type`,
              meta: "",
            };
          }

        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Phone number incorrect",
            meta: "",
          };
        }

      } else {
        // console.log('failed ',validation);
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: validation.errors,
          meta: "",
        };
      }
    } catch (error) {
      console.log('Error in paymentSendOtp()', error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async sendOtp(ctx) {
    let response;
    try {
      let rules = {
        otp_type_id: "required|integer",
        payment_id: "required|integer",
        phone_number: "required|string",
      };
      let user = ctx.state.user;
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, phone_number, payment_id } = ctx.request.body;
        let otp_types = await strapi
          .query("opt-verification-types")
          .findOne({ id: otp_type_id });
        // check for if phone number matches with user loggin phone number
        if (phone_number.toString() === user.username.toString()) {
          if (otp_types) {
            if (otp_types.type_name === "sms") {
              let opt_verification = await strapi
                .query("otp-verification")
                .findOne({ is_sms: true, payment_id: payment_id });

              if (!opt_verification) {
                const randomNumber = Math.floor(Math.random() * 90000) + 10000;

                let opt_verification_body = {
                  pin_sent: randomNumber,
                  is_sms: true,
                  is_running: false,
                  is_verified: false,
                  is_paying: false,
                  runned_by: `${user.firstname} ${user.lastname}`,
                  is_runned: false,
                  user_id: user.id,
                  time_created: new Date(),
                  payment_id: payment_id,
                  opt_verification_type_id: otp_types.id,
                };
                //To do send OTP-sms
                let phone_number_to_send = [phone_number];
                let message = `Your OTP is ${randomNumber}`;
                await sendSMSToWorker(phone_number_to_send, message);
                await strapi
                  .query("otp-verification")
                  .create(opt_verification_body);
                response = {
                  status: "Success",
                  data: `Pin Sent successfully , check  your phone number starts with ${phone_number.substring(
                    0,
                    5
                  )}`,
                  error: "",
                  meta: "",
                };
              } else {
                if (opt_verification.is_verified === false) {
                  const randomNumber =
                    Math.floor(Math.random() * 90000) + 10000;
                  // update pin and re-run sms sending
                  let opt_verification_body = {
                    pin_sent: randomNumber,
                    is_sms: true,
                    user_id: user.id,
                    time_created: new Date(),
                    payment_id: payment_id,
                    opt_verification_type_id: otp_types.id,
                  };
                  //To do send OTP-sms
                  let phone_number_to_send = [phone_number];
                  let message = `Your OTP PIN is ${randomNumber}`;
                  await sendSMSToWorker(phone_number_to_send, message);
                  await strapi
                    .query("otp-verification")
                    .update({ id: opt_verification.id }, opt_verification_body);
                  response = {
                    status: "Success",
                    data: `Pin Re-Sent successfully , check  your phone number starts with ${phone_number.substring(
                      0,
                      5
                    )}`,
                    error: "",
                    meta: "",
                  };
                } else {
                  response = {
                    status: "failed",
                    data: `SMS Already sent for this payment`,
                    error: "",
                    meta: "",
                  };
                }
              }
            }
          } else {
            response = {
              status: "failed",
              data: `Otp type with id ${otp_type_id} not found`,
              error: "",
              meta: "",
            };
          }
        } else {
          response = {
            status: "failed",
            data: `phone number incorrect`,
            error: "",
            meta: "",
          };
        }
      } else {
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      console.log(error);
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }

    return response;
  },
  async createOtpLogin(ctx) {
    let response;
    try {
      const rules = {
        otp_type_id: "required|integer",
        email: "required|string",
        password: "required|string",
      };
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, email, password } = ctx.request.body;
        const otp_types = await strapi.query("opt-verification-types").findOne({ id: otp_type_id });
        const levels = await strapi.query("users-levels").find();
        if (levels) {
          if (otp_types && otp_types.type_name === "login") {
            if (OTP_LOGIN_ENABLED.toString() === 'false') {
              const response_data = await authAdminLogin(email, password);
              if (response_data.status_code === 200) {
                const user_admins_access = await strapi.query("user-admin-access").findOne({ user_id: response_data.data.id });
                if (user_admins_access && parseInt(user_admins_access.user_level_id) >= 1 && user_admins_access.user_access) {
                  const user_level = levels.find((item) => parseInt(item.id) === parseInt(user_admins_access.user_level_id));
                  if (user_level.name === "level_1") {
                    const response_email = await authAdminLoginToken(email);
                    ctx.response.status = 200;
                    response = Format.success("Success", response_email.data);
                  } else {
                    const user_client_info = await getUserLevel(user_admins_access.user_id);
                    if (user_client_info.status && user_client_info.data.client_info) {
                      const response_email = await authAdminLoginToken(email);
                      ctx.response.status = 200;
                      response = Format.success("Success", response_email.data);
                    } else {
                      ctx.response.status = 400;
                      response = Format.badRequest("The user currently doens't have client association", []);
                    }
                  }
                } else {
                  ctx.response.status = 400;
                  response = Format.badRequest("The user currently lacks any access privileges.", []);
                }
              } else {
                ctx.response.status = 400;
                response = Format.badRequest(response_data.error_message, []);
              }
            } else {
              const response_data = await authAdminLogin(email, password);
              if (response_data.status_code === 200) {
                const user_admins_access = await strapi.query("user-admin-access").findOne({ user_id: response_data.data.id });
                if (user_admins_access && parseInt(user_admins_access.user_level_id) >= 1 && user_admins_access.user_access) {
                  const user_level = levels.find((item) => parseInt(item.id) === parseInt(user_admins_access.user_level_id));
                  if (user_level.name === "level_1") {
                    const randomNumber = utils.generateRandomNumber(5);
                    var data = {
                      from: "info@fixarwanda.com",
                      to: response_data.data.email,
                      subject: "OTP Login",
                      template: "otp-login",
                      "v:pin": `${randomNumber}`,
                      "v:subject": "Complete Sign in",
                    };
                    mailgun.messages().send(data);
                    const opt_verification_body = { pin_sent: randomNumber, is_sms: false, is_login: true, is_running: false, is_verified: false, is_paying: false, runned_by: `${response_data.data.firstname} ${response_data.data.lastname}`, is_runned: false, email: response_data.data.email, is_jwt: true, user_id: response_data.data.id, time_created: new Date(), payment_id: 0, opt_verification_type_id: otp_types.id };
                    await strapi.query("otp-verification").create(opt_verification_body);
                    response = Format.success(`Pin Sent successfully , check  your email ${response_data.data.email}`, []);
                  } else {
                    const user_client_info = await getUserLevel(user_admins_access.user_id);
                    if (user_client_info.status && user_client_info.data.client_info) {
                      const randomNumber = utils.generateRandomNumber(5);
                      var data = {
                        from: "info@fixarwanda.com",
                        to: response_data.data.email,
                        subject: "OTP Login",
                        template: "otp-login",
                        "v:pin": `${randomNumber}`,
                        "v:subject": "Complete Sign in",
                      };
                      mailgun.messages().send(data);
                      const opt_verification_body = { pin_sent: randomNumber, is_sms: false, is_login: true, is_running: false, is_verified: false, is_paying: false, runned_by: `${response_data.data.firstname} ${response_data.data.lastname}`, is_runned: false, email: response_data.data.email, is_jwt: true, user_id: response_data.data.id, time_created: new Date(), payment_id: 0, opt_verification_type_id: otp_types.id };
                      await strapi.query("otp-verification").create(opt_verification_body);
                      response = Format.success(`Pin Sent successfully , check  your email ${response_data.data.email}`, []);
                    } else {
                      ctx.response.status = 400;
                      response = Format.badRequest("The user currently doens't have client association", []);
                    }
                  }
                } else {
                  ctx.response.status = 400;
                  response = Format.badRequest("The user currently lacks any access privileges.", []);
                }
              } else {
                ctx.response.status = 400;
                response = Format.badRequest(response_data.error_message, []);
              }
            }
          } else {
            ctx.response.status = 400;
            response = Format.badRequest(`OTP with type id ${otp_type_id} not found ,Only accepting login types`, []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("Contact your administrator for config the user levels", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log("Error in createOtpLogin ", error.message);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async verifyOtpLogin(ctx) {
    let response;
    try {
      const rules = {
        otp_type_id: "required|integer",
        otp_pin: "required|integer",
        email: "required|string",
      };
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, otp_pin, email } = ctx.request.body;
        const levels = await strapi.query("users-levels").find();
        if (levels) {
          const otp_types = await strapi.query("opt-verification-types").findOne({ id: otp_type_id });
          if (otp_types && otp_types.type_name === "login") {
            const opt_verification = await strapi.query("otp-verification").findOne({ is_login: true, is_jwt: true, email: email, is_verified: false, _sort: "created_at:DESC" });
            if (opt_verification) {
              if (opt_verification.pin_sent.toString() === otp_pin.toString()) {
                const response_data = await authAdminLoginToken(email);
                if (response_data.status_code === 200) {
                  const user_admins_access = await strapi.query("user-admin-access").findOne({ user_id: response_data.data.user.id });
                  if (user_admins_access && parseInt(user_admins_access.user_level_id) >= 1 && user_admins_access.user_access) {
                    const user_level = levels.find((item) => parseInt(item.id) === parseInt(user_admins_access.user_level_id));
                    if (user_level.name === "level_1") {
                      await strapi.query("otp-verification").update({ id: opt_verification.id }, { is_login: false, is_jwt: false, email: email, is_verified: true, });
                      ctx.response.status = 200;
                      response = Format.success("Success", response_data.data);
                    } else {
                      const user_client_info = await getUserLevel(user_admins_access.user_id);
                      if (user_client_info.status && user_client_info.data.client_info) {
                        await strapi.query("otp-verification").update({ id: opt_verification.id }, { is_login: false, is_jwt: false, email: email, is_verified: true, });
                        ctx.response.status = 200;
                        response = Format.success("Success", response_data.data);
                      } else {
                        ctx.response.status = 400;
                        response = Format.badRequest("The user currently doens't have client association", []);
                      }
                    }
                  } else {
                    ctx.response.status = 400;
                    response = Format.badRequest("The user currently lacks any access privileges.", []);
                  }
                } else {
                  ctx.response.status = 400;
                  response = Format.badRequest(response_data.error_message, []);
                }
              } else {
                ctx.response.status = 400;
                response = Format.badRequest(`Incorrect OTP`, []);
              }
            } else {
              ctx.response.status = 400;
              response = Format.badRequest(`OTP Not found,please get a new OTP`, []);
            }
          } else {
            ctx.response.status = 400;
            response = Format.badRequest(`OTP with type id ${otp_type_id} not found ,Only accepting login types`, []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("Contact your administrator for config the user levels", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log("Error in verifyOtpLogin ", error.message);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  // verify otp
  async verifyOtp(ctx) {
    let response;
    try {
      let rules = {
        otp_type_id: "required|integer",
        otp_pin: "required|integer",
        payment_id: "required|integer",
      };
      let user = ctx.state.user;
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, otp_pin, payment_id } = ctx.request.body;
        let otp_types = await strapi.query("opt-verification-types").findOne({ id: otp_type_id });
        if (otp_types) {
          // sms
          if (otp_types.type_name === "sms") {
            let opt_verification = await strapi.query("otp-verification").findOne({ is_sms: true, payment_id: payment_id, is_verified: false, });
            if (opt_verification) {
              // verify otp
              if (opt_verification.pin_sent.toString() === otp_pin.toString()) {
                let new_body = {
                  pin_received: otp_pin,
                  is_verified: true,
                  is_running: false,
                };
                await strapi.query("otp-verification").update({ id: opt_verification.id }, { is_running: true });
                let payment = await strapi.query("payments").findOne({ id: payment_id });
                sendSmsCompasationToWorkers(payment, opt_verification.id);
                await strapi.query("otp-verification").update({ id: opt_verification.id }, new_body);
                response = {
                  status: "result",
                  data: [],
                  error: "",
                  meta: "",
                };
              } else {
                response = {
                  status: "failed",
                  data: `Incorrect OTP PIN`,
                  error: "",
                  meta: "",
                };
              }
            } else {
              response = {
                status: "failed",
                data: `entry otp not found`,
                error: "",
                meta: "",
              };
            }
          }
        } else {
          response = {
            status: "failed",
            data: `Otp type with id ${otp_type_id} not found`,
            error: "",
            meta: "",
          };
        }
      } else {
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // stop action
  async stopAction(ctx) {
    let response;
    try {
      let rules = {
        otp_type_id: "required|integer",
        payment_id: "required|integer",
      };
      let user = ctx.state.user;
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, payment_id } = ctx.request.body;
        let payment = await strapi.query("payments").findOne({ id: payment_id });
        if (payment) {
          let otp_types = await strapi.query("opt-verification-types").findOne({ id: otp_type_id });
          if (otp_types.type_name === "sms") {
            let otp_verification = await strapi.query("otp-verification").findOne({ is_running: true, payment_id: payment_id, is_sms: true });
            if (otp_verification) {
              await strapi.query("otp-verification").update({ id: otp_verification.id }, { is_running: false });
            } else {
              await strapi.query("otp-verification").update({ payment_id: payment_id }, { is_running: false });
            }
            response = {
              status: "success",
              data: `SMS Sending to Payment with ID ${payment_id} is Stoped`,
              error: error.message,
              meta: "",
            };
          }
          if (otp_types.type_name === "pay") {
            let otp_verification = await strapi.query("otp-verification").findOne({ is_running: true, payment_id: payment_id, is_paying: true, });
            if (otp_verification) {
              await strapi.query("otp-verification").update({ id: otp_verification.id }, { is_running: false });
            } else {
              await strapi.query("otp-verification").update({ payment_id: payment_id }, { is_running: false });
            }
            response = {
              status: "success",
              data: `Paying Sending to Payment with ID ${payment_id} is Stoped`,
              error: error.message,
              meta: "",
            };
          }
        } else {
          response = {
            status: "failed",
            data: `payment with id ${payment_id} does not exist`,
            error: error.message,
            meta: "",
          };
        }
      }
    } catch (error) {
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // get all admin users
  async findAllAdminUsers(ctx) {
    let response;
    try {
      // check user level access
      const admins_users = await strapi.query("user", "admin").find({ _limit: -1 });
      if (admins_users.length > 0) {
        let user_admins = admins_users.map((item) => {
          return {
            id: item.id,
            firstname: item.firstname,
            "job_title": "Operation Manager",
            "avatar_url": "",
            lastname: item.lastname,
            username: item.username,
            email: item.email,
            isActive: item.isActive,
          };
        });
        ctx.response.status = 200;
        response = {
          status: "success",
          data: user_admins,
          error: "",
          meta: "",
        };
      } else {
        ctx.response.status = 200;
        response = {
          status: "success",
          data: [],
          error: "",
          meta: "",
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // get single admin user
  async findadminUser(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      if (id) {
        // check user level access
        const admins_user = await strapi.query("user", "admin").findOne({ id: id });
        if (admins_user) {
          let user_admin = {
            id: admins_user.id,
            firstname: admins_user.firstname,
            "job_title": "Operation Manager",
            "avatar_url": "",
            lastname: admins_user.lastname,
            username: admins_user.username,
            email: admins_user.email,
            isActive: admins_user.isActive,
          };
          ctx.response.status = 200;
          response = {
            status: "success",
            data: user_admin,
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 404;
          response = {
            status: "failed",
            data: "",
            error: `User with id ${id} not found`,
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "Please specify a valid user id",
          meta: "",
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // company information
  async getCompanyInfo(ctx) {
    let response;
    try {
      let response_data = {
        id: 1,
        company_name: "Fixa Ltd",
        address: "Kigali, Rwanda",
        tin_number: "1123454",
        phone: "0785715789",
        email: "info@fixarwanda.com",
      };
      ctx.response.status = 200;
      response = {
        status: "success",
        data: response_data,
        error: "",
        meta: "",
      };
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // company information
  async updateCompanyInfo(ctx) {
    let response;
    try {
      let rules = {
        company_name: "required|string",
        address: "required|string",
        tin_number: "required|string",
        phone: "required|string",
        email: "required|string",
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let body = ctx.request.body;
        const { id } = ctx.params;
        if (id) {
          let response_data = {
            id: 1,
            company_name: "Fixa Ltd",
            address: "Kigali, Rwanda",
            tin_number: "1123454",
            phone: "0785715789",
            email: "info@fixarwanda.com",
          };
          ctx.response.status = 204;
          response = {
            status: "success",
            data: response_data,
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 404;
          response = {
            status: "failed",
            data: "",
            error: `Company with id ${id} not found`,
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // update user_admin information only if super admin or own account
  async updateAdminInfo(ctx) {
    let response;
    try {
      let rules = {
        job_title_id: "required|integer",
        avatar_url: "required|string",
        firstname: "required|string",
        lastname: "required|string",
        phone: "required|string",
        email: "required|string",
        isActive: "required|boolean"
      };
      const { id } = ctx.params;

      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let body = ctx.request.body;
        if (id) {
          ctx.response.status = 200;
          response = {
            status: "success",
            data: "User updated successfully",
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: `User with id ${id} not found`,
            error: "",
            meta: "",
          };
        }


      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  // update user_admin information only if super admin or own account
  async inviteUserAdmin(ctx) {
    let response;
    try {
      let rules = {
        job_title_id: "required|integer",
        avatar_url: "required|string",
        firstname: "required|string",
        lastname: "required|string",
        phone: "required|string",
        email: "required|string",
      };

      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let body = ctx.request.body;
        ctx.response.status = 201;
        response = {
          status: "success",
          data: `Invitation sent to ${body.email}`,
          error: "",
          meta: "",
        };


      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async createOtpExternalDeduction(ctx) {
    let response = {
      status_code: 404,
      error_message: "inside",
      data: {},
    };
    try {
      let rules = {
        otp_type_id: "required|integer",
        phone_number: "required|string"
      };
      // let user = ctx.state.user;
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, phone_number } = ctx.request.body;
        // find payee
        let email_user = '';
        if (ctx.state.user) {
          email_user = ctx.state.user.email;
        } else {
          let payee = await strapi.query('payee-names').findOne({ phone_number: phone_number });
          email_user = payee.email;
        }
        if (email_user.length > 6) {

          let otp_types = await strapi.query("opt-verification-types").findOne({ id: otp_type_id });
          if (otp_types && otp_types.type_name === "external") {
            const randomNumber = Math.floor(Math.random() * 90000) + 10000;
            let phone_number_to_send = [phone_number];
            let message = `Your OTP PIN is ${randomNumber}`;
            await sendSMSToWorker(phone_number_to_send, message);
            let opt_verification_body = {
              pin_sent: randomNumber,
              email: email_user,
              is_external: true,
              is_sms: false,
              is_login: false,
              is_running: false,
              is_verified: false,
              is_paying: false,
              runned_by: `Restaurent with phone number ${phone_number}`,
              is_runned: false,
              // user_id: response_data.data.id,
              time_created: new Date(),
              payment_id: 0,
              opt_verification_type_id: otp_types.id,
            };
            await strapi.query("otp-verification").create(opt_verification_body);
            response = {
              status: "Success",
              data: `Pin Sent successfully , check  your phone number starts with ${phone_number.substring(0, 5)}`,
              error: "",
              meta: "",
            };
          } else {
            ctx.response.status = 400;
            response = {
              status_code: 400,
              error_message: `OTP with type id ${otp_type_id} not found ,Only accepting external type`,
              data: {},
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status_code: 400,
            error_message: `Invalid Phone number`,
            data: {},
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status_code: 400,
          data: {},
          error_message: validation.errors
        };
      }

    } catch (error) {
      ctx.response.status = 400;
      console.log("error when front login", error);
      response = {
        status_code: 400,
        error_message: error.message,
        data: {},
      };
      //  ctx.throw(400, response);
    }
    return response;
  },
  async verifyOtpExternalDeduction(ctx) {
    let response = {};
    try {
      const rules = {
        otp_type_id: "required|integer",
        otp_pin: "required|integer",
        email: "required|string",
        phone_number: "required|string",
        all_deductions: "array|required",
        payment_id: "required|integer",
        payee_name_id: "required|integer"
      };
      // let user = ctx.state.user;
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { otp_type_id, otp_pin, email, phone_number, all_deductions, payment_id, payee_name_id } = ctx.request.body;
        // find payee
        const payee = await strapi.query('payee-names').findOne({ email: email });
        if (payee) {
          let email_user = email;
          if (ctx.state.user) {
            email_user = ctx.state.user.email;
          }
          const otp_types = await strapi.query("opt-verification-types").findOne({ id: otp_type_id });
          if (otp_types && otp_types.type_name === "external") {
            const opt_verification = await strapi.query("otp-verification").findOne({ is_external: true, email: email_user, is_verified: false, _sort: "created_at:DESC", });
            if (opt_verification) {
              if (opt_verification.pin_sent.toString() === otp_pin.toString()) {
                const otp_verification = await strapi.query("otp-verification").update({ id: opt_verification.id }, { is_external: true, is_verified: true });
                if (otp_verification) {
                  const external_deduction = await updateDeductionTransactionWithPayrollWorkersOTP(payee.phone_number, all_deductions, payment_id, payee_name_id);
                  if (external_deduction) {
                    response = {
                      status_code: 200,
                      status: "Success",
                      data: external_deduction.data,
                      error: ""
                    };
                  }
                }
              } else {
                ctx.response.status = 400;
                response = {
                  status_code: 400,
                  status: "failed",
                  error: "Incorrect OTP",
                  data: {}
                };
              }
            } else {
              ctx.response.status = 400;
              response = {
                status_code: 400,
                status: "failed",
                error_message: `OTP Not found,please get a new OTP`,
                data: {}
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status_code: 400,
              status: "failed",
              error_message: `OTP with type id ${otp_type_id} not found ,Only accepting login types`,
              data: {}
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status_code: 400,
            status: "failed",
            error_message: `Invalid Email`,
            data: {}
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status_code: 400,
          status: "failed",
          error_message: validation.errors,
          data: {}
        };
      }
    } catch (error) {
      console.log("erro =====>", error.message);
      ctx.response.status = 400;
      response = {
        status_code: 400,
        error_message: error.message,
        data: {},
      };
    }
    return response;
  },
};