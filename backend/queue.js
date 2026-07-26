const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = process.env.REDIS_URL
    ? new IORedis(process.env.REDIS_URL, {
          maxRetriesPerRequest: null,
      })
    : new IORedis({
          host: "127.0.0.1",
          port: 6379,
          maxRetriesPerRequest: null,
      });

const faceQueue = new Queue("face-processing", {
    connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
    },
});

module.exports = {
    faceQueue,
    connection,
};