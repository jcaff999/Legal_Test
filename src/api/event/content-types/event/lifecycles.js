'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const { isArray } = require('lodash')
const { ElasticSearchService } = require('../../../../shared')
const { generateSlug } = require('../../../../shared/utils/generateSlug')

const getEventSlug = (event) => {
  const { title, organizer, date } = event
  const result =
    title && organizer && title !== organizer ? `${title} by ${organizer} ${date}` : (title || organizer) + ' ' + date
  return generateSlug(result)
}

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    console.log('beforeCreate', data)
    data.slug = getEventSlug(data)
    console.log('data.slug', data.slug)
  },
  async afterCreate(event) {
    const { data } = event.params
    const elsService = new ElasticSearchService()
    if (data.publishedAt) {
      await Promise.all([
        strapi.service('api::event.event').createElsDocument(elsService, data),
        strapi.service('api::event.event').createAutoSuggest(elsService, data),
      ])
    }
  },
  async beforeUpdate(event) {
    const { data, where } = event.params
    data.slug = getEventSlug(data)
    const old = await strapi.entityService.findOne('api::event.event', where.id, {})
    if (old.slug !== data.slug) {
      await strapi.service('api::slug-update.slug-update').addNewSlugUpdate({
        type: 'event',
        oldSlug: old.slug,
        newSlug: data.slug,
      })
    }
  },
  async afterUpdate(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne('api::event.event', where.id, { populate: '*' })
    const elsService = new ElasticSearchService()
    if (data.publishedAt) {
      await Promise.all([
        strapi.service('api::event.event').updateElsDocument(elsService, data),
        strapi.service('api::event.event').updateAutoSuggest(elsService, data),
      ])
    } else {
      await Promise.all([
        strapi.service('api::event.event').deleteElsDocument(elsService, data),
        strapi.service('api::event.event').deleteAutoSuggest(elsService, data),
      ])
    }
  },

  async beforeDelete(event) {
    const { where } = event.params
    const data = await strapi.entityService.findOne('api::event.event', where.id, { fields: ['slug'] })
    await strapi.service('api::slug-update.slug-update').deleteSlugUpdates({
      type: 'event',
      slug: data.slug,
    })
  },

  async afterDelete(event) {
    const { where } = event.params
    const elsService = new ElasticSearchService()

    if (where.id) {
      try {
        await Promise.all([
          strapi.service('api::event.event').deleteElsDocument(elsService, where),
          strapi.service('api::event.event').deleteAutoSuggest(elsService, where),
        ])
      } catch (err) {
        console.error('deleting event failed', err)
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
                strapi.service('api::event.event').deleteElsDocument(elsService, { id }),
                strapi.service('api::event.event').deleteAutoSuggest(elsService, { id }),
              ]),
            ),
          )
        } catch (err) {
          console.error('deleting multiple events failed', err)
        }
      }
    }
  },

  async afterDeleteMany(event) {},
}
