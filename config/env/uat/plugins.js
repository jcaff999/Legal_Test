module.exports = ({ env }) => ({
  upload: {
    enabled: true,
    config: {
      provider: 'strapi-provider-upload-aws-s3-custom-domain',
      name: 'AWS S3 with custom domain',
      providerOptions: {
        baseUrl: env('AWS_S3_ENDPOINT'),
        bucket: env('AWS_BUCKET_NAME'),
        prefix: '/',
        setObjectPublic: 'Public'
      }
    }
  },
  email: {
    enabled: true,
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY')
      },
      settings: {
        defaultFrom: 'no-reply@legaltechnologyhub.com',
        defaultReplyTo: 'no-reply@legaltechnologyhub.com'
      }
    }
  },
  // wysiwyg: {
  //   enabled: true,
  //   resolve: './src/plugins/wysiwyg' // path to plugin folder
  // },
  ckeditor: true,
  graphql: {
    config: {
      defaultLimit: 100
    }
  }
});
