'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const _ = require('lodash');
const grant = require('grant-koa');
const { sanitizeEntity } = require('strapi-utils');
const jwt = require('jsonwebtoken');
var api_key = process.env.MAILGUN_API_KEY
var domain = process.env.MAILGUN_DOMAIN
var mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });
const utils = require("../../../config/functions/utils");
const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const tokenVerification = (token) => {
  const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET)
  return decoded;
}

module.exports = {
  // this function is used for login using (auth/local) endpoint
  async callback(ctx) {

    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;

    const store = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    if (provider === 'local') {
      if (!_.get(await store.get({ key: 'grant' }), 'email.enabled')) {
        return ctx.badRequest(null, 'This provider is disabled.');
      }

      // The identifier is required.
      if (!params.identifier) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.email.provide',
            message: 'Please provide your username or your e-mail.',
          })
        );
      }

      // The password is required.
      if (!params.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.password.provide',
            message: 'Please provide your password.',
          })
        );
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
      const user = await strapi.query('user', 'users-permissions').findOne(query);

      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.invalid',
            message: 'Identifier or password invalid.',
          })
        );
      }

      if (
        _.get(await store.get({ key: 'advanced' }), 'email_confirmation') &&
        user.confirmed !== true
      ) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.confirmed',
            message: 'Your account email is not confirmed',
          })
        );
      }

      if (user.blocked === true) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.blocked',
            message: 'Your account has been blocked by an administrator',
          })
        );
      }

      // The user never authenticated with the `local` provider.
      if (!user.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.password.local',
            message:
              'This user never set a local password, please login with the provider used during account creation.',
          })
        );
      }

      const validPassword = await strapi.plugins[
        'users-permissions'
      ].services.user.validatePassword(params.password, user.password);

      if (!validPassword) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.invalid',
            message: 'Identifier or password invalid.',
          })
        );
      } else {
        ctx.send({
          jwt: strapi.plugins["users-permissions"].services.jwt.issue({
            id: user.id,
            parent_id: user.parent_id,
            pages: user.pages,
          }),
          user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
            model: strapi.query("user", "users-permissions").model,
          }),
        });
      }
    } else {
      if (!_.get(await store.get({ key: 'grant' }), [provider, 'enabled'])) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'provider.disabled',
            message: 'This provider is disabled.',
          })
        );
      }

      // Connect the user with the third-party provider.
      let user;
      let error;
      try {
        [user, error] = await strapi.plugins['users-permissions'].services.providers.connect(
          provider,
          ctx.query
        );
      } catch ([user, error]) {
        return ctx.badRequest(null, error === 'array' ? error[0] : error);
      }

      if (!user) {
        return ctx.badRequest(null, error === 'array' ? error[0] : error);
      }

      ctx.send({
        jwt: strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    }
  },

  async resetPassword(ctx) {
    const params = _.assign({}, ctx.request.body, ctx.params);

    if (
      params.password &&
      params.passwordConfirmation &&
      params.password === params.passwordConfirmation &&
      params.token
    ) {
      try {
        const decoded = tokenVerification(params.token);
      } catch (error) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'TOKEN ERROR!',
            message: 'Your token has Expired or Invalid,Request another Link',
          })
        );
      }

      const user = await strapi
        .query('user', 'users-permissions')
        .findOne({ resetPasswordToken: `${params.token}` });

      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.code.provide',
            message: 'Incorrect code provided.',
          })
        );
      }

      const password = await strapi.plugins['users-permissions'].services.user.hashPassword({
        password: params.password,
      });

      // Update the user.
      await strapi
        .query('user', 'users-permissions')
        .update({ id: user.id }, { resetPasswordToken: null, password });

      try {

        let data = {
          from: `${process.env.FIXA_EMAIL}`,
          to: [
            `${user.email}`
          ],
          subject: "Reset your password",
          template: "corporate_reset_password",
        }
        // Send an email to the user.
        mailgun.messages().send(data);

      } catch (err) {
        return ctx.badRequest(null, err);
      }

      ctx.send({
        jwt: strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    } else if (
      params.password &&
      params.passwordConfirmation &&
      params.password !== params.passwordConfirmation
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.matching',
          message: 'Passwords do not match.',
        })
      );
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.params.provide',
          message: 'Incorrect params provided.',
        })
      );
    }
  },

  async connect(ctx, next) {
    const grantConfig = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'grant',
      })
      .get();

    const [requestPath] = ctx.request.url.split('?');
    const provider = requestPath.split('/')[2];

    if (!_.get(grantConfig[provider], 'enabled')) {
      return ctx.badRequest(null, 'This provider is disabled.');
    }

    if (!strapi.config.server.url.startsWith('http')) {
      strapi.log.warn(
        'You are using a third party provider for login. Make sure to set an absolute url in config/server.js. More info here: https://strapi.io/documentation/developer-docs/latest/development/plugins/users-permissions.html#setting-up-the-server-url'
      );
    }

    // Ability to pass OAuth callback dynamically
    grantConfig[provider].callback = _.get(ctx, 'query.callback') || grantConfig[provider].callback;
    grantConfig[provider].redirect_uri = strapi.plugins[
      'users-permissions'
    ].services.providers.buildRedirectUri(provider);

    return grant(grantConfig)(ctx, next);
  },

  async forgotPassword(ctx) {
    let { email } = ctx.request.body;
    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email);

    if (isEmail) {
      email = email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.format',
          message: 'Please provide valid email address.',
        })
      );
    }

    // Find the user by email.
    const user = await strapi
      .query('user', 'users-permissions')
      .findOne({ email: email.toLowerCase() });

    // Find the user in contact.
    const contact = await strapi
      .query('contact')
      .findOne({ email: email.toLowerCase() });

    // User not found.
    if (!user && !contact) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.user.not-exist',
          message: 'This email does not exist.',
        })
      );
    }

    // Generating Token for resetting password (5 MIN)
    const resetPasswordToken = jwt.sign({ email: email }, process.env.RESET_TOKEN_SECRET, { expiresIn: process.env.RESET_PASSWORD_TOKEN_EXPIRATION_TIME });

    //Reset url
    const url = `${process.env.CLIENT_PLATFORM}/activation/reset-password/${resetPasswordToken}`;
    const name = `${user.first_name} ${user.last_name}`;
    try {

      let data = {
        from: `support@fixarwanda.com`,
        to: [
          `${email}`
        ],
        subject: "Reset your password",
        template: "forgot-password",
        'v:reset_link': `${url}`,
        'v:name': `${name}`

      }
      // Send an email to the user.
      mailgun.messages().send(data);

    } catch (err) {
      return ctx.badRequest(null, err);
    }

    // Update the user.
    await strapi.query('user', 'users-permissions').update({ id: user.id }, { resetPasswordToken });

    ctx.send({ ok: true });
  },

  async register(ctx) {
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });
    let supervisor_password = Math.random().toString(36).slice(2, 10);
    const settings = await pluginStore.get({
      key: 'advanced',
    });

    let unHashed_password = '';

    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.advanced.allow_register',
          message: 'Register action is currently disabled.',
        })
      );
    }

    const params = {
      ..._.omit(ctx.request.body, ['confirmed', 'confirmationToken', 'resetPasswordToken']),
      provider: 'local',
    };

    // set default password for supervisors
    if (params.role === 'supervisors') {

      params.password = supervisor_password;
      unHashed_password = supervisor_password;
    }

    // Password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.provide',
          message: 'Please provide your password.',
        })
      );
    }

    // Email is required.
    /**
     * Removing the validation of an email for an artisan
     * 
     */
    if (params.role !== 'artisan') {
      if (!params.email) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.email.provide',
            message: 'Please provide your email.',
          })
        );
      }
    }

    /**
     * Validating company name for a corporate user
     */
    if (params.role === 'corporate') {
      if (!params.company_name) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.company_name.provide',
            message: 'The name of your company is required.',
          })
        );
      }
    }


    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (strapi.plugins['users-permissions'].services.user.isHashed(params.password)) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.format',
          message: 'Your password cannot contain more than three times the symbol `$`.',
        })
      );
    }

    const roleType = params.role || settings.default_role;


    const role = await strapi
      .query('role', 'users-permissions')
      .findOne({ type: roleType }, []);



    if (!role) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.role.notFound',
          message: 'Impossible to find the default role.',
        })
      );
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.format',
          message: 'Please provide valid email address.',
        })
      );
    }

    params.role = role.id;
    params.password = await strapi.plugins['users-permissions'].services.user.hashPassword(params);

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email,
    });

    if (user && user.provider === params.provider) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.taken',
          message: 'Email is already taken.',
        })
      );
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.taken',
          message: 'Email is already taken.',
        })
      );
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      const user = await strapi.query('user', 'users-permissions').create(params);
      const role_supervisor = await strapi.query('role', 'users-permissions').findOne({ name: 'Supervisor' });
      if (role_supervisor) {
        // send email to supervisors
        if (params.role.toString() === role_supervisor.id.toString()) {
          sendEmail(user, unHashed_password);
        }
      }


      const sanitizedUser = sanitizeEntity(user, {
        model: strapi.query('user', 'users-permissions').model,
      });

      /**
       * Send welcome email for a corporate user
       * 
       * 
       */
      if (user.role.type === 'corporate') {
        const platformSetting = await strapi.query('platform-settings').findOne({ identifier: 'corporate-user-login-page' });
        if (platformSetting && platformSetting.identifier && platformSetting.value) {
          strapi.services.email.send(
            user.email,
            'FIXA <no-reply@fixarwanda.com>',
            'Thanks for signing up',
            'fixa-welcome-email-corporate-user', [
            {
              name: 'company_name',
              value: user.company_name
            },
            {
              name: 'login_site',
              value: platformSetting.value
            }
          ]
          );
        }

      }

      if (settings.email_confirmation) {
        try {
          await strapi.plugins['users-permissions'].services.user.sendConfirmationEmail(user);
        } catch (err) {
          return ctx.badRequest(null, err);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue(_.pick(user, ['id']));

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      const adminError = _.includes(err.message, 'username')
        ? {
          id: 'Auth.form.error.username.taken',
          message: 'Phone number already taken',
        }
        : { id: 'Auth.form.error.username.taken', message: 'Phone number is already taken' };

      ctx.badRequest(null, formatError(adminError));
    }
  },

  async emailConfirmation(ctx, next, returnUser) {
    const { confirmation: confirmationToken } = ctx.query;

    const { user: userService, jwt: jwtService } = strapi.plugins['users-permissions'].services;

    if (_.isEmpty(confirmationToken)) {
      return ctx.badRequest('token.invalid');
    }

    const user = await userService.fetch({ confirmationToken }, []);

    if (!user) {
      return ctx.badRequest('token.invalid');
    }

    await userService.edit({ id: user.id }, { confirmed: true, confirmationToken: null });

    if (returnUser) {
      ctx.send({
        jwt: jwtService.issue({ id: user.id }),
        user: sanitizeEntity(user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    } else {
      const settings = await strapi
        .store({
          environment: '',
          type: 'plugin',
          name: 'users-permissions',
          key: 'advanced',
        })
        .get();

      ctx.redirect(settings.email_confirmation_redirection || '/');
    }
  },

  async sendEmailConfirmation(ctx) {
    const params = _.assign(ctx.request.body);

    if (!params.email) {
      return ctx.badRequest('missing.email');
    }

    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest('wrong.email');
    }

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email,
    });

    if (user.confirmed) {
      return ctx.badRequest('already.confirmed');
    }

    if (user.blocked) {
      return ctx.badRequest('blocked.user');
    }

    try {
      await strapi.plugins['users-permissions'].services.user.sendConfirmationEmail(user);
      ctx.send({
        email: user.email,
        sent: true,
      });
    } catch (err) {
      return ctx.badRequest(null, err);
    }
  },

  async verifyToken(ctx) {
    let { token } = ctx.request.body;
    try {
      const decoded = tokenVerification(token);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return ctx.badRequest(
          null,
          formatError({
            id: 'TOKEN EXPIRED!',
            message: 'Your token has Expired,Request another Link',
          })
        );
      }

      else if (error.name === 'JsonWebTokenError') {
        return ctx.badRequest(
          null,
          formatError({
            id: 'INVALID TOKEN!',
            message: 'Your token is Invalid, Request another Link',
          })
        );

      }
      else {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Token.ERROR',
            message: 'Your token has issues. Request another Link',
          })
        );
      }
    }
  }
};

function sendEmail(user, password) {
  try {
    const emailData = {
      from: "support@fixarwanda.com",
      to: [`${user.email}`],
      subject: "Welcome to Fixa",
      template: "invite supervisor",
      "v:first_name": `${user.first_name}`,
      "v:user_email": `${user.email}`,
      "v:user_password": `${password}`,
      "v:current_year": `${utils.getCurrentYear()}`
    };
    // Send an email to the user.
    mailgun.messages().send(emailData);
  } catch (error) {
    console.log("error in send email ", error.message);
  }

}