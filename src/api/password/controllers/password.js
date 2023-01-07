const { sanitize } = require('@strapi/utils/lib')
const { ValidationError } = require('@strapi/utils/lib/errors')
const { getService } = require('@strapi/plugin-users-permissions/server/utils')
const _ = require('lodash')

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state
  const userSchema = strapi.getModel('plugin::users-permissions.user')

  return sanitize.contentAPI.output(user, userSchema, { auth })
}

module.exports = {
  async change(ctx) {
    // Get posted params
    const params = _.assign({}, ctx.request.body, ctx.params)
    // The identifier is required.
    if (!params.identifier) {
      throw new ValidationError('Invalid identifier or password')
    }

    if (params.newPassword !== params.confirmPassword) {
      throw new ValidationError('Password and confirmation password is different')
    }

    // Get User based on identifier
    const user = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { email: params.identifier.toLowerCase() } })

    if (!user) {
      throw new ValidationError('Invalid identifier or password')
    }
    // Validate given password against user query result password
    const validPassword = await getService('user').validatePassword(params.password, user.password)

    if (!validPassword) {
      throw new ValidationError('Invalid identifier or password')
    } else {
      await getService('user').edit(user.id, { resetPasswordToken: null, password: params.newPassword })

      // Return new jwt token
      ctx.send({
        jwt: user.confirmed ? getService('jwt').issue({ id: user.id }) : null,
        user: await sanitizeUser(user, ctx),
      })
    }
  },

  async getInfo(ctx) {
    const params = _.assign({}, ctx.request.body, ctx.params)
    const userToken = params.token
    if (!userToken) {
      throw new ValidationError('Token is required')
    }

    const token = await getService('jwt').verify(userToken)
    if (!token || !token.id) {
      throw new ValidationError('Invalid token')
    }
    const id = token.id

    // Get User based on identifier
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { id } })

    if (!user) {
      throw new ValidationError('Invalid identifier')
    }
    // Return new jwt token
    ctx.send({
      jwt: getService('jwt').issue({ id: user.id }),
      user: await sanitizeUser(user, ctx),
    })
  },
}
