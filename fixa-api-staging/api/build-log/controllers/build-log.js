"use strict";

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require("crypto");
const _ = require("lodash");
const grant = require("grant-koa");
const { sanitizeEntity } = require("strapi-utils");
const jwt = require("jsonwebtoken");
const { decode } = require("punycode");
const { faker } = require("@faker-js/faker");
var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const tokenVerification = (token) => {
  const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);
  return decoded;
};

const inviteUserToClientPlatform = async (params, invitingUser) => {
  try {
    const pluginStore = await strapi.store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
    });

    const advanced = await pluginStore.get({
      key: "advanced",
    });
    params.provider = "local";
    // set random password for user
    params.password = faker.random.alphaNumeric(5);
    params.password = await strapi.plugins[
      "users-permissions"
    ].services.user.hashPassword(params);
    params.role = params.role === "Admin" ? "corporate" : "corporatestandard";

    const role = await strapi
      .query("role", "users-permissions")
      .findOne({ type: params.role }, []);
    if (!role) {
      response.errors.push(`The role "${params.role}" is not recognized.`);
    }
    params.role = role.id;
    params.confirmed = true;
    const user = await strapi.query("user", "users-permissions").create(params);

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString("hex");

    // Set the property code.
    user.resetPasswordToken = resetPasswordToken;
    const settings = await pluginStore
      .get({ key: "email" })
      .then((storeEmail) => {
        try {
          return storeEmail["reset_password"].options;
        } catch (error) {
          return {};
        }
      });
    settings.message = await strapi.plugins[
      "users-permissions"
    ].services.userspermissions.template(settings.message, {
      URL: advanced.email_reset_password,
      USER: _.omit(user.toJSON ? user.toJSON() : user, [
        "password",
        "resetPasswordToken",
        "role",
        "provider",
      ]),
      TOKEN: resetPasswordToken,
    });

    settings.object = await strapi.plugins[
      "users-permissions"
    ].services.userspermissions.template(settings.object, {
      USER: _.omit(user.toJSON ? user.toJSON() : user, [
        "password",
        "resetPasswordToken",
        "role",
        "provider",
      ]),
    });

    let platformUrl = await strapi.services["platform-settings"].findOne({
      identifier: "business-platform-url",
    });
    if (!platformUrl) {
      console.log("missing identifier of business-platform-url in the Platform Settings table");
      return;
    }
    const setPasswordLink = `${platformUrl.value}/activation/set-password?code=${resetPasswordToken}&&email=${user.email}`;
    const userProjects = params.projects;
    let scopeText = "";
    if (user.role.name === "corporate") {
      scopeText = "All projects.";
    }
    let projectNames = [];
    if (user.role.name === "corporatestandard") {
      for (var projectId = 0; projectId < userProjects.length; projectId++) {
        var project = await strapi.services.projects.findOne({
          id: userProjects[projectId],
        });
        if (project) {
          projectNames.push(project.name);
        }
      }
      projectNames = projectNames.join(", ");
      scopeText = `${projectNames.length > 1
        ? `${projectNames} projects.`
        : `${projectNames} project.`
        }`;
    }
    const emailData = {
      from: "support@fixarwanda.com",
      to: [`${user.email}`],
      subject: "Welcome to Fixa",
      template: "corporate-user-invite-email",
      "v:admin_user_name": `${invitingUser.first_name || invitingUser.last_name
        }`,
      "v:admin_user_email": `${invitingUser.email}`,
      "v:scope_text": `${scopeText}`,
      "v:join_link": setPasswordLink,
      "v:twitter_page_link": "#",
      "v:linkedin_page_link": "#",
      "v:instagram_page_link": "#",
    };
    // Send an email to the user.
    mailgun.messages().send(emailData);
    // Update the user.
    user.invite_accepted = false;
    await strapi
      .query("user", "users-permissions")
      .update({ id: user.id }, user);

    // create Client User Object Optimized for operations.
    const clientUser = {
      full_name: `${user.first_name} ${user.last_name}`,
      // projects: projectNames,
      status: user.invite_accepted ? "active" : "pending",
      email: user.email,
      phone_number: user.username,
      added_by: `${invitingUser.first_name}`,
      position_name: `${user.position.name}`,
      access: `${user.role.name === "corporate" ? "admin" : "standard"}`,
      user_id: user.id,
      client_id: params.client_id,
      client_projects: params.projects,
      type: "object",
      dataset: "users",
    };
    await strapi.services["client-users"].create(clientUser);
  } catch (error) {
    console.log("Error happened in /build-log/inviteUserToClientPlatform() ", error.message);
  }
};

