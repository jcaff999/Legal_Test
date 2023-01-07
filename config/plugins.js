module.exports = ({ env }) => ({
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
  },
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '30d'
      },
      jwtSecret: env('JWT_SECRET')
    }
  }
});
