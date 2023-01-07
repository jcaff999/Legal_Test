const { ElasticSearchService } = require('../../../shared')

const DEFAULT_LIMIT = 5

const mapAutosuggestToSuggestType = (result) => {
  if (!result) {
    return []
  }
  return result.body.hits.hits.map(({ _source: { data } }) => ({
    keyword: data.keyword,
    model: data.model,
    id: data.id,
    logo: data.logo || null,
    slug: data.slug,
  }))
}

module.exports = {
  async autosuggest(keyword) {
    const ctx = strapi.requestContext.get()
    const userId = ctx.state && ctx.state.user && ctx.state.user.id ? ctx.state.user.id : null
    const user = userId
      ? await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: userId } })
      : null
    const elsService = new ElasticSearchService()

    const params = {
      keyword,
      limit: DEFAULT_LIMIT,
      offset: 0,
    }
    const [vendors, events, solutions, companies, contents] = await Promise.all([
      elsService.searchAutosuggestByType(params, 'Vendors'),
      elsService.searchAutosuggestByType(params, 'Events'),
      elsService.searchAutosuggestByType(params, 'Solutions'),
      elsService.searchAutosuggestByType(params, 'Companies'),
      ...[user && user.isPremium ? elsService.searchAutosuggestByType(params, 'Contents') : Promise.resolve(null)],
    ])
    console.log('vendors', vendors)

    return {
      success: true,
      vendors: mapAutosuggestToSuggestType(vendors),
      events: mapAutosuggestToSuggestType(events),
      solutions: mapAutosuggestToSuggestType(solutions),
      companies: mapAutosuggestToSuggestType(companies),
      contents: mapAutosuggestToSuggestType(contents),
    }
  },
}
