const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb({ url: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

module.exports = prisma;