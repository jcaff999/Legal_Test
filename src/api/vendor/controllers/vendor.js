'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { ElasticSearchService } = require('../../../shared')

const DEFAULT_LIMIT = 10

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::vendor.vendor', ({ strapi }) => ({
  async search(ctx) {
    const { offset, limit, ...params } = ctx.options.query
    const elsService = new ElasticSearchService()
    const userId = ctx.state?.user?.id ? ctx.state?.user?.id : null

    const vendorsSearchParams = {
      ...params,
      limit: limit || DEFAULT_LIMIT,
      offset: offset || 0,
      userId,
    }

    const searchResult = await elsService.searchVendors(vendorsSearchParams)
    const vendors = searchResult.body.hits.hits.map(({ _source }) => ({
      id: _source.id,
      slug: _source.slug,
      model: _source.model,
      tool: _source.tool,
      name: _source.name,
      description: _source.description,
      logo: _source.logo,
      enhancedListingEnabled: _source.enhancedListingEnabled,
      subTopics: _source.subTopic.length ? _source.subTopic.split(', ') : [],
      follow: userId ? _source.userIds.includes(userId) : false,
      rating: _source.rating === -1 ? null : _source.rating,
      reviewCnt: _source.reviewCnt,
      consolidation: _source.consolidationData,
      graveyard: _source.graveyardData,
      isPremium: _source.isPremium,
    }))
    return {
      success: true,
      data: {
        total: searchResult.body.hits.total.value,
        vendors,
      },
    }
  },

  async getSimilarVendors(ctx) {
    let { id: vendorId, model, from } = ctx
    if (isNaN(vendorId)) {
      return { success: false }
    }
    if (from) {
      const subTopic = await strapi.db.query('api::sub-topic.sub-topic').findOne({ where: { slug: from } })
      from = subTopic ? subTopic.name : null
    }

    let result = []
    let subTopics = []
    const similarIds = []
    let vendor
    if (model === 'Vendors') {
      vendor = await strapi.entityService.findOne('api::vendor.vendor', vendorId, { populate: '*' })
      if (!vendor) {
        return { success: false }
      }
      result = vendor.similarSolutions.map(async (item) => {
        const similar = await strapi.entityService.findOne('api::vendor.vendor', item.id, {
          populate: { logo: true, reviews: true },
        })
        const reviews = similar.reviews.filter((review) => review.publishedAt != null)
        return {
          slug: item.slug,
          model: 'Vendors',
          tool: item.tool,
          name: item.name,
          logo: similar.logo ? similar.logo.url : null,
          rating: similar.rating,
          reviewCnt: reviews.length,
        }
      })
      vendor.similarSolutions.map((item) => similarIds.push(item.id))
      subTopics = vendor.subTopics
    } else if (model === 'ALSPs') {
      vendor = await strapi.entityService.findOne(
        'api::alternative-legal-service.alternative-legal-service',
        vendorId,
        { populate: '*' },
      )
      if (!vendor) {
        return { success: false }
      }
      result = vendor.similarSolutions.map(async (item) => {
        const similar = await strapi.entityService.findOne(
          'api::alternative-legal-service.alternative-legal-service',
          item.id,
          { populate: { logo: true, reviews: true } },
        )
        const reviews = similar.reviews.filter((review) => review.publishedAt != null)
        return {
          slug: item.slug,
          model: 'ALSPs',
          name: item.name,
          logo: similar.logo ? similar.logo.url : null,
          rating: similar.rating,
          reviewCnt: reviews.length,
        }
      })
      vendor.similarSolutions.map((item) => similarIds.push(item.id))
      subTopics = vendor.serviceOfferings
    } else if (model === 'Consultants') {
      vendor = await strapi.entityService.findOne('api::consulting.consulting', vendorId, { populate: '*' })
      if (!vendor) {
        return { success: false }
      }
      result = vendor.similarSolutions.map(async (item) => {
        const similar = await strapi.entityService.findOne('api::consulting.consulting', item.id, {
          populate: { logo: true, reviews: true },
        })
        const reviews = similar.reviews.filter((review) => review.publishedAt != null)
        return {
          slug: item.slug,
          model: 'Consultants',
          name: item.name,
          logo: similar.logo ? similar.logo.url : null,
          rating: similar.rating,
          reviewCnt: reviews.length,
        }
      })
      vendor.similarSolutions.map((item) => similarIds.push(item.id))
      subTopics = vendor.serviceOfferings
    } else {
      return { success: false }
    }

    if (result.length < process.env.SIMILAR_VENDORS_COUNT && subTopics.length > 0) {
      const limit = process.env.SIMILAR_VENDORS_COUNT - result.length
      const elsService = new ElasticSearchService()
      similarIds.push(vendor.id)
      const searchResult = await elsService.searchSimilarVendor({
        limit,
        ids: similarIds,
        subTopics,
        from,
        model,
      })

      const vendors = searchResult.body.hits.hits.map(({ _source }) => ({
        slug: _source.slug,
        model: _source.model,
        tool: _source.tool,
        name: _source.name,
        logo: _source.logo,
        rating: _source.rating === -1 ? null : _source.rating,
        reviewCnt: _source.reviewCnt,
      }))
      result = result.concat(vendors)
    }
    return {
      success: true,
      data: result,
    }
  },
}))
