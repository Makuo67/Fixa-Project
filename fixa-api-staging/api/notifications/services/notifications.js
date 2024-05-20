"use strict";

const moment = require("moment");
const Pusher = require("pusher");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
// Pusher configuration
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

module.exports = {
  async sendNotification(data) {
    // configure pusher

    const { content, is_clickable, query_params, recipient_id, redirect_url } =
      data;

    const create_body = {
      datetime: moment().format(),
      seen: false,
    };
    // validate request
    if (typeof content != "undefined") {
      create_body.content = content;
    } else {
      return "content is required";
    }

    if (typeof is_clickable != "undefined") {
      create_body.is_clickable = is_clickable;

      if (is_clickable == "true" || is_clickable == true) {
        if (typeof query_params != "undefined") {
          if (typeof query_params == "string") {
            try {
              create_body.query_params = JSON.parse(query_params);
            } catch (e) {
              return "query_params must be a valid JSON string";
            }
          } else {
            create_body.query_params = query_params;
          }
        } else {
          return "query_params is required when the notifications is clickable";
        }

        if (typeof redirect_url != "undefined") {
          create_body.redirect_url = redirect_url;
        } else {
          return "redirect_url is required when the notifications is clickable";
        }
      }
    } else {
      return "is_clickable is required";
    }

    if (typeof recipient_id != "undefined") {
      create_body.recipient_id = recipient_id;
    } else {
      return "recipient_id is required";
    }

    return await strapi
      .query("notifications")
      .create(create_body)
      .then((data) => {
        pusher.trigger(
          `private-notification-${data.recipient_id}`,
          `private-notification-event`,
          data
        );
        return "message sent";
      })
      .catch((err) => {
        console.log(err);
        return "could not sent the message";
      });
  },
  async NotifyClientAttendance(projectID, date, message, params) {
    /**
     * @projectID - Which project you want to notify
     * @date - Which date will be in the event.
     * @message - The custom message to be sent, 
     * This will be containing data to display, actions happened, etc...
     */

    pusher.trigger(
      `attendance-${process.env.PUSHER_ATTENDANCE_CHANNEL}`,
      `attendance-${projectID}-${date}`,
      { message: `${message}` }
    );
    // Saving notification
    /* ProjectId as recipient_ID, */
    await strapi.query('notifications').create({
      datetime: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      content: message,
      recipient_id: projectID,
      seen: false,
      is_clickable: true,
      query_params: params,
      redirect_url: `${process.env.CLIENT_PLATFORM}/attendance/date/${params.date}?project=${params.project_id}&id=${params.attendance_id}&shift=${params.shift_id === 1 ? "Day" : params.shift_id == 2 ? "Night" : ''}`
    });

  },

};
