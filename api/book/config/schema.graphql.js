module.exports = {
  query: `
    booksCount(where: JSON): Int!
  `,
  resolver: {
    Query: {
      booksCount: {
        description: 'Return the count of books',
        resolverOf: 'application::book.book.count',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.book.services.book.count(options.where || {});
        },
      },
    },
  },
};