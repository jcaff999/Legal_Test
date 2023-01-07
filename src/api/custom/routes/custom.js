module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/custom/follow',
      handler: 'custom.follow',
      config: {
        policies: [],
      },
    },
  ],
}
