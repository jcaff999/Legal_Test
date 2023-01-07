'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const { isArray } = require('lodash')
const { ElasticSearchService } = require('../../../../shared')
const { generateSlug } = require('../../../../shared/utils/generateSlug')

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    data.slug = generateSlug(data.title)
  },
  async afterCreate(event) {
    const { data } = event.params
    if (data.publishedAt) {
      const elsService = new ElasticSearchService()
      await Promise.all([
        strapi.service('api::content.content').createElsDocument(elsService, data),
        strapi.service('api::content.content').createAutoSuggest(elsService, data),
      ])
    }
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    const vendor = await strapi.entityService.findOne('api::content.content', where.id, { publicationState: 'preview' })
    if (!vendor) return
    data.slug = generateSlug(data.title)
    const old = await strapi.entityService.findOne('api::content.content', where.id, {})
    if (old.slug !== data.slug) {
      await strapi.service('api::slug-update.slug-update').addNewSlugUpdate({
        type: 'contents',
        oldSlug: old.slug,
        newSlug: data.slug,
      })
    }
  },
  async afterUpdate(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()
    const data = await strapi.entityService.findOne('api::content.content', where.id, { populate: '*' })
    if (data.publishedAt) {
      await Promise.all([
        strapi.service('api::content.content').updateElsDocument(elsService, data),
        strapi.service('api::content.content').updateAutoSuggest(elsService, data),
      ])
    } else {
      await Promise.all([
        strapi.service('api::content.content').deleteElsDocument(elsService, data),
        strapi.service('api::content.content').deleteAutoSuggest(elsService, data),
      ])
    }
  },
  async beforeDelete(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne('api::content.content', where.id, { fields: ['slug'] })
    await strapi.service('api::slug-update.slug-update').deleteSlugUpdates({
      type: 'contents',
      slug: data.slug,
    })
  },
  async afterDelete(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()

    if (where.id) {
      try {
        await Promise.all([
          strapi.service('api::content.content').deleteElsDocument(elsService, where),
          strapi.service('api::content.content').deleteAutoSuggest(elsService, where),
        ])
      } catch (err) {
        console.error('deleting content failed', err)
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
                strapi.service('api::content.content').deleteElsDocument(elsService, { id }),
                strapi.service('api::content.content').deleteAutoSuggest(elsService, { id }),
              ]),
            ),
          )
        } catch (err) {
          console.error('deleting multiple contents failed', err)
        }
      }
    }
  },

  async afterDeleteMany(event) {},
}
