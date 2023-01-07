'use strict'

/**
 * content service
 */

const { createCoreService } = require('@strapi/strapi').factories
const { v4: uuid } = require('uuid')
const { getVendorDisplayName } = require('../../../shared/utils/getVendorDisplayName')

module.exports = createCoreService('api::content.content', ({ strapi }) => ({
  getElsBodyFromModel(content) {
    return {
      id: content.id,
      title: content.title,
      slug: content.slug,
      snippet: content.snippet,
      isPremium: content.isPremium,
      isTrending: content.isTrending,
      audiences: content.audiences.length > 0 ? content.audiences.map((audience) => audience.name).join(' ') : null,
      audienceIds: content.audiences.map((audience) => audience.id),
      phase: content.phase ? content.phase.title : null,
      phaseId: content.phase ? content.phase.id : null,
      authorVendor: content.authorVendor ? getVendorDisplayName(content.authorVendor) : null,
      authorVendorId: content.authorVendor ? content.authorVendor.id : null,
      resourceVendors:
        content.resourceVendors.length > 0
          ? content.resourceVendors.map((vendor) => getVendorDisplayName(vendor)).join(' ')
          : null,
      resourceVendorIds: content.resourceVendors.map((vendor) => vendor.id),
      author: content.author,
      isAuthorVendor: content.isAuthorVendor,
      subjectMatters:
        content.subjectMatters.length > 0
          ? content.subjectMatters.map((subjectMatter) => subjectMatter.name).join(' ')
          : null,
      subjectMatterIds: content.subjectMatters.map((subjectMatter) => subjectMatter.id),
      themes: content.themes.length > 0 ? content.themes.map((theme) => theme.name).join(' ') : null,
      themeIds: content.themes.map((theme) => theme.id),
      documentType: content.documentType,
      blogTaxonomies:
        content.blogTaxonomies.length > 0
          ? content.blogTaxonomies.map((blogTaxonomy) => blogTaxonomy.name).join(' ')
          : null,
      blogTaxonomyIds: content.blogTaxonomies.map((blogTaxonomy) => blogTaxonomy.id),
      includeInKnowHow: content.includeInKnowHow,
      expertName: content.expert ? [content.expert.firstName, content.expert.lastName].join(' ') : null,
      expertTitle: content.expert ? content.expert.title.join(', ') : null,
      expertAvatar: content.expert.avatar ? content.expert.avatar.url : null,
      contentType: content.contentType,
      defaultImage: content.defaultImage ? content.defaultImage.url : null,
      subTopics: content.subTopics.length > 0 ? content.subTopics.map((subTopic) => subTopic.name).join(' ') : null,
      subTopicIds: content.subTopics.map((subTopic) => subTopic.id),
    }
  },

  async createAutoSuggest(elsService, content) {
    const id = uuid()
    const body = {
      suggestKeyword: content.title,
      type: 'Contents',
      data: {
        keyword: content.title,
        id: content.id,
        logo: content.documentType,
        model: 'Contents',
        slug: content.slug,
      },
    }
    return await elsService.client.create({
      id,
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body,
    })
  },

  async deleteAutoSuggest(elsService, content) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              { "term": { "type": "Contents" } },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.id": ${content.id} }
                  }
                }
              },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.model": "Contents" }
                  }
                }
              }
            ]
          }
        }
      }
    `

    try {
      await elsService.client.deleteByQuery({
        index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
        body: query,
      })
    } catch (err) {
      console.error('content deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, content) {
    await this.deleteAutoSuggest(elsService, content)
    await this.createAutoSuggest(elsService, content)
  },

  async createElsDocument(elsService, content) {
    await elsService.client.create({
      id: uuid(),
      index: process.env.OPENSEARCH_INDEX_CONTENT,
      body: this.getElsBodyFromModel(content),
    })
  },

  async updateElsDocument(elsService, content) {
    await this.deleteElsDocument(elsService, content)
    await this.createElsDocument(elsService, content)
  },

  async deleteElsDocument(elsService, content) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              {
                "match": { "id": ${content.id} }
              }
            ]
          }
        }
      }
    `

    try {
      await elsService.client.deleteByQuery({
        index: process.env.OPENSEARCH_INDEX_CONTENT,
        body: query,
      })
    } catch (err) {
      console.error('content deleteElsDocument', err)
    }
  },
}))
