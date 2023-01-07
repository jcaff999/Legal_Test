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
  },
  async afterCreate(event) {
    const { data } = event.params
    if (data.publishedAt) {
      const elsService = new ElasticSearchService()
      await Promise.all([
        strapi.service('api::alternative-legal-service.alternative-legal-service').createElsDocument(elsService, data),
        strapi.service('api::alternative-legal-service.alternative-legal-service').createAutoSuggest(elsService, data),
      ])
    }
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    if (data.name) {
      data.slug = generateSlug(data.name)
      const old = await strapi.entityService.findOne(
        'api::alternative-legal-service.alternative-legal-service',
        where.id,
        {},
      )
      if (old.slug !== data.slug) {
        await strapi.service('api::slug-update.slug-update').addNewSlugUpdate({
          type: 'alsps',
          oldSlug: old.slug,
          newSlug: data.slug,
        })
      }
    }
  },
  async afterUpdate(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne(
      'api::alternative-legal-service.alternative-legal-service',
      where.id,
      { populate: '*' },
    )
    if (data.publishedAt) {
      const elsService = new ElasticSearchService()
      await Promise.all([
        strapi.service('api::alternative-legal-service.alternative-legal-service').updateElsDocument(elsService, data),
        strapi.service('api::alternative-legal-service.alternative-legal-service').updateAutoSuggest(elsService, data),
      ])
    } else {
      const elsService = new ElasticSearchService()
      await Promise.all([
        strapi.service('api::alternative-legal-service.alternative-legal-service').deleteElsDocument(elsService, data),
        strapi.service('api::alternative-legal-service.alternative-legal-service').deleteAutoSuggest(elsService, data),
      ])
    }
  },

  async beforeDelete(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne(
      'api::alternative-legal-service.alternative-legal-service',
      where.id,
      { fields: ['slug'] },
    )
    await strapi.service('api::slug-update.slug-update').deleteSlugUpdates({
      type: 'alsps',
      slug: data.slug,
    })
  },

  async afterDelete(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()

    if (where.id) {
      try {
        await Promise.all([
          strapi
            .service('api::alternative-legal-service.alternative-legal-service')
            .deleteElsDocument(elsService, where),
          strapi
            .service('api::alternative-legal-service.alternative-legal-service')
            .deleteAutoSuggest(elsService, where),
        ])
      } catch (err) {
        console.error('deleting ALSP failed', err)
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
                strapi
                  .service('api::alternative-legal-service.alternative-legal-service')
                  .deleteElsDocument(elsService, { id }),
                strapi
                  .service('api::alternative-legal-service.alternative-legal-service')
                  .deleteAutoSuggest(elsService, { id }),
              ]),
            ),
          )
        } catch (err) {
          console.error('deleting multiple ALSPs failed', err)
        }
      }
    }
  },

  async afterDeleteMany(event) {},
}