const rolesAssignmentToUsers = async () => {
  try {
    const users = await strapi
      .query("user", "users-permissions")
      .find({ _limit: -1 });
    if (users.length !== 0) {
      for (var i = 0; i < users.length; i++) {
        const user = users[i];
        if (user.role.name === "corporate") {
          const client = await strapi.services["client-users"].findOne({
            user_id: user.id,
          });
          if (!client) {
            const clientUser = {
              full_name: `${user.first_name} ${user.last_name}`,
              projects: "Inyange Plant", // dynamically add all projects
              status: "active",
              email: user.email,
              phone_number: user.username,
              added_by: "system",
              position_name: `${user.position ? user.position.name : "-"}`,
              access: `${user.role.name === "corporate" ? "admin" : "standard"
                }`,
              user_id: user.id,
              client_id: 1,
              type: "object",
              dataset: "users",
              created_at: user.created_at,
              updated_at: user.updated_at,
            };
            await strapi.services["client-users"].create(clientUser);
          }
        }
      }
    }
  } catch (error) {
    console.log("error happened in api/build-log/controllers/build-log/rolesAssignmentToUsers() ", error.message);
  }
};

const updateUserProfile = async (requestPayload) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      email,
      projects,
      position,
      role,
    } = requestPayload;

    const roleData = await strapi
      .query("role", "users-permissions")
      .findOne({ name: role });

    if (!roleData) {
      console.log(`I can not find role(${role}), code should not get here`);
      return;
    }
    const userData = {
      username: requestPayload.phone_number, //update field name of phone number to username since we store phone in the place of username in our database
      role: roleData.id,
      first_name,
      last_name,
      phone_number,
      email,
      projects,
      position,
    };

    await strapi
      .query("user", "users-permissions")
      .update({ id: requestPayload.user_id }, userData);

    const user = await strapi
      .query("user", "users-permissions")
      .findOne({ id: requestPayload.user_id });

    if (user) {
      const clientUser = await strapi.services["client-users"].findOne({
        id: requestPayload.client_id,
      });

      const selectedProjectNames = [];
      for (var i = 0; i < projects.length; i++) {
        const singleProject = await strapi.services.projects.findOne({
          id: projects[i],
        });
        if (singleProject) {
          selectedProjectNames.push(singleProject.name);
        }
      }
      if (clientUser) {
        await strapi.services["client-users"].update(
          {
            id: requestPayload.client_id,
          },
          {
            full_name: `${user.first_name} ${user.last_name}`,
            projects: selectedProjectNames.join(","),
            email: user.email,
            phone_number: user.username,
            position_name: `${user.position.name}`,
            access: `${user.role.name === "corporate" ? "admin" : "standard"}`,
            user_id: user.id,
          }
        );
      }
    }
  } catch (err) {
    console.log("Error happened in /build-log/updateUserProfile() ", err.message);
  }
};

