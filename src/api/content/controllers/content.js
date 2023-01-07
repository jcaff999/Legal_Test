'use strict'

/**
 * content controller
 */

const { createCoreController } = require('@strapi/strapi').factories
const { ElasticSearchService } = require('../../../shared')

const DEFAULT_LIMIT = 10

module.exports = createCoreController('api::content.content', ({ strapi }) => ({
  async search(ctx) {
    const { offset, limit, ...params } = ctx.options.query
    const elsService = new ElasticSearchService()
    const userId = ctx.state?.user?.id ? ctx.state?.user?.id : null

    const contentsSearchParams = {
      ...params,
      limit: limit || DEFAULT_LIMIT,
      offset: offset || 0,
      userId,
    }

    const searchResult = await elsService.searchContents(contentsSearchParams)
    const contents = searchResult.body.hits.hits.map(({ _source }) => ({
      id: _source.id,
      model: _source.model,
      title: _source.title,
      snippet: _source.snippet,
      author: _source.author,
      expertName: _source.expertName.length ? _source.expertName.split(', ') : [],
      expertTitle: _source.expertTitle.length ? _source.expertTitle.split(', ') : [],
      expertAvatar: _source.expertAvatar.length ? _source.expertAvatar.split(', ') : [],
      taxonomy: _source.taxonomy,
      contentType: _source.contentType,
      content: _source.content,
      isPremium: _source.isPremium,
      phase: _source.phase.length ? _source.phase.length.split(', ') : [],
      audience: _source.audience.length ? _source.audience.split(', ') : [],
      documentType: _source.documentType,
    }))
    return {
      success: true,
      data: {
        total: searchResult.body.hits.total.value,
        contents,
      },
    }
  },
}))
