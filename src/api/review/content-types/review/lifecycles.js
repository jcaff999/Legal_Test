'use strict'

const sgMail = require('@sendgrid/mail')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
let needToSendEmail = false

module.exports = {
  async beforeUpdate(event) {
    const { data, where } = event.params
    const result = await strapi.entityService.findOne('api::review.review', where.id, { populate: '*' })
    if (!result.publishedAt && data.publishedAt) {
      needToSendEmail = true
    } else {
      needToSendEmail = false
    }
  },

  async afterUpdate(event) {
    const { result: data } = event
    let slug = null
    let path = null
    if (data.vendor) {
      const vendor = await strapi.entityService.findOne('api::vendor.vendor', data.vendor.id, {
        populate: { reviews: true },
      })
      const reviews = vendor.reviews.filter((review) => review.publishedAt != null)
      const sum = reviews.reduce((total, item) => total + item.rating, 0)
      const average = reviews.length > 0 ? (sum / reviews.length).toFixed(1) : null
      await strapi.entityService.update('api::vendor.vendor', data.vendor.id, { data: { rating: average } })
      slug = vendor.slug
      path = 'vendors'
    } else if (data.alsp) {
      const alsp = await strapi.entityService.findOne(
        'api::alternative-legal-service.alternative-legal-service',
        data.alsp.id,
        { populate: { reviews: true } },
      )
      const reviews = alsp.reviews.filter((review) => review.publishedAt != null)
      const sum = reviews.reduce((total, item) => total + item.rating, 0)
      const average = reviews.length > 0 ? (sum / reviews.length).toFixed(1) : null
      await strapi.entityService.update('api::alternative-legal-service.alternative-legal-service', data.alsp.id, {
        data: { rating: average },
      })
      slug = alsp.slug
      path = 'alsps'
    } else if (data.consultant) {
      const consultant = await strapi.entityService.findOne('api::consulting.consulting', data.consultant.id, {
        populate: { reviews: true },
      })
      const reviews = consultant.reviews.filter((review) => review.publishedAt != null)
      const sum = reviews.reduce((total, item) => total + item.rating, 0)
      const average = reviews.length > 0 ? (sum / reviews.length).toFixed(1) : null
      await strapi.entityService.update('api::consulting.consulting', data.consultant.id, { data: { rating: average } })
      slug = consultant.slug
      path = 'consultants'
    }

    if (needToSendEmail) {
      needToSendEmail = false
      // send emails to admin
      const receivers = await strapi.entityService.findMany('api::email-receiver.email-receiver', {
        filters: { enable: true },
        limit: -1,
        publicationState: 'live',
      })
      if (receivers && receivers.length > 0) {
        const emails = receivers.map((receiver) => receiver.email)
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        let companyName = ''
        if (data.vendor) {
          const vendor = await strapi.entityService.findOne('api::vendor.vendor', data.vendor.id, {
            populate: ['company'],
          })
          companyName = vendor.company?.name
        }
        const msg = {
          to: emails,
          from: 'Legaltech Hub <info@legaltechnologyhub.com>',
          subject: 'New review has been published.',
          text: `Product name: ${data.solutionDispName}
          Company name: ${companyName}
          Review rating: ${data.rating}
          Review title: ${data.title}
          Review body: ${data.content}
          Submitter's name: ${data.submittedBy?.username}
          `,
          html: `<p>Product name: ${data.solutionDispName}</p>
          <p>Company name: ${companyName}</p>
          <p>Review rating: ${data.rating}</p>
          <p>Review title: ${data.title}</p>
          <p>Review body: ${data.content}</p>
          <p>Submitter's name: ${data.submittedBy?.username}</p>
          `,
        }
        sgMail.sendMultiple(msg)
      }

      // send email to customer
      if (data.submittedBy?.email && path && slug) {
        const msg = {
          to: data.submittedBy?.email,
          from: 'Legaltech Hub <no-reply@legaltechnologyhub.com>',
          templateId: 'd-f151b7c824044386906fc1c405fd87bf',
          dynamicTemplateData: {
            url: `${process.env.FRONTEND_URL}/${path}/${slug}/?from=submitReview`,
            subject: `Your review on ${data.solutionDispName} is live now`,
          },
        }
        await strapi.plugins.email.services.email.send(msg)
      }
    }
  },
}
