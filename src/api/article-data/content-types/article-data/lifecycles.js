'use strict'

const { generateSlug } = require('../../../../shared/utils/generateSlug')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    data.slug = generateSlug(data.title)
  },
  beforeUpdate(event) {
    const { data } = event.params
    if (data.title) {
      data.slug = generateSlug(data.title)
    }
  },
}
