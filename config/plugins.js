module.exports = {
  graphql: {
    endpoint: '/graphql',
    shadowCRUD: true,
    playgroundAlways: false,
    depthLimit: 7,
    amountLimit: 99999,
    apolloServer: {
      tracing: false,
    }
  }
}