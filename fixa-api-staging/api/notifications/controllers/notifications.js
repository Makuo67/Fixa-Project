"use strict";
const Pusher = require("pusher");
const moment = require("moment");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

function isToday(TODAY, momentDate) {
  return momentDate.isSame(TODAY, "day");
}
function isYesterday(YESTERDAY, momentDate) {
  return momentDate.isSame(YESTERDAY, "day");
}
function isThisWeek(THIS_WEEK, momentDate) {
  return momentDate.isSame(THIS_WEEK, "week");
}
function isLongAgo(THIS_WEEK, momentDate) {
  return !isThisWeek(THIS_WEEK, momentDate);
}

module.exports = {
  async pusherUserAuth(ctx) {
    // console.log("hitted");
    const { socket_id } = ctx.request.body;
    const user = {
      id: ctx.state.user.id.toString(),
      user_info: ctx.state.user.first_name + " " + ctx.state.user.last_name,
    };
    // console.log(user);
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
    const auth = pusher.authenticateUser(socket_id, user);

    // const cb = callback.replace(/\\"/g, "") + "(" + auth + ");";
    // console.log(auth)
    return auth;
  },
  async pusherAuth(ctx) {
    // console.log("1 hitted");
    const { channel_name, socket_id } = ctx.request.body;
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
    const auth = pusher.authorizeChannel(socket_id, channel_name);
    return auth;
  },
  async send(ctx) {
    return await strapi.services.notifications.sendNotification(
      ctx.request.body
    );
  },
 /*  async find(ctx) {
    var REFERENCE = moment(); // fixed just for testing, use moment();
    var TODAY = REFERENCE.clone().startOf("day");
    var YESTERDAY = REFERENCE.clone().subtract(1, "days").startOf("day");
    var THIS_WEEK = REFERENCE.clone().startOf("isoWeek");
    // console.log("ctx.state.user.id", ctx.state.user.id);
    const data = await strapi.query("notifications").find({
      _limit: -1,
      recipient_id: ctx.state.user.id,
      _sort: "datetime:DESC",
    });

    const result = {
      today: {
        total_new: 0,
        list: [],
      },
      yesterday: { total_new: 0, list: [] },
      this_week: { total_new: 0, list: [] },
      long_ago: { total_new: 0, list: [] },
    };

    for (let i = 0; i < data.length; i++) {
      const msg = data[i];
      const datum = {
        id: msg.id,
        datetime: msg.datetime,
        content: msg.content,
        is_clickable: msg.is_clickable,
        seen: msg.seen,
        query_params: msg.query_params,
        recipient_id: msg.recipient_id,
        redirect_url: msg.redirect_url,
      };
      if (isToday(TODAY, moment(msg.datetime))) {
        result.today.list.push(datum);
        if (!datum.seen) result.today.total_new += 1;
      } else if (isYesterday(YESTERDAY, moment(msg.datetime))) {
        result.yesterday.list.push(datum);
        if (!datum.seen) result.yesterday.total_new += 1;
      } else if (isThisWeek(THIS_WEEK, moment(msg.datetime))) {
        result.this_week.list.push(datum);
        if (!datum.seen) result.this_week.total_new += 1;
      } else if (isLongAgo(THIS_WEEK, moment(msg.datetime))) {
        result.long_ago.list.push(datum);
        if (!datum.seen) result.long_ago.total_new += 1;
      }
    }

    return result;
  }, */
};
