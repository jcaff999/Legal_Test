'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  async afterUpdate(event) {
    const { result: data } = event
    if (data.publishedAt) {
      // publish button has been clicked
      let entry
      if (data.listingType === 'Vendor') {
        const req = data.vendorReq
        const newVendor = {
          name: req.companyName,
          tool: req.productName,
          description: req.shortDescription,
          longDescription: req.longDescription,
          logo: req.logo,
          website: req.website,
          type: 'default',
          audiences: req.audiences,
          existingCustomers: req.existingCustomers,
          features: [],
          deployments: req.deployments,
          integrations: req.integrations,
          offices: req.offices,
          languages: req.languages,
          practiceAreas: [],
          hqs: req.hqs,
          topics: [],
          regionsServed: [],
          subTopics: req.subTopics,
          typeOfUser: req.typeOfUsers,
          published_at: null,
        }
        if (data.enhancedVendorReq) {
          const enhancedVendorReq = data.enhancedVendorReq
          const enhanced = {
            ...enhancedVendorReq,
            callToAction: {
              label: enhancedVendorReq.callToActionText,
              url: enhancedVendorReq.callToActionUrl,
            },
            videos: enhancedVendorReq.productVideos,
          }
          newVendor.enhancedListingData = enhanced
          newVendor.enhancedListingEnabled = true
        }
        if (req.isCreate) {
          entry = await strapi.entityService.create('api::vendor.vendor', { data: newVendor })
        } else {
          entry = await strapi.db
            .query('api::vendor.vendor')
            .findOne({ where: { tool: req.productName, name: req.companyName } })
          if (entry) {
            entry = await strapi.entityService.update('api::vendor.vendor', entry.id, { data: newVendor })
          }
        }
      } else if (data.listingType === 'Consultant') {
        const req = data.consultantReq
        const newConsultant = {
          serviceName: req.serviceName,
          name: req.listingName,
          shortDescription: req.shortDescription,
          longDescription: req.longDescription,
          logo: req.logo,
          url: req.website,
          audiences: req.audiences,
          features: [],
          deployments: [],
          offices: req.offices,
          languages: req.languages,
          practiceAreas: [],
          hqs: req.hqs,
          regionsServed: req.regionsServed,
          size: req.size,
          operatingSince: req.yearFounded,
          published_at: null,
        }
        if (data.enhancedConsultantReq) {
          const enhancedConsultantReq = data.enhancedConsultantReq
          const enhanced = {
            ...enhancedConsultantReq,
            callToAction: {
              label: enhancedConsultantReq.callToActionText,
              url: enhancedConsultantReq.callToActionUrl,
            },
          }
          newConsultant.enhancedListingData = enhanced
          newConsultant.enhancedListingEnabled = true
        }
        if (req.isCreate) {
          entry = await strapi.entityService.create('api::consulting.consulting', { data: newConsultant })
        } else {
          entry = await strapi.db.query('api::consulting.consulting').findOne({ where: { name: req.listingName } })
          if (entry) {
            entry = await strapi.entityService.update('api::consulting.consulting', entry.id, { data: newConsultant })
          }
        }
      } else if (data.listingType === 'ALSP') {
        const req = data.alspReq
        const newAlsp = {
          serviceName: req.serviceName,
          name: req.listingName,
          shortDescription: req.shortDescription,
          longDescription: req.longDescription,
          logo: req.logo,
          url: req.website,
          audiences: req.audiences,
          features: [],
          deployments: [],
          offices: req.offices,
          languages: req.languages,
          practiceAreas: [],
          hqs: req.hqs,
          regionsServed: req.regionsServed,
          size: req.size,
          operatingSince: req.yearFounded,
          published_at: null,
        }
        if (data.enhancedAlspReq) {
          const enhancedAlspReq = data.enhancedAlspReq
          const enhanced = {
            ...enhancedAlspReq,
            callToAction: {
              label: enhancedAlspReq.callToActionText,
              url: enhancedAlspReq.callToActionUrl,
            },
          }
          newAlsp.enhancedListingData = enhanced
          newAlsp.enhancedListingEnabled = true
        }
        if (req.isCreate) {
          entry = await strapi.entityService.create('api::alternative-legal-service.alternative-legal-service', {
            data: newAlsp,
          })
        } else {
          entry = await strapi.db
            .query('api::alternative-legal-service.alternative-legal-service')
            .findOne({ where: { name: req.listingName } })
          if (entry) {
            entry = await strapi.entityService.update(
              'api::alternative-legal-service.alternative-legal-service',
              entry.id,
              { data: newAlsp },
            )
          }
        }
      }
    }
  },
}
