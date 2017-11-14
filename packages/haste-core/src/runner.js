const os = require('os');
const Tapable = require('tapable');
const { Farm } = require('haste-worker-farm');
const { resolveTaskName } = require('./utils');

module.exports = class Runner extends Tapable {
  constructor() {
    super();

    this.farm = new Farm({ maxConcurrentCalls: os.cpus().length });
  }

  define(action, { persistent = false } = {}) {
    return async ({ context }) => {
      const tasks = new Proxy({}, {
        get: (target, name) => {
          const modulePath = resolveTaskName(name, context);
          const pool = this.farm.createPool({ modulePath });

          return async (options) => {
            return pool.call({ options });
          };
        }
      });

      const result = await action(tasks);

      return { persistent, result };
    };
  }
};
