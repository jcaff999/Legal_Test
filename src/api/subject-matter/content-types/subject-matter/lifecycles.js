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
    const subjectMatter = await strapi.entityService.findOne('api::subject-matter.subject-matter', where.id, {
      publicationState: 'preview',
    })
    if (!subjectMatter) return
    const name = data.name || subjectMatter.name
    data.slug = generateSlug(name)
  },
}
