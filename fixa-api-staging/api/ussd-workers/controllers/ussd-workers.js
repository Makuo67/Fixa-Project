"use strict";
const {
  sendSMSToWorker,
} = require("../../service-providers/services/service-providers");
const moment = require("moment");
const {
  checkIfPaymentExist,
  getPayrollTransactions,
} = require("../../payments/services/payments");



/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

function smsPinMessage(language_id, name, pin) {
  let message = "";
  let eng_message = `Welcome to Fixa ${name}. Your PIN is ${pin}. Please Dial *801*37# for more information.`;
  let kiny_message = `Murakza neza kuri Fixa ${name}. PIN yanyu ni ${pin}. Kanda *801*37# kubona amakuru ya konti yawe.`;
  if (language_id.toString() === "1") {
    message =kiny_message;
  } else if(language_id.toString() === "2"){
    message = eng_message;
  }
  return message;
}

function accountMessage(language_id, worker_details) {
  let message = "";

  let eng_message = `END ${worker_details.names}
  MM ${worker_details.phone_number}
  ID: ${worker_details.national_id}
  Service: ${worker_details.trade}
  Rate: ${worker_details.daily_earnings}

  Thank you for working with Fixa
  `;
  let kiny_message = `END ${worker_details.names}
  MM ${worker_details.phone_number}
  ID: ${worker_details.national_id}
  Umwuga: ${worker_details.trade}
  Umushahara: ${worker_details.daily_earnings}

  Urakoze gukorana na Fixa
  `;
  if (language_id.toString() === "1") {
    message = kiny_message;
  }else if (language_id.toString() === "2") {
    message = eng_message;
  }
  return message;
}

async function EarningsMessage(language_id, worker_details, worker_id) {
  let message = "";
  let eng_message = `END Hello ${worker_details.names}.\nNo payment details available.\nThank you for working with Fixa`;
  let kiny_message = `END Muraho ${worker_details.names}.\nNta makuru y'ubwishyu ahari.\nMurakoze gukorana na Fixa`;
  // new assigned workers
  // let assigned_worker = await strapi
  //   .query("new-assigned-workers")
  //   .findOne({ worker_id: worker_id, _sort: "created_at:DESC" });
  let workforce_assigned_worker = await strapi
  .query("workforce")
  .findOne({ worker_id: worker_id, _sort: "created_at:DESC" });
  // payments
  let date = new Date();
  let date_range = getTimeRange(date);
  let worker_payment_details = await getAttendanceDetails(
    date_range.start_date,
    date_range.end_date,
    workforce_assigned_worker.project_id,
    workforce_assigned_worker.assigned_worker_id,
    worker_details.phone_number
  );

  if (worker_payment_details.status) {
    kiny_message = `END Muraho ${worker_details.names}
      MM ${worker_details.phone_number}
      cyino gihembwe, mwakoze ${worker_payment_details.day_shifts}
      iminsi, ${worker_payment_details.night_shifts} amajoro
      Amafaranga yose yakuweho Rwf ${worker_payment_details.total_deductions}
      Amafaranga yose yakorewe kuri Fixa Rwf
      ${worker_payment_details.total_earnings}      
    
      Murakoze gukorana na Fixa
      `;

      eng_message = `END Hello ${worker_details.names}
      MM ${worker_details.phone_number}
      This pay period, you worked ${worker_payment_details.day_shifts}
      Day shifts, ${worker_payment_details.night_shifts} Night Shifts
      Total Deductions Rwf ${worker_payment_details.total_deductions}
      Total Earnings on Fixa Rwf
      ${worker_payment_details.total_earnings}      
    
      Thank you for working with Fixa
      `;
  }

  if (language_id.toString() === "1") {
    message = kiny_message;
  }else if (language_id.toString() === "2") {
    message = eng_message;
  }
  return message;
}

