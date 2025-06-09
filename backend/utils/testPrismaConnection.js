const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection by counting Memory records
    const count = await prisma.memory.count();
    console.log(`Connected to SQLite! Memory records count: ${count}`);
    process.exit(0);
  } catch (error) {
    console.error('Prisma connection test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 