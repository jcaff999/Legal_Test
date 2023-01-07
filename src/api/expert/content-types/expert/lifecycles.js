'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const { generateSlug } = require('../../../../shared/utils/generateSlug')

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    const { firstName, lastName } = data
    data.slug = generateSlug(`${firstName} ${lastName}`)
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    const expert = await strapi.entityService.findOne('api::expert.expert', where.id, { publicationState: 'preview' })
    if (!expert) return
    const firstName = data.firstName || expert.firstName
    const lastName = data.lastName || expert.lastName
    data.slug = generateSlug(`${firstName} ${lastName}`)
  },
}