function words(language_id, language_item_key) {
  let word = "";
  let language_kiny_words = {
    language_id: 1,
    language_key: "Kinyarwanda",
    words_texts: [
      {
        retry_error: "END Mwongere mukanya",
      },
      {
        worker_not_found: "END Ntabwo wiyandikishije",
      },
      {
        yes_button: "Yego",
      },
      {
        no_button: "Oya",
      },
      {
        back_button: "Gusubira inyuma",
      },
      {
        policy_text: `Politiki yibanga ya Fixa\nMugukomeza ndemera politiki yibanga ya Fixa`,
      },
      {
        policy_text_accepted: `END Murakaza neza kuri Fixa.\n\nPIN Yoherejwe neza kuri nimero\nya telefoni yanyu`,
      },
      {
        policy_text_declined: `END Politiki yibanga ya Fixa yahakanywe`,
      },
      {
        menu: `CON Murakaza neza kuri Fixa\n\n1) Konti yanjye\n2) Amafaranga winjiza\n3) Ibyerekeye Fixa\n4) Guhindura PIN\n5) Funga konti`,
      },
      {
        menu_account: `CON Injiza Pin Yawe\n\n0) Gusubira inyuma`,
      },
      {
        wrong_pin_retry: `CON Ibyo wemeje byanze ,\n\nEmeza umubare w'ibanga nyawo\n\n0) Gusubira inyuma`,
      },
      {
        invalid_pin_retry: `CON Ibyo wemeje byanze ,\n\numubare w'ibanga ugizwe n'imibare 4 xxxx\n\n0) Gusubira inyuma`,
      },
      {
        about_fixa_1: `CON Fixa ni ikigo gihuza abakozi \nnabakoresha mu Rwanda, Tugufasha \ngutera imbere mu mwuga wawe. Dutanga\n akazi, tukishyura ku gihe. \n\n0) Gusubira inyuma\nn) Next`,
      },
      {
        about_fixa_2: `END Musabwe kubahiriza amasaha muzira\n ku kazi n’imyitwarire igenga Fixa ishyirwaho\n n’abayobozi ba Fixa, no gutanga \numusaruro ukwiye buri munsi.`,
      },
      {
        national_pin: `CON Injiza umubare w'indangamuntu yawe\n\n0) Gusubira inyuma`,
      },
      {
        reset_pin_1: `CON Injiza PIN nshya igizwe\nn'imibare 4(xxxx)`,
      },
      {
        reset_pin_2: `CON Ongera winjize PIN nshya`,
      },
      {
        reset_pin_3: `END PIN yawe yahinduwe nza`,
      },
      {
        reset_pin_4: `END PIN zombi ntizihuye`,
      },
      {
        invalid_id_number: `END Injiza nimero y'indangamuntu yemewe yawe`,
      },
      {
        incorrect_id_number: `END Nimero y'indangamuntu yinjijwe siyo`,
      },
      {
        delete_account: `CON Gusiba konti yawe, Injiza PIN yawe `,
      },
      {
        delete_account_1: `END Murakoze. Konti yanyu yafunzwe neza.`,
      },
      {
        delete_account_2: `END PIN siyo`,
      },
    ],
  };
  let language_eng_words = {
    language_id: 2,
    language_key: "English",
    words_texts: [
      {
        retry_error: "END Please try again later",
      },
      {
        worker_not_found: "END You are not registered",
      },
      {
        yes_button: "Yes",
      },
      {
        no_button: "No",
      },
      {
        back_button: "Back",
      },
      {
        policy_text: `Fixa's Privacy policy\n\nBy continuing I consent to Fixa's privacy policy`,
      },
      {
        policy_text_accepted: `END Welcome to Fixa.\n\nPlease check your phone for your PIN.`,
      },
      {
        policy_text_declined: `END Fixa's privacy policy declined`,
      },
      {
        menu: `CON Welcome to the Fixa\n\n 1) Account\n2) Earnings\n3) About Fixa\n4) Reset PIN\n5) Delete account`,
      },
      {
        menu_account: `CON Enter your Fixa Pin\n\n0) Back`,
      },
      {
        wrong_pin_retry: `CON Wrong Pin ,\n\nPlease try again\n\n0) Back`,
      },
      {
        invalid_pin_retry: `CON Invalid Pin ,\n\nPlease should be 4 digits xxxx\n\n0) Back`,
      },
      {
        about_fixa_1: `CON Fixa is a staffing agency\nconnecting you to jobs in Rwanda.\nWe offer jobs and salary payments\non time, follow conduct set by your\nsupervisor.\n\n0) Back\nn) Next`,
      },
      {
        about_fixa_2: `END Fixa is here to help grow you in\nyour career. Please contact the\nsite Admin for more information`,
      },
      {
        national_pin: `CON Please enter your National ID Number\n\n0) Back`,
      },
      {
        reset_pin_1: `CON Enter new 4-Digit PIN(XXXX)`,
      },
      {
        reset_pin_2: `CON Re-Enter new 4-Digit PIN(XXXX)`,
      },
      {
        reset_pin_3: `END Your PIN has been\nsuccessfully reset`,
      },
      {
        reset_pin_4: `END Both PIN does not match`,
      },
      {
        invalid_id_number: `END Invalid ID number`,
      },
      {
        incorrect_id_number: `END Incorrect ID number`,
      },
      {
        delete_account: `CON Please enter your PIN to\ndelete your account`,
      },
      {
        delete_account_1: `END Thank you. We have closed\nyour account.`,
      },
      {
        delete_account_2: `END Wrong PIN`,
      },
    ],
  };

  if (language_id === 2) {
    for (
      let index = 0;
      index < language_eng_words.words_texts.length;
      index++
    ) {
      if (
        language_eng_words.words_texts[index].hasOwnProperty(language_item_key)
      ) {
        word = language_eng_words.words_texts[index][language_item_key];
        break;
      }
    }
  } else if(language_id === 1){
    for (
      let index = 0;
      index < language_kiny_words.words_texts.length;
      index++
    ) {
      if (
        language_kiny_words.words_texts[index].hasOwnProperty(language_item_key)
      ) {
        word = language_kiny_words.words_texts[index][language_item_key];
        break;
      }
    }
  } else if (language_id === 0 && language_item_key === "worker_not_found") {
    word = `END Service is unavailable for you.
      Ntaburenganzira mufite.`;
  }
  // console.log("here is the text ",word," --- -- ",language_id, language_item_key);

  return word;
}

