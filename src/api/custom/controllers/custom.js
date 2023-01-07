const { ValidationError } = require('@strapi/utils/lib/errors')
const { ElasticSearchService } = require('../../../shared')

module.exports = {
  async follow(ctx) {
    const { model, id, follow } = ctx.options
    if (!ctx.state.user) {
      throw new ValidationError('Forbidden!')
    }
    const elsService = new ElasticSearchService()
    if (model === 'Vendors') {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: ctx.state.user.id },
        populate: ['followingVendors'],
      })
      let solutions = user.followingVendors.map((item) => item.id)
      if (follow === true) {
        if (!solutions.includes(id)) {
          solutions.push(id)
        }
      } else {
        solutions = solutions.filter((item) => item !== id)
      }
      await strapi
        .query('plugin::users-permissions.user')
        .update({ where: { id: user.id }, data: { followingVendors: solutions } })
      // update els
      const vendor = await strapi.entityService.findOne('api::vendor.vendor', id, { populate: '*' })
      if (vendor) {
        await strapi.service('api::vendor.vendor').updateElsDocument(elsService, vendor)
      }
    } else if (model === 'ALSPs') {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: ctx.state.user.id },
        populate: ['followingAlsps'],
      })
      let solutions = user.followingAlsps.map((item) => item.id)
      if (follow === true) {
        if (!solutions.includes(id)) {
          solutions.push(id)
        }
      } else {
        solutions = solutions.filter((item) => item !== id)
      }
      await strapi
        .query('plugin::users-permissions.user')
        .update({ where: { id: user.id }, data: { followingAlsps: solutions } })
      // update els
      const alsp = await strapi.entityService.findOne('api::alternative-legal-service.alternative-legal-service', id, {
        populate: '*',
      })
      if (alsp) {
        await strapi
          .service('api::alternative-legal-service.alternative-legal-service')
          .updateElsDocument(elsService, alsp)
      }
    } else if (model === 'Consultants') {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: ctx.state.user.id },
        populate: ['followingConsultants'],
      })
      let solutions = user.followingConsultants.map((item) => item.id)
      if (follow === true) {
        if (!solutions.includes(id)) {
          solutions.push(id)
        }
      } else {
        solutions = solutions.filter((item) => item !== id)
      }
      await strapi
        .query('plugin::users-permissions.user')
        .update({ where: { id: user.id }, data: { followingConsultants: solutions } })
      // update els
      const consultant = await strapi.entityService.findOne('api::consulting.consulting', id, { populate: '*' })
      if (consultant) {
        await strapi.service('api::consulting.consulting').updateElsDocument(elsService, consultant)
      }
    }
    return true
  },

  async isFollow(ctx) {
    const { model, id } = ctx.options
    if (!ctx.state.user) {
      throw new ValidationError('Forbidden!')
    }
    let solutions = []
    if (model === 'Vendors') {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: ctx.state.user.id },
        populate: ['followingVendors'],
      })
      solutions = user.followingVendors.map((item) => item.id)
    } else if (model === 'ALSPs') {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: ctx.state.user.id },
        populate: ['followingAlsps'],
      })
      solutions = user.followingAlsps.map((item) => item.id)
    } else if (model === 'Consultants') {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: ctx.state.user.id },
        populate: ['followingConsultants'],
      })
      solutions = user.followingConsultants.map((item) => item.id)
    }
    if (solutions.includes(id)) return true
    return false
  },
}
