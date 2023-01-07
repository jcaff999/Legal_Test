'use strict'

/**
 * premium-organization controller
 */

const { createCoreController } = require('@strapi/strapi').factories
const { ValidationError } = require('@strapi/utils/lib/errors')
const { verifyRecaptcha } = require('../../../shared/utils/verifyRecaptcha')

module.exports = createCoreController('api::premium-organization.premium-organization', ({ strapi }) => ({
  async registerPremiumOrganization(ctx) {
    const data = ctx.data
    if (!data.gReCaptchaToken) {
      throw new ValidationError('Invalid google recaptcha token!')
    }
    const recaptchaSuccess = await verifyRecaptcha(data.gReCaptchaToken)
    if (!recaptchaSuccess) {
      throw new ValidationError('Google ReCaptcha Failure!')
    }
    data.publishedAt = null
    data.status = 'Registered (Not Paid)'
    const entity = await strapi.entityService.create('api::premium-organization.premium-organization', {
      data,
      populate: '*',
    })
    // // send emails
    // const receivers = await strapi.entityService.findMany('api::email-receiver.email-receiver', {
    //   filters: { enable: true },
    //   limit: -1,
    //   publicationState: 'live',
    // })
    // if (receivers && receivers.length > 0) {
    //   const emails = receivers.map((receiver) => receiver.email)
    //   sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    //   const msg = {
    //     to: emails,
    //     from: 'Legaltech Hub <info@legaltechnologyhub.com>',
    //     subject: 'New listing request has been submitted.',
    //     text: `Product/Company name: ${data.companyName}
    //     Submitter's name: ${data.submittedName}
    //     Submitter's email: ${data.submittedEmail}
    //     Enhanced/Simple listing: ${data.basicOrEnhanced}
    //     New/Update request or not: ${data.createOrUpdate}
    //     Request Information: ${process.env.URL}/admin/content-manager/collectionType/api::listing-request.listing-request/${entity.id}
    //     `,
    //     html: `<p>Product/Company name: ${data.companyName}</p>
    //             <p>Submitter's name: ${data.submittedName}</p>
    //             <p>Submitter's email: ${data.submittedEmail}</p>
    //             <p>Enhanced/Simple listing: ${data.basicOrEnhanced}</p>
    //             <p>New/Update request or not: ${data.createOrUpdate}</p>
    //             <p>Request Information: ${process.env.URL}/admin/content-manager/collectionType/api::listing-request.listing-request/${entity.id}</p>
    //     `,
    //   }
    //   sgMail.sendMultiple(msg)
    // }

    return entity
  },
}))
