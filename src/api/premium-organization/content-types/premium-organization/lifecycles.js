'use strict'

const { differenceWith } = require('lodash')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  async afterCreate(event) {
    const { data } = event.params
    if (!data.publishedAt) {
      return
    }
    if (data.status !== 'Paid') {
      return
    }
    const { emailDomain, invitations } = data
    const existingUsers = await strapi.query('plugin::users-permissions.user').findMany({
      where: {
        $or: [
          { email: { $in: invitations.map((invitation) => invitation.email) } },
          ...(emailDomain ? [{ email: { $endsWith: emailDomain.toLowercase() } }] : []),
        ],
      },
    })
    const newInvitations = differenceWith(invitations, existingUsers, (obj) => obj.email)
    console.log('newInvitations', newInvitations)
    console.log('existingUsers', existingUsers)
    await Promise.all([
      ...existingUsers.map(async (member) => {
        await strapi
          .query('plugin::users-permissions.user')
          .update({ where: { id: member }, data: { isPremium: true } })
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: member } })
        await strapi.service('api::premium-organization.premium-organization').sendPremiumUpgradedEmail(user)
      }),
      strapi.service('api::premium-organization.premium-organization').inviteNewUsers(newInvitations),
    ])
  },
  async beforeUpdate(event) {
    // const { data } = event.params
    // const { members } = data
    // const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' })
    // const settings = await pluginStore.get({ key: 'email' }).then((storeEmail) => storeEmail.email_confirmation.options)
    // if (members && isArray(members)) {
    //   await Promise.all(
    //     members.map(async (member) => {
    //       if (data.status === 'Paid') {
    //         strapi.query('plugin::users-permissions.user').update({ where: { id: member }, data: { isPremium: true } })
    //         const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: member } })
    //         try {
    //           await strapi.plugins.email.services.email.send({
    //             to: user.email,
    //             from:
    //               settings.from.email && settings.from.name
    //                 ? `${settings.from.name} <${settings.from.email}>`
    //                 : undefined,
    //             replyTo: settings.response_email,
    //             text: `Dear ${user.username}, Thank you for signing up ${data.organizationName} to LegalTech Hub Premium. The account has now been created. Please forward this email to all users and invite them to join your subscription. All your users can join here (insert link to Join your orgs subscription page ) and learn all about the wonderful world of legal tech. Welcome to LegalTechHub premium.
    //               `,
    //             subject: 'The Strapi Email plugin worked successfully',
    //             // html: 'Hello world!',
    //           })
    //         } catch (err) {
    //           console.log(err.response.body.errors)
    //         }
    //       } else {
    //         strapi.query('plugin::users-permissions.user').update({ where: { id: member }, data: { isPremium: false } })
    //       }
    //     }),
    //   )
    // }
  },
  async afterUpdate(event) {
    // const { where } = event.params;
    // const data = await strapi.entityService.findOne('api::alternative-legal-service.alternative-legal-service', where.id, { populate: '*' })
    // if (data.publishedAt) {
    //   const elsService = new ElasticSearchService()
    //   await Promise.all([
    //     strapi.service('api::alternative-legal-service.alternative-legal-service').updateElsDocument(elsService, data),
    //     strapi.service('api::alternative-legal-service.alternative-legal-service').updateAutoSuggest(elsService, data)
    //   ])
    // } else {
    //   const elsService = new ElasticSearchService()
    //   await Promise.all([
    //     strapi.service('api::alternative-legal-service.alternative-legal-service').deleteElsDocument(elsService, data),
    //     strapi.service('api::alternative-legal-service.alternative-legal-service').deleteAutoSuggest(elsService, data)
    //   ])
    // }
  },

  async beforeDelete(event) {
    const { where } = event.params
    try {
      await strapi
        .query('plugin::users-permissions.user')
        .update({ where: { premiumOrganization: where.id }, data: { isPremium: false } })
    } catch (err) {
      console.error('updating users failed', err)
    }
  },
}
