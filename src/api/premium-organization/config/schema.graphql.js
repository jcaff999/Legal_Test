module.exports = {
  definition: `
    input RegisterPremiumOrganizationInput {
      name: String!
      registrationContact: ComponentRegistrationContactRegistrationContactInput!
      billingAddress: ComponentBillingAddressBillingAddressInput!
      emailDomain: String!
      paymentOption: ENUM_PREMIUMORGANIZATION_PAYMENTOPTION!
      pricingPlan: ID!
      gReCaptchaToken: String!
    }
  `,

  mutation: `
    registerPremiumOrganization(data: RegisterPremiumOrganizationInput!): PremiumOrganization
  `,

  resolver: {
    Mutation: {
      registerPremiumOrganization: {
        description: 'Registers a new premium organization',
        resolver: 'application::premium-organization.premium-organization.registerPremiumOrganization',
      },
    },
  },
}
