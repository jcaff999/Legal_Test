'use strict'

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require('crypto')
const _ = require('lodash')
const utils = require('@strapi/utils')
const { getService } = require('@strapi/plugin-users-permissions/server/utils')
const {
  validateCallbackBody,
  validateRegisterBody,
  validateSendEmailConfirmationBody,
  validateEmailConfirmationBody,
  validateChangePasswordBody,
} = require('@strapi/plugin-users-permissions/server/controllers/validation/auth')
const { validatePasswordPolicy } = require('../../../shared/utils/validatePasswordPolicy')
const { verifyRecaptcha } = require('../../../shared/utils/verifyRecaptcha')

const { sanitize } = utils
const { ApplicationError, ValidationError } = utils.errors

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state
  const userSchema = strapi.getModel('plugin::users-permissions.user')

  return sanitize.contentAPI.output(user, userSchema, { auth })
}

module.exports = {
  async callback(ctx) {
    const provider = ctx.params.provider || 'local'
    const params = ctx.request.body

    const store = await strapi.store({ type: 'plugin', name: 'users-permissions' })

    if (provider === 'local') {
      if (!_.get(await store.get({ key: 'grant' }), 'email.enabled')) {
        throw new ApplicationError('This provider is disabled')
      }

      await validateCallbackBody(params)

      const query = { provider }

      // Check if the provided identifier is an email or not.
      const isEmail = emailRegExp.test(params.identifier)

      // Set the identifier to the appropriate query field.
      if (isEmail) {
        query.email = params.identifier.toLowerCase()
      } else {
        query.username = params.identifier
      }

      // Check if the user exists.
      const user = await strapi.query('plugin::users-permissions.user').findOne({ where: query })

      if (!user) {
        throw new ValidationError('Invalid identifier or password')
      }

      if (user.blocked === true) {
        throw new ApplicationError('Your account has been blocked by an administrator')
      }

      // The user never authenticated with the `local` provider.
      if (!user.password) {
        throw new ApplicationError(
          'This user never set a local password, please login with the provider used during account creation',
        )
      }

      const validPassword = await getService('user').validatePassword(params.password, user.password)

      if (!validPassword) {
        throw new ValidationError('Invalid identifier or password')
      } else {
        ctx.send({
          jwt: getService('jwt').issue({
            id: user.id,
          }),
          user: await sanitizeUser(user, ctx),
        })
      }
    } else {
      if (!_.get(await store.get({ key: 'grant' }), [provider, 'enabled'])) {
        throw new ApplicationError('This provider is disabled')
      }

      // Connect the user with the third-party provider.
      let user
      let error
      try {
        ;[user, error] = await getService('providers').connect(provider, ctx.query)
      } catch ([user, error]) {
        throw new ApplicationError(error.message)
      }

      if (!user) {
        throw new ApplicationError(error.message)
      }
      ctx.send({
        jwt: getService('jwt').issue({ id: user.id }),
        user: await sanitizeUser(user, ctx),
      })
    }
  },

  async changePassword(ctx) {
    if (!ctx.state.user) {
      throw new ApplicationError('You must be authenticated to reset your password')
    }

    const { currentPassword, password } = await validateChangePasswordBody(ctx.request.body)

    const user = await strapi.entityService.findOne('plugin::users-permissions.user', ctx.state.user.id)

    const validPassword = await getService('user').validatePassword(currentPassword, user.password)

    if (!validPassword) {
      throw new ValidationError('The provided current password is invalid')
    }

    if (currentPassword === password) {
      throw new ValidationError('Your new password must be different than your current password')
    }

    await getService('user').edit(user.id, { password })

    ctx.send({
      jwt: getService('jwt').issue({ id: user.id }),
      user: await sanitizeUser(user, ctx),
    })
  },

  async resetPassword(ctx) {
    const params = _.assign({}, ctx.request.body, ctx.params)

    if (
      params.password &&
      params.passwordConfirmation &&
      params.password === params.passwordConfirmation &&
      params.code
    ) {
      const user = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { resetPasswordToken: `${params.code}` } })

      if (!user) {
        throw new ValidationError('Incorrect code provided')
      }

      await getService('user').edit(user.id, { resetPasswordToken: null, password: params.password })
      // Update the user.
      ctx.send({
        jwt: getService('jwt').issue({ id: user.id }),
        user: await sanitizeUser(user, ctx),
      })
    } else if (params.password && params.passwordConfirmation && params.password !== params.passwordConfirmation) {
      throw new ValidationError('Passwords do not match')
    } else {
      throw new ValidationError('Incorrect params provided')
    }
  },

  async connect(ctx, next) {
    const grant = require('grant-koa')

    const providers = await strapi.store({ type: 'plugin', name: 'users-permissions', key: 'grant' }).get()

    const apiPrefix = strapi.config.get('api.rest.prefix')
    const grantConfig = {
      defaults: {
        prefix: `${apiPrefix}/connect`,
      },
      ...providers,
    }

    const [requestPath] = ctx.request.url.split('?')
    const provider = requestPath.split('/connect/')[1].split('/')[0]

    if (!_.get(grantConfig[provider], 'enabled')) {
      throw new ApplicationError('This provider is disabled')
    }

    if (!strapi.config.server.url.startsWith('http')) {
      strapi.log.warn(
        'You are using a third party provider for login. Make sure to set an absolute url in config/server.js. More info here: https://docs.strapi.io/developer-docs/latest/plugins/users-permissions.html#setting-up-the-server-url',
      )
    }

    // Ability to pass OAuth callback dynamically
    grantConfig[provider].callback =
      _.get(ctx, 'query.callback') || _.get(ctx, 'session.grant.dynamic.callback') || grantConfig[provider].callback
    grantConfig[provider].redirect_uri = getService('providers').buildRedirectUri(provider)

    return grant(grantConfig)(ctx, next)
  },

  async forgotPassword(ctx) {
    let { email } = ctx.request.body

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email)

    if (isEmail) {
      email = email.toLowerCase()
    } else {
      throw new ValidationError('Please provide a valid email address')
    }

    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' })

    // Find the user by email.
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email: email.toLowerCase() } })

    // User not found.
    if (!user) {
      // throw new ApplicationError('This email does not exist');
      return ctx.send({ ok: true })
    }

    // User blocked
    if (user.blocked) {
      // throw new ApplicationError('This user is disabled');
      return ctx.send({ ok: true })
    }

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString('hex')

    const settings = await pluginStore.get({ key: 'email' }).then((storeEmail) => {
      try {
        return storeEmail.reset_password.options
      } catch (error) {
        return {}
      }
    })

    const advanced = await pluginStore.get({
      key: 'advanced',
    })

    const userInfo = await sanitizeUser(user, ctx)

    settings.message = await getService('users-permissions').template(settings.message, {
      URL: advanced.email_reset_password,
      USER: userInfo,
      TOKEN: resetPasswordToken,
    })

    settings.object = await getService('users-permissions').template(settings.object, {
      USER: userInfo,
    })

    try {
      // Send an email to the user.
      await strapi
        .plugin('email')
        .service('email')
        .send({
          to: user.email,
          from:
            settings.from.email || settings.from.name ? `${settings.from.name} <${settings.from.email}>` : undefined,
          replyTo: settings.response_email,
          templateId: 'd-0e6e5065a02b49609fcac7d5b3bf0ee7',
          dynamicTemplateData: {
            url: advanced.email_reset_password + '?code=' + resetPasswordToken,
          },
        })
    } catch (err) {
      throw new ApplicationError(err.message)
    }

    // Update the user.
    await strapi
      .query('plugin::users-permissions.user')
      .update({ where: { id: user.id }, data: { resetPasswordToken } })

    ctx.send({ ok: true })
  },

  async register(ctx) {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' })

    const settings = await pluginStore.get({
      key: 'advanced',
    })

    if (!settings.allow_register) {
      throw new ApplicationError('Register action is currently disabled')
    }

    const params = {
      ..._.omit(ctx.request.body, ['confirmed', 'confirmationToken', 'resetPasswordToken']),
      provider: 'local',
    }

    if (!params.gReCaptchaToken) {
      throw new ValidationError('Invalid google recaptcha token!')
    }
    const recaptchaSuccess = await verifyRecaptcha(params.gReCaptchaToken)
    if (!recaptchaSuccess) {
      throw new ValidationError('Google ReCaptcha Failure!')
    }

    await validateRegisterBody(params)

    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (getService('user').isHashed(params.password)) {
      throw new ValidationError('Your password cannot contain more than three times the symbol `$`')
    }

    const policy = validatePasswordPolicy(params.password)
    if (policy !== 'success') {
      throw new ValidationError(policy)
    }

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: settings.default_role } })

    if (!role) {
      throw new ApplicationError('Impossible to find the default role')
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email)

    if (isEmail) {
      params.email = params.email.toLowerCase()
    } else {
      throw new ValidationError('Please provide a valid email address')
    }

    params.role = role.id

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: params.email },
    })

    if (user && user.provider === params.provider) {
      throw new ApplicationError('Email is already taken')
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      throw new ApplicationError('Email is already taken')
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true
      }

      const user = await getService('user').add(params)

      const sanitizedUser = await sanitizeUser(user, ctx)

      if (settings.email_confirmation) {
        try {
          await getService('user').sendConfirmationEmail(sanitizedUser)
        } catch (err) {
          throw new ApplicationError(err.message)
        }

        // return ctx.send({ user: sanitizedUser });
      }

      const jwt = getService('jwt').issue(_.pick(user, ['id']))

      return ctx.send({
        jwt,
        user: sanitizedUser,
      })
    } catch (err) {
      if (_.includes(err.message, 'username')) {
        throw new ApplicationError('Username already taken')
      } else if (_.includes(err.message, 'email')) {
        throw new ApplicationError('Email already taken')
      } else {
        strapi.log.error(err)
        throw new ApplicationError('An error occurred during account creation')
      }
    }
  },

  async emailConfirmation(ctx, next, returnUser) {
    const { confirmation: confirmationToken } = await validateEmailConfirmationBody(ctx.query)

    const userService = getService('user')
    const jwtService = getService('jwt')

    const [user] = await userService.fetchAll({ filters: { confirmationToken } })

    if (!user) {
      throw new ValidationError('Invalid verification code')
    }
    if (!user.confirmed) {
      await userService.edit(user.id, { confirmed: true })
    }

    if (returnUser) {
      ctx.send({
        jwt: jwtService.issue({ id: user.id }),
        user: await sanitizeUser(user, ctx),
      })
    } else {
      const settings = await strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' }).get()

      ctx.redirect(settings.email_confirmation_redirection || '/')
    }
  },

  async sendEmailConfirmation(ctx) {
    const { email } = await validateSendEmailConfirmationBody(ctx.request.body)

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return ctx.send({ email, sent: true })
    }

    if (user.confirmed) {
      throw new ApplicationError('Already confirmed')
    }

    if (user.blocked) {
      throw new ApplicationError('User blocked')
    }

    await getService('user').sendConfirmationEmail(user)

    ctx.send({
      email: user.email,
      sent: true,
    })
  },
}
