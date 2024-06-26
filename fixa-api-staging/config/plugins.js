module.exports = ({ env }) => ({
    // ...
    email: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: env('SENDGRID_EMAIL'),
        // defaultReplyTo: 'email',
        // testAddress: 'address',
      },
    },
    // ...
  });