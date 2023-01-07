module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/password/change',
      handler: 'password.change',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/password/info',
      handler: 'password.getInfo',
      config: {
        policies: [],
      },
    },
  ],
}
