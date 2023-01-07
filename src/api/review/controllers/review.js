'use strict'
const { ValidationError } = require('@strapi/utils/lib/errors')
const _ = require('lodash')
const sgMail = require('@sendgrid/mail')
const { verifyRecaptcha } = require('../../../shared/utils/verifyRecaptcha')

/**
 *  review controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::review.review', ({ strapi }) => ({
  async create(ctx) {
    const { data } = _.assign({}, ctx.request.body, ctx.params)

    if (!data.gReCaptchaToken) {
      throw new ValidationError('Invalid google recaptcha token!')
    }
    const recaptchaSuccess = await verifyRecaptcha(data.gReCaptchaToken)
    if (!recaptchaSuccess) {
      throw new ValidationError('Google ReCaptcha Failure!')
    }

    if (!ctx.state.user) {
      throw new ValidationError('Forbidden!')
    }
    let dispName = ''
    let companyName = ''
    if (data.vendor) {
      const vendor = await strapi.entityService.findOne('api::vendor.vendor', data.vendor, { populate: ['company'] })
      dispName = vendor.displayName
      if (vendor.company) {
        companyName = vendor.company.name
      }
    } else if (data.alsp) {
      const alsp = await strapi.entityService.findOne(
        'api::alternative-legal-service.alternative-legal-service',
        data.alsp,
        {},
      )
      dispName = alsp.name
    } else if (data.consultant) {
      const consultant = await strapi.entityService.findOne('api::consulting.consulting', data.consultant, {})
      dispName = consultant.name
    }

    data.solutionDispName = dispName
    data.submittedBy = ctx.state.user.id
    if (data.anonymous === true) {
      data.submitterTitle = ctx.state.user.jobTitle
      data.submitterSubTitle = ctx.state.user.companySize
    } else {
      data.submitterTitle = ctx.state.user.username
      const company = ctx.state.user.companyName ? `, ${ctx.state.user.companyName}` : ''
      data.submitterSubTitle = ctx.state.user.jobTitle + company
    }
    const entity = await strapi.entityService.create('api::review.review', { data, populate: '*' })

    // send emails
    const receivers = await strapi.entityService.findMany('api::email-receiver.email-receiver', {
      filters: { enable: true },
      limit: -1,
      publicationState: 'live',
    })
    if (receivers && receivers.length > 0) {
      const emails = receivers.map((receiver) => receiver.email)
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
        to: emails,
        from: 'Legaltech Hub <info@legaltechnologyhub.com>',
        subject: 'New review has been submitted.',
        text: `Product name: ${data.solutionDispName}
        Company name: ${companyName}
        Review rating: ${data.rating}
        Review title: ${data.title}
        Review body: ${data.content}
        Submitter's name: ${ctx.state.user?.username}
        Dashboard: ${process.env.URL}/admin/content-manager/collectionType/api::review.review/${entity.id}
        `,
        html: `<p>Product name: ${data.solutionDispName}</p>
        <p>Company name: ${companyName}</p>
        <p>Review rating: ${data.rating}</p>
        <p>Review title: ${data.title}</p>
        <p>Review body: ${data.content}</p>
        <p>Submitter's name: ${ctx.state.user?.username}</p>
        <p>Dashboard: ${process.env.URL}/admin/content-manager/collectionType/api::review.review/${entity.id}</p>
        `,
      }
      sgMail.sendMultiple(msg)
    }

    if (entity) {
      return true
    }
    return false
  },
}))
