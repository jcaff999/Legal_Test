'use strict'

const { getService } = require('@strapi/plugin-users-permissions/server/utils')
const validator = require('validator')
const { addContact } = require('../../../../shared/hubspot.service')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

let shouldResendVerification = false

module.exports = {
  async afterCreate(event) {
    const { data } = event.params
    if (data.subscribed) {
      // subscribe to newsletter
      await addContact(data.email)
    }
  },

  async beforeUpdate(event) {
    const { where, data } = event.params
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where })
    if (user && user.confirmed === false && data.confirmed === true) {
      const msg = {
        to: user.email,
        from: 'Legaltech Hub <no-reply@legaltechnologyhub.com>',
        templateId: 'd-760ad66cb8c6440a868c4bb186b7c0b6',
        dynamicTemplateData: {
          url: process.env.FRONTEND_URL + '/signin',
        },
      }
      await strapi.plugins.email.services.email.send(msg)
    }

    if (data.email && user && user.email !== data.email) {
      shouldResendVerification = true
      data.confirmed = false
    } else {
      shouldResendVerification = false
    }
  },

  async afterUpdate(event) {
    // update review
    const { result } = event
    if (result.reviews && Array.isArray(result.reviews)) {
      result.reviews.map((review) => {
        let title = ''
        let subTitle = ''
        if (review.anonymous) {
          title = result.jobTitle
          subTitle = result.companySize
        } else {
          title = result.username
          const company = result.companyName ? `, ${result.companyName}` : ''
          subTitle = result.jobTitle + company
        }
        if (review.submitterTitle !== title || review.submitterSubTitle !== subTitle) {
          strapi.entityService.update('api::review.review', review.id, {
            data: { submitterTitle: title, submitterSubTitle: subTitle },
          })
        }
        return null
      })
    }

    // resend confirmation email
    const { data } = event.params
    if (shouldResendVerification === true) {
      if (validator.isEmail(data.email)) {
        data.email = data.email.toLowerCase()
      } else {
        return
      }
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: data.email },
      })

      if (user.confirmed) {
        return
      }

      if (user.blocked) {
        return
      }

      try {
        await getService('user').sendConfirmationEmail(user)
      } catch (err) {
        console.log('send confirmation email error->', err)
      }
    }
  },
}
