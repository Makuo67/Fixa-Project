module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "bookshelf",
      settings: {
        client: "mysql",
        host: env("DATABASE_HOST", "127.0.0.1"),
        port: env.int("DATABASE_PORT", 3306),
        database: env("DATABASE_NAME", ""),
        username: env("DATABASE_USERNAME", ""),
        password: env("DATABASE_PASSWORD", ""),
        // ssl: env.bool("DATABASE_SSL", false),
      },
      options: {
        pool: {
          min: 0,
          max: 10,
          idleTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          acquireTimeoutMillis: 60000,
        },
      },
    },
  },
});
