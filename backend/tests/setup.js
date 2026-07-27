const db = require('../src/models');

beforeAll(async () => {
  // Sync DB
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});
