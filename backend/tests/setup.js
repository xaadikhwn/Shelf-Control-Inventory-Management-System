const db = require('../src/models');

jest.setTimeout(30000);

beforeAll(async () => {
  if (db.sequelize.getDialect() === 'sqlite') {
    await db.sequelize.query('PRAGMA foreign_keys = OFF;');
  }
  await db.sequelize.sync({ force: true });
  if (db.sequelize.getDialect() === 'sqlite') {
    await db.sequelize.query('PRAGMA foreign_keys = ON;');
  }
});

afterAll(async () => {
  await db.sequelize.close();
});
