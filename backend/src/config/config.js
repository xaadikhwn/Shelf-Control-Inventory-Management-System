require('dotenv').config();

const normalizeDialect = (value) => {
  if (!value) return undefined;
  if (value.toLowerCase() === 'tidb') return 'mysql';
  return value;
};

const getDialect = () => {
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL.toLowerCase();
    if (url.startsWith('mysql://') || url.startsWith('mysql2://')) return 'mysql';
    if (url.startsWith('postgres://') || url.startsWith('postgresql://')) return 'postgres';
  }

  const configuredDialect = normalizeDialect(process.env.DB_DIALECT);
  if (configuredDialect) return configuredDialect;

  return 'sqlite';
};

const getDialectOptions = () => {
  if (process.env.DB_SSL === 'true') {
    return {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  return {};
};

const dialect = getDialect();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'bizmanage',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect,
    storage: dialect === 'sqlite' ? (process.env.DB_STORAGE || './bizmanage.sqlite') : undefined,
    logging: false,
    ...(Object.keys(getDialectOptions()).length ? { dialectOptions: getDialectOptions() } : {}),
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'bizmanage_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: normalizeDialect(process.env.DB_DIALECT) || getDialect() || 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false,
    ...(Object.keys(getDialectOptions()).length ? { dialectOptions: getDialectOptions() } : {}),
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: normalizeDialect(process.env.DB_DIALECT) || getDialect() || 'mysql',
    logging: false,
    ...(process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : {}),
    ...(Object.keys(getDialectOptions()).length ? { dialectOptions: getDialectOptions() } : {}),
  },
};

