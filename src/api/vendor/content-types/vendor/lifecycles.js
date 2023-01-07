'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const { isArray } = require('lodash')
const { ElasticSearchService } = require('../../../../shared')
const { generateSlug } = require('../../../../shared/utils/generateSlug')
const { getVendorDisplayName } = require('../../../../shared/utils/getVendorDisplayName')

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    const toolName = getVendorDisplayName(data)
    data.slug = generateSlug(toolName)
    data.displayName = toolName
  },
  async afterCreate(event) {
    const { data } = event.params
    if (data.publishedAt) {
      const elsService = new ElasticSearchService()
      await Promise.all([
        strapi.service('api::vendor.vendor').createElsDocument(elsService, data),
        strapi.service('api::vendor.vendor').createAutoSuggest(elsService, data),
      ])
    }
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    const vendor = await strapi.entityService.findOne('api::vendor.vendor', where.id, { publicationState: 'preview' })
    if (!vendor) return
    data.name = data.name || vendor.name
    data.tool = data.tool || vendor.tool
    const toolName = getVendorDisplayName(data)
    data.slug = generateSlug(toolName)
    data.displayName = toolName
    const old = await strapi.entityService.findOne('api::vendor.vendor', where.id, {})
    if (old.slug !== data.slug) {
      await strapi.service('api::slug-update.slug-update').addNewSlugUpdate({
        type: 'vendors',
        oldSlug: old.slug,
        newSlug: data.slug,
      })
    }
  },
  async afterUpdate(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()
    const data = await strapi.entityService.findOne('api::vendor.vendor', where.id, { populate: '*' })
    if (data.publishedAt) {
      await Promise.all([
        strapi.service('api::vendor.vendor').updateElsDocument(elsService, data),
        strapi.service('api::vendor.vendor').updateAutoSuggest(elsService, data),
      ])
    } else {
      await Promise.all([
        strapi.service('api::vendor.vendor').deleteElsDocument(elsService, data),
        strapi.service('api::vendor.vendor').deleteAutoSuggest(elsService, data),
      ])
    }
  },
  async beforeDelete(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne('api::vendor.vendor', where.id, { fields: ['slug'] })
    await strapi.service('api::slug-update.slug-update').deleteSlugUpdates({
      type: 'vendors',
      slug: data.slug,
    })
  },
  async afterDelete(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()

    if (where.id) {
      try {
        await Promise.all([
          strapi.service('api::vendor.vendor').deleteElsDocument(elsService, where),
          strapi.service('api::vendor.vendor').deleteAutoSuggest(elsService, where),
        ])
      } catch (err) {
        console.error('deleting vendor failed', err)
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
                strapi.service('api::vendor.vendor').deleteElsDocument(elsService, { id }),
                strapi.service('api::vendor.vendor').deleteAutoSuggest(elsService, { id }),
              ]),
            ),
          )
        } catch (err) {
          console.error('deleting multiple vendors failed', err)
        }
      }
    }
  },

  async afterDeleteMany(event) {},
}
