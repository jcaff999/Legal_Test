'use strict'

const { isArray } = require('lodash')
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const { ElasticSearchService } = require('../../../../shared')
const { generateSlug } = require('../../../../shared/utils/generateSlug')

let vendorsNeedUpdate = []

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    data.slug = generateSlug(data.name)
  },
  async afterCreate(event) {
    const { data } = event.params
    if (data.publishedAt) {
      const elsService = new ElasticSearchService()
      await strapi.service('api::topic.topic').createAutoSuggest(elsService, data)
    }
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    if (data.name) {
      data.slug = generateSlug(data.name)
      const old = await strapi.entityService.findOne('api::topic.topic', where.id, {})
      if (old.slug !== data.slug) {
        await strapi.service('api::slug-update.slug-update').addNewSlugUpdate({
          type: 'topics',
          oldSlug: old.slug,
          newSlug: data.slug,
        })
      }
    }

    vendorsNeedUpdate = []
    if (data.vendors) {
      vendorsNeedUpdate = [...data.vendors.connect, data.vendors.disconnect]
    }
  },
  async afterUpdate(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()
    const data = await strapi.entityService.findOne('api::topic.topic', where.id, { populate: '*' })
    if (data.publishedAt) {
      await strapi.service('api::topic.topic').updateAutoSuggest(elsService, data)
    } else {
      await strapi.service('api::topic.topic').deleteAutoSuggest(elsService, data)
    }

    vendorsNeedUpdate.map(async (id) => {
      const vendor = await strapi.entityService.findMany('api::vendor.vendor', id, {})
      if (vendor) {
        await strapi.service('api::vendor.vendor').updateElsDocument(elsService, vendor)
      }
    })
  },

  async beforeDelete(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne('api::topic.topic', where.id, { fields: ['slug'] })
    await strapi.service('api::slug-update.slug-update').deleteSlugUpdates({
      type: 'topics',
      slug: data.slug,
    })
  },

  async afterDelete(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()

    if (where.id) {
      try {
        await Promise.all([strapi.service('api::topic.topic').deleteAutoSuggest(elsService, where)])
      } catch (err) {
        console.error('deleting topic failed', err)
      }
    } else if (where.$and) {
      // bulk delete
      const ids = where.$and[0].id.$in
      const elsService = new ElasticSearchService()
      if (ids && isArray(ids)) {
        try {
          await Promise.all(
            ids.map((id) => Promise.all([strapi.service('api::topic.topic').deleteAutoSuggest(elsService, { id })])),
          )
        } catch (err) {
          console.error('deleting multiple topics failed', err)
        }
      }
    }
  },

  async afterDeleteMany(event) {},
}
