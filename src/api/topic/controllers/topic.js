'use strict'
const { ValidationError } = require('@strapi/utils/lib/errors')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::topic.topic', ({ strapi }) => ({
  async followingTopics(ctx) {
    if (!ctx.state.user) {
      throw new ValidationError('Forbidden!')
    }
    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: ctx.state.user.id },
      populate: ['followingVendors', 'followingAlsps', 'followingConsultants'],
    })

    const vendorIds = user.followingVendors.map((item) => item.id)
    const alspIds = user.followingAlsps.map((item) => item.id)
    const consultantIds = user.followingConsultants.map((item) => item.id)

    let topicIds = []
    let subTopicIds = []

    await Promise.all(
      vendorIds.map(async (id) => {
        const vendor = await strapi.entityService.findOne('api::vendor.vendor', id, {
          populate: ['topics', 'subTopics'],
        })
        topicIds = topicIds.concat(vendor.topics.map((topic) => topic.id))
        subTopicIds = subTopicIds.concat(vendor.subTopics.map((topic) => topic.id))
      }),
    )
    if (alspIds.length > 0) {
      const topic = await strapi.db.query('api::topic.topic').findOne({ where: { name: 'Alternative Legal Services' } })
      topicIds.push(topic.id)
      await Promise.all(
        alspIds.map(async (id) => {
          const alsp = await strapi.entityService.findOne(
            'api::alternative-legal-service.alternative-legal-service',
            id,
            { populate: ['serviceOfferings'] },
          )
          subTopicIds = subTopicIds.concat(alsp.serviceOfferings.map((so) => so.id))
        }),
      )
    }
    if (consultantIds.length > 0) {
      const topic = await strapi.db.query('api::topic.topic').findOne({ where: { name: 'Consultants' } })
      topicIds.push(topic.id)
      await Promise.all(
        consultantIds.map(async (id) => {
          const consultant = await strapi.entityService.findOne('api::consulting.consulting', id, {
            populate: ['serviceOfferings'],
          })
          subTopicIds = subTopicIds.concat(consultant.serviceOfferings.map((so) => so.id))
        }),
      )
    }
    topicIds = [...new Set(topicIds)]
    subTopicIds = [...new Set(subTopicIds)]
    const topics = []
    await Promise.all(
      topicIds.map(async (id) => {
        const topic = await strapi.entityService.findOne('api::topic.topic', id, { populate: ['subTopics'] })
        topics.push(topic)
      }),
    )
    topics.map((topic) => (topic.subTopics = topic.subTopics.filter((subTopic) => subTopicIds.includes(subTopic.id))))
    const sanitizedEntity = await this.sanitizeOutput(topics, ctx)
    return this.transformResponse(sanitizedEntity)
  },
}))
