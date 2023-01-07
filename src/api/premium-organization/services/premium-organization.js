'use strict'

/**
 * premium-organization service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::premium-organization.premium-organization', ({ strapi }) => ({
  /**
   * Invite users to register the platform.
   */
  async inviteNewUsers(invitations) {
    await Promise.all(invitations.map((invitation) => this.sendInvitationEmail(invitation.email)))
  },

  /**
   * Send invitation email to a new user.
   */
  sendInvitationEmail(email) {
    // TODO: Send invitation email to register
  },

  /**
   * Send premium upgraded email to the existing user.
   */
  sendPremiumUpgradedEmail(user) {
    // TODO: Send premium upgraded email to the existing user
    console.log(user)
    // const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' })
    // const settings = await pluginStore.get({ key: 'email' }).then((storeEmail) => storeEmail.email_confirmation.options)
    // try {
    //   await strapi.plugins.email.services.email.send({
    //     to: user.email,
    //     from:
    //       settings.from.email && settings.from.name ? `${settings.from.name} <${settings.from.email}>` : undefined,
    //     replyTo: settings.response_email,
    //     text: `Dear ${user.username}, Thank you for signing up ${data.organizationName} to LegalTech Hub Premium. The account has now been created. Please forward this email to all users and invite them to join your subscription. All your users can join here (insert link to Join your orgs subscription page ) and learn all about the wonderful world of legal tech. Welcome to LegalTechHub premium.`,
    //     subject: 'Welcome to the Premium class of LegalTech Hub',
    //     // html: 'Hello world!',
    //   })
    // } catch (err) {
    //   console.log(err.response.body.errors)
    // }
  },
}))
