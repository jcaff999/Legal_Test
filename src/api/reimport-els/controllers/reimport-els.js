const { ElasticSearchService } = require('../../../shared')

const autoSuggestIndexBody = require('../../../els/autosuggest.json')
const eventIndexBody = require('../../../els/event.json')
const vendorIndexBody = require('../../../els/vendor.json')

const reindexVendors = async (elsService) => {
  const vendorsService = strapi.service('api::vendor.vendor')
  let offset = 0

  const vendors = await strapi.entityService.findMany('api::vendor.vendor', {
    limit: -1,
    populate: '*',
    publicationState: 'live',
  })
  console.info(`Starting to reindex ${vendors.length} vendors`)
  for (const vendor of vendors) {
    await vendorsService.createElsDocument(elsService, vendor)
    offset++
    console.log(`reindexed vendor from ${offset}`)
  }
  console.info(`Successfully refreshed els for ${vendors.length} vendors`)
}

const reindexConsultants = async (elsService) => {
  const vendorsService = strapi.service('api::consulting.consulting')
  let offset = 0

  const vendors = await strapi.entityService.findMany('api::consulting.consulting', {
    limit: -1,
    populate: '*',
    publicationState: 'live',
  })
  console.info(`Starting to reindex ${vendors.length} consultants`)
  for (const vendor of vendors) {
    await vendorsService.createElsDocument(elsService, vendor)
    offset++
    console.log(`reindexed consultant from ${offset}`)
  }
  console.info(`Successfully refreshed els for ${vendors.length} consultants`)
}

const reindexALSPs = async (elsService) => {
  const vendorsService = strapi.service('api::alternative-legal-service.alternative-legal-service')
  let offset = 0

  const vendors = await strapi.entityService.findMany('api::alternative-legal-service.alternative-legal-service', {
    limit: -1,
    populate: '*',
    publicationState: 'live',
  })
  console.info(`Starting to reindex ${vendors.length} ALSPs`)
  for (const vendor of vendors) {
    await vendorsService.createElsDocument(elsService, vendor)
    offset++
    console.log(`reindexed alsp from ${offset}`)
  }
  console.info(`Successfully refreshed els for ${vendors.length} ALSPs`)
}

const reindexEvents = async (elsService) => {
  const eventsService = strapi.service('api::event.event')
  let offset = 0

  console.info('starting to reindex events')

  while (true) {
    const events = await strapi.entityService.findMany('api::event.event', {
      limit: 20,
      start: offset,
      sort: ['id'],
      populate: '*',
      publicationState: 'live',
    })
    if (events.length === 0) {
      break
    }
    await Promise.all(events.map((event) => eventsService.createElsDocument(elsService, event)))
    console.log(`reindexed ${events.length} events from ${offset}`)
    offset += events.length
  }
  console.info(`Successfully refreshed els for ${offset} events`)
}

const reindexVendorsAutosuggest = async (elsService) => {
  const vendorsService = strapi.service('api::vendor.vendor')
  let offset = 0

  const vendors = await strapi.entityService.findMany('api::vendor.vendor', {
    limit: -1,
    populate: { logo: true, consolidationData: true },
    publicationState: 'live',
  })
  console.info(`Starting to reindex ${vendors.length} vendors autosuggest`)
  for (const vendor of vendors) {
    await vendorsService.createAutoSuggest(elsService, vendor)
    offset++
    console.log(`${offset}: reindexed vendor autosuggest`)
  }
  console.info(`Successfully refreshed autosuggest for ${vendors.length} vendors`)
}

const reindexContentsAutosuggest = async (elsService) => {
  const contentsService = strapi.service('api::content.content')
  let offset = 0

  const contents = await strapi.entityService.findMany('api::content.content', {
    limit: -1,
    populate: { logo: true },
    publicationState: 'live',
  })
  console.info(`Starting to reindex ${contents.length} contents autosuggest`)
  for (const content of contents) {
    await contentsService.createAutoSuggest(elsService, content)
    offset++
    console.log(`${offset}: reindexed content autosuggest`)
  }
  console.info(`Successfully refreshed autosuggest for ${contents.length} contents`)
}

const reindexConsultantsAutosuggest = async (elsService) => {
  const vendorsService = strapi.service('api::consulting.consulting')
  let offset = 0

  const vendors = await strapi.entityService.findMany('api::consulting.consulting', {
    limit: -1,
    populate: { logo: true },
    publicationState: 'live',
  })
  console.info(`Starting to reindex ${vendors.length} consultants autosuggest`)
  for (const vendor of vendors) {
    await vendorsService.createAutoSuggest(elsService, vendor)
    offset++
    console.log(`${offset}: reindexed consultant autosuggest`)
  }
  console.info(`Successfully refreshed autosuggest for ${vendors.length} consultants`)
}

const reindexALSPsAutosuggest = async (elsService) => {
  const vendorsService = strapi.service('api::alternative-legal-service.alternative-legal-service')
  let offset = 0

  const vendors = await strapi.entityService.findMany('api::alternative-legal-service.alternative-legal-service', {
    limit: -1,
    populate: { logo: true },
    publicationState: 'live',
  })
  console.info(`Starting to reindex ${vendors.length} alsps autosuggest`)
  for (const vendor of vendors) {
    await vendorsService.createAutoSuggest(elsService, vendor)
    offset++
    console.log(`${offset}: reindexed alsp autosuggest`)
  }
  console.info(`Successfully refreshed autosuggest for ${vendors.length} alsps`)
}