module.exports = {
  /**
   * Invite new corporate user
   * @param {*} ctx
   * @returns
   */
  async inviteCorporateUser(ctx) {
    const response = {
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      /**
       * TO DO
       * 1. Register basic user information
       * 2. set temporary password for user
       * 3. Generate "forgot password link"(FPL)
       * 4. Send email to invited user with FPL
       */

      const params = ctx.request.body;
      const invitingUser = ctx.state.user;

      if (!invitingUser || invitingUser.role.name !== "corporate") {
        response.errors.push("You're not allowed to invite a user");
        response.status = "failure";
        return response;
      }

      if (!params.first_name || !params.last_name) {
        response.errors.push("The first name or last name is required");
      } else if (!params.email) {
        response.errors.push("The email is required");
      } else if (!emailRegExp.test(params.email)) {
        response.errors.push("Please provide a valid email address");
      } else if (!params.username) {
        response.errors.push("The phone number is required");
      } else if (!params.role) {
        response.errors.push("The role is required");
      } else if (!params.projects) {
        response.errors.push(
          `Please assign ${params.first_name} to at least one project`
        );
      } else if (!params.position) {
        response.errors.push(
          `Please assign ${params.first_name} to at least one position`
        );
      }
      else if (!params.client_id) {
        response.errors.push(
          `${invitingUser.first_name}, We are missing a way to identify what client you belong to. This is a system issue. Please contact FIXA to help.`
        );
      }

      // check if user is assigned to a recognized/valid client

      const client = await strapi.services.clients.findOne({
        id: params.client_id,
      });
      if (!client) {
        response.errors.push(
          `${invitingUser.first_name}, We can not find the client you're trying to invite ${params.first_name} to. This is a system issue. Please contact FIXA to help.`
        );
      }

      // check if we've assigned valid position
      const contactPosition = await strapi.services["contact-position"].findOne(
        { id: params.position }
      );
      if (!contactPosition) {
        response.errors.push(
          `Please assign to ${params.first_name} a valid position.`
        );
      }

      // check if we've assigned valid projects
      const submittedProjects = params.projects;
      if (typeof submittedProjects !== "object") {
        response.errors.push(
          "You've submitted the projects in an unexpected format. If you're an end user, this is a system issue. Please contact FIXA to help."
        );
      } else if (typeof submittedProjects === "object") {
        for (
          var projectId = 1;
          projectId <= submittedProjects.length;
          projectId++
        ) {
          const storedProject = await strapi.services.projects.findOne({
            id: submittedProjects[projectId],
          });
          if (!storedProject) {
            response.errors.push(
              `Please assign a recognized project to ${params.first_name}`
            );
            break;
          }
        }
      }

      if (response.errors.length !== 0) {
        response.status = "failure";
        return response;
      }

      inviteUserToClientPlatform(params, invitingUser);

      response.status = "success";
      response.data = [
        `We've successfully sent an invite to ${params.first_name} ${params.last_name} to their email(${params.email}).`,
      ];
      return response;
    } catch (error) {
      console.log("Error happened in /corporate/invite-user/inviteCorporateUser() ", error.message);
      response.errors.push(`Error happened - ${error}`);
      response.status = "failure";
    }
    return response;
  },
  async setPassword(ctx) {
    const response = {
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const params = _.assign({}, ctx.request.body, ctx.params);
      if (!params.password) {
        response.errors.push("The password is required");
      } else if (!params.passwordConfirmation) {
        response.errors.push("The password confirmation is required");
      }

      if (
        params.password &&
        params.passwordConfirmation &&
        params.password !== params.passwordConfirmation
      ) {
        response.status = "failure";
        response.errors.push("Passwords do not match.");
      }

      if (!params.code) {
        response.errors.push(
          "You do not have permission to reset. This is either a hack or a system issue. Please contact Fixa to help."
        );
      }

      if (response.errors.length !== 0) {
        response.status = "failure";
        return response;
      }

      const user = await strapi
        .query("user", "users-permissions")
        .findOne({ resetPasswordToken: `${params.code}` });

      if (!user) {
        response.status = "failure";
        response.errors.push("Incorrect code provided.");
        return response;
      }

      // Delete the current code
      user.resetPasswordToken = null;

      user.password = await strapi.plugins[
        "users-permissions"
      ].services.user.hashPassword({
        password: params.password,
      });

      //update invite from user
      user.invite_accepted = true;

      // Update the user.
      await strapi
        .query("user", "users-permissions")
        .update({ id: user.id }, user);

      // update client user object
      await strapi.services["client-users"].update(
        { user_id: user.id },
        {
          status: "active",
        }
      );

      response.data = {
        jwt: strapi.plugins["users-permissions"].services.jwt.issue({
          id: user.id,
          client_id: user.client_id.id,
          first_name: user.first_name,
          last_name: user.last_name,
          position: user.position.name,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query("user", "users-permissions").model,
        }),
      };
    } catch (error) {
      console.log("Error happened in /corporate/reset-password/changePassword() ", error.message);
      response.errors.push(`Error happened - ${error}`);
      response.status = "failure";
    }

    return response;
  },

  async changePassword(ctx) {
    const response = {
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { currentPassword, newPassword, newPasswordConfirmation } =
        ctx.request.body;

      const errors = [];
      if (!currentPassword) {
        errors.push("Your current password is required");
      }

      if (!newPassword) {
        errors.push("Your new password is required");
      }

      if (!newPasswordConfirmation) {
        errors.push("Confirming your new password is required");
      }

      if (newPassword !== newPasswordConfirmation) {
        errors.push("Your password and confirmation do not match.");
      }

      if (errors.length !== 0) {
        response.status = "failure";
        response.errors = errors;
        return response;
      }

      const authUser = ctx.state.user;

      if (!authUser) {
        response.errors.push("Please login to change your password");
        response.status = "failure";
        return response;
      }

      const exUser = await strapi
        .query("user", "users-permissions")
        .findOne({ id: authUser.id });
      const passwordIsValid = await strapi.plugins[
        "users-permissions"
      ].services.user.validatePassword(currentPassword, exUser.password);

      if (!passwordIsValid) {
        errors.push(
          "The current password you've provided is wrong. Please provide a correct one. If don't remember you can log out and request a reset of your password."
        );
        response.status = "failure";
        response.errors = errors;
        return response;
      }

      const newHashedPassword = await strapi.plugins[
        "users-permissions"
      ].services.user.hashPassword({
        password: newPassword,
      });

      await strapi.query("user", "users-permissions").update(
        { id: exUser.id },
        {
          password: newHashedPassword,
        }
      );

      response.status = "success";
      response.data =
        "Your password has successfully been updated. We will log you out so you can use your new password.";
      return response;
    } catch (error) {
      console.log("Error happened in /corporate/changePassword ", error.message);
      response.errors.push(`Error happened - ${error}`);
      response.status = "failure";
    }

    return response;
  },
  async login(ctx) {
    const response = {
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const provider = "local";
      const params = ctx.request.body;

      const store = await strapi.store({
        environment: "",
        type: "plugin",
        name: "users-permissions",
      });

      if (provider === "local") {
        if (!_.get(await store.get({ key: "grant" }), "email.enabled")) {
          return ctx.badRequest(null, "This provider is disabled.");
        }

        // The identifier is required.
        if (!params.identifier) {
          response.errors.push("Please provide your username or your e-mail.");
        }

        // The password is required.
        if (!params.password) {
          response.errors.push("Please provide your password.");
        }

        if (response.errors.length !== 0) {
          response.status = "failure";
          return response;
        }

        const query = { provider };

        // Check if the provided identifier is an email or not.
        const isEmail = emailRegExp.test(params.identifier);

        // Set the identifier to the appropriate query field.
        if (isEmail) {
          query.email = params.identifier.toLowerCase();
        } else {
          query.username = params.identifier;
        }

        // Check if the user exists.
        const user = await strapi
          .query("user", "users-permissions")
          .findOne(query);

        if (!user) {
          response.errors.push("Identifier or password invalid.");
          response.status = "failure";
          return response;
        }

        if (
          _.get(await store.get({ key: "advanced" }), "email_confirmation") &&
          user.confirmed !== true
        ) {
          response.errors.push("Your account email is not confirmed");
          response.status = "failure";
          return response;
        }

        if (user.blocked === true) {
          response.errors.push(
            "Your account has been blocked by an administrator"
          );
          response.status = "failure";
          return response;
        }

        // The user never authenticated with the `local` provider.
        if (!user.password) {
          response.errors.push(
            "This user never set a local password, please login with the provider used during account creation."
          );
          response.status = "failure";
          return response;
        }

        const validPassword = await strapi.plugins[
          "users-permissions"
        ].services.user.validatePassword(params.password, user.password);

        const client_status = await strapi
          .query("client-users")
          .findOne({ user_id: user.id });

        if (!validPassword) {
          response.errors.push("Email, username or password are invalid.");
          response.status = "failure";
          return response;
        }
        if (client_status.status === "inactive") {
          response.status = "success";
          response.data = {
            client_user_status: client_status.status,
            user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
              model: strapi.query("user", "users-permissions").model,
            }),
          };
        } else {
          response.status = "success";
          response.data = {
            jwt: strapi.plugins["users-permissions"].services.jwt.issue({
              id: user.id,
              client_id: user.client_id.id,
              first_name: user.first_name,
              last_name: user.last_name,
              position: user.position.name,
            }),
            client_user_status: client_status.status,
            user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
              model: strapi.query("user", "users-permissions").model,
            }),
          };
        }
      }
    } catch (error) {
      console.log("Error happened in /api/build-log/controllers/build-log/login() ", error.message);
      response.errors.push(
        "This is a system issue. Please contact FIXA to help."
      );
    }
    return response;
  },

  async updateUser(ctx) {
    const response = {
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const params = ctx.request.body;
      const {
        first_name,
        last_name,
        email,
        projects,
        position,
        role,
        phone_number,
      } = params;
      /**
       * 1. Validate body
       */

      const errors = [];

      if (!first_name) {
        errors.push("The first name is required");
      }

      if (!last_name) {
        errors.push("The last name is required");
      }

      if (!email) {
        errors.push("The email is required");
      } else if (!emailRegExp.test(email)) {
        errors.push("Please provide a valid email address.");
      }

      if (!projects) {
        errors.push("Users should be assigned to at least one project");
      } else if (typeof projects !== "object" || projects.length === 0) {
        errors.push("Please provide valid projects");
      } else {
        for (var i = 0; i < projects.length; i++) {
          if (typeof projects[i] !== "number") {
            errors.push(
              "One of the projects you have submitted is not recognized. Please provide valid projects assigned to this user"
            );
            break;
          }
        }
      }

      if (!position) {
        errors.push("The position is required");
      } else if (typeof position !== "number") {
        errors.push("Please provide a valid position.");
      }

      if (!role) {
        errors.push("The access is required");
      } else if (!["corporate", "corporatestandard"].includes(role)) {
        errors.push(
          `The ${role} role is not recognized. Please provide a valid role`
        );
      }

      if (!phone_number) {
        errors.push("The phone number is required");
      } else {
        // check phone number lengh
        //250788439355
        if (phone_number.length !== 12) {
          errors.push(
            "The phone number you provided is not in the expected format. Please provide a 12 lengh phone number in this format 250xxxxxxxxx"
          );
        }
      }

      if (errors.length !== 0) {
        response.status = "failure";
        response.errors = errors;
        return response;
      }

      updateUserProfile(params);

      response.status = "success";
    } catch (error) {
      console.log("Error happened in /api/build-log/controllers/build-log/updateUser() ", error.message);
      response.errors.push(
        "This is a system issue. Please contact FIXA to help."
      );
    }
    return response;
  },
  async migrateCorporateUsers(ctx) {
    const response = {
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      /**
       * TO DO
       * 1. Query all users
       * 2. For users with the corporate role, change inv
       */
      rolesAssignmentToUsers();
    } catch (error) {
      console.log("Error happened in /corporate/migrate-users/migrateCorporateUsers() ", error.message);
      response.errors.push(`Error happened - ${error}`);
      response.status = "failure";
    }

    return response;
  },
};
