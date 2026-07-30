require('dotenv').config();
const app = require('./app');
const db = require('./models');
const { startStockAlertCron } = require('./jobs/stockAlert.job');
const { autoSeed } = require('./seeders/initSeeder');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    await db.sequelize.sync({ force: false });
    await autoSeed();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      startStockAlertCron();
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
// Server updated at 2026-07-29