const reindexEventsAutosuggest = async (elsService) => {
  const eventsService = strapi.service('api::event.event')
  let offset = 0

  console.info('starting to reindex events')

  while (true) {
    const events = await strapi.entityService.findMany('api::event.event', {
      limit: 20,
      start: offset,
      sort: 'id',
      populate: { logo: true },
      publicationState: 'live',
    })
    if (events.length === 0) {
      break
    }

    await Promise.all(events.map((event) => eventsService.createAutoSuggest(elsService, event)))
    console.log(`reindexed ${events.length} events from ${offset}`)
    offset += events.length
  }
  console.info(`Successfully refreshed els for ${offset} events`)
}

const reindexTopicsAutosuggest = async (elsService) => {
  const topicsService = strapi.service('api::topic.topic')
  const topics = await strapi.entityService.findMany('api::topic.topic', { limit: -1, publicationState: 'live' })
  await Promise.all(topics.map((topic) => topicsService.createAutoSuggest(elsService, topic)))

  console.info(`Successfully refreshed els for ${topics.length} topics`)
}

const reindexSubTopicsAutosuggest = async (elsService) => {
  const subTopicsService = strapi.service('api::sub-topic.sub-topic')
  const subTopics = await strapi.entityService.findMany('api::sub-topic.sub-topic', {
    limit: -1,
    publicationState: 'live',
  })
  await Promise.all(subTopics.map((subTopic) => subTopicsService.createAutoSuggest(elsService, subTopic)))

  console.info(`Successfully refreshed els for ${subTopics.length} subTopics`)
}

const reindexCompaniesAutosuggest = async (elsService) => {
  const companiesService = strapi.service('api::company.company')
  const companies = await strapi.entityService.findMany('api::company.company', {
    limit: -1,
    populate: { logo: true },
    publicationState: 'live',
  })
  await Promise.all(companies.map((company) => companiesService.createAutoSuggest(elsService, company)))

  console.info(`Successfully refreshed els for ${companies.length} companies`)
}

module.exports = {
  // POST /vendors
  async vendors(ctx) {
    const elsService = new ElasticSearchService()

    try {
      await elsService.client.indices.delete({ index: process.env.OPENSEARCH_INDEX_VENDOR })
    } catch (err) {
      console.error(err)
    }

    await elsService.client.indices.create({
      index: process.env.OPENSEARCH_INDEX_VENDOR,
      body: vendorIndexBody,
    })

    await reindexVendors(elsService)
    await reindexConsultants(elsService)
    await reindexALSPs(elsService)

    ctx.send('Done!')
  },

  // POST /autosuggest
  async autosuggest(ctx) {
    const elsService = new ElasticSearchService()

    try {
      await elsService.client.indices.delete({ index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST })
    } catch (err) {
      console.error(err)
    }

    await elsService.client.indices.create({
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body: autoSuggestIndexBody,
    })

    await reindexVendorsAutosuggest(elsService)
    await reindexConsultantsAutosuggest(elsService)
    await reindexALSPsAutosuggest(elsService)
    await reindexEventsAutosuggest(elsService)
    await reindexTopicsAutosuggest(elsService)
    await reindexSubTopicsAutosuggest(elsService)
    await reindexCompaniesAutosuggest(elsService)
    await reindexContentsAutosuggest(elsService)

    ctx.send('Done!')
  },

  // POST /events
  async events(ctx) {
    const elsService = new ElasticSearchService()

    try {
      await elsService.client.indices.delete({ index: process.env.OPENSEARCH_INDEX_EVENT })
    } catch (err) {
      console.error(err)
    }

    await elsService.client.indices.create({
      index: process.env.OPENSEARCH_INDEX_EVENT,
      body: eventIndexBody,
    })

    await reindexEvents(elsService)

    ctx.send('Done!')
  },

  async download(ctx) {
    ctx.type = 'text/csv; charset=utf-8'
    let result = 'ID,Name,Website,Topics,SubTopics\n'

    if (ctx.query.type === 'vendor') {
      result = '"ID","Name","Tool","DisplayName","Website","Topics","Sub-topics","Consolidation Date"\n'
      const vendors = await strapi.entityService.findMany('api::vendor.vendor', {
        limit: -1,
        populate: { topics: true, subTopics: true, consolidationData: true },
        filters: { consolidationEnabled: true },
      })
      vendors.forEach((vendor) => {
        const topics = vendor.topics.map((topic) => topic.name).join(',')
        const subTopics = vendor.subTopics.map((subTopic) => subTopic.name).join(',')
        result += `"${vendor.id}","${vendor.name}","${vendor.tool}","${vendor.displayName}","${vendor.website}","${topics}","${subTopics}","${vendor.consolidationData?.date}"\n`
      })
    } else if (ctx.query.type === 'alsp') {
      const vendors = await strapi.entityService.findMany('api::alternative-legal-service.alternative-legal-service', {
        limit: -1,
        populate: { serviceOfferings: true },
      })
      vendors.forEach((vendor) => {
        const st = vendor.serviceOfferings.map((subTopic) => subTopic.name).join(',')
        result += `"${vendor.id}","${vendor.name}","${vendor.url}","ALSPs","${st}"\n`
      })
    } else if (ctx.query.type === 'consultant') {
      const vendors = await strapi.entityService.findMany('api::consulting.consulting', {
        limit: -1,
        populate: { serviceOfferings: true },
      })
      vendors.forEach((vendor) => {
        const st = vendor.serviceOfferings.map((subTopic) => subTopic.name).join(',')
        result += `"${vendor.id}","${vendor.name}","${vendor.url}","Consultants","${st}"\n`
      })
    }

    ctx.body = result
    return ctx.body
  },
}
