module.exports = {
  definition: `
    input Taxonomy {
      id: String
      name: String
    }

    input VendorListingRequest {
        companyName: String
        name: String
        email: String
        ceoName: String
        ceoEmail: String
        marketName: String
        marketEmail: String
        website: String
        hqs: [String]
        offices: [String]
        productName: String
        logo: Upload
        shortDescription: String
        longDescription: String
        audiences: [String]
        subTopics: [String]
        lanuages: [String]
        deployments: [String]
        practiceAreas: [String]
        integrations: [Taxonomy]
        existingCustomers: [Taxonomy]
        typeOfUsers: [String]
        isCreate: Boolean
        notes: String
        competitor: String
        yearFounded: Int
        isOpenJobPosition: Boolean
      }

      input ConsultantListingRequest {
        serviceName: String
        listingName: String
        userName: String
        userRole: String
        userEmail: String
        phone: String
        marketName: String
        marketEmail: String
        ceoName: String
        ceoEmail: String
        shortDescription: String
        longDescription: String
        logo: Upload
        website: String
        hqs: [String]
        offices: [String]
        lanuages: [String]
        regionsServed: [String]
        audiences: [String]
        serviceOfferings: [String]
        yearFounded: Int
        size: Int
        isCreate: Boolean
        notes: String
      }

      input DedicatedResource {
        count: Int
        type: ENUM_COMPONENTCONPROPSDEDICATEDRESOURCE_TYPE
      }

      input Member {
        avatar: Upload
        name: String
        role: String
        bio: String
      }

      input Video {
        title: String
        summary: String
        url: String
      }

      input ScreenShot {
        title: String
        summary: String
        image: Upload
      }

      input Author {
        avatar: Upload
        name: String
        role: String
        company: String
      }

      input Testimonial {
        description: String
        author: Author
      }

      input VendorResource {
        title: String
        summary: String
        link: String
        publishedDate: Date
        author: String
        type: ENUM_COMPONENTVENDORPROPSPOC_TYPE
      }

      input EnhancedConsultantListingRequest {
        callToActionUrl: String
        callToActionText: String
        serviceBreakdown: String
        engagementLen: Int
        valueProposition: String
        dedicatedResources: [DedicatedResource]
        technology: String
        founders: [Member]
        specialists: [Member]
        competitor: String
        productVideos: [Video]
        screenShots: [ScreenShot]
        pricingData: String
        testimonials: [Testimonial]
        vendorResources: [VendorResource]
      }

      input EnhancedVendorListingRequest {
        callToActionUrl: String
        callToActionText: String
        productVideos: [Video]
        screenShots: [ScreenShot]
        pricingData: String
        testimonials: [Testimonial]
        vendorResources: [VendorResource]
      }

      input ListingRequestData {
          listingType: ENUM_LISTINGREQUEST_LISTINGTYPE
          vendorReq: VendorListingRequest
          consultantReq: ConsultantListingRequest
          alspReq: ConsultantListingRequest
          enhancedVendorReq: ComponentRequestEnhancedVendorReqInput
          enhancedConsultantReq: ComponentRequestEnhancedListReqInput
          enhancedAlspReq: ComponentRequestEnhancedListReqInput
      }
      `,

  mutation: `
      createListingRequestData(data: ListingRequestData): ListingRequest
  `,

  resolver: {
    Mutation: {
      createListingRequestData: {
        description: 'create listing request',
        resolver: 'application::listing-request.listing-request.createListingRequestData',
      },
    },
  },
}