function getLanguageId(text) {
  let language_id = 0;
  let text_parts = text.split("*");

  if (text !== "" && text_parts.length > 0) {
    language_id = parseInt(text_parts[0]);
  }
  return language_id;
}

function getArrangedText(text) {
  let new_text = "";
  let new_text_splitted = [];
  if (text && text.length > 0) {
    let split_text = text.split("*");

    for (let index = 0; index < split_text.length; index++) {
      if (index === split_text.length - 1) {
        if (split_text[index] !== "0") {
          new_text_splitted.push(split_text[index]);
        }
      } else {
        let next_index = index + 1;
        if (split_text[next_index] !== "0" && split_text[index] !== "0") {
          new_text_splitted.push(split_text[index]);
        }
      }
    }
    new_text = new_text_splitted.join("*");
  }

  return new_text;
}

module.exports = {
  async ussdWorkers(ctx) {
    let response = "";
    let language_code = 1;
    const { sessionId, serviceCode, phoneNumber, text } = ctx.request.body;
    try {
      let new_text = getArrangedText(text);
      let phone_number = phoneNumber.toString().substring(3);
      let worker;
      let worker_ussd;
      let worker_details;
      language_code = getLanguageCode(text);
      // get worker from workers
      worker = await strapi
        .query("service-providers")
        .findOne({ phone_number: phone_number });

      if (worker) {
        // get worker from ussd_workers
        worker_ussd = await strapi
          .query("ussd-workers")
          .findOne({ phone_number: phone_number });
        // get worker details
        worker_details = await strapi
          .query("workforce")
          .findOne({ worker_id: worker.id });
      }
      // ***************** path condition *****************
      // 1.
      if (new_text === "") {
        if (worker) {
          response = `CON Welcome to Fixa\n\nMurakaze neza kuri Fixa\n\n1) Kinyarwanda\n2) English`;
        } else {
          // let language_id = 0;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      }
      // ********************************** English path ************************************
      else if (new_text === "1" || new_text === "2") {
        if (worker_ussd && worker_ussd.is_accepted === true) {
          let response_text = words(language_code, "menu");
          response = response_text;
        } else if (worker) {
          let response_text_policy = words(language_code, "policy_text");
          let response_text_yes_btn = words(language_code, "yes_button");
          let response_text_no_btn = words(language_code, "no_button");
          let response_text_back_btn = words(language_code, "back_button");
          response = `CON ${response_text_policy}
        
          1) ${response_text_yes_btn}
          2) ${response_text_no_btn}
          0) ${response_text_back_btn}
          `;
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (new_text === "1*1" || new_text === "2*1") {
        if (worker_ussd && worker_ussd.is_accepted === true) {
          let response_text = words(language_code, "menu_account");
          response = response_text;
        } else if (worker) {
          let response_text_policy = words(language_code, "policy_text_accepted");
          let worker_phones = [phone_number];
          var pin = Math.floor(1000 + Math.random() * 9000);
          await strapi.query("ussd-workers").create({
            phone_number: phone_number,
            pin: pin,
            worker_id: worker.id,
            id_number: worker.nid_number,
            language_id: 1,
            is_accepted: true,
          });
          let message = smsPinMessage(
            language_code,
            `${worker.first_name} ${worker.last_name}`,
            pin
          );
          await sendSMSToWorker(worker_phones, message);
          response = response_text_policy;
        } else {
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if ( new_text === "1*2"|| new_text === "2*2") {
        if (worker_ussd && worker_ussd.is_accepted === true) {
          let response_text = words(language_code, "menu_account");
          response = response_text;
        } else if (worker) {
          let response_text_policy = words(language_code, "policy_text_declined");
          response = response_text_policy;
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "account_pin") {
        let pin_status = getPin(new_text);
        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (pin_status.pin.length.toString() === "4") {
            if (worker_ussd.pin.toString() === pin_status.pin.toString()) {
              let response_text = accountMessage(language_code, worker_details);
              response = response_text;
            } else {
              let response_text = words(language_code, "wrong_pin_retry");
              response = response_text;
            }
          } else {
            let response_text = words(language_code, "invalid_pin_retry");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "account_re_pin") {
        let pin_status = getPin(new_text);
        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (pin_status.pin.length.toString() === "4") {
            if (worker_ussd.pin.toString() === pin_status.pin.toString()) {
              let response_text = accountMessage(language_code, worker_details);
              response = response_text;
            } else {
              let response_text = words(language_code, "delete_account_2");
              response = response_text;
            }
          } else {
            let response_text = words(language_code, "invalid_pin_retry");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "earnings_pin") {
        let pin_status = getPin(new_text);
        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (pin_status.pin.length.toString() === "4") {
            if (worker_ussd.pin.toString() === pin_status.pin.toString()) {
              let response_text = EarningsMessage(language_code, worker_details, worker.id);
              response = response_text;
            } else {
              let response_text = words(language_code, "wrong_pin_retry");
              response = response_text;
            }
          } else {
            let response_text = words(language_code, "invalid_pin_retry");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "earnings_re_pin") {
        let pin_status = getPin(new_text);
        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (pin_status.pin.length.toString() === "4") {
            if (worker_ussd.pin.toString() === pin_status.pin.toString()) {
              let response_text = EarningsMessage(language_code, worker_details, worker.id);
              response = response_text;
            } else {
              let response_text = words(language_code, "delete_account_2");
              response = response_text;
            }
          } else {
            let response_text = words(language_code, "invalid_pin_retry");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if ( new_text === "1*3" || new_text === "2*3") {
        if (worker_ussd && worker_ussd.is_accepted === true) {
          let response_text = words(language_code, "about_fixa_1");
          response = response_text;
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (new_text === "1*3*n" || new_text === "2*3*n") {
        if (worker_ussd && worker_ussd.is_accepted === true) {
          let response_text = words(language_code, "about_fixa_2");
          response = response_text;
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (new_text === "1*4" || new_text === "2*4") {
        if (worker_ussd && worker_ussd.is_accepted === true) {
          let response_text = words(language_code, "national_pin");
          response = response_text;
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "id_number") {
        let pin_status = getPin(new_text);
        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (pin_status.pin.length.toString() === "16") {
            if (
              worker_ussd.id_number.toString() === pin_status.pin.toString()
            ) {
              let response_text = words(language_code, "reset_pin_1");
              response = response_text;
            } else {
              let response_text = words(language_code, "incorrect_id_number");
              response = response_text;
            }
          } else {
            let response_text = words(language_code, "invalid_id_number");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "id_number_pin") {
        let pin_status = getPin(new_text);
        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (pin_status.pin.length.toString() === "4") {
            let response_text = words(language_code, "reset_pin_2");
            response = response_text;
          } else {
            let response_text = words(language_code, "invalid_pin_retry");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "id_number_reset_pin") {
        let pin_status = getPin(new_text);

        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (pin_status.pin.length.toString() === "4") {
            if (
              pin_status.re_set_pin.length.toString() ===
              pin_status.pin.length.toString()
            ) {
              await strapi
                .query("ussd-workers")
                .update(
                  { id: worker_ussd.id },
                  { pin: parseInt(pin_status.re_set_pin) }
                );
              let worker_phones = [phone_number];
              let message = `Here is your new pin ${pin_status.re_set_pin}`;
              await sendSMSToWorker(worker_phones, message);
              let response_text = words(language_code, "reset_pin_3");
              response = response_text;
            } else {
              let response_text = words(language_code, "reset_pin_4");
              response = response_text;
            }
          } else {
            let response_text = words(language_code, "invalid_pin_retry");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if ( new_text === "1*5" || new_text === "2*5") {
        if (worker_ussd && worker_ussd.is_accepted === true) {
          let response_text = words(language_code, "delete_account");
          response = response_text;
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      } else if (checkPathPin(new_text) === "delete_account") {
        let pin_status = getPin(new_text);
        if (worker_ussd && worker_ussd.is_accepted === true) {
          if (parseInt(worker_ussd.pin) === parseInt(pin_status.pin)) {
            await strapi.query("ussd-workers").delete({ id: worker_ussd.id });
            let response_text = words(language_code, "delete_account_1");
            response = response_text;
          } else {
            let response_text = words(language_code, "delete_account_2");
            response = response_text;
          }
        } else {
          // let language_id = 2;
          let response_text = words(language_code, "worker_not_found");
          response = response_text;
        }
      }
    } catch (error) {
      console.log("error meessage", error.message);
      let response_text = words(language_code, "retry_error");
      response = response_text;
    }
    return response;
  },
};

function getLanguageCode(text){
  let language_code = 1;
  if (text){
   let texxt = text;
    let new_text = Array.from(texxt)[0];
    if(!isNaN(new_text)){
      language_code = parseInt(new_text);
    }

  }

  return language_code;
}

function checkPathPin(text) {
  let status = "";
  if (text) {
    const str = text;
    const parts = str.split("*");
    const lastPart = parts[parts.length - 1];
    const length = lastPart.length;
    // account pin
    if (parts.length === 3 && parts[1].toString() === "1") {
      status = "account_pin";
    } else if (parts.length === 3 && parts[1].toString() === "2") {
      status = "earnings_pin";
    } else if (parts.length === 4 && parts[1].toString() === "1") {
      status = "account_re_pin";
    } else if (parts.length === 4 && parts[1].toString() === "2") {
      status = "earnings_re_pin";
    } else if (parts.length === 3 && parts[1].toString() === "4") {
      status = "id_number";
    } else if (
      parts.length === 4 &&
      parts[1].toString() === "4" &&
      length === 4
    ) {
      status = "id_number_pin";
    } else if (
      parts.length === 5 &&
      parts[1].toString() === "4" &&
      parts[2].length === 16 &&
      parts[3].length === 4
    ) {
      status = "id_number_reset_pin";
    } else if (parts.length === 3 && parts[1].toString() === "5") {
      status = "delete_account";
    }
  }

  return status;
}

function getPin(text) {
  let pin_status = {};
  const str = text;
  const parts = str.split("*");
  const lastPart = parts[parts.length - 1];
  if (lastPart.length === 3 && parts[1].toString() === "1") {
    pin_status = { pin: lastPart, status: true, flow: "account_pin" };
  } else if (
    parts.length === 4 &&
    lastPart.length === 4 &&
    parts[1].toString() === "1"
  ) {
    pin_status = { pin: lastPart, status: true, flow: "account_re_pin" };
  } else if (lastPart.length === 3 && parts[1].toString() === "2") {
    pin_status = { pin: lastPart, status: true, flow: "earnings_pin" };
  } else if (
    parts.length === 4 &&
    lastPart.length === 4 &&
    parts[1].toString() === "2"
  ) {
    pin_status = { pin: lastPart, status: true, flow: "earnings_re_pin" };
  } else if (
    parts.length === 3 &&
    lastPart.length === 16 &&
    parts[1].toString() === "4"
  ) {
    pin_status = { pin: lastPart, status: true, flow: "id_number" };
  } else if (
    parts.length === 4 &&
    lastPart.length === 4 &&
    parts[1].toString() === "4" &&
    parts[2].length === 16
  ) {
    pin_status = { pin: lastPart, status: true, flow: "id_number_pin" };
  } else if (
    parts.length === 5 &&
    lastPart.length === 4 &&
    parts[1].toString() === "4" &&
    parts[2].length === 16 &&
    parts[3].length === 4
  ) {
    pin_status = {
      pin: parts[3],
      re_set_pin: lastPart,
      status: true,
      flow: "id_number_reset_pin",
    };
  } else if (lastPart.length === 4 && parts[1].toString() === "5") {
    pin_status = { pin: lastPart, status: true, flow: "delete_account" };
  } else {
    pin_status = { pin: lastPart, status: false, flow: 0 };
  }
  return pin_status;
}

function getTimeRange(date_check) {
  let time_range;
  if (date_check) {
    let new_date = new Date(date_check);
    let start_date = new Date(new_date.getFullYear(), new_date.getMonth(), 1);
    let end_date = new Date(new_date.getFullYear(), new_date.getMonth() + 1, 0);
    if (
      new_date.getDate() >= start_date.getDate() &&
      new_date.getDate() <= 15
    ) {
      let end_date_rtn = new Date(
        new_date.getFullYear(),
        new_date.getMonth(),
        15
      );
      time_range = {
        start_date: moment(start_date).format("YYYY-MM-DD"),
        end_date: moment(end_date_rtn).format("YYYY-MM-DD"),
      };
    } else if (
      new_date.getDate() >= 16 &&
      new_date.getDate() <= end_date.getDate()
    ) {
      let start_date_rtn = new Date(
        new_date.getFullYear(),
        new_date.getMonth(),
        16
      );
      time_range = {
        start_date: moment(start_date_rtn).format("YYYY-MM-DD"),
        end_date: moment(end_date).format("YYYY-MM-DD"),
      };
    }
  } else {
    time_range = { status: false };
  }
  return time_range;
}

async function getAttendanceDetails(
  start_date,
  end_date,
  project_id,
  assigned_worker_id,
  phone_number
) {
  const knex = strapi.connections.default;
  let response = {};

  // get attendances
  let attendances = await strapi.query("new-attendance").find({date_gte:start_date,date_lte:end_date,project_id:project_id,_limit:-1});
  if(attendances.length > 0){
  let attendances_ids = attendances.map((item) => item.id);

  let attendace_sql_raw =
      "SELECT" +
      " t1.working_time," +
      " t3.id AS shift_id," +
      " t3.name AS shift_name," +
      " t5.value AS daily_earnings" +
      " FROM attendance_details AS t1" +
      " LEFT JOIN new_attendances AS t2 ON t1.attendance_id = t2.id" +
      " LEFT JOIN shifts AS t3 ON t2.shift_id = t3.id" +
      " LEFT JOIN worker_rates AS t5 on t1.worker_rate_id = t5.id" +
      ` WHERE t1.attendance_id IN (${attendances_ids}) AND t1.assigned_worker_id = ${assigned_worker_id}` +
      " ORDER BY t2.date DESC";
  
    let attendance_data = await knex.raw(attendace_sql_raw);

    let day_shifts = 0;
    let night_shifts = 0;
    let total_earnings = 0;
    let total_deductions = 0;

    for (let index = 0; index < attendance_data[0].length; index++) {
      const item = attendance_data[0][index];

      if (item['shift_name'].toString().toLowerCase() === 'day') {
        if (item['working_time'].toString().toLowerCase() == 'half') {
          day_shifts = day_shifts + 0.5;
          total_earnings = total_earnings + (parseInt(item['daily_earnings'].toString()) / 2)
        } else {
          day_shifts = day_shifts + 1;
          total_earnings = total_earnings + parseInt(item['daily_earnings'].toString())
        }

      } else if (item['shift_name'].toString().toLowerCase() === 'night') {
        if (item['working_time'].toString().toLowerCase() == 'half') {
          night_shifts = night_shifts + 0.5;
          total_earnings = total_earnings + (parseInt(item['daily_earnings'].toString()) / 2)
        } else {
          night_shifts = night_shifts + 1;
          total_earnings = total_earnings + parseInt(item['daily_earnings'].toString())
        }
      }
    }

    

    let deductions = await strapi.query("deductions").find({ date_gte:start_date,date_lte:end_date,project_id:project_id, assigned_worker_id: assigned_worker_id,_limit:-1 });
      if(deductions.length > 0){
        total_deductions = deductions.reduce((sum, itm) => {
          return sum + parseInt(itm.deduction_amount.toString());
        }, 0);
      }

      if(day_shifts === 0 && night_shifts === 0 && total_earnings === 0  && total_deductions === 0 ){
        response = {
          status: false,
          phone_number: phone_number,
          day_shifts: "",
          night_shifts: "",
          total_earnings: "",
          total_deductions: "",
        };
      }else {
        response = {
          status: true,
          phone_number: phone_number,
          day_shifts: day_shifts.toString(),
          night_shifts: night_shifts.toString(),
          total_earnings: total_earnings.toString(),
          total_deductions: total_deductions.toString(),
        };
      }
  } else {
    response = {
      status: false,
      phone_number: phone_number,
      day_shifts: "",
      night_shifts: "",
      total_earnings: "",
      total_deductions: "",
    };
  } 
  return response;
}

