'use strict'

/**
 * slug-update service.
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::slug-update.slug-update', ({ strapi }) => ({
  async addNewSlugUpdate({ type, oldSlug, newSlug }) {
    const existingEntities = await strapi.entityService.findMany('api::slug-update.slug-update', {
      fields: ['id'],
      filters: {
        $or: [{ oldSlug }, { newSlug }, { oldSlug: newSlug }, { newSlug: oldSlug }],
      },
    })
    await Promise.all(existingEntities.map(({ id }) => strapi.entityService.delete('api::slug-update.slug-update', id)))
    await strapi.entityService.create('api::slug-update.slug-update', {
      data: {
        type,
        oldSlug,
        newSlug,
        publishedAt: new Date(),
      },
    })
  },

  async deleteSlugUpdates({ slug, type }) {
    const existingEntities = await strapi.entityService.findMany('api::slug-update.slug-update', {
      fields: ['id'],
      filters: {
        $and: [
          { type },
          {
            $or: [{ oldSlug: slug }, { newSlug: slug }],
          },
        ],
      },
    })
    await Promise.all(existingEntities.map(({ id }) => strapi.entityService.delete('api::slug-update.slug-update', id)))
  },
}))
