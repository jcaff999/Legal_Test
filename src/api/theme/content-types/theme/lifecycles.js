'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const { generateSlug } = require('../../../../shared/utils/generateSlug')

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    data.slug = generateSlug(data.name)
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    const theme = await strapi.entityService.findOne('api::theme.theme', where.id, { publicationState: 'preview' })
    if (!theme) return
    const name = data.name || theme.name
    data.slug = generateSlug(name)
  },
}
