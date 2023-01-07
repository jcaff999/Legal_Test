'use strict'

const { v4: uuid } = require('uuid')
const moment = require('moment')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::event.event', ({ strapi }) => ({
  async getEventsFromElsResult(searchResult, eventScopeName = 'default') {
    const { hits } = searchResult.body.hits
    const ids = hits.map((hit) => parseInt(hit._id, 10))
    const events = await strapi.entityService.findMany('api::event.event', { filters: { id: ids } })
    const scoresMap = hits.reduce((scoresMap, hit, index) => {
      scoresMap[hit._id] = {
        index,
        score: hit._score,
      }
      return scoresMap
    }, {})
    events.sort((a, b) => {
      if (scoresMap[b.id].score < scoresMap[a.id].score) return -1
      if (scoresMap[b.id].score > scoresMap[a.id].score) return 1
      return scoresMap[a.id].index - scoresMap[b.id].index
    })
    return events
  },

  getElsBodyFromModel(event) {
    return {
      id: event.id,
      organizer: event.organizer,
      title: event.title,
      website: event.website,
      description: event.description || '',
      notes: event.notes || '',
      country: event.country,
      city: event.city || '',
      location: event.city ? `${event.country}, ${event.city}` : event.country,
      date: moment(event.date).utc().format('YYYY-MM'),
      month: moment(event.date).utc().month() + 1,
      featured: event.featured ? 'Featured' : null,
      duration: event.durationId ? event.durationId.name : null,
      durations: event.durationId ? event.durationId.id : null,
      format: event.formatId ? event.formatId.name : null,
      formats: event.formatId ? event.formatId.id : null,
      feature: event.features.map((item) => item.name).join(', '),
      features: event.features.map((item) => item.id),
      audience: event.audiences.map((item) => item.name).join(', '),
      audiences: event.audiences.map((item) => item.id),
    }
  },

  async createAutoSuggest(elsService, event) {
    const id = uuid()
    const body = {
      suggestKeyword: `${event.title} - ${event.organizer}`,
      type: 'Events',
      data: {
        keyword: event.title,
        id: event.id,
        logo: event.logo ? event.logo.url : null,
        model: 'Events',
        slug: event.slug,
      },
    }
    return await elsService.client.create({
      id,
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body,
    })
  },

  async deleteAutoSuggest(elsService, event) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              { "term": { "type": "Events" } },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.id": ${event.id} }
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
      console.error('event deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, event) {
    await this.deleteAutoSuggest(elsService, event)
    await this.createAutoSuggest(elsService, event)
  },

  async createElsDocument(elsService, event) {
    await elsService.client.create({
      id: event.id,
      index: process.env.OPENSEARCH_INDEX_EVENT,
      body: this.getElsBodyFromModel(event),
    })
  },

  async updateElsDocument(elsService, event) {
    await this.deleteElsDocument(elsService, event)
    await this.createElsDocument(elsService, event)
  },

  async deleteElsDocument(elsService, event) {
    try {
      await elsService.client.delete({
        id: event.id,
        index: process.env.OPENSEARCH_INDEX_EVENT,
        refresh: true,
      })
    } catch (err) {
      console.error('event deleteElsDocument', err)
    }
  },
}))
