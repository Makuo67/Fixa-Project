const redis = require("redis");
const redis_host = process.env.REDIS_PUBLIC_DNS;
const redis_port = process.env.REDIS_PORT;
const redis_password = process.env.REDIS_PASSWORD;
class RedisService {
  constructor() {
    this.redisClient = redis.createClient({
      url: `redis://:${redis_password}@${redis_host}:${redis_port}`,
    });
    this.redisClient.on("connect", () =>
      console.log("🔌 Redis client connected!")
    );
    this.redisClient.on("ready", () =>
      console.log("💻 Redis client is ready ")
    );
    this.redisClient.connect();
  }
  getClient() {
    return this.redisClient;
  }
}

module.exports = new RedisService();
