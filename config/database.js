module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'mysql',
        host: env('DATABASE_HOST', '45.77.174.242'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'qltv_backend'),
        username: env('DATABASE_USERNAME', 'root'),
        password: env('DATABASE_PASSWORD', 'passwordbimatmysql'),
        ssl: env.bool('DATABASE_SSL', false),
      },
      options: {}
    },
  },
});
