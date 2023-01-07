'use strict'

const sgMail = require('@sendgrid/mail')
const { ValidationError } = require('@strapi/utils/lib/errors')
const { verifyRecaptcha } = require('../../../shared/utils/verifyRecaptcha')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::listing-request.listing-request', ({ strapi }) => ({
  async createListingRequestData(ctx) {
    const data = ctx.data
    if (!data.gReCaptchaToken) {
      throw new ValidationError('Invalid google recaptcha token!')
    }
    const recaptchaSuccess = await verifyRecaptcha(data.gReCaptchaToken)
    if (!recaptchaSuccess) {
      throw new ValidationError('Google ReCaptcha Failure!')
    }
    if (data.vendorReq) {
      data.listingType = 'Vendor'
      data.basicOrEnhanced = data.enhancedVendorReq ? 'Enhanced' : 'Basic'
      data.createOrUpdate = data.vendorReq.isCreate ? 'Create' : 'Update'
      data.companyName = data.vendorReq.companyName
      data.submittedName = data.vendorReq.name
      data.submittedEmail = data.vendorReq.email
    } else if (data.consultantReq) {
      data.listingType = 'Consultant'
      data.basicOrEnhanced = data.enhancedConsultantReq ? 'Enhanced' : 'Basic'
      data.createOrUpdate = data.consultantReq.isCreate ? 'Create' : 'Update'
      data.companyName = data.consultantReq.listingName
      data.submittedName = data.consultantReq.userName
      data.submittedEmail = data.consultantReq.userEmail
    } else if (data.alspReq) {
      data.listingType = 'ALSP'
      data.basicOrEnhanced = data.enhancedAlspReq ? 'Enhanced' : 'Basic'
      data.createOrUpdate = data.alspReq.isCreate ? 'Create' : 'Update'
      data.companyName = data.alspReq.listingName
      data.submittedName = data.alspReq.userName
      data.submittedEmail = data.alspReq.userEmail
    } else {
      return
    }
    data.publishedAt = null
    data.status = 'Initial'
    if (data.listingType === 'Vendor') {
      const integrationData = data.vendorReq.integrations
      if (integrationData) {
        data.vendorReq.integrations = await Promise.all(
          integrationData.map(async (item) => {
            if (item.id) {
              return item.id
            } else if (item.name) {
              const entity = await strapi.entityService.create('api::integration.integration', {
                data: { name: item.name, published_at: null },
              })
              return entity.id.toString()
            }
          }),
        )
      }
      const customerData = data.vendorReq.existingCustomers
      if (customerData) {
        data.vendorReq.existingCustomers = await Promise.all(
          customerData.map(async (item) => {
            if (item.id) {
              return item.id
            } else if (item.name) {
              const entity = await strapi.entityService.create('api::existing-customer.existing-customer', {
                data: { name: item.name, published_at: null },
              })
              return entity.id.toString()
            }
          }),
        )
      }
    }
    const entity = await strapi.entityService.create('api::listing-request.listing-request', { data, populate: '*' })
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
        subject: 'New listing request has been submitted.',
        text: `Product/Company name: ${data.companyName}
        Submitter's name: ${data.submittedName}
        Submitter's email: ${data.submittedEmail}
        Enhanced/Simple listing: ${data.basicOrEnhanced}
        New/Update request or not: ${data.createOrUpdate}
        Request Information: ${process.env.URL}/admin/content-manager/collectionType/api::listing-request.listing-request/${entity.id}
        `,
        html: `<p>Product/Company name: ${data.companyName}</p>
                <p>Submitter's name: ${data.submittedName}</p>
                <p>Submitter's email: ${data.submittedEmail}</p>
                <p>Enhanced/Simple listing: ${data.basicOrEnhanced}</p>
                <p>New/Update request or not: ${data.createOrUpdate}</p>
                <p>Request Information: ${process.env.URL}/admin/content-manager/collectionType/api::listing-request.listing-request/${entity.id}</p>
        `,
      }
      sgMail.sendMultiple(msg)
    }

    return entity
  },
}))
