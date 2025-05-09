
const fs = require('fs');


process.env.REDIS_URL = 'redis://redis:6379';


const queueConfig = {
  redis: {
    host: 'redis',
    port: 6379,
    password: '',
    db: 0,
    maxRetriesPerRequest: 10,
    enableReadyCheck: true,
    connectTimeout: 10000
  },
  prefix: 'bms',
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 100,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
};

// Write the configuration to a file that can be loaded
fs.writeFileSync('/app/queue-config.json', JSON.stringify(queueConfig, null, 2));

console.log('Queue configuration created and environment prepared.'); 