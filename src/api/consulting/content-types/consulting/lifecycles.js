'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const { isArray } = require('lodash')
const { ElasticSearchService } = require('../../../../shared')
const { generateSlug } = require('../../../../shared/utils/generateSlug')
const { getConsultancyDisplayName } = require('../../../../shared/utils/getVendorDisplayName')

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    const displayName = getConsultancyDisplayName(data)
    data.slug = generateSlug(displayName)
    data.displayName = displayName
  },
  async afterCreate(event) {
    const { data } = event.params
    if (data.publishedAt) {
      const elsService = new ElasticSearchService()
      await Promise.all([
        strapi.service('api::consulting.consulting').createElsDocument(elsService, data),
        strapi.service('api::consulting.consulting').createAutoSuggest(elsService, data),
      ])
    }
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    const consultancy = await strapi.entityService.findOne('api::consulting.consulting', where.id, {
      publicationState: 'preview',
    })
    if (!consultancy) return
    data.name = data.name || consultancy.name
    data.serviceName = data.serviceName || consultancy.serviceName
    const displayName = getConsultancyDisplayName(data)
    data.slug = generateSlug(displayName)
    data.displayName = displayName
    const old = await strapi.entityService.findOne('api::consulting.consulting', where.id, {})
    if (old.slug !== data.slug) {
      await strapi.service('api::slug-update.slug-update').addNewSlugUpdate({
        type: 'consultants',
        oldSlug: old.slug,
        newSlug: data.slug,
      })
    }
  },
  async afterUpdate(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()
    const data = await strapi.entityService.findOne('api::consulting.consulting', where.id, { populate: '*' })
    if (data.publishedAt) {
      await Promise.all([
        strapi.service('api::consulting.consulting').updateElsDocument(elsService, data),
        strapi.service('api::consulting.consulting').updateAutoSuggest(elsService, data),
      ])
    } else {
      await Promise.all([
        strapi.service('api::consulting.consulting').deleteElsDocument(elsService, data),
        strapi.service('api::consulting.consulting').deleteAutoSuggest(elsService, data),
      ])
    }
  },

  async beforeDelete(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne('api::consulting.consulting', where.id, { fields: ['slug'] })
    await strapi.service('api::slug-update.slug-update').deleteSlugUpdates({
      type: 'consultants',
      slug: data.slug,
    })
  },

  async afterDelete(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()

    if (where.id) {
      try {
        await Promise.all([
          strapi.service('api::consulting.consulting').deleteElsDocument(elsService, where),
          strapi.service('api::consulting.consulting').deleteAutoSuggest(elsService, where),
        ])
      } catch (err) {
        console.error('deleting consultant failed', err)
      }
    } else if (where.$and) {
      // bulk delete
      const ids = where.$and[0].id.$in
      const elsService = new ElasticSearchService()
      if (ids && isArray(ids)) {
        try {
          await Promise.all(
            ids.map((id) =>
              Promise.all([
                strapi.service('api::consulting.consulting').deleteElsDocument(elsService, { id }),
                strapi.service('api::consulting.consulting').deleteAutoSuggest(elsService, { id }),
              ]),
            ),
          )
        } catch (err) {
          console.error('deleting multiple consultants failed', err)
        }
      }
    }
  },

  async afterDeleteMany(event) {},
}
